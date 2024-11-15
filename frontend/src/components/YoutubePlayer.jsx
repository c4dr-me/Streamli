// YouTubePlayer.js
import React, { useState, useEffect, useRef } from "react";
import { FaPlay, FaPause, FaSync } from "react-icons/fa";
import { throttle } from "lodash";

function YouTubePlayer({
  selectedVideo,
  isPlaying,
  setIsPlaying,
  leader,
  username,
  isSyncEnabled,
  progress,
  setProgress,
  socket,
  roomId,
  onVideoChange,
}) {
  const [player, setPlayer] = useState(null);
  const progressBarRef = useRef(null);

  useEffect(() => {
    if (window.YT) {
      try {
        const newPlayer = new window.YT.Player("youtube-player", {
          videoId: selectedVideo,
          playerVars: {
            controls: 0,
            modestbranding: 1,
            fs: 1,
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
          },
        });
        setPlayer(newPlayer);
        return () => newPlayer.destroy();
      } catch (error) {
        console.error("Error creating YouTube player", error);
      }
    }
  }, [selectedVideo]);

  const onPlayerReady = (event) => {
    if (isPlaying) event.target.playVideo();
  };

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      updateProgress();
      if (username === leader && isSyncEnabled) {
        throttleSync("play", player.getCurrentTime(), progress);
      }
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
      if (username === leader && isSyncEnabled) {
        throttleSync("pause", player.getCurrentTime(), progress);
      }
    }
  };

  const updateProgress = () => {
    if (player) {
      const duration = player.getDuration();
      const currentTime = player.getCurrentTime();
      const newProgress = (currentTime / duration) * 100;
      setProgress(newProgress);
    }
  };

  const handlePlayPause = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
        setIsPlaying(false);
        if (username === leader && isSyncEnabled) {
          socket.emit("sync_video", {
            roomId,
            action: "pause",
            time: player.getCurrentTime(),
          });
        }
      } else {
        player.playVideo();
        setIsPlaying(true);
        if (username === leader && isSyncEnabled) {
          socket.emit("sync_video", {
            roomId,
            action: "play",
            time: player.getCurrentTime(),
          });
        }
      }
    }
  };

  const throttleSync = throttle((action, time, progress) => {
    if (socket?.connected) {
      socket.emit("sync_video", {
        roomId,
        action,
        time,
        progress,
      });
    }
  }, 1000);

  const handleSeek = (event) => {
    if (player && progressBarRef.current) {
      const progressBarWidth = progressBarRef.current.offsetWidth ?? 1;
      const clickPosition = event.nativeEvent.offsetX;
      const clickProgress = (clickPosition / progressBarWidth) * 100;
      const duration = player.getDuration();
      const newTime = (clickProgress / 100) * duration || 0;

      player.seekTo(newTime);
      setProgress(clickProgress || 0);
      if (username === leader && isSyncEnabled) {
        throttleSync("seek", newTime, clickProgress);
      }
    }
  };

  return (
    <div className="bg-gray-700 rounded-lg mt-2 flex-1 flex flex-col space-y-4 min-h-[30vh]">
      <div id="youtube-player" className="w-full h-[400px] md:h-[490px] rounded-lg"></div>
      <div className="flex items-center justify-between mt-2 px-2 pb-2">
        <button
          onClick={handlePlayPause}
          tabIndex="1"
          className="flex m-auto items-center pl-4 justify-center p-0 bg-transparent border-none hover:bg-transparent transition duration-300"
          aria-label={isPlaying ? "Pause video" : "Play video"}
        >
          {isPlaying ? <FaPause size={26} className="text-blue-600 hover:text-blue-700" /> : <FaPlay size={26} className="text-blue-600 hover:text-blue-700" />}
        </button>

        <div className="flex-1 mx-4">
          <div ref={progressBarRef} className="progressbar-container" onClick={handleSeek}>
            <div className="progressbar-complete" style={{ width: `${progress}%` }}>
              <div className="progressbar-liquid"></div>
            </div>
            <span className="progress">{Math.round(progress)}%</span>
          </div>
        </div>

        {username === leader && (
          <button
            onClick={() => onVideoChange(!isSyncEnabled)}
            className={`ml-2 p-3 rounded-full transition-all duration-300 transform hover:scale-110 hover:rotate-12 shadow-md ${
              isSyncEnabled ? "bg-gradient-to-br from-green-500 to-blue-600 text-white hover:shadow-lg" : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white shadow-sm"
            }`}
            title={isSyncEnabled ? "Disable Sync" : "Enable Sync"}
          >
            <FaSync size={18} className={`text-white transition-transform duration-500 ${isSyncEnabled ? "rotate-180 animate-shake" : "rotate-0 animate-shake"}`} />
          </button>
        )}
      </div>
    </div>
  );
}

export default YouTubePlayer;
