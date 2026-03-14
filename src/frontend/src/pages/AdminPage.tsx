import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Heart,
  Images,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddPhotoToAlbum,
  useCreateAlbum,
  useDeleteAlbum,
  useDeletePhotoFromAlbum,
  useGetAlbums,
  useGetPhotosInAlbum,
  useGetWeddingInfo,
  useIsAdmin,
  useUpdateWeddingInfo,
} from "../hooks/useQueries";

function PhotoImage({
  blobId,
  alt,
  className,
}: { blobId: string; alt: string; className?: string }) {
  const src = blobId.startsWith("/")
    ? blobId
    : ExternalBlob.fromURL(blobId).getDirectURL();
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}

export default function AdminPage() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        if (error?.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="border-border shadow-petal">
            <CardHeader className="text-center pb-2 pt-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Heart className="text-primary" size={24} fill="currentColor" />
              </div>
              <CardTitle className="font-display text-2xl">
                Admin Access
              </CardTitle>
              <p className="text-muted-foreground text-sm mt-1">
                Sign in to manage your wedding album
              </p>
            </CardHeader>
            <CardContent className="pb-8 flex flex-col items-center gap-4">
              <Button
                onClick={handleAuth}
                disabled={isLoggingIn}
                className="w-full max-w-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                data-ocid="auth.login_button"
              >
                {isLoggingIn ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </Button>
              <Link to="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground gap-1.5"
                >
                  <ArrowLeft size={14} /> Back to Gallery
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <p className="font-display text-xl text-foreground mb-2">
            Access Denied
          </p>
          <p className="text-muted-foreground text-sm mb-6">
            You don&apos;t have admin privileges.
          </p>
          <Button
            onClick={handleAuth}
            variant="outline"
            data-ocid="auth.logout_button"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleAuth} />;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings size={18} className="text-primary" />
            <span className="font-display font-medium text-lg">
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
              >
                <ArrowLeft size={14} /> Gallery
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="gap-1.5"
              data-ocid="auth.logout_button"
            >
              <LogOut size={14} /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <CoupleInfoSection />
        <Separator />
        <AlbumsSection />
      </main>

      <footer className="border-t border-border mt-16 py-6 text-center text-muted-foreground text-sm">
        &copy; {new Date().getFullYear()}. Built with{" "}
        <Heart size={11} className="inline text-primary" fill="currentColor" />{" "}
        using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

function CoupleInfoSection() {
  const { data: info, isLoading } = useGetWeddingInfo();
  const updateInfo = useUpdateWeddingInfo();
  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (!initialized && info !== undefined && !isLoading) {
    setBrideName(info?.brideName || "");
    setGroomName(info?.groomName || "");
    setWeddingDate(info?.weddingDate || "");
    setInitialized(true);
  }

  const handleSave = async () => {
    try {
      await updateInfo.mutateAsync({ brideName, groomName, weddingDate });
      toast.success("Wedding info updated!");
    } catch {
      toast.error("Failed to update info");
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="font-display text-2xl font-medium mb-1">
        Couple Information
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        This appears in the public gallery hero section
      </p>

      {isLoading ? (
        <div className="space-y-4">
          {["ci-sk-1", "ci-sk-2", "ci-sk-3"].map((k) => (
            <Skeleton key={k} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bride">Bride&apos;s Name</Label>
            <Input
              id="bride"
              value={brideName}
              onChange={(e) => setBrideName(e.target.value)}
              placeholder="e.g. Isabella"
              data-ocid="admin.couple_info.input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="groom">Groom&apos;s Name</Label>
            <Input
              id="groom"
              value={groomName}
              onChange={(e) => setGroomName(e.target.value)}
              placeholder="e.g. Alexander"
              data-ocid="admin.couple_info.input"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="date">Wedding Date</Label>
            <Input
              id="date"
              value={weddingDate}
              onChange={(e) => setWeddingDate(e.target.value)}
              placeholder="e.g. June 21, 2025"
              data-ocid="admin.couple_info.input"
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              onClick={handleSave}
              disabled={updateInfo.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              data-ocid="admin.couple_info.save_button"
            >
              {updateInfo.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {updateInfo.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}
    </motion.section>
  );
}

function AlbumsSection() {
  const { data: albums = [], isLoading } = useGetAlbums();
  const createAlbum = useCreateAlbum();
  const deleteAlbum = useDeleteAlbum();
  const [newAlbumName, setNewAlbumName] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState("");

  const handleCreate = async () => {
    if (!newAlbumName.trim()) return;
    try {
      await createAlbum.mutateAsync(newAlbumName.trim());
      toast.success(`Album "${newAlbumName.trim()}" created!`);
      setNewAlbumName("");
      if (!selectedAlbum) setSelectedAlbum(newAlbumName.trim());
    } catch {
      toast.error("Failed to create album");
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await deleteAlbum.mutateAsync(name);
      toast.success(`Album "${name}" deleted`);
      if (selectedAlbum === name) setSelectedAlbum("");
    } catch {
      toast.error("Failed to delete album");
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h2 className="font-display text-2xl font-medium mb-1">
        Albums &amp; Photos
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        Organize your wedding photos into albums
      </p>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Album Management */}
        <div className="space-y-4">
          <h3 className="font-body font-semibold text-foreground">
            Manage Albums
          </h3>

          <div className="flex gap-2">
            <Input
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="New album name..."
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              data-ocid="admin.album.input"
            />
            <Button
              onClick={handleCreate}
              disabled={createAlbum.isPending || !newAlbumName.trim()}
              className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
              data-ocid="admin.album.submit_button"
            >
              {createAlbum.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus size={16} />
              )}
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {["al-sk-1", "al-sk-2", "al-sk-3"].map((k) => (
                <Skeleton key={k} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : albums.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
              <Images className="mx-auto mb-2 opacity-30" size={32} />
              <p className="text-sm">No albums yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {albums.map((album, idx) => (
                <button
                  type="button"
                  key={album}
                  data-ocid={`admin.album.item.${idx + 1}`}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                    selectedAlbum === album
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                  onClick={() => setSelectedAlbum(album)}
                >
                  <span className="font-body text-sm font-medium">{album}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(album);
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                    data-ocid={`admin.album.delete_button.${idx + 1}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Photos in selected album */}
        <div className="space-y-4">
          <h3 className="font-body font-semibold text-foreground">Photos</h3>
          {albums.length > 0 && (
            <Select value={selectedAlbum} onValueChange={setSelectedAlbum}>
              <SelectTrigger data-ocid="admin.photo.select">
                <SelectValue placeholder="Select an album" />
              </SelectTrigger>
              <SelectContent>
                {albums.map((album) => (
                  <SelectItem key={album} value={album}>
                    {album}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedAlbum ? (
            <PhotosPanel albumName={selectedAlbum} />
          ) : (
            <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-lg">
              <p className="text-sm">Select an album to manage photos</p>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function PhotosPanel({ albumName }: { albumName: string }) {
  const { data: photos = [], isLoading } = useGetPhotosInAlbum(albumName);
  const addPhoto = useAddPhotoToAlbum();
  const deletePhoto = useDeletePhotoFromAlbum();
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
        setUploadProgress(pct),
      );
      const url = blob.getDirectURL();
      await addPhoto.mutateAsync({ albumName, blobId: url, caption });
      toast.success("Photo uploaded!");
      setCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (photoId: string) => {
    try {
      await deletePhoto.mutateAsync({ albumName, photoId });
      toast.success("Photo deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      <div className="border border-dashed border-primary/40 rounded-lg p-4 space-y-3">
        <div className="space-y-2">
          <Label>Caption (optional)</Label>
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Describe this photo..."
            data-ocid="admin.photo.caption.input"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant="outline"
            className="flex-1 border-primary/40 text-primary hover:bg-primary/5"
            data-ocid="admin.photo.upload_button"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading{" "}
                {uploadProgress}%
              </>
            ) : (
              <>
                <Upload size={15} className="mr-2" /> Choose Photo
              </>
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2">
          {["ph-sk-1", "ph-sk-2", "ph-sk-3", "ph-sk-4"].map((k) => (
            <Skeleton key={k} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div
          data-ocid="gallery.empty_state"
          className="text-center py-6 text-muted-foreground text-sm"
        >
          No photos in this album yet
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {photos.map((photo, idx) => (
            <div
              key={photo.blobId}
              className="relative group aspect-square rounded-lg overflow-hidden"
              data-ocid={`admin.photo.item.${idx + 1}`}
            >
              <PhotoImage
                blobId={photo.blobId}
                alt={photo.caption || `Photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleDelete(photo.blobId)}
                  className="bg-destructive text-destructive-foreground p-2 rounded-full hover:bg-destructive/80 transition-colors"
                  data-ocid={`admin.photo.delete_button.${idx + 1}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {photo.caption && (
                <p className="absolute bottom-0 inset-x-0 text-xs text-white bg-foreground/50 px-2 py-1 truncate">
                  {photo.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
