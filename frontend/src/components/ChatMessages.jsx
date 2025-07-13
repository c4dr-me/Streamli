import React, { useEffect, useRef } from "react";
import "./ScrollBar.css";
import { FaRobot } from "react-icons/fa";
import { getColorForUsername } from "../utils/colorUtils"; // Import the utility function

function ChatMessages({ chatMessages, setReplyTo }) {
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div
      ref={chatContainerRef}
      className="bg-gray-800 rounded-lg p-4 mb-2 h-[25rem] overflow-y-auto space-y-4 custom-scrollbar max-w-full"
    >
      {chatMessages.length === 0 ? (
        <p className="text-center text-gray-400">No messages yet...</p>
      ) : (
        chatMessages.map((msg, index) => (
          <div key={index} className="flex space-x-2 animate-fadeIn">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                msg.username === "System"
                  ? "bg-black"
                  : getColorForUsername(msg.username)
              }`}
            >
              {msg.username === "System" ? (
                <FaRobot />
              ) : (
                msg.username[0].toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between pl-2">
                <strong
                  className={`text-white ${
                    msg.username === "System" ? "text-gray-400" : ""
                  }`}
                >
                  {msg.username}
                </strong>
                <span className="text-sm text-gray-400">{msg.time}</span>
              </div>

              <div
                className={`${
                  msg.isToxic
                    ? "bg-gradient-to-r from-red-500 to-black text-white border-l-4 border-red-800 opacity-80 relative group"
                    : "bg-gray-700"
                } rounded-lg p-2 mt-1`}
              >
                <p className="break-words max-w-full">{msg.message}</p>
                {msg.isToxic && (
                  <>
                    <span className="absolute top-0 right-0 bg-red-400 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
                      Inappropriate
                    </span>
                    <div className="absolute top-0 right-0 mt-2 mr-2 hidden group-hover:block bg-black text-white text-xs rounded p-1">
                      Message not sent
                    </div>
                  </>
                )}

                {!msg.isToxic && msg.username !== "System" && (
                  <button
                    onClick={() => setReplyTo(msg)}
                    className="text-blue-500 hover:underline mt-2 ml-2 flex items-center gap-1"
                    title="Reply to this message"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h7V6a1 1 0 011-1h7a1 1 0 011 1v12a1 1 0 01-1 1h-7a1 1 0 01-1-1v-4H3v-4z" /></svg>
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