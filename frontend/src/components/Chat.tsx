import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/env";

interface ChatProps {
  roomId?: string;
}

interface Attachment {
  name: string;
  type: string;
  data: string; // base64
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
    const res = await fetch(`${API_BASE_URL}/api/messages/${hikeId}`);
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

const Chat: React.FC<ChatProps> = ({ roomId }) => {
  const { user } = useAuth();
  const userId = user?.name;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
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
    const handleReceiveMessage = (payload: Message) => {
      setMessages((prev) => {
        // Avoid duplicates by checking _id
        if (payload._id && prev.some(m => m._id === payload._id)) {
          return prev;
        }
        return [...prev, payload];
      });
    };
    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [roomId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit file size to 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
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

      const payload = {
        roomId,
        message: message.trim() || (selectedFile ? `📎 ${selectedFile.name}` : ""),
        senderId: userId,
        createdAt: new Date().toISOString(),
        attachment,
      };

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
      <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0" ref={messagesEndRef}>
        {isLoading ? (
          <p className="text-center text-glass-dim">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-glass-dim">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((m, idx) => (
            <div key={m._id || idx} className={`flex mb-4 ${m.senderId === userId ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg p-3 max-w-lg ${m.senderId === userId ? 'glass-dark text-glass' : 'glass-strong'}`}>
                <div className="font-bold mb-1 text-gray-800">{m.senderId === userId ? 'Me' : m.senderId}</div>
                {m.attachment && (
                  <div className="mb-2">
                    {m.attachment.type.startsWith('image/') ? (
                      <img 
                        src={m.attachment.data} 
                        alt={m.attachment.name} 
                        className="max-w-full rounded-lg max-h-64 object-contain cursor-pointer"
                        onClick={() => window.open(m.attachment?.data, '_blank')}
                      />
                    ) : (
                      <a 
                        href={m.attachment.data} 
                        download={m.attachment.name}
                        className="flex items-center gap-2 p-2 rounded bg-white/20 hover:bg-white/30 transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span className="text-sm truncate">{m.attachment.name}</span>
                      </a>
                    )}
                  </div>
                )}
                {m.message && !m.message.startsWith('📎') && (
                  <p className={`${m.senderId === userId ? 'text-glass' : 'text-gray-900'}`}>{m.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
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
              className="p-1 hover:bg-white/20 rounded"
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
            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
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
            disabled={isUploading || (!message.trim() && !selectedFile)}
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
