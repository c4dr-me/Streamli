// client/src/components/ChatMessages.jsx
import React from 'react';
import './ScrollBar.css';

function ChatMessages({ chatMessages }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-2 h-80 overflow-y-auto space-y-4 custom-scrollbar">
      {chatMessages.length === 0 ? (
        <p className="text-center text-gray-400">No messages yet...</p>
      ) : (
        chatMessages.map((msg, index) => (
          <div key={index} className="flex space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {msg.username[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <strong>{msg.username}</strong>
                <span className="text-sm text-gray-400">{msg.time}</span>
              </div>
              <p>{msg.message}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ChatMessages;
