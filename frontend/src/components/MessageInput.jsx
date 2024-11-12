import React, { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';

const MessageInput = ({ newMessage, setNewMessage, handleSendMessage, handleTyping }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const onEmojiClick = (emojiObject) => {
    const emoji = emojiObject.emoji || emojiObject.native || ''; 
    setNewMessage((prevMessage) => {
      const updatedMessage = (prevMessage || "") + emoji;
      return updatedMessage;
    });
    
    setShowEmojiPicker(false); 
  };

  return (
    <div className="flex items-center space-x-2 relative">
      <button
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        className="bg-gray-700 text-white p-2 rounded-lg"
      >
        😊
      </button>
      {showEmojiPicker && (
        <div className="absolute bottom-16 z-10">
          <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
        </div>
      )}
      <input
        type="text"
        value={newMessage || ''}  
        onChange={(e) => {
          setNewMessage(e.target.value);
        }}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            handleSendMessage();
          }
        }}
        onKeyUp={handleTyping}
        placeholder="Type a message"
        className="flex-1 bg-gray-700 text-white p-2 rounded-lg"
      />
      <button
        onClick={handleSendMessage}
        className="bg-blue-600 text-white p-2 rounded-lg"
      >
        Send
      </button>
    </div>
  );
};

export default MessageInput;
