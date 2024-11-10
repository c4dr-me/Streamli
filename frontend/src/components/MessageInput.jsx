// client/src/components/MessageInput.jsx
import React from 'react';

function MessageInput({ newMessage, setNewMessage, handleSendMessage }) {
  return (
    <div className="flex space-x-2 mb-6">
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        onClick={handleSendMessage}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Send
      </button>
    </div>
  );
}

export default MessageInput;
