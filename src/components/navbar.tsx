import { Bell, Menu, MessageSquare, User, LogOut, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"

interface NavbarProps {
  toggleSidebar: () => void
}

interface UserDetails {
  name: string;
  email: string;
  subscriptionStatus: string;
}

export function Navbar({ toggleSidebar }: NavbarProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Fetch user details from backend when component mounts
  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('Medical_User_Id');
      if (!userId) {
        setLoading(false);
        return;
      }

      const response = await fetch(`https://medical-backend-loj4.onrender.com/api/test/userdata/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserDetails({
          name: data.name,
          email: data.email,
          subscriptionStatus: data.subscriptionStatus || 'inactive'
        });

      } else {
        console.error('Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Fetch user details from backend when component mounts
    fetchUserDetails();
  }, []);


  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('Medical_User_Id');
    setUserDetails(null);
    // localStorage.removeItem('token');

    // Redirect to login page
    window.location.href = '/login';
  };

  return (
<nav className="bg-white shadow-md border-b border-slate-200">
      <div className="min-w-[100%] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="block md:hidden">
              <Menu onClick={toggleSidebar} className="w-8 h-8" />
            </div>
            <span className="font-semibold text-xl">BioVerse</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/inquiries" className="text-gray-600 hover:text-gray-800">
              <Bell className="h-6 w-6" />
            </Link>
            <Link href="/dashboard/study-planner" className="text-gray-600 hover:text-gray-800">
              <MessageSquare className="h-6 w-6" />
            </Link>
            <div className="relative" ref={dropdownRef}>
              <div 
                className="text-gray-600 hover:text-gray-800 cursor-pointer"
                onMouseEnter={() => setShowUserDropdown(true)}
              >
                <User className="h-6 w-6" />
              </div>
              
              {showUserDropdown && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
                >
                  {loading ? (
                    <div className="px-4 py-2 text-sm text-gray-600">Loading...</div>
                  ) : userDetails ? (
                    <div>
                      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-medium text-gray-500">Profile</p>
                        <button 
                          className={`text-gray-500 hover:text-blue-600 focus:outline-none ${refreshing ? 'animate-spin' : ''}`} 
                          onClick={() => {
                            setRefreshing(true);
                            fetchUserDetails();
                          }}
                          disabled={refreshing}
                          title="Refresh user data"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{userDetails.name}</p>
                        <p className="text-xs text-gray-500 truncate">{userDetails.email}</p>
                      </div>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500">Subscription Status</p>
                        <p className={`text-sm font-medium ${userDetails.subscriptionStatus === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                          {userDetails.subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div className="px-4 py-2">
                        <button 
                          className="flex items-center text-sm text-red-600 hover:text-red-800"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-600">
                      <Link href="/login" className="block hover:text-blue-600">Login</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}