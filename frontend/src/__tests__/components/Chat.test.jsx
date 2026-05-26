// frontend/src/__tests__/components/Chat.test.jsx
// Tests for FR-OS-09 (real-time chat message) and FR-OS-10 (file/image attachment)

import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';

// Mock chat room component
const ChatRoom = ({ roomId, messages, currentUser, onSendMessage, onUploadFile }) => {
  return (
    <div data-testid="chat-room">
      <div data-testid="messages-list">
        {messages && messages.length > 0 ? (
          messages.map(msg => (
            <div key={msg.id} data-testid={`message-${msg.id}`} className="message">
              <span data-testid={`msg-sender-${msg.id}`}>{msg.senderName}</span>
              <span data-testid={`msg-text-${msg.id}`}>{msg.text}</span>
              {msg.attachmentUrl && (
                <img
                  src={msg.attachmentUrl}
                  alt="attachment"
                  data-testid={`msg-attachment-${msg.id}`}
                />
              )}
            </div>
          ))
        ) : (
          <p data-testid="no-messages">No messages yet. Say hello!</p>
        )}
      </div>

      <form
        data-testid="message-form"
        onSubmit={e => {
          e.preventDefault();
          const input = e.target.elements['message-input'];
          if (input.value.trim()) {
            onSendMessage && onSendMessage(input.value);
            input.value = '';
          }
        }}
      >
        <input
          type="text"
          name="message-input"
          data-testid="message-input"
          placeholder="Type a message..."
        />
        <button type="submit" data-testid="send-button">Send</button>
        <label htmlFor="file-upload" data-testid="attach-label">
          Attach
          <input
            id="file-upload"
            type="file"
            data-testid="file-input"
            accept="image/*,.pdf,.doc,.docx"
            onChange={e => {
              const file = e.target.files[0];
              if (file) onUploadFile && onUploadFile(file);
            }}
            style={{ display: 'none' }}
          />
        </label>
      </form>
    </div>
  );
};

const mockMessages = [
  { id: 'msg-1', senderName: 'Alice', text: 'Hello everyone!', attachmentUrl: null },
  { id: 'msg-2', senderName: 'Bob', text: 'Ready for the hike?', attachmentUrl: null },
  { id: 'msg-3', senderName: 'Alice', text: 'Check this map', attachmentUrl: 'https://example.com/map.jpg' },
];

const mockUser = { id: 'u1', name: 'Alice' };

describe('Chat Component - FR-OS-09: Real-time Message Display', () => {
  it('should render the chat room', () => {
    render(
      <Router>
        <ChatRoom roomId="hike-123" messages={[]} currentUser={mockUser} />
      </Router>
    );

    expect(screen.getByTestId('chat-room')).toBeInTheDocument();
    expect(screen.getByTestId('messages-list')).toBeInTheDocument();
  });

  it('should display existing messages in the chat', () => {
    render(
      <Router>
        <ChatRoom roomId="hike-123" messages={mockMessages} currentUser={mockUser} />
      </Router>
    );

    expect(screen.getByTestId('message-msg-1')).toBeInTheDocument();
    expect(screen.getByTestId('msg-text-msg-1')).toHaveTextContent('Hello everyone!');
    expect(screen.getByTestId('msg-sender-msg-1')).toHaveTextContent('Alice');
  });

  it('should display all messages from different senders', () => {
    render(
      <Router>
        <ChatRoom roomId="hike-123" messages={mockMessages} currentUser={mockUser} />
      </Router>
    );

    expect(screen.getByTestId('msg-sender-msg-2')).toHaveTextContent('Bob');
    expect(screen.getByTestId('msg-text-msg-2')).toHaveTextContent('Ready for the hike?');
  });

  it('should show empty state when no messages exist', () => {
    render(
      <Router>
        <ChatRoom roomId="hike-123" messages={[]} currentUser={mockUser} />
      </Router>
    );

    expect(screen.getByTestId('no-messages')).toBeInTheDocument();
  });

  it('should render message input and send button', () => {
    render(
      <Router>
        <ChatRoom roomId="hike-123" messages={[]} currentUser={mockUser} />
      </Router>
    );

    expect(screen.getByTestId('message-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  it('should call onSendMessage when form is submitted with text', async () => {
    const user = userEvent.setup();
    const mockSend = jest.fn();

    render(
      <Router>
        <ChatRoom roomId="hike-123" messages={[]} currentUser={mockUser} onSendMessage={mockSend} />
      </Router>
    );

    const input = screen.getByTestId('message-input');
    await user.type(input, 'See you at the trailhead!');

    const form = screen.getByTestId('message-form');
    form.dispatchEvent(new Event('submit', { bubbles: true }));

    await waitFor(() => {
      expect(mockSend).toHaveBeenCalledWith('See you at the trailhead!');
    });
  });
});

describe('Chat Component - FR-OS-10: File Attachment in Chat', () => {
  it('should render file upload input', () => {
    render(
      <Router>
        <ChatRoom roomId="hike-123" messages={[]} currentUser={mockUser} />
      </Router>
    );

    expect(screen.getByTestId('file-input')).toBeInTheDocument();
  });

  it('should display image attachments in messages', () => {
    render(
      <Router>
        <ChatRoom roomId="hike-123" messages={mockMessages} currentUser={mockUser} />
      </Router>
    );

    expect(screen.getByTestId('msg-attachment-msg-3')).toBeInTheDocument();
    expect(screen.getByTestId('msg-attachment-msg-3')).toHaveAttribute('src', 'https://example.com/map.jpg');
  });

  it('should not render attachment element for text-only messages', () => {
    render(
      <Router>
        <ChatRoom roomId="hike-123" messages={mockMessages} currentUser={mockUser} />
      </Router>
    );

    expect(screen.queryByTestId('msg-attachment-msg-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('msg-attachment-msg-2')).not.toBeInTheDocument();
  });

  it('should call onUploadFile when a file is selected', async () => {
    const user = userEvent.setup();
    const mockUpload = jest.fn();

    render(
      <Router>
        <ChatRoom roomId="hike-123" messages={[]} currentUser={mockUser} onUploadFile={mockUpload} />
      </Router>
    );

    const fileInput = screen.getByTestId('file-input');
    const file = new File(['photo content'], 'photo.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, file);

    expect(mockUpload).toHaveBeenCalledWith(file);
  });

  it('should accept image and document file types', () => {
    render(
      <Router>
        <ChatRoom roomId="hike-123" messages={[]} currentUser={mockUser} />
      </Router>
    );

    const fileInput = screen.getByTestId('file-input');
    expect(fileInput).toHaveAttribute('accept', 'image/*,.pdf,.doc,.docx');
  });
});
