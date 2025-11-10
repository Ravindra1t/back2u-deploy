import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { MapPin, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Button } from "../ui/Button";

export default function RecentActivity({ items, isLoading }) {
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
  if (isLoading) {
    return (
      <Card className="shadow-md border-none bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-none bg-white">
      <CardHeader className="border-b border-gray-100">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-amrita-blue rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            Recently Found Items
          </CardTitle>
          <Link to={createPageUrl("BrowseFound")}>
            <Button
              variant="ghost"
              className="text-amrita-blue hover:text-amrita-blue hover:bg-blue-50"
            >
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-2">
          {items.length > 0 ? (
            items.map((item, index) => (
              (isMobile ? (
                <div
                  key={item._id || item.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                >
                  <div className="p-3 rounded-lg bg-blue-100 text-amrita-blue">
                    <MapPin className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.itemName || item.title || "Item"}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>At: {item.locationFound || item.location_found || "Unknown"}</span>
                      <span>•</span>
                      <span>
                        {item.createdAt
                          ? format(new Date(item.createdAt), "MMM d, yyyy")
                          : item.created_date
                          ? format(new Date(item.created_date), "MMM d, yyyy")
                          : "Date not available"}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={createPageUrl("BrowseFound")}
                    className="opacity-100"
                  >
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </Link>
                </div>
              ) : (
                <motion.div
                  key={item._id || item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                >
                  <div className="p-3 rounded-lg bg-blue-100 text-amrita-blue">
                    <MapPin className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.itemName || item.title || "Item"}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>At: {item.locationFound || item.location_found || "Unknown"}</span>
                      <span>•</span>
                      <span>
                        {item.createdAt
                          ? format(new Date(item.createdAt), "MMM d, yyyy")
                          : item.created_date
                          ? format(new Date(item.created_date), "MMM d, yyyy")
                          : "Date not available"}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={createPageUrl("BrowseFound")}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </Link>
                </motion.div>
              ))
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No items have been reported yet. Be the first!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
