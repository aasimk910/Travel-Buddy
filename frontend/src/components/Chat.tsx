import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/env";
import { useRoomKey } from "../hooks/useRoomKey";
import { encryptMessage, decryptMessage, isEncrypted } from "../utils/e2e";

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
  createdAt: string;
  attachment?: Attachment;
}

// Fetch previous messages from the API
const fetchMessages = async (hikeId: string): Promise<Message[]> => {
  try {
    const token = localStorage.getItem("travelBuddyToken");
    const res = await fetch(`${API_BASE_URL}/api/messages/${hikeId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return [];
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

const Chat = ({ roomId }: ChatProps) => {
  const { user } = useAuth();
  const userId = user?.id || user?.email || user?.name;
  const { roomKey, isReady: keyReady, error: keyError } = useRoomKey(roomId);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [decryptedTexts, setDecryptedTexts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
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
    fetchMessages(roomId).then((prevMessages) => {
      setMessages(prevMessages);
      setIsLoading(false);
    });

    // Join the chat room
    socket.emit("join_room", { roomId });

    // Listen for incoming messages
    const handleReceiveMessage = async (payload: Message) => {
      console.log("Received message:", payload);
      console.log("Has attachment:", !!payload.attachment);
      if (payload.attachment) {
        console.log("Attachment URL:", payload.attachment.url);
      }

      // Decrypt the message text if we have the room key
      if (roomKey && isEncrypted(payload.message)) {
        const plain = await decryptMessage(payload.message, roomKey);
        const msgKey = payload._id || `recv-${Date.now()}`;
        setDecryptedTexts((prev) => ({ ...prev, [msgKey]: plain }));
      }

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

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [roomId]);

  // Decrypt all messages whenever the room key becomes available
  useEffect(() => {
    if (!roomKey || messages.length === 0) return;
    const decrypt = async () => {
      const entries: Record<string, string> = {};
      await Promise.all(
        messages.map(async (m, idx) => {
          const key = m._id || String(idx);
          if (isEncrypted(m.message)) {
            entries[key] = await decryptMessage(m.message, roomKey);
          } else {
            entries[key] = m.message;
          }
        })
      );
      setDecryptedTexts(entries);
    };
    decrypt();
  }, [roomKey, messages]);

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

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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

      // Encrypt the text payload if the room key is ready
      const plaintext = message.trim() || (selectedFile ? `Sent an image` : "");
      const encryptedText = roomKey
        ? await encryptMessage(plaintext, roomKey)
        : plaintext;

      const payload = {
        roomId,
        message: encryptedText,
        senderId: userId,
        createdAt: new Date().toISOString(),
        attachment,
      };

      console.log("Sending message with attachment:", attachment ? "yes" : "no");
      
      // Optimistically add message to UI (show plaintext to sender)
      const optimisticMessage: Message = {
        _id: `temp-${Date.now()}`,
        roomId,
        message: encryptedText,
        senderId: userId,
        createdAt: payload.createdAt,
        attachment: attachment ? {
          name: attachment.name,
          type: attachment.type,
          data: attachment.data,
        } : undefined,
      };
      
      setMessages((prev) => [...prev, optimisticMessage]);
      // Show plaintext immediately for the sender
      setDecryptedTexts((prev) => ({
        ...prev,
        [optimisticMessage._id!]: plaintext,
      }));
      
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
      {/* E2E status bar */}
      {keyError && (
        <div className="px-4 py-1 text-xs text-yellow-300 bg-yellow-900/30 border-b border-yellow-700/30">
          🔑 {keyError}
        </div>
      )}
      {keyReady && (
        <div className="px-4 py-1 text-xs text-green-400/70 bg-green-900/20 border-b border-green-700/20 flex items-center gap-1">
          <span>🔒</span> End-to-end encrypted
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0 scrollbar-hide" ref={messagesContainerRef} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {isLoading ? (
          <p className="text-center text-glass-dim">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-glass-dim">No messages yet. Start the conversation!</p>
        ) : (
          <>
            {messages.map((m, idx) => {
              const msgKey = m._id || String(idx);
              const displayText = decryptedTexts[msgKey] ?? (isEncrypted(m.message) ? "[decrypting…]" : m.message);
              return (
              <div key={msgKey} className={`flex mb-4 ${m.senderId === userId ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg p-3 max-w-lg ${m.senderId === userId ? 'glass-dark text-glass' : 'glass-strong'}`}>
                <div className="font-bold mb-1 text-white/80">{m.senderId === userId ? 'Me' : m.senderId}</div>
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
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span className="text-sm truncate">{m.attachment.name}</span>
                      </a>
                    )}
                  </div>
                )}
                {displayText && displayText !== 'Sent an image' && (
                  <p className={`${m.senderId === userId ? 'text-glass' : 'text-white/90'}`}>{displayText}</p>
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
                <svg className="w-8 h-8 text-glass-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              )}
              <span className="text-sm text-glass-light truncate">{selectedFile.name}</span>
            </div>
            <button 
              onClick={clearSelectedFile}
              className="p-1 glass-button rounded"
              title="Remove file"
            >
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        )}
        <div className="flex items-center">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isUploading && keyReady && sendMessage()}
            placeholder={roomId && !keyReady ? "Setting up encryption…" : "Type a message..."}
            className="flex-1 p-2 rounded-lg glass-input"
            disabled={isUploading || (!!roomId && !keyReady)}
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
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
            </svg>
          </button>
          <button 
            onClick={sendMessage} 
            className="ml-2 p-2 glass-button-dark disabled:opacity-50"
            disabled={isUploading || (!message.trim() && !selectedFile) || (!!roomId && !keyReady)}
          >
            {isUploading ? (
              <svg className="w-6 h-6 text-glass-light animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-6 h-6 text-glass-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
