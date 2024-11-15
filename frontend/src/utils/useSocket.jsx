// useSocket.js
import { useEffect, useState } from "react";
import io from "socket.io-client";

const useSocket = ({ roomId, username, setChatMessages, setUsersInRoom, setLeader, setTypingUser, setUserActivity, setSelectedVideo,
  setIsPlaying,
  setProgress, }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("join_room", { roomId, username });
    });

    newSocket.on("update_users", (userList) => {
      setUsersInRoom(userList);
      if (!setLeader && userList.length > 0) setLeader(userList[0].username);
    });

    newSocket.on("receive_message", (message) => setChatMessages((prevMessages) => [...prevMessages, message]));
    
    newSocket.on("user_typing", (typingUser) => {
      if (typingUser !== username) {
        setTypingUser(typingUser);
        setTimeout(() => setTypingUser(""), 3000);
      }
    });

    newSocket.on("leader_changed", (newLeader) => setLeader(newLeader));

    newSocket.on("sync_video_change", (videoId) => {
      console.log("Syncing video change:", videoId);
      setSelectedVideo(videoId);
    });

    newSocket.on("sync_video", ({ action, time, progress }) => {
      if (player) {
        if (action === "play") {
          player.seekTo(time);
          player.playVideo();
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
      }
    });

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

    newSocket.on("user_left", ({ username, time }) => setChatMessages((prevMessages) => [
      ...prevMessages,
      { username: "System", message: `${username} left the room`, time },
    ]));

    return () => {
      newSocket.disconnect();
      newSocket.emit("leave_room", { roomId, username });
    };
  }, [roomId, username, setChatMessages, setUsersInRoom, setLeader, setTypingUser]);

  return socket;
};

export default useSocket;
