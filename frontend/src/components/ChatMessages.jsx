import React, { useEffect, useRef } from 'react';
import './ScrollBar.css';
import { FaRobot } from 'react-icons/fa'; // Import the bot icon
import { getColorForUsername } from '../utils/colorUtils'; // Import the utility function

function ChatMessages({ chatMessages, setReplyTo }) {
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div ref={chatContainerRef} className="bg-gray-800 rounded-lg p-4 mb-2 h-[25rem] overflow-y-auto space-y-4 custom-scrollbar max-w-full">
      {chatMessages.length === 0 ? (
        <p className="text-center text-gray-400">No messages yet...</p>
      ) : (
        chatMessages.map((msg, index) => (
          <div key={index} className="flex space-x-2 animate-fadeIn">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${msg.username === 'System' ? 'bg-black' : getColorForUsername(msg.username)}`}>
              {msg.username === 'System' ? <FaRobot /> : msg.username[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex justify-between pl-2">
                <strong className={`text-white ${msg.username === 'System' ? 'text-gray-400' : ''}`}>{msg.username}</strong>
                <span className="text-sm text-gray-400">{msg.time}</span>
              </div>
              <div className={`bg-gray-700 rounded-lg p-2 mt-1 relative ${msg.replyTo ? 'border-l-4 border-blue-500' : ''} ${msg.username === 'System' ? 'bg-gray-600 text-gray-400' : ''}`}>
                <p className="break-words max-w-full">{msg.message}</p>
                {msg.username !== 'System' && (
                  <button
                    onClick={() => setReplyTo(msg)}
                    className="text-blue-500 hover:underline mt-2 absolute right-2 top-1"
                  >
                    Reply
                  </button>
                )}
                {msg.replyTo && (
                  <div className="bg-gray-600 rounded-lg p-2 mt-2">
                    <p className="text-gray-400">Replying to: {msg.replyTo}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ChatMessages;