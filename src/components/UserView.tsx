import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { 
  Calendar, 
  Star, 
  BookOpen, 
  ArrowLeft,
  User as UserIcon,
  ChevronRight,
  Feather
} from 'lucide-react';
import { Card, Navbar, Footer, Button } from './ui';
import FeedbackModal from './FeedbackModal';
import type { User } from '@supabase/supabase-js';

// API interfaces
interface PublicUserProfile {
  id: string;
  displayName: string;
  bio: string | null;
  avatarStyle: string;
  taleCount: number;
  voteCount: number;
  joinedDate: string;
}

interface TaleSummary {
  id: string;
  title: string | null;
  contentPreview: string;
  createdAt: string;
  votesReceived: number;
}

const getPublicUserProfile = async (identifier: string): Promise<PublicUserProfile> => {
  const { data: { session } } = await supabase.auth.getSession();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:32769';
  
  const response = await fetch(`${API_BASE_URL}/api/Users/${identifier}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
    },
  });
  
  if (!response.ok) {
    throw new Error('User not found');
  }
  
  return response.json();
};

// API function to get user's tales
const getUserTales = async (userId: string): Promise<TaleSummary[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:32769';
  
  const response = await fetch(`${API_BASE_URL}/api/Users/${userId}/tales`, {
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user tales');
  }
  
  return response.json();
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

// Avatar component using DiceBear API with dynamic style
function Avatar({ 
  username, 
  avatarStyle = 'initials',
  size = 'lg' 
}: { 
  username: string; 
  avatarStyle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  const avatarUrl = `https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${encodeURIComponent(username)}`;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className={`${sizeMap[size]} rounded-full overflow-hidden ring-4 ring-violet-500/30 shadow-xl shadow-violet-500/20`}
    >
      <img 
        src={avatarUrl} 
        alt={`${username}'s avatar`}
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
}

// Stats Card Component
function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  color = 'violet' 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number | string;
  color?: 'violet' | 'amber';
}) {
  const colorStyles = {
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`p-6 rounded-2xl border backdrop-blur-md ${colorStyles[color]}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color === 'violet' ? 'bg-violet-500/20' : 'bg-amber-500/20'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-slate-400 font-medium">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </motion.div>
  );
}

// Tale Card Component
function TaleCard({ 
  tale, 
  onNavigate 
}: { 
  tale: TaleSummary; 
  onNavigate: (id: string) => void;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="h-full group" hoverable>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 cursor-pointer" onClick={() => onNavigate(tale.id)}>
              <h3 className="text-lg font-serif font-semibold text-violet-300 group-hover:text-violet-200 transition-colors line-clamp-1">
                {tale.title || 'Untitled'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {new Date(tale.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400">
                <Star className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{tale.votesReceived}</span>
              </div>
            </div>
          </div>

          {/* Preview */}
          <p 
            className="text-slate-300 text-sm font-serif leading-relaxed line-clamp-3 mb-4 cursor-pointer"
            onClick={() => onNavigate(tale.id)}
          >
            {tale.contentPreview}
          </p>

          {/* Read More */}
          <div className="flex items-center justify-end pt-4 border-t border-white/10">
            <motion.div
              initial={{ x: 0 }}
              whileHover={{ x: 4 }}
              className="cursor-pointer flex items-center gap-2 text-slate-500 group-hover:text-violet-400 transition-colors"
              onClick={() => onNavigate(tale.id)}
            >
              <span className="text-sm">Read</span>
              <ChevronRight className="w-5 h-5" />
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function UserView() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch public profile data
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['publicUserProfile', identifier],
    queryFn: () => getPublicUserProfile(identifier!),
    enabled: !!identifier,
  });

  // Fetch user's tales (only when we have the profile id)
  const { data: tales, isLoading: talesLoading } = useQuery({
    queryKey: ['userTales', profile?.id],
    queryFn: () => getUserTales(profile!.id),
    enabled: !!profile?.id,
  });

  const handleNavigate = (id: string) => {
    navigate(`/tale/${id}`);
  };

  const displayName = profile?.displayName || 'Storyteller';
  const avatarStyle = profile?.avatarStyle || 'initials';

  const joinedDate = profile?.joinedDate 
    ? new Date(profile.joinedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Unknown';

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar user={currentUser} />
        <main className="flex-1 flex items-center justify-center px-6">
          <Card className="p-12 text-center max-w-md">
            <UserIcon className="w-12 h-12 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-300 font-serif text-lg">User not found</p>
            <p className="text-slate-500 text-sm mt-2">
              This user doesn't exist or their profile is private.
            </p>
            <Button
              variant="primary"
              className="mt-6"
              onClick={() => navigate('/')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Home
            </Button>
          </Card>
        </main>
        <Footer onFeedbackClick={() => setIsFeedbackOpen(true)} />
        <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <Navbar user={currentUser} />

      {/* Profile Header */}
      <header className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-6">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-20"
            >
              <div className="text-center">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-violet-400" />
                </motion.div>
                <p className="text-slate-400 font-serif text-lg">Loading profile...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row items-center gap-8"
            >
              {/* Avatar */}
              <Avatar username={displayName} avatarStyle={avatarStyle} size="xl" />

              {/* User Info */}
              <div className="text-center md:text-left flex-1">
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl sm:text-4xl font-serif font-bold text-white mb-2"
                >
                  {displayName}
                </motion.h1>
                
                {/* Bio */}
                {profile?.bio && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="text-slate-300 text-base font-serif mb-3 max-w-lg"
                  >
                    {profile.bio}
                  </motion.p>
                )}
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-center md:justify-start gap-2 text-slate-400"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Joined {joinedDate}</span>
                </motion.div>
              </div>

              {/* Stats Cards */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 gap-4 w-full md:w-auto"
              >
                <StatsCard
                  icon={Star}
                  label="Impact Score"
                  value={profile?.voteCount ?? 0}
                  color="amber"
                />
                <StatsCard
                  icon={BookOpen}
                  label="Tales Spun"
                  value={profile?.taleCount ?? 0}
                  color="violet"
                />
              </motion.div>
            </motion.div>
          )}
        </div>
      </header>

      {/* Tales Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 pb-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Feather className="w-5 h-5 text-violet-400" />
            <h2 className="text-xl font-serif font-semibold text-white">
              Tales by {displayName}
            </h2>
          </div>

          {talesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : tales && tales.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {tales.map((tale) => (
                <TaleCard 
                  key={tale.id} 
                  tale={tale} 
                  onNavigate={handleNavigate} 
                />
              ))}
            </motion.div>
          ) : (
            <Card className="p-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-500" />
              <p className="text-slate-400 font-serif">
                {displayName} hasn't written any tales yet.
              </p>
            </Card>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <Footer onFeedbackClick={() => setIsFeedbackOpen(true)} />

      {/* Feedback Modal */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </div>
  );
}
