// src/components/Chat.tsx
// Real-time group chat component for hike participants. Uses Socket.IO for messaging
// and supports file attachments uploaded to Cloudinary.
// #region Imports
import { useEffect, useState, useRef } from "react";
import { socket } from "../../utils/socket";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../config/env";
import { Paperclip, FileText, X, Send, Loader2 } from "lucide-react";
import { getToken } from "../../services/auth";

// #endregion Imports
interface ChatProps {
  roomId?: string;
}

interface Attachment {
  name: string;
  type: string;
  data?: string; // base64 (for sending)
  url?: string; // Cloudinary URL (for receiving)
  publicId?: string;
}

interface Message {
  _id?: string;
  roomId?: string;
  message: string;
  senderId: string;
  senderName?: string;
  createdAt: string;
  attachment?: Attachment;
}

// Fetch previous messages from the API
const fetchMessages = async (
  hikeId: string,
  before?: string
): Promise<{ messages: Message[]; hasMore: boolean }> => {
  try {
    const token = getToken();
    const url = new URL(`${API_BASE_URL}/api/messages/${hikeId}`);
    url.searchParams.set("limit", "50");
    if (before) url.searchParams.set("before", before);
    const res = await fetch(url.toString(), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return { messages: [], hasMore: false };
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return { messages: [], hasMore: false };
  }
};

// Convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Handles Chat logic.
const Chat = ({ roomId }: ChatProps) => {
  const { user } = useAuth();
  const userId = user?.id || user?.email || user?.name;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Use setTimeout to ensure DOM is updated before scrolling
    setTimeout(scrollToBottom, 100);
  }, [messages]);

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    // Load previous messages
    setIsLoading(true);
    setHasMore(false);
    fetchMessages(roomId).then(({ messages: prevMessages, hasMore: more }) => {
      setMessages(prevMessages);
      setHasMore(more);
      setIsLoading(false);
    });

    // Join the chat room
    socket.emit("join_room", { roomId });

    // Listen for incoming messages
    const handleReceiveMessage = (payload: Message) => {
      setMessages((prev) => {
        // Replace temp message with server message, or add new message
        if (payload._id) {
          // Remove any temp message from this sender around the same time
          const filtered = prev.filter(m => 
            !(m._id?.startsWith('temp-') && 
              m.senderId === payload.senderId && 
              Math.abs(new Date(m.createdAt).getTime() - new Date(payload.createdAt).getTime()) < 5000)
          );
          
          // Check if this server message already exists
          if (filtered.some(m => m._id === payload._id)) {
            return prev; // Already have this message
          }
          
          return [...filtered, payload];
        }
        return [...prev, payload];
      });
    };
    socket.on("receive_message", handleReceiveMessage);

    // Handles handleAttachmentError logic.
    const handleAttachmentError = ({ message: errMsg }: { message: string }) => {
      setAttachmentError(errMsg);
      setTimeout(() => setAttachmentError(null), 5000);
    };
    socket.on("attachment_error", handleAttachmentError);

    return () => {
      socket.emit("leave_room", { roomId });
      socket.off("receive_message", handleReceiveMessage);
      socket.off("attachment_error", handleAttachmentError);
    };
  }, [roomId]);

  // Handles handleFileSelect logic.
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        alert("Please select an image file");
        return;
      }
      // Limit file size to 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  // Handles clearSelectedFile logic.
  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handles sendMessage logic.
  const sendMessage = async () => {
    if ((!message.trim() && !selectedFile) || !userId) return;

    setIsUploading(true);

    try {
      let attachment: Attachment | undefined;

      if (selectedFile) {
        const base64Data = await fileToBase64(selectedFile);
        attachment = {
          name: selectedFile.name,
          type: selectedFile.type,
          data: base64Data,
        };
      }

      const plaintext = message.trim() || (selectedFile ? "Sent an image" : "");

      const payload = {
        roomId,
        message: plaintext,
        senderId: userId,
        senderName: user?.name,
        createdAt: new Date().toISOString(),
        attachment,
      };

      // Optimistically add message to UI
      const optimisticMessage: Message = {
        _id: `temp-${Date.now()}`,
        roomId,
        message: plaintext,
        senderId: userId,
        createdAt: payload.createdAt,
        attachment: attachment ? {
          name: attachment.name,
          type: attachment.type,
          data: attachment.data,
        } : undefined,
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      // Send to server
      socket.emit("send_message", payload);
      setMessage("");
      clearSelectedFile();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0 scrollbar-hide" ref={messagesContainerRef} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {attachmentError && (
          <div className="mx-4 my-1 px-3 py-2 rounded-lg bg-red-900/40 border border-red-500/30 text-red-300 text-xs text-center">
            {attachmentError}
          </div>
        )}
        {isLoading ? (
          <p className="text-center text-glass-dim">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-glass-dim">No messages yet. Start the conversation!</p>
        ) : (
          <>
            {hasMore && (
              <div className="text-center py-2">
                <button
                  onClick={async () => {
                    if (!roomId || isLoadingMore) return;
                    setIsLoadingMore(true);
                    const oldestId = messages[0]?._id;
                    const { messages: older, hasMore: more } = await fetchMessages(roomId, oldestId);
                    setMessages((prev) => [...older, ...prev]);
                    setHasMore(more);
                    setIsLoadingMore(false);
                  }}
                  disabled={isLoadingMore}
                  className="text-xs text-indigo-300 hover:text-indigo-100 disabled:opacity-50 transition-colors"
                >
                  {isLoadingMore ? "Loading..." : "Load older messages"}
                </button>
              </div>
            )}
            {messages.map((m, idx) => {
              const msgKey = m._id || String(idx);
              return (
              <div key={msgKey} className={`flex mb-4 ${m.senderId === userId ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg p-3 max-w-lg ${m.senderId === userId ? 'glass-dark text-glass' : 'glass-strong'}`}>
                <div className="font-bold mb-1 text-white/80">{m.senderId === userId ? 'Me' : (m.senderName || m.senderId)}</div>
                {m.attachment && (
                  <div className="mb-2">
                    {m.attachment.type.startsWith('image/') ? (
                      <img 
                        src={m.attachment.url || m.attachment.data} 
                        alt={m.attachment.name} 
                        className="max-w-full rounded-lg max-h-64 object-contain cursor-pointer bg-white/10"
                        onClick={() => window.open(m.attachment?.url || m.attachment?.data, '_blank')}
                        onLoad={scrollToBottom}
                        onError={(e) => {
                          console.error("Image failed to load:", m.attachment?.url);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <a 
                        href={m.attachment.url || m.attachment.data} 
                        download={m.attachment.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded glass-button transition"
                      >
                        <FileText className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm truncate">{m.attachment.name}</span>
                      </a>
                    )}
                  </div>
                )}
                {m.message && m.message !== 'Sent an image' && (
                  <p className={`${m.senderId === userId ? 'text-glass' : 'text-white/90'}`}>{m.message}</p>
                )}
                <p className="text-xs text-white/40 mt-1">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <div className="p-4 border-t border-white/20">
        {/* Selected file preview */}
        {selectedFile && (
          <div className="mb-3 p-2 rounded-lg glass-button flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              {selectedFile.type.startsWith('image/') ? (
                <img 
                  src={URL.createObjectURL(selectedFile)} 
                  alt="Preview" 
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <FileText className="w-8 h-8 text-glass-dim" />
              )}
              <span className="text-sm text-glass-light truncate">{selectedFile.name}</span>
            </div>
            <button 
              onClick={clearSelectedFile}
              className="p-1 glass-button rounded"
              title="Remove file"
            >
              <X className="w-5 h-5 text-red-400" />
            </button>
          </div>
        )}
        <div className="flex items-center">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isUploading && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 p-2 rounded-lg glass-input"
            disabled={isUploading}
          />
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="ml-2 p-2 glass-button text-glass-dim hover:text-glass-light" 
            title="Attach file"
            disabled={isUploading}
          >
            <Paperclip className="w-6 h-6" />
          </button>
          <button 
            onClick={sendMessage} 
            className="ml-2 p-2 glass-button-dark disabled:opacity-50"
            disabled={isUploading || (!message.trim() && !selectedFile)}
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-glass-light animate-spin" />
            ) : (
              <Send className="w-6 h-6 text-glass-light" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// #region Exports
export default Chat;
// #endregion Exports
