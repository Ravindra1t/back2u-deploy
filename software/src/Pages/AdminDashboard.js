import React, { useState, useEffect } from "react";

// UI components
import { Button } from "../Components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../Components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../Components/ui/Table";
import { Badge } from "../Components/ui/Badge";

// Icons
import { Trash2, Check, Shield, UserX, UserCheck, CheckCheck, Users, Package, MessageSquare } from "lucide-react";

// Date formatting
import { format } from "date-fns";
import { apiBase } from "../config";

// Alert Dialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../Components/ui/AlertDialog";

export default function AdminDashboard() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [lostPosts, setLostPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // removed unused 'user' state to satisfy eslint
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('items'); // items | users | lost

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const isAdminFlag = localStorage.getItem("isAdmin") === "true";
    const isAdmin = isAdminFlag || token === "admin-local";

    if (!token || !isAdmin) {
      setError("Access Denied: You must be an admin to view this page.");
      setIsLoading(false);
      return;
    }

    // call loader once on mount
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // apiBase imported from ../config

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("authToken")}`,
  });

  const loadAll = async () => {
    try {
      setIsLoading(true);
      const [itemsRes, usersRes, lostRes] = await Promise.all([
        fetch(`${apiBase}/api/admin/items`, { headers: authHeaders() }),
        fetch(`${apiBase}/api/admin/users`, { headers: authHeaders() }),
        fetch(`${apiBase}/api/admin/lost`, { headers: authHeaders() }),
      ]);
      const itemsData = await itemsRes.json();
      const usersJson = await usersRes.json();
      const lostData = await lostRes.json();
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setUsers(Array.isArray(usersJson?.users) ? usersJson.users : []);
      setLostPosts(Array.isArray(lostData) ? lostData : []);
    } catch (e) {
      setError("Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    await fetch(`${apiBase}/api/admin/items/${itemId}`, { method: 'DELETE', headers: authHeaders() });
    loadAll();
  };

  const markAsReturned = async (item) => {
    await fetch(`${apiBase}/api/admin/items/${item._id}/mark-returned`, { method: 'PATCH', headers: authHeaders() });
    loadAll();
  };

  const deleteUser = async (userId) => {
    await fetch(`${apiBase}/api/admin/users/${userId}`, { method: 'DELETE', headers: authHeaders() });
    loadAll();
  };

  const deleteLost = async (lostId) => {
    await fetch(`${apiBase}/api/admin/lost/${lostId}`, { method: 'DELETE', headers: authHeaders() });
    loadAll();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Available</Badge>;
      case "claimed":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Claimed</Badge>;
      case "returned":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Returned</Badge>;
      case "disputed":
        return <Badge variant="destructive">Disputed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-amrita-bg">
        <Card className="w-full max-w-md mx-auto text-center p-8 bg-white shadow-lg">
          <UserX className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-amrita-blue">Access Denied</h1>
          <p className="text-gray-600 mt-2">{error}</p>
        </Card>
      </div>
    );
  }

  if (isLoading) return <p>Loading admin data...</p>;

  return (
    <div className="p-4 md:p-8 bg-amrita-bg min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amrita-blue flex items-center gap-3">
            <Shield className="w-8 h-8" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage all found item posts on the platform.</p>
        </div>
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button variant={activeTab==='items'? 'default':'outline'} onClick={()=>setActiveTab('items')}><Package className="w-4 h-4 mr-2"/>Items</Button>
          <Button variant={activeTab==='users'? 'default':'outline'} onClick={()=>setActiveTab('users')}><Users className="w-4 h-4 mr-2"/>Users</Button>
          <Button variant={activeTab==='lost'? 'default':'outline'} onClick={()=>setActiveTab('lost')}><MessageSquare className="w-4 h-4 mr-2"/>Lost Posts</Button>
        </div>

        {activeTab === 'items' && (
          <Card className="bg-white shadow-lg border-none">
            <CardHeader>
              <CardTitle>All Items ({items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Finder</TableHead>
                    <TableHead>Claimant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Confirmations</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it._id}>
                      <TableCell className="font-medium">{it.itemName || 'Untitled'}</TableCell>
                      <TableCell>{it.reportedBy?.email || it.reportedBy?.name || 'N/A'}</TableCell>
                      <TableCell>{it.claimedBy?.email || it.claimedBy?.name || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(it.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span title="Finder Confirmed">
                            <UserCheck className={`w-4 h-4 ${it.finder_confirmed_return ? "text-green-600" : "text-gray-300"}`} />
                          </span>
                          <span title="Claimant Confirmed">
                            <CheckCheck className={`w-4 h-4 ${it.claimant_confirmed_receipt ? "text-green-600" : "text-gray-300"}`} />
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{it.dateFound ? format(new Date(it.dateFound), "yyyy-MM-dd") : '-'}</TableCell>
                      <TableCell className="space-x-2">
                        {it.status === "claimed" && (
                          <Button variant="outline" size="sm" onClick={() => markAsReturned(it)} title="Mark as Returned">
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" title="Delete Item">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Permanently delete this item and its messages.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(it._id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === 'users' && (
          <Card className="bg-white shadow-lg border-none">
            <CardHeader>
              <CardTitle>All Users ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" title="Delete User">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Permanently delete user {u.email}. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteUser(u._id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === 'lost' && (
          <Card className="bg-white shadow-lg border-none">
            <CardHeader>
              <CardTitle>All Lost Posts ({lostPosts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lostPosts.map((lp) => (
                    <TableRow key={lp._id}>
                      <TableCell className="font-medium">{lp.itemName || 'Untitled'}</TableCell>
                      <TableCell>{lp.lostBy?.email || lp.lostBy?.name || 'N/A'}</TableCell>
                      <TableCell>{lp.category}</TableCell>
                      <TableCell>{lp.dateLost ? format(new Date(lp.dateLost), "yyyy-MM-dd") : '-'}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" title="Delete Lost Post">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Permanently delete this lost post.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteLost(lp._id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
