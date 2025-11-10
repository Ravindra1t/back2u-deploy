import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input"; 
import { Send, Loader2 } from "lucide-react";
import io from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import { apiBase, socketUrl } from "../config";

// Connect to your backend socket server
const socket = io(socketUrl);

export default function ChatModal({ item, onClose, customReceiverId = null }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Get current user ID from token
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      const decoded = jwtDecode(token);
      setCurrentUser(decoded.user);
    }
  }, []);

  // Fetch chat history and set up socket listeners
  useEffect(() => {
    if (!item || !currentUser) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("authToken");
      
      try {
        const res = await fetch(`${apiBase}/api/chat/${item._id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
      }
      setIsLoading(false);
    };
    
    fetchHistory();

    const token = localStorage.getItem("authToken");
    socket.emit("join_room", { itemId: item._id, token });

    const handleReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };
    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };

  }, [item, currentUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !item) return;

    const token = localStorage.getItem("authToken");
    // Send message to server (server determines receiver & authorization)
    socket.emit("send_message", {
      item: item._id,
      token,
      content: newMessage,
      receiverId: customReceiverId || undefined,
    });

    setNewMessage(""); // Clear input
  };

  if (!item) return null;

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg flex flex-col h-[70vh]">
        <DialogHeader>
          <DialogTitle className="text-amrita-blue">
            Chat about: {item.itemName}
          </DialogTitle>
        </DialogHeader>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 text-amrita-blue animate-spin" />
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${msg.sender._id === currentUser.id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-3 rounded-lg max-w-[70%] ${
                    msg.sender._id === currentUser.id
                      ? "bg-amrita-blue text-white"
                      : "bg-white text-gray-800 border"
                  }`}
                >
                  <p className="text-xs font-semibold mb-1 opacity-70">
                    {msg.sender.name}
                  </p>
                  <p>{msg.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Send Message Form */}
        <form onSubmit={handleSendMessage} className="flex gap-2 pt-4">
          <Input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)} 
            className="flex-1"
          />
          <Button type="submit" className="bg-amrita-blue hover:bg-amrita-blue-dark">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}