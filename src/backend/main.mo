import Map "mo:core/Map";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  include MixinStorage();

  public type UserProfile = {
    name : Text;
  };

  type Photo = {
    blobId : Text;
    caption : Text;
  };

  type WeddingInfo = {
    brideName : Text;
    groomName : Text;
    weddingDate : Text;
  };

  let photos = Map.empty<Text, Photo>();
  let albums = Map.empty<Text, Set.Set<Text>>();
  var weddingInfo : ?WeddingInfo = null;
  let userProfiles = Map.empty<Principal, UserProfile>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Wedding info management
  public shared ({ caller }) func updateWeddingInfo(coupleInfo : WeddingInfo) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can update wedding info");
    };
    weddingInfo := ?coupleInfo;
  };

  public query ({ caller }) func getWeddingInfo() : async ?WeddingInfo {
    weddingInfo;
  };

  // Album management
  public shared ({ caller }) func createAlbum(albumName : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can create albums");
    };
    if (albums.containsKey(albumName)) {
      Runtime.trap("Album already exists");
    };
    albums.add(albumName, Set.empty<Text>());
  };

  public query ({ caller }) func getAlbums() : async [Text] {
    albums.keys().toArray();
  };

  public shared ({ caller }) func deleteAlbum(albumName : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can delete albums");
    };
    switch (albums.get(albumName)) {
      case (null) { Runtime.trap("Album does not exist") };
      case (?photoIds) {
        photoIds.values().forEach(func(photoId) { photos.remove(photoId) });
        albums.remove(albumName);
      };
    };
  };

  // Photo management
  public shared ({ caller }) func addPhotoToAlbum(albumName : Text, blobId : Text, caption : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can add photos");
    };
    switch (albums.get(albumName)) {
      case (null) { Runtime.trap("Album does not exist") };
      case (?photoIds) {
        let photoId = blobId;
        let newPhoto = { blobId; caption };
        photos.add(photoId, newPhoto);
        photoIds.add(photoId);
      };
    };
  };

  public query ({ caller }) func getPhotosInAlbum(albumName : Text) : async [Photo] {
    switch (albums.get(albumName)) {
      case (null) { Runtime.trap("Album does not exist") };
      case (?photoIds) {
        photoIds.values().toArray().map(func(photoId) { switch (photos.get(photoId)) { case (null) { Runtime.trap("Photo does not exist") }; case (?photo) { photo } } });
      };
    };
  };

  public shared ({ caller }) func deletePhotoFromAlbum(albumName : Text, photoId : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can delete photos");
    };
    switch (albums.get(albumName)) {
      case (null) { Runtime.trap("Album does not exist") };
      case (?photoIds) {
        if (not photoIds.contains(photoId)) {
          Runtime.trap("Photo not found in album");
        };
        photoIds.remove(photoId);
        photos.remove(photoId);
      };
    };
  };
};
