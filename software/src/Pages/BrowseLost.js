import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Frown, Loader2 } from "lucide-react";
import ItemCard from "../Components/browse/ItemCard";
import SearchFilters from "../Components/browse/SearchFilters";
import ItemDetailsModal from "../Components/browse/ItemDetailsModal";
import { apiBase } from "../config";

export default function BrowseLost() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${apiBase}/api/lost/browse?search=${searchTerm}&category=${selectedCategory}`);
        if (!response.ok) {
          throw new Error("Failed to fetch lost items");
        }
        const data = await response.json();
        setItems(data);
      } catch (e) {
        console.error("Failed to fetch lost items:", e);
      }
      setIsLoading(false);
    };

    fetchItems();
  }, [searchTerm, selectedCategory]);
  
  // This is the "I Found This" handler
  const handleReportFinding = async (item) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
    
    try {
      const response = await fetch(`${apiBase}/api/lost/respond/${item._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      
      const data = await response.json();

      if (response.ok) {
        // Remove this lost post locally since it gets converted to a found item
        setItems(prev => prev.filter((i) => i._id !== item._id));
        setSelectedItem(null);
        alert("Thanks! The item has been moved into Found and linked to the owner. Check My Activity.");
      } else {
        alert(data.message || "Failed to send report.");
      }
    } catch (err) {
      console.error("Found item error:", err);
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
              Browse Lost Items
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              See what others have lost. If you've found one of these items, click to report it.
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
                No Lost Items Found
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Try adjusting your search or filters.
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
          onClaim={handleReportFinding}
          isLoggedIn={Boolean(localStorage.getItem("authToken"))}
          showClaimButton={true}
          pageType="lost" // <-- Pass the type for dynamic text changes
        />
      )}
    </div>
  );
}