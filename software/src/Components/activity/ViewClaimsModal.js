import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Check, Loader2, MessageSquare } from "lucide-react";
import { apiBase } from "../../config";

export default function ViewClaimsModal({ item, isOpen, onClose, onApprove, onChat }) {
  const [isApproving, setIsApproving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!isOpen || !item) return;
      setIsLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${apiBase}/api/items/${item._id}/requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load requests');
        const data = await res.json();
        setRequests(data);
      } catch (e) {
        console.error(e);
        setRequests([]);
      }
      setIsLoading(false);
    };
    fetchRequests();
  }, [isOpen, item]);

  if (!item) return null;

  const handleApproveClick = async (requestId) => {
    setIsApproving(true);
    await onApprove(item, requestId);
    setIsApproving(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amrita-blue">Claim Requests for "{item.itemName}"</DialogTitle>
            <DialogDescription>
              Review the users who have requested this item. You can chat with them before approving.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>
            ) : requests && requests.length > 0 ? (
              requests.map((req) => (
                <div key={req._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{req.user?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{req.user?.email || ''}</p>
                    <p className="text-xs text-gray-400 mt-1">{req.message}</p>
                  </div>
                  <div className="flex gap-2">
                    {onChat && (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => onChat(item, req.user?._id)}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Chat
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700" 
                      onClick={() => handleApproveClick(req._id)}
                      disabled={isApproving}
                    >
                      {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approve
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No claim requests yet.</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat is only available after approval */}
    </>
  );
}