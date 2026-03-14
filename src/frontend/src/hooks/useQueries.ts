import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Photo, WeddingInfo } from "../backend.d";
import { useActor } from "./useActor";

export function useGetWeddingInfo() {
  const { actor, isFetching } = useActor();
  return useQuery<WeddingInfo | null>({
    queryKey: ["weddingInfo"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getWeddingInfo();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAlbums() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["albums"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAlbums();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPhotosInAlbum(albumName: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Photo[]>({
    queryKey: ["photos", albumName],
    queryFn: async () => {
      if (!actor || !albumName) return [];
      return actor.getPhotosInAlbum(albumName);
    },
    enabled: !!actor && !isFetching && !!albumName,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateWeddingInfo() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (info: WeddingInfo) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateWeddingInfo(info);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["weddingInfo"] }),
  });
}

export function useCreateAlbum() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.createAlbum(name);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["albums"] }),
  });
}

export function useDeleteAlbum() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteAlbum(name);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["albums"] }),
  });
}

export function useAddPhotoToAlbum() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      albumName,
      blobId,
      caption,
    }: { albumName: string; blobId: string; caption: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addPhotoToAlbum(albumName, blobId, caption);
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["photos", vars.albumName] }),
  });
}

export function useDeletePhotoFromAlbum() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      albumName,
      photoId,
    }: { albumName: string; photoId: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.deletePhotoFromAlbum(albumName, photoId);
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["photos", vars.albumName] }),
  });
}
