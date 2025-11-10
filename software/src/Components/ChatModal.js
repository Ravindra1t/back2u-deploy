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
  const [chatPartner, setChatPartner] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Get current user ID from token
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      const decoded = jwtDecode(token);
      setCurrentUser(decoded.user);
    }
  }, []);

  // Determine chat partner
  useEffect(() => {
    if (!item || !currentUser) return;
    
    // If customReceiverId is provided, use it
    if (customReceiverId) {
      // Find the partner from claimRequests or claimedBy
      if (item.claimRequests) {
        const partner = item.claimRequests.find(r => r.user._id === customReceiverId);
        if (partner) {
          setChatPartner(partner.user);
          return;
        }
      }
      if (item.claimedBy && item.claimedBy._id === customReceiverId) {
        setChatPartner(item.claimedBy);
        return;
      }
    }
    
    // Otherwise determine based on user role
    const isFinder = item.reportedBy && item.reportedBy._id === currentUser.id;
    if (isFinder) {
      // Finder chatting with claimer
      if (item.claimedBy) {
        setChatPartner(item.claimedBy);
      } else if (item.claimRequests && item.claimRequests.length > 0) {
        setChatPartner(item.claimRequests[0].user);
      }
    } else {
      // Claimer chatting with finder
      setChatPartner(item.reportedBy);
    }
  }, [item, currentUser, customReceiverId]);

  // Fetch chat history and set up socket listeners
  useEffect(() => {
    if (!item || !currentUser || !chatPartner) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("authToken");
      
      try {
        // Pass partnerId to get only messages between this pair
        const url = `${apiBase}/api/chat/${item._id}?partnerId=${chatPartner._id}`;
        const res = await fetch(url, {
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
      // Only add message if it's from the chat partner (messages from current user are added optimistically)
      const isFromPartner = message.sender._id === chatPartner._id && message.receiver._id === currentUser.id;
      
      if (isFromPartner) {
        setMessages((prev) => [...prev, message]);
      }
    };
    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };

  }, [item, currentUser, chatPartner]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !item || !chatPartner) return;

    const messageContent = newMessage;
    setNewMessage(""); // Clear input immediately

    // Optimistically add message to UI
    const optimisticMessage = {
      _id: `temp-${Date.now()}`, // Temporary ID
      sender: { _id: currentUser.id, name: currentUser.name || 'You' },
      receiver: { _id: chatPartner._id, name: chatPartner.name },
      content: messageContent,
      createdAt: new Date(),
      isOptimistic: true // Flag to identify optimistic messages
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    const token = localStorage.getItem("authToken");
    // Send message to server with specific receiver
    socket.emit("send_message", {
      item: item._id,
      token,
      content: messageContent,
      receiverId: chatPartner._id,
    });
  };

  if (!item) return null;

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg flex flex-col h-[70vh]">
        <DialogHeader>
          <DialogTitle className="text-amrita-blue">
            Chat about: {item.itemName}
            {chatPartner && (
              <span className="text-sm font-normal text-gray-600 block mt-1">
                Chatting with: {chatPartner.name}
              </span>
            )}
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