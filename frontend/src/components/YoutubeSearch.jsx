import React, { useState, useEffect } from 'react';
import axios from 'axios';

function YouTubeSearch({ youtubeSearch, setYoutubeSearch, onVideoSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSearch = async (query) => {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: 20,
          key: import.meta.env.VITE_YOUTUBE_API_KEY,
        },
      });
      setSuggestions(response.data.items);
    } catch (error) {
      console.error('Error fetching YouTube suggestions:', error);
    }
  };

  const handleVideoSelect = (videoId) => {
    onVideoSelect(videoId); // This will emit the sync event if the leader has sync enabled
    setSuggestions([]); // Clear suggestions
    setIsTyping(false); // Reset typing state
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setYoutubeSearch(value);
    setIsTyping(value.trim() !== '');
    if (value.trim()) {
      handleSearch(value);
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex space-x-2">
        <input
          type="text"
          value={youtubeSearch}
          onChange={handleInputChange}
          placeholder="Search YouTube videos"
          className="w-full px-4 py-2 rounded-md bg-gray-800 text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-300"
        />
      </div>

      {/* Display suggestions as a scrollable list */}
      {isTyping && suggestions.length > 0 && (
        <div className="bg-gray-800 rounded-md mt-2 max-h-60 overflow-y-auto custom-scrollbar border border-gray-600 animate-fadeIn">
          {suggestions.map((video) => (
            <div
              key={video.id.videoId}
              onClick={() => handleVideoSelect(video.id.videoId)}
              className="p-2 cursor-pointer hover:bg-gray-700 flex items-center space-x-2 transition duration-300"
            >
              <img src={video.snippet.thumbnails.default.url} alt={video.snippet.title} className="w-16 h-9 rounded-md" />
              <p className="text-sm text-white">{video.snippet.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default YouTubeSearch;