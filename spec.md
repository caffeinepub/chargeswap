# ChargeSwap

## Current State
New project with empty backend.

## Requested Changes (Diff)

### Add
- User registration with unique App ID (auto-generated), display name, and phone number
- User login via App ID + phone number
- Send phone charge units to another user by searching their phone number or App ID
- Receive phone charge units from other users
- Transaction history: all sent and received charge transfers
- Charge units display (how many units user currently holds)
- Confirmation screen before completing a transfer
- In-app notification/alert when a new charge transfer is received
- Mobile-friendly UI

### Modify
- N/A (new project)

### Remove
- N/A

## Implementation Plan
- Backend:
  - User type: { appId, name, phoneNumber, chargeUnits }
  - register(name, phoneNumber): creates account, returns generated appId
  - login(appId, phoneNumber): returns user profile
  - searchUser(query): search by phoneNumber or appId, returns basic info
  - sendCharge(fromAppId, toAppId, units): transfers charge units, records transaction
  - getTransactions(appId): returns list of sent/received transfers
  - getProfile(appId): returns user profile with current charge units
- Frontend:
  - Auth screens: Register / Login
  - Home screen: charge units display, Send button, Receive info, recent transactions
  - Send flow: search recipient → enter units → confirmation screen → success
  - Transaction history page
  - Alert/notification banner when charge received (polling)
