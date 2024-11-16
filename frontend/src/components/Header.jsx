import React, { useState } from "react";
import { FaCopy, FaEnvelope, FaWhatsapp } from "react-icons/fa";

const Header = ({ username, roomId, copyRoomUrl, shareViaGmail, shareViaWhatsApp }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000); // Reset after 1 second
  };

  return (
    <header className="mb-6 p-3 bg-gray-800 shadow-lg rounded-lg">
      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        {/* Left section: Username */}
        <h1 className="text-3xl pl-2 font-bold text-left text-gray-400">
          Welcome, <span className="text-gray-100 font-3xl font-extrabold">{username}</span>!
        </h1>

        {/* Middle section: Room ID */}
        <div
          onClick={handleCopyRoomId}
          className={`relative border border-gray-600 rounded-lg px-6 py-3 text-center cursor-pointer transition duration-500 shadow-md ${
            copied ? "bg-green-400 opacity-90" : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          <span className="text-lg text-gray-300 font-semibold">Room ID:</span>
          <span className="text-white font-bold ml-2">{roomId}</span>
          {!copied && (
            <FaCopy
              size={16}
              className="text-gray-400 absolute top-1 right-1 hover:text-white"
              title="Click to copy"
            />
          )}
        </div>

        {/* Right section: Share icons */}
        <div className="flex gap-3">
          <button
            onClick={copyRoomUrl}
            title="Copy room link"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded flex items-center transition duration-200"
          >
            <FaCopy size={16} />
          </button>
          <button
            onClick={shareViaGmail}
            title="Share via Gmail"
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded flex items-center transition duration-200"
          >
            <FaEnvelope size={16} />
          </button>
          <button
            onClick={shareViaWhatsApp}
            title="Share via WhatsApp"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded flex items-center transition duration-200"
          >
            <FaWhatsapp size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
