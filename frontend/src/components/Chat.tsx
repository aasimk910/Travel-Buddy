import { useEffect, useState } from "react";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext";

interface ChatProps {
  roomId?: string;
}

interface Message {
  roomId?: string;
  message: string;
  senderId: string;
  createdAt: string;
}

export default function Chat({ roomId }: ChatProps) {
  const { user } = useAuth();
  const userId = user?.name;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!roomId) return;

    // Join the chat room
    socket.emit("join_room", { roomId });

    // Listen for incoming messages
    const handleReceiveMessage = (payload: Message) => {
      setMessages((prev) => [...prev, payload]);
    };
    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      // The component shouldn't disconnect the socket, AuthContext handles it.
    };
  }, [roomId]);

  const sendMessage = () => {
    if (!message.trim() || !userId) return;

    const payload = {
      roomId,
      message,
      senderId: userId,
      createdAt: new Date().toISOString(),
    };

    // optimistic UI
    setMessages((prev) => [...prev, payload]);

    socket.emit("send_message", payload);
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex mb-4 ${m.senderId === userId ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg p-3 max-w-lg ${m.senderId === userId ? 'glass-dark text-glass' : 'glass-strong'}`}>
              <div className="font-bold mb-1 text-gray-800">{m.senderId === userId ? 'Me' : m.senderId}</div>
              <p className={`${m.senderId === userId ? 'text-glass' : 'text-gray-900'}`}>{m.message}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-white/20">
        <div className="flex items-center">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 p-2 rounded-lg glass-input"
          />
          <button onClick={sendMessage} className="ml-2 p-2 glass-button-dark">
            <svg className="w-6 h-6 text-glass-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
