import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/env';

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

const Files = ({ roomId }: FilesProps) => {
  const [images, setImages] = useState<Array<{ url: string; name: string; date: string; sender: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setImages([]);
      setIsLoading(false);
      return;
    }

    const fetchImages = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/messages/${roomId}`);
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
    <div className="p-4 h-full overflow-y-auto">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img, idx) => (
          <div key={idx} className="glass-card rounded-lg overflow-hidden group cursor-pointer">
            <div className="relative aspect-square">
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onClick={() => window.open(img.url, '_blank')}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"></path>
                </svg>
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
  );
};

export default Files;
