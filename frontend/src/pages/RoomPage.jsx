import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import ChatMessages from "../components/ChatMessages";
import MessageInput from "../components/MessageInput";
import YouTubeSearch from "../components/YouTubeSearch";
import ActiveUsers from "../components/ActiveUsers";
import io from "socket.io-client";
import axios from "axios";
import "../components/scrollBar.css";
import {
  FaPlay,
  FaPause,
  FaSync,
  FaChartBar,
} from "react-icons/fa";
import Analytics from "../components/Analytics ";
import {throttle} from 'lodash';
import Header from '../components/Header';
import Modal from '../components/Modal';

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
  const [replyTo, setReplyTo] = useState(null); // State to manage the message being replied to
  const [leader, setLeader] = useState(""); // State to manage the leader of the room
  const [isSyncEnabled, setIsSyncEnabled] = useState(true); // State to manage the sync status
  const progressBarRef = useRef(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [userActivity, setUserActivity] = useState([]); // State to track user activity (join/leave)
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    if (window.YT && selectedVideo) {
      let newPlayer;
  
      try {
        newPlayer = new window.YT.Player("youtube-player", {
          videoId: selectedVideo,
          playerVars: {
            controls: 1,
            modestbranding: 1,
            fs: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
          },
        });
  
        setPlayer(newPlayer);
      } catch (error) {
        console.error("Error creating YouTube player", error);
      }
  
      return () => {
        if (newPlayer) {
          console.log("Destroying player instance");
          newPlayer.destroy();
          setPlayer(null);
        }
      };
    }
  }, [selectedVideo]);
  
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

    const fetchUserEvents = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/rooms/userEvents/${roomId}`
        );
        console.log("User events:", response.data);
        setUserActivity(response.data);
      } catch (error) {
        console.error("Error fetching user events:", error);
      }
    };
    fetchUserEvents();
    fetchMessages();

    const newSocket = io("http://localhost:5000", {
      reconnection: true, 
      reconnectionAttempts: 5, 
      reconnectionDelay: 1000, 
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to backend");
      newSocket.emit("join_room", { roomId, username });
    });

    newSocket.on("update_users", (userList) => {
      console.log("Received user list:", userList);
      setUsersInRoom(userList);
      if (!leader && userList.length > 0) {
        setLeader(userList[0].username); 
      }
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

    newSocket.on("leader_changed", (newLeader) => {
      setLeader(newLeader);
    });

    newSocket.on("sync_video_change", (videoId) => {
      console.log("Syncing video change:", videoId.videoId);
      setSelectedVideo(videoId.videoId);
    });

    newSocket.on("sync_video", ({ action, time, progress }) => {
      if (!player || !isPlayerReady) {
        console.warn("Player not ready or unavailable");
        return;
      }
    
      if (action === "play") {
        player.playVideo();
        player.seekTo(time);
        setIsPlaying(true);
      } else if (action === "pause") {
        player.seekTo(time);
        player.pauseVideo();
        setIsPlaying(false);
      } else if (action === "seek") {
        player.seekTo(time);
        if (progress !== undefined) {
          setProgress(progress);
        }
      }
    });
    

    // Listen for user join and leave events
    newSocket.on("user_joined", ({ username, time }) => {
      setChatMessages((prevMessages) => {
        // Check if the join message already exists
        const joinMessageExists = prevMessages.some(
          (msg) => msg.username === "System" && msg.message === `${username} joined the room`
        );
        if (!joinMessageExists) {
          return [...prevMessages, { username: "System", message: `${username} joined the room`, time }];
        }
        return prevMessages;
      });
    });

    newSocket.on("user_left", ({ username, time }) => {
      setChatMessages((prevMessages) => [
        ...prevMessages,
        { username: "System", message: `${username} left the room`, time },
      ]);
    });

    return () => {
      newSocket.disconnect();
      newSocket.off();
    newSocket.emit("leave_room", { roomId, username });}
  }, [roomId, username, navigate, leader, player, isPlayerReady]);

  const handleVideoSelect = (videoId) => {
    console.log("Selected video:", videoId); // Ensure this is a string
    if (selectedVideo !== videoId) {
      if (username === leader && isSyncEnabled) {
        socket.emit("video_changed", { roomId, videoId });
        console.log("the user in room has selected video:", roomId, videoId);
      }
      setSelectedVideo(videoId);
    }
  };
  
  

  const throttleSync = throttle((action, time, progress) => {
    if (socket?.connected) {
      console.log("Throttling sync:", { action, time, progress });
      socket.emit("sync_video", {
        roomId,
        action,
        time,
        progress,
      });
    }
  }, 1000);
  


  // useEffect(() => {
  //   return () => {
  //     if (player) {
  //       console.log("Destroying player instance in cleanup");
  //       player.destroy();
  //     }
  //   };
  // }, [player]);
  
  

  const onPlayerReady = (event) => {
    console.log("Player ready");
    setIsPlayerReady(true);
    if (isPlaying) {
      event.target.playVideo();
    }
    updateProgress();
  };

  const onPlayerStateChange = (event) => {
    if (!player || event.data === -1) return;
    console.log("Player state changed:", event.data);
    if (!player) return;

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
    if (player && typeof player.getDuration === 'function') {
      const duration = player.getDuration() || 1;
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
    try {
      if (player && typeof player.playVideo === "function") {
        if (isPlaying) {
          player.pauseVideo();
          setIsPlaying(false);
  
          // Sync pause state with others if leader
          if (username === leader && isSyncEnabled) {
            try {
              socket.emit("sync_video", {
                roomId,
                action: "pause",
                time: player.getCurrentTime(),
              });
            } catch (error) {
              console.error("Error syncing pause state:", error);
            }
          }
        } else {
          player.playVideo();
          setIsPlaying(true);
  
          // Sync play state with others if leader
          if (username === leader && isSyncEnabled) {
            try {
              socket.emit("sync_video", {
                roomId,
                action: "play",
                time: player.getCurrentTime(),
              });
            } catch (error) {
              console.error("Error syncing play state:", error);
            }
          }
        }
      } else {
        console.error("Player is not initialized correctly or missing required methods.");
      }
    } catch (error) {
      console.error("An unexpected error occurred in handlePlayPause:", error);
    }
  };
  

  const handleSeek = (event) => {
    if (player && progressBarRef.current) {
      const progressBarWidth = progressBarRef.current?.offsetWidth ?? 1; 
      const clickPosition = event.nativeEvent.offsetX;
      const clickProgress = (clickPosition / progressBarWidth) * 100;
      const duration = player.getDuration();
      const newTime = (clickProgress / 100) * duration || 1; 

      player.seekTo(newTime);
      setProgress(clickProgress || 0); 
      if (username === leader && isSyncEnabled) {
        throttleSync("seek", newTime, clickProgress);
      }
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && socket?.connected) {
      const message = {
        username,
        message: newMessage,
        time: new Date().toLocaleTimeString(),
        roomId,
        replyTo: replyTo ? replyTo.message : null, // Include the replied message
      };

      socket.emit("send_message", message);
      setNewMessage("");
      setReplyTo(null); // Clear the reply state after sending the message
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
      alert("Room URL copied to clipboard!");
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
    window.open(whatsappLink, "_blank");
  };

  const handleShowAnalytics = () => {
    setShowAnalytics(!showAnalytics);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white pt-1 pb-8">
      <Header
        username={username}
        roomId={roomId}
        copyRoomUrl={copyRoomUrl}
        shareViaGmail={shareViaGmail}
        shareViaWhatsApp={shareViaWhatsApp}
      /> 
       <Modal isOpen={showAnalytics} onClose={handleShowAnalytics}>
        <Analytics chatMessages={chatMessages} usersInRoom={usersInRoom} userActivity={userActivity} />
      </Modal>
      
        <div className="flex flex-col md:flex-row w-full max-w-screen-xl mx-auto space-y-4 md:space-y-0 md:space-x-8">
          {/* Left Section: Video Player */}
          <div className="w-full md:w-7/8 bg-gray-800 rounded-lg p-4 flex flex-col space-y-6">
            <YouTubeSearch
              youtubeSearch={youtubeSearch}
              setYoutubeSearch={setYoutubeSearch}
              onVideoSelect={handleVideoSelect}
            />
            <div className="bg-gray-700 rounded-lg mt-2 flex-1 flex flex-col space-y-4 min-h-[30vh]">
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
                    <FaPause
                      size={26}
                      className="text-blue-600 hover:text-blue-700"
                    />
                  ) : (
                    <FaPlay
                      size={26}
                      className="text-blue-600 hover:text-blue-700"
                    />
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

                {username === leader && (
                  <button
                    onClick={() => setIsSyncEnabled(!isSyncEnabled)}
                    className={`ml-2 p-3 rounded-full transition-all duration-300 transform hover:scale-110 hover:rotate-12 shadow-md ${isSyncEnabled
                        ? "bg-gradient-to-br from-green-500 to-blue-600 text-white hover:shadow-lg"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white shadow-sm"
                      }`}
                    title={isSyncEnabled ? "Disable Sync" : "Enable Sync"}
                  >
                    <FaSync
                      size={18}
                      className={`text-white transition-transform duration-500 ${isSyncEnabled ? "rotate-180 animate-shake" : "rotate-0 animate-shake"}`}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>
      
          {/* Right Section: Active Users & Chat */}
          <div className="w-full md:w-2/5 flex flex-col space-y-8">
            {/* Chat Area */}
            <div className="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col shadow-lg ">
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 max-w-full ">
                <ChatMessages
                  chatMessages={chatMessages}
                  setReplyTo={setReplyTo}
                />
                {typingUser && (
                  <p className="text-gray-400 pt-10">{typingUser} is typing...</p>
                )}
              </div>
              {replyTo && (
                <div className="bg-gray-700 p-2 rounded-lg mb-2">
                  <p className="text-gray-400">Replying to: {replyTo.message}</p>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="text-red-500"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <MessageInput
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                handleSendMessage={handleSendMessage}
                handleTyping={handleTyping}
              />
            </div>
            {/* Active Users Section */}
            <div className="h-40 bg-gray-800 rounded-lg p-4 overflow-y-auto shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Active Users</h3>
              <ActiveUsers
                users={usersInRoom}
                currentUsername={username}
                leader={leader}
              />
            </div>
          </div>
            
      </div>
           <button
        onClick={handleShowAnalytics}
        className="fixed bottom-8 right-8 p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:from-blue-600 hover:to-purple-700 transition duration-300"
        title="Show Analytics"
      >
        <div className="absolute top-0 left-10 w-full h-full bg-gradient-to-r from-transparent via-gray-300 to-transparent rounded-full animate-shine"></div>
        <FaChartBar size={24} />
        
      </button>
      
    </div>
  );
}

export default RoomPage;