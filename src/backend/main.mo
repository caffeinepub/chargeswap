import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  module Transfer {
    public type Transfer = {
      amount : Nat;
      timestamp : Time.Time;
      senderAppID : Nat;
      receiverAppID : Nat;
    };

    public func compare(a : Transfer, b : Transfer) : Order.Order {
      Int.compare(a.timestamp, b.timestamp);
    };
  };

  module User {
    public type User = {
      appID : Nat;
      name : Text;
      phoneNumber : Text;
      balance : Nat;
      principal : Principal;
    };

    public func getUserByAppId(appId : Nat, users : Map.Map<Nat, User>) : User {
      switch (users.get(appId)) {
        case (null) { Runtime.trap("User with appID " # appId.toText() # " does not exist") };
        case (?user) { user };
      };
    };
  };

  var nextAppID = 1;

  public type RegistrationInput = {
    name : Text;
    phoneNumber : Text;
  };

  public type UserProfile = {
    name : Text;
    phoneNumber : Text;
    appID : Nat;
  };

  let users = Map.empty<Nat, User.User>();
  let phoneToAppId = Map.empty<Text, Nat>();
  let transfers = Map.empty<Nat, Transfer.Transfer>();
  let principalToAppId = Map.empty<Principal, Nat>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public shared ({ caller }) func register(input : RegistrationInput) : async Nat {
    let appID = nextAppID;
    nextAppID += 1;

    if (phoneToAppId.containsKey(input.phoneNumber)) {
      Runtime.trap("Phone number already registered. ");
    };

    let user : User.User = {
      appID;
      name = input.name;
      phoneNumber = input.phoneNumber;
      balance = 100;
      principal = caller;
    };

    users.add(appID, user);
    phoneToAppId.add(input.phoneNumber, appID);
    principalToAppId.add(caller, appID);

    // Assign user role to the newly registered user
    AccessControl.assignRole(accessControlState, caller, caller, #user);

    appID;
  };

  public query ({ caller }) func getUser(appID : Nat) : async User.User {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search for other users");
    };
    User.getUserByAppId(appID, users);
  };

  public query ({ caller }) func getUserByPhone(phoneNumber : Text) : async User.User {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search for other users");
    };
    switch (phoneToAppId.get(phoneNumber)) {
      case (null) { Runtime.trap("User not found") };
      case (?appID) { User.getUserByAppId(appID, users) };
    };
  };

  public query ({ caller }) func getBalance(appID : Nat) : async Nat {
    let user = User.getUserByAppId(appID, users);
    if (caller != user.principal and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own balance");
    };
    user.balance;
  };

  public shared ({ caller }) func transfer(transferRequest : Transfer.Transfer) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can transfer charge units");
    };

    let sender = User.getUserByAppId(transferRequest.senderAppID, users);

    if (caller != sender.principal) {
      Runtime.trap("Cannot transfer from another user's account.");
    };

    if (sender.balance < transferRequest.amount) {
      Runtime.trap("Insufficient balance");
    };

    let receiver = User.getUserByAppId(transferRequest.receiverAppID, users);

    users.add(
      sender.appID,
      {
        sender with
        balance = sender.balance - transferRequest.amount;
      },
    );

    users.add(
      receiver.appID,
      {
        receiver with
        balance = receiver.balance + transferRequest.amount;
      },
    );

    let txId = transfers.size() + 1;
    let transfer : Transfer.Transfer = {
      amount = transferRequest.amount;
      timestamp = Time.now();
      senderAppID = transferRequest.senderAppID;
      receiverAppID = transferRequest.receiverAppID;
    };

    transfers.add(txId, transfer);
  };

  public query ({ caller }) func getTransactionHistory(appID : Nat) : async [Transfer.Transfer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transaction history");
    };

    let user = User.getUserByAppId(appID, users);
    if (caller != user.principal and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own transactions");
    };

    transfers.values().toArray().filter(
      func(transfer) {
        transfer.senderAppID == appID or transfer.receiverAppID == appID;
      }
    ).sort();
  };

  // Required profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };

    switch (principalToAppId.get(caller)) {
      case (null) { null };
      case (?appID) {
        let user = User.getUserByAppId(appID, users);
        ?{
          name = user.name;
          phoneNumber = user.phoneNumber;
          appID = user.appID;
        };
      };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };

    switch (principalToAppId.get(user)) {
      case (null) { null };
      case (?appID) {
        let userData = User.getUserByAppId(appID, users);
        ?{
          name = userData.name;
          phoneNumber = userData.phoneNumber;
          appID = userData.appID;
        };
      };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    switch (principalToAppId.get(caller)) {
      case (null) { Runtime.trap("User not registered") };
      case (?appID) {
        let user = User.getUserByAppId(appID, users);

        // Check if phone number is being changed to one that's already taken
        if (profile.phoneNumber != user.phoneNumber and phoneToAppId.containsKey(profile.phoneNumber)) {
          Runtime.trap("Phone number already registered");
        };

        // Remove old phone number mapping if changed
        if (profile.phoneNumber != user.phoneNumber) {
          phoneToAppId.remove(user.phoneNumber);
          phoneToAppId.add(profile.phoneNumber, appID);
        };

        // Update user data
        users.add(
          appID,
          {
            user with
            name = profile.name;
            phoneNumber = profile.phoneNumber;
          },
        );
      };
    };
  };
};
