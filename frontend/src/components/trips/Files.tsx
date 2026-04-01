// src/components/Files.tsx
// Photo gallery/lightbox component for viewing hike group photos with zoom and navigation.
// #region Imports
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config/env';
import { Download, X, Loader2, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { getToken } from "../../services/auth";

// #endregion Imports
interface FilesProps {
  roomId?: string;
}

interface Attachment {
  name: string;
  type: string;
  url?: string;
  data?: string;
  publicId?: string;
}

interface Message {
  _id: string;
  message: string;
  senderId: string;
  createdAt: string;
  attachment?: Attachment;
}

// Handles Files logic.
const Files = ({ roomId }: FilesProps) => {
  const [images, setImages] = useState<Array<{ url: string; name: string; date: string; sender: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Handles handleDownload logic.
  const handleDownload = async (url: string, name: string) => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!roomId) {
      setImages([]);
      setIsLoading(false);
      return;
    }

    // Handles fetchImages logic.
    const fetchImages = async () => {
      setIsLoading(true);
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE_URL}/api/messages/${roomId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          setImages([]);
          return;
        }
        const messages: Message[] = await res.json();
        
        // Filter messages with image attachments
        const imageMessages = messages
          .filter(m => m.attachment && m.attachment.type.startsWith('image/'))
          .map(m => ({
            url: m.attachment!.url || m.attachment!.data || '',
            name: m.attachment!.name,
            date: new Date(m.createdAt).toLocaleDateString(),
            sender: m.senderId,
          }));
        
        setImages(imageMessages);
      } catch (error) {
        console.error('Failed to fetch images:', error);
        setImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [roomId]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    // Handles handleKey logic.
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null);
      else if (e.key === 'ArrowLeft') setLightboxIdx(i => (i! > 0 ? i! - 1 : images.length - 1));
      else if (e.key === 'ArrowRight') setLightboxIdx(i => (i! < images.length - 1 ? i! + 1 : 0));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIdx, images.length]);

  if (!roomId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-glass-dim">Select a trip to view files</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-glass-dim">Loading files...</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-glass-dim">No images uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      {/* Lightbox */}
      {lightboxIdx !== null && (() => {
        const img = images[lightboxIdx];
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
            onClick={() => setLightboxIdx(null)}
          >
            <div
              className="glass-card relative flex flex-col rounded-2xl shadow-2xl overflow-hidden"
              style={{ maxWidth: '92vw', maxHeight: '92vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
                <div className="min-w-0 mr-4">
                  <p className="text-white font-medium text-sm truncate max-w-[50vw]">{img.name}</p>
                  <p className="text-white/50 text-xs mt-0.5">By {img.sender} &middot; {img.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(img.url, img.name)}
                    title="Download"
                    disabled={downloading}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white/70 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {downloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setLightboxIdx(null)}
                    title="Close (Esc)"
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500/70 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Image + nav arrows */}
              <div className="relative flex items-center justify-center flex-1 min-h-0 px-12 py-5">
                <img
                  src={img.url}
                  alt={img.name}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg select-none"
                  style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
                />
                {images.length > 1 && (
                  <button
                    onClick={() => setLightboxIdx(i => (i! > 0 ? i! - 1 : images.length - 1))}
                    className="absolute left-2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 flex items-center justify-center text-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {images.length > 1 && (
                  <button
                    onClick={() => setLightboxIdx(i => (i! < images.length - 1 ? i! + 1 : 0))}
                    className="absolute right-2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 border border-white/10 flex items-center justify-center text-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Footer counter */}
              {images.length > 1 && (
                <div className="flex items-center justify-center pb-3 shrink-0">
                  <span className="text-white/40 text-xs tracking-widest">
                    {lightboxIdx + 1} / {images.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })()}
      <div className="p-4 h-full overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <div key={idx} className="glass-card rounded-lg overflow-hidden group cursor-pointer">
              <div className="relative aspect-square">
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onClick={() => setLightboxIdx(idx)}
                />
                <div
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center"
                  onClick={() => setLightboxIdx(idx)}
                >
                  <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs text-glass-light truncate">{img.name}</p>
                <p className="text-xs text-glass-dim">By {img.sender}</p>
                <p className="text-xs text-glass-dim">{img.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// #region Exports
export default Files;
// #endregion Exports
