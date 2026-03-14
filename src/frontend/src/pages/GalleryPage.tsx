import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Heart,
  Settings,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ExternalBlob } from "../backend";
import {
  useGetAlbums,
  useGetPhotosInAlbum,
  useGetWeddingInfo,
} from "../hooks/useQueries";

const SAMPLE_ALBUMS = ["Ceremony", "Reception", "Details", "Portraits"];
const SAMPLE_PHOTOS = [
  {
    blobId: "/assets/generated/sample-wedding-1.dim_800x600.jpg",
    caption: "Our first moment as one",
  },
  {
    blobId: "/assets/generated/sample-wedding-2.dim_800x600.jpg",
    caption: "Every detail, pure love",
  },
  {
    blobId: "/assets/generated/sample-wedding-3.dim_800x600.jpg",
    caption: "Dancing into forever",
  },
  {
    blobId: "/assets/generated/sample-wedding-4.dim_800x600.jpg",
    caption: "Bound by these rings",
  },
  {
    blobId: "/assets/generated/sample-wedding-5.dim_800x600.jpg",
    caption: "Blossoms of happiness",
  },
  {
    blobId: "/assets/generated/sample-wedding-6.dim_800x600.jpg",
    caption: "Joy shared by all",
  },
];

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

function Lightbox({
  photos,
  initialIndex,
  onClose,
}: {
  photos: Array<{ blobId: string; caption: string }>;
  initialIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);
  const photo = photos[current];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-foreground/90 flex items-center justify-center"
        onClick={onClose}
      >
        <button
          type="button"
          className="absolute top-4 right-4 text-primary-foreground/80 hover:text-primary-foreground z-10 p-2"
          onClick={onClose}
        >
          <X size={28} />
        </button>

        {current > 0 && (
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-foreground/80 hover:text-primary-foreground z-10 p-2 bg-white/10 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((c) => c - 1);
            }}
          >
            <ChevronLeft size={32} />
          </button>
        )}

        {current < photos.length - 1 && (
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-foreground/80 hover:text-primary-foreground z-10 p-2 bg-white/10 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((c) => c + 1);
            }}
          >
            <ChevronRight size={32} />
          </button>
        )}

        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="max-w-4xl max-h-[85vh] mx-8 flex flex-col items-center gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <PhotoImage
            blobId={photo.blobId}
            alt={photo.caption}
            className="max-h-[72vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
          {photo.caption && (
            <p className="font-display italic text-lg text-primary-foreground/90 text-center">
              {photo.caption}
            </p>
          )}
          <p className="text-primary-foreground/50 text-sm">
            {current + 1} / {photos.length}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function AlbumGrid({
  albumName,
  isDefault,
}: { albumName: string; isDefault: boolean }) {
  const { data: photos = [], isLoading } = useGetPhotosInAlbum(albumName);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const displayPhotos =
    isDefault && photos.length === 0 ? SAMPLE_PHOTOS : photos;

  if (isLoading) {
    return (
      <div className="masonry-grid" data-ocid="gallery.loading_state">
        {[200, 260, 200, 320, 260, 200].map((h, i) => (
          <div
            key={["sk-a", "sk-b", "sk-c", "sk-d", "sk-e", "sk-f"][i]}
            className="masonry-item"
          >
            <Skeleton
              className="w-full rounded-lg"
              style={{ height: `${h}px` }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (displayPhotos.length === 0) {
    return (
      <div
        data-ocid="gallery.empty_state"
        className="text-center py-24 text-muted-foreground"
      >
        <Camera className="mx-auto mb-4 opacity-30" size={48} />
        <p className="font-display italic text-xl">
          No photos yet in this album
        </p>
        <p className="text-sm mt-2">Photos will appear here once added</p>
      </div>
    );
  }

  return (
    <>
      <div className="masonry-grid">
        {displayPhotos.map((photo, idx) => (
          <motion.div
            key={photo.blobId}
            className="masonry-item cursor-pointer group relative overflow-hidden rounded-lg"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.25 }}
            onClick={() => setLightboxIndex(idx)}
            data-ocid={`gallery.photo.item.${idx + 1}`}
          >
            <PhotoImage
              blobId={photo.blobId}
              alt={photo.caption || `Photo ${idx + 1}`}
              className="w-full object-cover rounded-lg transition-all duration-500 group-hover:brightness-90"
            />
            {photo.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-b-lg">
                <p className="text-primary-foreground font-display italic text-sm">
                  {photo.caption}
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={displayPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

export default function GalleryPage() {
  const { data: weddingInfo, isLoading: infoLoading } = useGetWeddingInfo();
  const { data: albums = [], isLoading: albumsLoading } = useGetAlbums();
  const [activeAlbum, setActiveAlbum] = useState<string | null>(null);

  const displayAlbums = albums.length > 0 ? albums : SAMPLE_ALBUMS;
  const currentAlbum = activeAlbum ?? displayAlbums[0] ?? "";

  const brideName = weddingInfo?.brideName || "Isabella";
  const groomName = weddingInfo?.groomName || "Alexander";
  const weddingDate = weddingInfo?.weddingDate || "May 6, 2025";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="text-primary" size={20} fill="currentColor" />
            <span className="font-display italic text-foreground font-medium">
              Wedding Album
            </span>
          </div>
          <Link to="/admin">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground gap-1.5"
              data-ocid="nav.admin_link"
            >
              <Settings size={15} />
              Admin
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[480px] flex items-center justify-center overflow-hidden">
        <img
          src="/assets/generated/wedding-hero.dim_1600x700.jpg"
          alt="Wedding hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/20 via-foreground/10 to-background" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative text-center px-6"
        >
          <p className="font-body text-sm tracking-[0.3em] uppercase text-primary-foreground/70 mb-4">
            Together Forever
          </p>
          <h1 className="font-script text-6xl md:text-8xl text-white drop-shadow-lg leading-tight">
            {infoLoading ? (
              <Skeleton className="h-20 w-80 mx-auto" />
            ) : (
              <>
                {brideName}
                <span className="mx-4 text-accent">&amp;</span>
                {groomName}
              </>
            )}
          </h1>
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-white/50" />
            <p className="font-display italic text-white/80 text-lg">
              {weddingDate}
            </p>
            <div className="h-px w-16 bg-white/50" />
          </div>
        </motion.div>
      </section>

      {/* Albums & Gallery */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl font-medium text-foreground mb-3">
            Our Story in Photos
          </h2>
          <p className="text-muted-foreground font-body">
            Every picture tells a chapter of our love
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-primary/40" />
            <Heart size={14} className="text-primary" fill="currentColor" />
            <div className="h-px w-12 bg-primary/40" />
          </div>
        </motion.div>

        {/* Album Tabs */}
        {albumsLoading ? (
          <div className="flex gap-3 justify-center mb-10">
            {["al-sk-1", "al-sk-2", "al-sk-3", "al-sk-4"].map((k) => (
              <Skeleton key={k} className="h-10 w-28 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 justify-center mb-10">
            {displayAlbums.map((album) => (
              <button
                type="button"
                key={album}
                onClick={() => setActiveAlbum(album)}
                data-ocid="gallery.album.tab"
                className={`px-6 py-2.5 rounded-full font-body text-sm font-medium transition-all duration-200 border ${
                  currentAlbum === album
                    ? "bg-primary text-primary-foreground border-primary shadow-rose"
                    : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-secondary"
                }`}
              >
                {album}
              </button>
            ))}
          </div>
        )}

        {/* Photo Grid */}
        <AlbumGrid albumName={currentAlbum} isDefault={albums.length === 0} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart size={14} className="text-primary" fill="currentColor" />
            <span className="font-script text-2xl text-primary">
              {brideName} &amp; {groomName}
            </span>
            <Heart size={14} className="text-primary" fill="currentColor" />
          </div>
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()}. Built with{" "}
            <Heart
              size={12}
              className="inline text-primary"
              fill="currentColor"
            />{" "}
            using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
