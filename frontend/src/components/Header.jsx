import React from "react";
import { FaCopy, FaEnvelope, FaWhatsapp, FaChartBar } from "react-icons/fa";

const Header = ({ username, roomId, copyRoomUrl, shareViaGmail, shareViaWhatsApp, showAnalytics }) => (
  <header className="mb-2 p-4">
    <div className="flex justify-between items-center">
      {/* Left section: Username */}
            <h1 className="text-2xl pl-2 font-bold text-left text-gray-400">Welcome, <span className="text-gray-100 font-3xl font-extrabold">{username}</span>!</h1>

      {/* Middle section: Room ID */}
      <h2 className="text-xl font-bold text-center text-gray-400">Room ID: <span className="text-gray-100 font-2xl font-extrabold">{roomId}</span></h2>

      {/* Right section: Share icons */}
      <div className="flex gap-3">
        <button
          onClick={copyRoomUrl}
          title="Copy room link"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded flex items-center"
        >
          <FaCopy size={12} />
        </button>
        <button
          onClick={shareViaGmail}
          title="Share via Gmail"
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded flex items-center"
        >
          <FaEnvelope size={12} />
        </button>
        <button
          onClick={shareViaWhatsApp}
          title="Share via WhatsApp"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded flex items-center"
        >
          <FaWhatsapp size={12} />
        </button>
        <button
        onClick={showAnalytics}
        title="Show Analytics"
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded flex items-center"
      >
        <FaChartBar size={12} />
      </button>
      </div>
    </div>
  </header>
);

export default Header;
