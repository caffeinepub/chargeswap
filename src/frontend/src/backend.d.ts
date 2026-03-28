import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Transfer {
    receiverAppID: bigint;
    senderAppID: bigint;
    timestamp: Time;
    amount: bigint;
}
export interface RegistrationInput {
    name: string;
    phoneNumber: string;
}
export type Time = bigint;
export interface UserProfile {
    appID: bigint;
    name: string;
    phoneNumber: string;
}
export interface User {
    principal: Principal;
    balance: bigint;
    appID: bigint;
    name: string;
    phoneNumber: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getBalance(appID: bigint): Promise<bigint>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getTransactionHistory(appID: bigint): Promise<Array<Transfer>>;
    getUser(appID: bigint): Promise<User>;
    getUserByPhone(phoneNumber: string): Promise<User>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    register(input: RegistrationInput): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    transfer(transferRequest: Transfer): Promise<void>;
}
