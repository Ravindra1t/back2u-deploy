import React from "react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  Check,
  CheckCheck,
  Send,
  HelpCircle,
  MessageSquare,
  Eye,
  Users, // <-- 1. Import new icon
} from "lucide-react";

const StatusIndicator = ({ item }) => {
  const { status, finder_confirmed_return, claimant_confirmed_receipt } = item;

  if (status === "returned") {
    return (
      <Badge className="bg-green-100 text-green-800 flex items-center gap-1.5">
        <CheckCheck className="w-4 h-4" />
        Returned
      </Badge>
    );
  }

  if (status === "claimed") {
    if (!claimant_confirmed_receipt) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4" />
          Awaiting Claimant Confirmation
        </Badge>
      );
    }
    if (claimant_confirmed_receipt && !finder_confirmed_return) {
      return (
        <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1.5">
          <Send className="w-4 h-4" />
          Awaiting Finder Confirmation
        </Badge>
      );
    }
  }
  
  

  return null;
};

// --- 3. Add 'onViewClaims' to the props ---
export default function ActivityCard({ item, userRole, onConfirm, onOpenChat, onViewDetails, onViewClaims }) {
  
  const getConfirmationButton = () => {
    if (item.status === "returned") return null;

    if (
      userRole === "claimant" &&
      !item.claimant_confirmed_receipt
    ) {
      return (
        <Button size="sm" onClick={() => onConfirm(item)}>
          <CheckCheck className="w-4 h-4 mr-2" />
          Confirm Receipt
        </Button>
      );
    }

    if (
      userRole === "finder" &&
      item.claimant_confirmed_receipt &&
      !item.finder_confirmed_return
    ) {
      return (
        <Button size="sm" onClick={() => onConfirm(item)}>
          <Check className="w-4 h-4 mr-2" />
          Confirm Return
        </Button>
      );
    }

    return null;
  };
  
  // --- 4. NEW FUNCTION TO GET THE ACTION BUTTONS ---
  const getActionButtons = () => {
    // For the FINDER
    if (userRole === "finder") {
      // If item is still found and has pending requests, allow viewing them
      if (item.status === 'found' && item.claimRequests && item.claimRequests.length > 0 && onViewClaims) {
        return (
          <Button 
            size="sm" 
            onClick={() => onViewClaims(item)}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            View Requests ({item.claimRequests.length})
          </Button>
        );
      }

      // Item is claimed -> Show Chat & Confirm
      if (item.status === 'claimed') {
        return (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onOpenChat(item)}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </Button>
            {getConfirmationButton()}
          </>
        );
      }
    }

    // For the CLAIMER
    if (userRole === "claimant") {
      // Case 1: Item is claimed (they are the approved claimer) -> Show Chat & Confirm
      if (item.status === 'claimed') {
        return (
          <>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onOpenChat(item)}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </Button>
            {getConfirmationButton()}
          </>
        );
      }
      
      // Case 2: Item is still 'found' but user has a pending claim request -> Show Chat
      if (item.status === 'found' && onOpenChat) {
        return (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onOpenChat(item)}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Chat with Finder
          </Button>
        );
      }
    }
    
    // Default: no buttons (e.g., item is 'returned')
    return getConfirmationButton(); // Will return null if returned
  };


  return (
    <div className="p-4 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50/50 overflow-hidden w-full">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.itemName} 
            className="w-16 h-16 object-cover rounded-md"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-2xl">
            📦
          </div>
        )}
        <div className="min-w-0">
          <h4 className="font-semibold text-gray-900 truncate break-words">
            {item.itemName || "Item"}
          </h4>
          
          <p className="text-sm text-gray-600 break-words">
            {userRole === "finder"
              ? `Status: ${item.claimedBy ? `Approved to ${item.claimedBy.name || ''}` : 'Pending'}`
              : item.status === 'found' 
                ? `Claim Status: Pending Approval - Found by: ${item.reportedBy ? item.reportedBy.name : "N/A"}`
                : `Found by: ${item.reportedBy ? item.reportedBy.name : "N/A"}`}
          </p>
          <div className="mt-2">
            <StatusIndicator item={item} />
          </div>
        </div>
      </div>
      
      <div className="w-full sm:w-auto flex-shrink-0 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onViewDetails(item)}
          className="flex items-center gap-2 shrink-0 whitespace-nowrap"
        >
          <Eye className="w-4 h-4" />
          Details
        </Button>
        
        {getActionButtons()}
      </div>
    </div>
  );
}