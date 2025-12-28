import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

interface ChatProps {
  hikeId?: string;
}

const Chat: React.FC<ChatProps> = ({ hikeId }) => {
    interface Message {
    id: number;
    text: string;
    sender: string;
    time: string;
  }

  const socket = useSocket();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Has anyone booked their flight yet? I\'m looking at options for May 15th.', sender: 'Emma', time: '2:34 PM' },
    { id: 2, text: 'I booked mine yesterday! I\'ll be arriving at Narita at 9:00 AM on the 15th.', sender: 'me', time: '2:36 PM' },
    { id: 3, text: 'Not yet, but I\'m planning to book today. Are we all meeting at the hotel?', sender: 'Sarah', time: '2:40 PM' },
    { id: 4, text: 'Yes, I think that\'s the plan. The hotel is in Shinjuku, right?', sender: 'me', time: '2:41 PM' },
  ]);
  const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
    if (hikeId) {
      socket.emit('join room', hikeId);
    }

    const handleNewMessage = (msg: Message) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    };

    socket.on('chat message', handleNewMessage);

    return () => {
      socket.off('chat message', handleNewMessage);
      if (hikeId) {
        socket.emit('leave room', hikeId);
      }
    };
  }, [hikeId, socket]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        text: newMessage,
        sender: 'me', // This should be dynamic based on the logged-in user
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hikeId: hikeId,
      };
      socket.emit('chat message', message);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex mb-4 ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg p-3 max-w-lg ${message.sender === 'me' ? 'glass-dark text-glass' : 'glass-card text-gray-800'}`}>
              {message.sender !== 'me' && <div className="font-bold mb-1 text-gray-700">{message.sender}</div>}
              <p>{message.text}</p>
              <div className={`text-xs mt-1 ${message.sender === 'me' ? 'text-glass-dim' : 'text-gray-500'}`}>{message.time}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 glass-nav">
        <div className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 p-2 rounded-lg glass-input"
            placeholder="Type a message..."
          />
          <button className="ml-2 p-2 glass-button">
            <svg className="w-6 h-6 text-glass-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
          </button>
          <button onClick={handleSendMessage} className="ml-2 p-2 glass-button-dark">
            <svg className="w-6 h-6 text-glass-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
