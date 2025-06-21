import { Bell, Menu, MessageSquare, User, LogOut, RefreshCw, Clock, Pause, Play } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"

interface NavbarProps {
  toggleSidebar: () => void
}

interface UserDetails {
  name: string;
  email: string;
  subscriptionStatus: string;
}

// Define Pomodoro timer types (same as in other components)
type TimerMode = "work" | "shortBreak" | "longBreak"

// Keys for localStorage (same as in other components)
const TIMER_STATE_KEY = "pomodoroTimerState"
const SETTINGS_KEY = "pomodoroSettings"

// Interface for saved timer state
interface SavedTimerState {
  startTimestamp: number
  totalDuration: number
  mode: TimerMode
  isActive: boolean
  cycles: number
}

// Default timer settings
const DEFAULT_SETTINGS = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
}

export function Navbar({ toggleSidebar }: NavbarProps) {
  const router = useRouter();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Pomodoro timer states
  const [time, setTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<TimerMode>("work");
  const [cycles, setCycles] = useState(0);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showTimer, setShowTimer] = useState(false);

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

  // POMODORO TIMER FUNCTIONS
  // Load timer settings from localStorage on initial mount
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Error loading saved settings:", e);
      }
    }
  }, []);
  
  // Load timer state from localStorage and set up a listener for changes
  const loadTimerState = useCallback(() => {
    const savedTimerState = localStorage.getItem(TIMER_STATE_KEY);
    if (savedTimerState) {
      try {
        const parsedState = JSON.parse(savedTimerState) as SavedTimerState;
        
        // Calculate elapsed time
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - parsedState.startTimestamp) / 1000);
        const remainingTime = Math.max(0, parsedState.totalDuration - elapsedSeconds);
        
        // Set the timer state
        setMode(parsedState.mode);
        setCycles(parsedState.cycles);
        setTime(remainingTime);
        setIsActive(parsedState.isActive && remainingTime > 0);
        
        // Show timer when it's active
        setShowTimer(parsedState.isActive && remainingTime > 0);
        
        // If timer is close to complete (less than 5 minutes), always show it
        if (remainingTime < 300 && remainingTime > 0) {
          setShowTimer(true);
        }
      } catch (e) {
        console.error("Error loading saved timer state:", e);
      }
    } else {
      // No active timer
      setIsActive(false);
      setShowTimer(false);
    }
  }, []);

  useEffect(() => {
    // Initial load
    loadTimerState();
    
    // Set up a listener to detect changes in localStorage from other components
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === TIMER_STATE_KEY) {
        loadTimerState();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Poll localStorage less frequently to avoid conflicts with manual actions
    // This prevents the polling from quickly overriding user actions
    const syncInterval = setInterval(loadTimerState, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(syncInterval);
    };
  }, [loadTimerState]);

  // Timer tick function
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (isActive && time > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTime(prevTime => {
          // Check localStorage for most up-to-date time
          const savedState = localStorage.getItem(TIMER_STATE_KEY);
          if (savedState) {
            try {
              const parsedState = JSON.parse(savedState) as SavedTimerState;
              const now = Date.now();
              const elapsedSeconds = Math.floor((now - parsedState.startTimestamp) / 1000);
              const remainingTime = Math.max(0, parsedState.totalDuration - elapsedSeconds);
              
              if (Math.abs(remainingTime - prevTime) > 2) {
                // If there's a significant difference, use the localStorage value
                return remainingTime;
              }
            } catch (e) {
              console.error("Error parsing timer state:", e);
            }
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isActive, time]);

  // Create a ref to track manual pause/play actions
  const userActionRef = useRef<boolean>(false);
  
  const toggleTimer = () => {
    // Mark this as a user action
    userActionRef.current = true;
    
    const newActiveState = !isActive;
    setIsActive(newActiveState);
    
    if (newActiveState) {
      // Save timer state when starting
      const timerState: SavedTimerState = {
        startTimestamp: Date.now() - ((settings[mode] * 60) - time) * 1000,
        totalDuration: settings[mode] * 60,
        mode,
        isActive: true,
        cycles
      };
      localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(timerState));
    } else {
      // When pausing, update localStorage to reflect paused state
      if (time > 0) {
        const timerState: SavedTimerState = {
          startTimestamp: Date.now() - ((settings[mode] * 60) - time) * 1000,
          totalDuration: settings[mode] * 60,
          mode,
          isActive: false,
          cycles
        };
        localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(timerState));
      } else {
        localStorage.removeItem(TIMER_STATE_KEY);
      }
    }
    
    // Force an event to notify other components about the change
    window.dispatchEvent(new Event('storage'));
    
    // Ensure visibility state is updated
    setShowTimer(newActiveState || time < 300);
    
    // Reset the user action flag after a delay
    setTimeout(() => {
      userActionRef.current = false;
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getModeColor = () => {
    switch (mode) {
      case "work":
        return "text-blue-600";
      case "shortBreak":
        return "text-green-600";
      case "longBreak":
        return "text-indigo-600";
      default:
        return "text-gray-600";
    }
  };
  
  const getModeLabel = () => {
    switch (mode) {
      case "work":
        return "W";
      case "shortBreak":
        return "SB";
      case "longBreak":
        return "LB";
      default:
        return "";
    }
  };
  
  const navigateToPomodoro = () => {
    router.push("/dashboard/pomodoro-timer");
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
            {/* Pomodoro Timer UI in Navbar */}
            {(isActive || showTimer) && (
              <div className="flex items-center space-x-1 bg-white border border-gray-200 rounded-full px-2 py-1 shadow-sm">
                <div 
                  className="flex items-center space-x-1 cursor-pointer"
                  onClick={navigateToPomodoro}
                >
                  <Clock className={`h-4 w-4 ${getModeColor()}`} />
                  <span className={`text-sm font-medium ${getModeColor()}`}>{formatTime(time)}</span>
                  <span className="text-xs bg-gray-100 rounded-full px-1.5 py-0.5">{getModeLabel()}</span>
                </div>
                {/* <button
                  className={`rounded-full p-1 ${isActive ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleTimer();
                  }}
                >
                  {isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </button> */}
              </div>
            )}

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