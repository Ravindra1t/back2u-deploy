import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Frown, Loader2 } from "lucide-react";
import ItemCard from "../Components/browse/ItemCard";
import SearchFilters from "../Components/browse/SearchFilters";
import ItemDetailsModal from "../Components/browse/ItemDetailsModal";
import { apiBase } from "../config";

export default function BrowseFound() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const navigate = useNavigate();

  // Fetch items whenever filters change
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        // This is a public endpoint again
        const response = await fetch(`${apiBase}/api/items/browse?search=${searchTerm}&category=${selectedCategory}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch items");
        }
        
        const data = await response.json();
        setItems(data);
      } catch (e) {
        console.error("Failed to fetch items:", e);
      }
      setIsLoading(false);
    };

    fetchItems();
  }, [searchTerm, selectedCategory]);

  // Check if logged in to show/hide "Claim" button
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);
  
  // Submit a claim request (approval-based)
  const handleClaimItem = async (item) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
    
    try {
      const response = await fetch(`${apiBase}/api/items/claim/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();

      if (response.ok) {
        alert("Request submitted! Redirecting to My Activity to chat with the finder...");
        navigate('/my-activity', { state: { openChatForItemId: item._id } });
      } else {
        alert(data.message || "Failed to claim item.");
      }
    } catch (err) {
      console.error("Claim item error:", err);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-amrita-blue mb-2">
              Find Your Lost Item
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse items found by the campus community. If you see yours, click to view details and claim it.
            </p>
          </div>
        </motion.div>

        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-16">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-amrita-blue" />
            </div>
          ) : items.length > 0 ? (
            items.map((item, index) => (
              <ItemCard
                key={item._id}
                item={item}
                index={index}
                onCardClick={() => setSelectedItem(item)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-16 bg-white rounded-xl shadow-sm">
              <Frown className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Matching Items Found
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Try adjusting your search or filters. New items are added daily!
              </p>
            </div>
          )}
        </div>
      </div>
      
      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onClaim={handleClaimItem}
          isLoggedIn={isLoggedIn}
          showClaimButton={selectedItem?.status !== 'returned'}
        />
      )}
    </div>
  );
}