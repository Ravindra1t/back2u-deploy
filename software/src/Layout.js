import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { 
  Search, 
  Home, 
  PlusSquare, 
  Shield, 
  LogOut, 
  ClipboardList,
  Settings as SettingsIcon
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "./Components/ui/Sidebar"; 
import { Button } from "./Components/ui/Button"; 

// --- ROLLED-BACK NAVIGATION ---
const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Report Found Item", url: "/report-found", icon: PlusSquare },
  { title: "Browse Found Items", url: "/browse-found", icon: Search },
  { title: "Report Lost Item", url: "/report-lost", icon: PlusSquare },
  { title: "Browse Lost Items", url: "/browse-lost", icon: Search },
  { title: "My Activity", url: "/my-activity", icon: ClipboardList },
  { title: "Settings", url: "/settings", icon: SettingsIcon },
];
// -----------------------------

const adminNavigationItem = {
  title: "Admin Dashboard",
  url: "/admin",
  icon: Shield,
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }
      
      if (token === "admin-local") {
        setUser({ name: "Admin", email: "admin1234@amrita.edu", role: "admin" });
        return;
      }

      const decodedUser = jwtDecode(token);
      setUser(decodedUser.user);

    } catch (error) {
      console.error("Failed to decode token:", error);
      localStorage.removeItem("authToken");
      navigate("/login");
    }
  }, [location.pathname, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  if (!user) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return (
    <SidebarProvider>
      <style>
        {`
          :root {
            --amrita-blue: #003366;
            --amrita-saffron: #FF9933;
            --amrita-bg: #F8F9FA;
            --amrita-light-blue: #e0e8f0;
          }
          .text-amrita-blue { color: var(--amrita-blue); }
          .bg-amrita-blue { background-color: var(--amrita-blue); }
          .border-amrita-blue { border-color: var(--amrita-blue); }
          .hover\\:bg-amrita-blue-dark:hover { background-color: #002244; }
          .text-amrita-saffron { color: var(--amrita-saffron); }
          .bg-amrita-saffron { background-color: var(--amrita-saffron); }
          .hover\\:bg-amrita-saffron-dark:hover { background-color: #E68A2E; }
          .bg-amrita-light-blue { background-color: var(--amrita-light-blue); }
        `}
      </style>

      <div className="min-h-screen flex w-full bg-gray-50 relative">
        {/* Sidebar */}
        <Sidebar className="border-r border-gray-200/60 bg-white/95 backdrop-blur-sm">
          <SidebarHeader className="border-b border-gray-200/60 p-5">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.png" 
                  alt="Back2U Logo" 
                  className="w-10 h-10 object-contain"
                  onError={(e) => e.target.style.display = 'none'}
                />
                <div>
                  <h2 className="font-bold text-amrita-blue text-lg">Back2You</h2>
                  <p className="text-sm text-gray-500 font-medium">Amrita Lost & Found</p>
                </div>
              </div>
            </Link>
          </SidebarHeader>

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
                Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`transition-all duration-200 rounded-lg text-sm ${
                          location.pathname === item.url
                            ? "bg-amrita-light-blue text-amrita-blue shadow-sm"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-5 h-5" />
                          <span className="font-semibold">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}

                  {user && user.role === "admin" && (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        className={`transition-all duration-200 rounded-lg text-sm ${
                          location.pathname === adminNavigationItem.url
                            ? "bg-amrita-light-blue text-amrita-blue shadow-sm"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <Link to={adminNavigationItem.url} className="flex items-center gap-3 px-3 py-2.5">
                          <adminNavigationItem.icon className="w-5 h-5" />
                          <span className="font-semibold">{adminNavigationItem.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200/80 p-3">
            {user ? (
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="w-10 h-10 bg-amrita-saffron rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                  <LogOut className="w-5 h-5 text-gray-500 hover:text-amrita-blue" />
                </Button>
              </div>
            ) : (
              <p>Not logged in</p>
            )}
          </SidebarFooter>
        </Sidebar>

        {/* Mobile overlay when sidebar is open */}
        <MobileOverlay />

        {/* Main content */}
        <main className="flex-1 flex flex-col bg-gray-50/50">
          <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200/60 px-6 py-4 md:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-xl transition-colors duration-200" />
                <h1 className="text-lg font-bold text-amrita-blue">Back2U</h1>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl max-w-full">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function MobileOverlay() {
  const { isOpen, setIsOpen } = useSidebar();
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/40 z-30 md:hidden"
      onClick={() => setIsOpen(false)}
      aria-hidden="true"
    />
  );
}