import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogIn, LogOut, PenLine, Search, Loader2, Menu, Bell, X } from 'lucide-react';
import { Button } from './Button';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { useState, useRef, useEffect, useCallback } from 'react';
import { searchTales, type SearchResult, getNotifications, type Notification } from '../../services/api';
import { NotificationBell } from '../NotificationBell';
import { useQuery } from '@tanstack/react-query';

interface NavbarProps {
  user: User | null;
  onStartStory?: () => void;
}

export function Navbar({ user, onStartStory }: NavbarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Fetch notifications for mobile menu badge
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 30000,
    enabled: !!user,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Debounced search
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return (query: string) => {
        clearTimeout(timeoutId);
        if (query.trim().length < 2) {
          setSearchResults([]);
          setShowDropdown(false);
          return;
        }
        timeoutId = setTimeout(async () => {
          setIsSearching(true);
          try {
            const results = await searchTales(query, 5);
            setSearchResults(results);
            setShowDropdown(results.length > 0);
          } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
          } finally {
            setIsSearching(false);
          }
        }, 300);
      };
    })(),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowDropdown(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const handleResultClick = (id: string) => {
    setShowDropdown(false);
    setSearchQuery('');
    navigate(`/tale/${id}`);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on navigation
  const handleMobileNavigation = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const handleMobileLogout = async () => {
    setMobileMenuOpen(false);
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-4 z-40 mx-4 sm:mx-6 lg:mx-8"
    >
      <div className="backdrop-blur-xl bg-white/5 border border-white/15 rounded-2xl shadow-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] px-4 sm:px-6 py-3 transition-all duration-300 hover:border-violet-500/20">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0" title="Vote + Tales">
            <motion.div
              whileHover={{ rotate: 10 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <BookOpen className="w-6 h-6 text-violet-400" />
            </motion.div>
            <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-amber-200" title="Vote + Tales">
              VoTales
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20"
              title="VoTales is currently in public beta. Expect rapid changes."
            >
              BETA v1.0
            </span>
          </Link>

          {/* Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                placeholder="Search tales..."
                className="w-full pl-10 pr-4 py-2 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 hover:border-white/20 hover:bg-white/[0.07]"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 animate-spin" />
              )}
            </div>

            {/* Search Dropdown */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 backdrop-blur-xl bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="max-h-80 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result.id)}
                        className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
                      >
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {result.title || 'Untitled Tale'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {result.content}
                        </p>
                        {result.authorName && (
                          <p className="text-xs text-violet-400 mt-1">
                            by {result.authorName}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    }}
                    className="w-full px-4 py-2 text-center text-sm text-violet-400 hover:bg-white/10 transition-colors border-t border-white/10"
                  >
                    View all results →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/search')}
              className="md:hidden"
            >
              <Search className="w-4 h-4" />
            </Button>

            {onStartStory && (
              <Button
                variant="primary"
                size="sm"
                onClick={onStartStory}
                leftIcon={<PenLine className="w-4 h-4" />}
              >
                <span className="hidden sm:inline">Start Story</span>
                <span className="sm:hidden">New</span>
              </Button>
            )}

            {/* Desktop Layout - visible on md and up */}
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <NotificationBell />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/profile')}
                  leftIcon={
                    <img
                      src={`https://api.dicebear.com/9.x/${user.user_metadata?.avatarStyle || 'initials'}/svg?seed=${encodeURIComponent(
                        user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
                      )}`}
                      alt="Avatar"
                      className="w-5 h-5 rounded-full"
                    />
                  }
                >
                  Profile
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  leftIcon={<LogOut className="w-4 h-4" />}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                leftIcon={<LogIn className="w-4 h-4" />}
                className="hidden md:flex"
              >
                Login
              </Button>
            )}

            {/* Mobile Menu Button - visible on screens below md */}
            {user ? (
              <div ref={mobileMenuRef} className="relative md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="relative"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <>
                      <Menu className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-amber-500 text-white text-xs font-bold rounded-full px-1">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </>
                  )}
                </Button>

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                  {mobileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 backdrop-blur-xl bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      {/* Notifications */}
                      <button
                        onClick={() => handleMobileNavigation('/profile')}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left"
                      >
                        <Bell className="w-4 h-4 text-violet-400" />
                        <span className="text-sm text-slate-200 flex-1">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="min-w-[20px] h-5 flex items-center justify-center bg-amber-500 text-white text-xs font-bold rounded-full px-1.5">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </button>

                      {/* Profile */}
                      <button
                        onClick={() => handleMobileNavigation('/profile')}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors text-left border-t border-white/5"
                      >
                        <img
                          src={`https://api.dicebear.com/9.x/${user.user_metadata?.avatarStyle || 'initials'}/svg?seed=${encodeURIComponent(
                            user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
                          )}`}
                          alt="Avatar"
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="text-sm text-slate-200">My Profile</span>
                      </button>

                      {/* Logout */}
                      <button
                        onClick={handleMobileLogout}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-500/10 transition-colors text-left border-t border-white/5"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-red-400">Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                leftIcon={<LogIn className="w-4 h-4" />}
                className="md:hidden"
              >
                <span className="sr-only sm:not-sr-only">Login</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;
