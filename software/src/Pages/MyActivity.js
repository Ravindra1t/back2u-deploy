import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, PackageSearch, PackageCheck } from "lucide-react";
import ActivityList from "../Components/activity/ActivityList";
import ItemDetailsModal from "../Components/browse/ItemDetailsModal";
import ChatModal from "../Components/ChatModal";
import ViewClaimsModal from "../Components/activity/ViewClaimsModal";
import { apiBase } from "../config";

export default function MyActivity() {
  const [foundByMe, setFoundByMe] = useState([]);
  const [claimedByMe, setClaimedByMe] = useState([]);
  const [lostByMe, setLostByMe] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState(null); // For Details Modal
  const [selectedItemForClaims, setSelectedItemForClaims] = useState(null); // For Claims Modal
  const [selectedChatItem, setSelectedChatItem] = useState(null); // For Chat Modal
  const [selectedChatReceiverId, setSelectedChatReceiverId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchActivity = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
    setIsLoggedIn(true); 

    try {
      const response = await fetch(`${apiBase}/api/activity`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("authToken");
        navigate("/login");
        return;
      }
      const data = await response.json();
      setFoundByMe(data.foundByMe || []);
      setClaimedByMe(data.claimedByMe || []);
      setLostByMe(data.lostByMe || []);
      setIsLoading(false);

    } catch (e) {
      console.error("Failed to fetch activity:", e);
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // If redirected here with a claimed item to open chat, auto-open it after data loads
  useEffect(() => {
    const state = location.state;
    if (!isLoading && state && state.openChatForItemId) {
      const targetId = state.openChatForItemId;
      // Prefer items I claimed, but also check items I found in case of lost-respond flow
      const target = claimedByMe.find(i => i._id === targetId) || foundByMe.find(i => i._id === targetId);
      if (target) {
        setSelectedChatItem(target);
        // Clear the navigation state so it doesn't reopen on refresh
        navigate(location.pathname, { replace: true, state: {} });
      } else {
        // If not found yet, refetch once after a short delay to allow the claim write to be visible
        const t = setTimeout(() => {
          fetchActivity();
        }, 600);
        return () => clearTimeout(t);
      }
    }
  }, [isLoading, claimedByMe, foundByMe, location, navigate, fetchActivity]);

  // Optimistically show the claimed item if BrowseFound passed it along
  useEffect(() => {
    const state = location.state;
    if (state && state.claimedItem) {
      const ci = state.claimedItem;
      setClaimedByMe(prev => {
        if (prev.some(x => x._id === ci._id)) return prev;
        return [ci, ...prev];
      });
      setSelectedChatItem(ci);
      // Clear state so it won't repeat on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  
  const handleConfirmation = async (item, confirmationType) => {
    const token = localStorage.getItem("authToken");
    try {
      await fetch(`${apiBase}/api/items/confirm/${item._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ confirmationType }),
      });
      fetchActivity(); // Refresh list
    } catch (error) {
      console.error("Error confirming return:", error);
    }
  };

  // Finder approves a specific request -> item becomes claimed to that user
  const handleApproveClaim = async (item, requestId) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await fetch(`${apiBase}/api/items/${item._id}/requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        await fetchActivity();
        setSelectedItemForClaims(null);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to approve');
      }
    } catch (e) {
      console.error('Approve claim error', e);
    }
  };

  const handleDeleteLost = async (lostItem) => {
    const token = localStorage.getItem("authToken");
    if (!window.confirm("Delete this lost post?")) return;
    try {
      const res = await fetch(`${apiBase}/api/lost/${lostItem._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setLostByMe(prev => prev.filter(li => li._id !== lostItem._id));
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete');
      }
    } catch (e) {
      console.error(e);
    }
  };

  


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-amrita-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-amrita-blue mb-2">
            My Activity
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Manage your found item reports and claims. Confirm returns to close cases.
          </p>
        </div>

        {/* Items I Lost */}
        <div className="bg-white shadow-lg border-none p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-amrita-blue mb-4">Items I Lost</h2>
          {lostByMe.length > 0 ? (
            <div className="space-y-3">
              {lostByMe.map((lost) => (
                <div key={lost._id} className="p-4 border rounded-lg flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    {lost.imageUrl ? (
                      <img src={lost.imageUrl} alt={lost.itemName} className="w-16 h-16 object-cover rounded-md" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-2xl">🔎</div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{lost.itemName || 'Item'}</p>
                      <p className="text-sm text-gray-600">Status: {lost.status}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteLost(lost)}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
              No lost posts yet.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ActivityList
            title="Items I Found"
            items={foundByMe}
            userRole="finder"
            onConfirm={(item) => handleConfirmation(item, "finder")}
            emptyIcon={PackageSearch}
            emptyText="You haven't reported any found items yet."
            onViewDetails={(item) => setSelectedItemForDetails(item)}
            onViewClaims={(item) => setSelectedItemForClaims(item)}
            onOpenChat={(item) => { setSelectedChatItem(item); setSelectedChatReceiverId(null); }}
          />
          <ActivityList
            title="Items I Claimed"
            items={claimedByMe}
            userRole="claimant"
            onConfirm={(item) => handleConfirmation(item, "claimant")}
            emptyIcon={PackageCheck}
            emptyText="You haven't claimed any items yet."
            onViewDetails={(item) => setSelectedItemForDetails(item)}
            onViewClaims={null} // Claimers can't view claims
            onOpenChat={(item) => setSelectedChatItem(item)}
          />
        </div>
      </div>

      {/* --- 4. RENDER BOTH MODALS --- */}
      {selectedItemForDetails && (
        <ItemDetailsModal
          item={selectedItemForDetails}
          isOpen={!!selectedItemForDetails}
          onClose={() => setSelectedItemForDetails(null)}
          isLoggedIn={isLoggedIn}
          showClaimButton={false} // <-- Hide the "Claim" button
        />
      )}
      
      

      {selectedChatItem && (
        <ChatModal
          item={selectedChatItem}
          onClose={() => { setSelectedChatItem(null); setSelectedChatReceiverId(null); }}
          customReceiverId={selectedChatReceiverId}
        />
      )}

      {selectedItemForClaims && (
        <ViewClaimsModal
          item={selectedItemForClaims}
          isOpen={!!selectedItemForClaims}
          onClose={() => setSelectedItemForClaims(null)}
          onApprove={handleApproveClaim}
          onChat={(item, receiverId) => { setSelectedChatItem(item); setSelectedChatReceiverId(receiverId); }}
        />
      )}
    </div>
  );
}