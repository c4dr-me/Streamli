import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import ChatMessages from "../components/ChatMessages";
import MessageInput from "../components/MessageInput";
import YouTubeSearch from "../components/YouTubeSearch";
import ActiveUsers from "../components/ActiveUsers";
import io from "socket.io-client";
import axios from "axios";
import "../components/scrollBar.css"; 
import { FaPlay, FaPause, FaCopy, FaEnvelope, FaWhatsapp } from "react-icons/fa";

function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState(location?.state?.username || "");
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [youtubeSearch, setYoutubeSearch] = useState("");
  const [usersInRoom, setUsersInRoom] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState("dQw4w9WgXcQ"); 
  const [socket, setSocket] = useState(null);
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false); 
  const [progress, setProgress] = useState(0);
  const [typingUser, setTypingUser] = useState("");
  const progressBarRef = useRef(null);

  useEffect(() => {
    if (!username) {
      navigate("/", { state: { roomId } });
      return;
    }

    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/messages/${roomId}`
        );
        setChatMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to backend");
      newSocket.emit("join_room", { roomId, username });
    });

    newSocket.on("update_users", (userList) => {
      console.log("Received user list:", userList);
      setUsersInRoom(userList);
    });

    newSocket.on("receive_message", (message) => {
      setChatMessages((prevMessages) => [...prevMessages, message]);
    });

    newSocket.on("user_typing", (typingUser) => {
      if (typingUser !== username) {
        setTypingUser(typingUser);
        setTimeout(() => setTypingUser(""), 3000);
      }
    });

    return () => newSocket.disconnect();
  }, [roomId, username, navigate]);

  useEffect(() => {
    if (window.YT) {
      const newPlayer = new window.YT.Player("youtube-player", {
        videoId: selectedVideo,
        playerVars: {
          controls: 1,
          modestbranding: 1,
          fs: 1,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      });

      setPlayer(newPlayer);

      return () => {
        if (newPlayer) {
          newPlayer.destroy();
        }
      };
    }
  }, [selectedVideo]);

  const onPlayerReady = (event) => {
    console.log("Player ready");
    if (isPlaying) {
      event.target.playVideo();
    }
  };

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      updateProgress();
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
    }
  };

  const updateProgress = () => {
    if (player) {
      const duration = player.getDuration();
      const currentTime = player.getCurrentTime();
      const progress = (currentTime / duration) * 100;
      setProgress(progress);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        updateProgress();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPlaying, player]);

  const handlePlayPause = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
        setIsPlaying(false);
      } else {
        player.playVideo();
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (event) => {
    if (player && progressBarRef.current) {
      const progressBarWidth = progressBarRef.current.offsetWidth;
      const clickPosition = event.nativeEvent.offsetX;
      const clickProgress = (clickPosition / progressBarWidth) * 100;
      const newTime = (clickProgress / 100) * player.getDuration();
      player.seekTo(newTime);
      setProgress(clickProgress);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && socket?.connected) {
      const message = {
        username,
        message: newMessage,
        time: new Date().toLocaleTimeString(),
        roomId,
      };

      socket.emit("send_message", message);
      setNewMessage("");
    }
  };

  const handleTyping = () => {
    if (socket?.connected) {
      socket.emit("typing", { roomId, username });
    }
  };

  const copyRoomUrl = () => {
    const roomUrl = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(roomUrl).then(() => {
      alert('Room URL copied to clipboard!');
    });
  };

  const shareViaGmail = () => {
    const roomUrl = `${window.location.origin}/room/${roomId}`;
    const mailtoLink = `mailto:?subject=Join%20Room%20${roomId}&body=Join%20the%20room%20using%20this%20link:%20${roomUrl}`;
    window.location.href = mailtoLink;
  };

  const shareViaWhatsApp = () => {
    const roomUrl = `${window.location.origin}/room/${roomId}`;
    const whatsappLink = `https://wa.me/?text=Join%20the%20room%20using%20this%20link:%20${roomUrl}`;
    window.open(whatsappLink, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white pt-1">
      <header className="mb-2">
        <h1 className="text-2xl font-bold text-center">
          Welcome, {username}!
        </h1>
        <div className="flex flex-row justify-center gap-2">
          <h2 className="text-1xl text-center text-gray-400">
            Room #{roomId}
          </h2>
          <button
            onClick={copyRoomUrl}
            title="Copy room ID"
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
        </div>
      </header>
      <div className="flex flex-col md:flex-row w-full max-w-screen-xl mx-auto space-y-4 md:space-y-0 md:space-x-8">
        {/* Left Section: Video Player */}
        <div className="w-full md:w-7/8 bg-gray-800 rounded-lg p-4 flex flex-col space-y-6">
          <YouTubeSearch
            youtubeSearch={youtubeSearch}
            setYoutubeSearch={setYoutubeSearch}
            onVideoSelect={setSelectedVideo} 
          />
          <div className="bg-gray-700 rounded-lg mt-2 flex-1">
            <div
              id="youtube-player"
              className="w-full h-[400px] md:h-[490px] rounded-lg"
            ></div>

            <div className="flex items-center justify-between mt-2 px-2 pb-2">
              <button
                onClick={handlePlayPause}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === "") {
                    handlePlayPause();
                    event.preventDefault();
                  }
                }}
                tabIndex="1"
                className="flex m-auto items-center pl-4 justify-center p-0 bg-transparent border-none hover:bg-transparent transition duration-300"
                aria-label={isPlaying ? "Pause video" : "Play video"}
              >
                {isPlaying ? (
                  <FaPause size={26} className="text-blue-600 hover:text-blue-700" />
                ) : (
                  <FaPlay size={26} className="text-blue-600 hover:text-blue-700" />
                )}
              </button>

              <div className="flex-1 mx-4">
                <div
                  ref={progressBarRef}
                  className="progressbar-container"
                  onClick={handleSeek}
                >
                  <div
                    className="progressbar-complete"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="progressbar-liquid"></div>
                  </div>
                  <span className="progress">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Active Users & Chat */}
        <div className="w-full md:w-2/5 flex flex-col space-y-8">
          {/* Active Users Section */}
          <div className="h-40 bg-gray-800 rounded-lg p-4 overflow-y-auto shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Active Users</h3>
            <ActiveUsers users={usersInRoom} currentUsername={username} />
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col shadow-lg min-h-[70vh]">
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 max-w-full ">
              <ChatMessages chatMessages={chatMessages} />
              {typingUser && <p className="text-gray-400 pt-10">{typingUser} is typing...</p>}
            </div>
            <MessageInput
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              handleSendMessage={handleSendMessage}
              handleTyping={handleTyping}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomPage;