import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface WeddingInfo {
    weddingDate: string;
    brideName: string;
    groomName: string;
}
export interface UserProfile {
    name: string;
}
export interface Photo {
    caption: string;
    blobId: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addPhotoToAlbum(albumName: string, blobId: string, caption: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAlbum(albumName: string): Promise<void>;
    deleteAlbum(albumName: string): Promise<void>;
    deletePhotoFromAlbum(albumName: string, photoId: string): Promise<void>;
    getAlbums(): Promise<Array<string>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPhotosInAlbum(albumName: string): Promise<Array<Photo>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWeddingInfo(): Promise<WeddingInfo | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateWeddingInfo(coupleInfo: WeddingInfo): Promise<void>;
}
