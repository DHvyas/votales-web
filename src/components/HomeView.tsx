import { useState, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchRoots, type SortOption } from '../services/api';
import { supabase } from '../lib/supabase';
import { BookOpen, ChevronRight, User as UserIcon, Loader2, Flame, TrendingUp, Clock } from 'lucide-react';
import CreateStoryModal from './CreateStoryModal';
import FeedbackModal from './FeedbackModal';
import { Card, Navbar, Footer } from './ui';
import type { User } from '@supabase/supabase-js';

// Story Branch Node Component for Git-like visualization
const BranchNode = ({ 
  x, 
  y, 
  delay, 
  isBranch = false 
}: { 
  x: number; 
  y: number; 
  delay: number; 
  isBranch?: boolean;
}) => (
  <motion.circle
    cx={x}
    cy={y}
    r="8"
    fill={isBranch ? '#a78bfa' : '#fbbf24'}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay, duration: 0.4, type: 'spring', stiffness: 200 }}
  />
);

// Git-like Story Tree Visualization
const StoryTreeVisualization = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative w-full h-64 md:h-80"
    >
      <svg
        viewBox="0 0 300 200"
        className="w-full h-full"
        style={{ overflow: 'visible' }}
      >
        {/* Main trunk line */}
        <motion.path
          d="M 50 180 L 50 20"
          stroke="#4c1d95"
          strokeWidth="4"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />

        {/* Branch line 1 */}
        <motion.path
          d="M 50 140 Q 80 140, 100 100"
          stroke="#7c3aed"
          strokeWidth="3"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.6, ease: 'easeInOut' }}
        />

        {/* Branch line 2 */}
        <motion.path
          d="M 50 100 Q 90 100, 130 60"
          stroke="#8b5cf6"
          strokeWidth="3"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.7, duration: 0.6, ease: 'easeInOut' }}
        />

        {/* Sub-branch from branch 2 */}
        <motion.path
          d="M 130 60 Q 160 60, 180 30"
          stroke="#a78bfa"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 1.1, duration: 0.4, ease: 'easeInOut' }}
        />

        {/* Branch line 3 */}
        <motion.path
          d="M 50 60 Q 100 60, 140 90"
          stroke="#a78bfa"
          strokeWidth="3"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.9, duration: 0.6, ease: 'easeInOut' }}
        />

        {/* Main trunk nodes */}
        <BranchNode x={50} y={180} delay={0.2} />
        <BranchNode x={50} y={140} delay={0.4} />
        <BranchNode x={50} y={100} delay={0.6} />
        <BranchNode x={50} y={60} delay={0.8} />
        <BranchNode x={50} y={20} delay={1.0} />

        {/* Branch nodes */}
        <BranchNode x={100} y={100} delay={1.1} isBranch />
        <BranchNode x={130} y={60} delay={1.3} isBranch />
        <BranchNode x={180} y={30} delay={1.5} isBranch />
        <BranchNode x={140} y={90} delay={1.4} isBranch />

        {/* Labels */}
        <motion.text
          x="60"
          y="185"
          fill="#94a3b8"
          fontSize="10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          Chapter 1
        </motion.text>
        <motion.text
          x="110"
          y="105"
          fill="#a78bfa"
          fontSize="10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7 }}
        >
          Path A
        </motion.text>
        <motion.text
          x="190"
          y="35"
          fill="#a78bfa"
          fontSize="10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          Ending 1
        </motion.text>
        <motion.text
          x="150"
          y="95"
          fill="#a78bfa"
          fontSize="10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.9 }}
        >
          Path B
        </motion.text>
      </svg>

      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
    </motion.div>
  );
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

export default function HomeView() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('votes');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['roots', sortBy],
    queryFn: ({ pageParam = 1 }) => fetchRoots({ page: pageParam, size: 9, sort: sortBy }),
    getNextPageParam: (lastPage) => 
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  // Flatten all pages into a single array of roots
  const roots = data?.pages.flatMap((page) => page.items) ?? [];

  const handleCardClick = (id: string) => {
    navigate(`/tale/${id}`);
  };

  const handleStartStory = () => {
    if (!user) {
      navigate('/login');
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <Navbar user={user} onStartStory={handleStartStory} />

      {/* Hero Section - 2 Column Layout */}
      <header className="py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                className="mb-6"
              >
                <BookOpen className="w-12 h-12 sm:w-14 sm:h-14 text-violet-400" />
              </motion.div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-violet-300 to-amber-200">
                  Democratizing Fiction
                </span>
              </h1>
              
              <p className="text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed mb-4">
                Vote for the plot. Write the Tales. You decide the canon.
              </p>
              
              <p className="text-slate-500 text-sm sm:text-base">
                Your voice shapes the story. Every vote counts.
              </p>
            </motion.div>

            {/* Right Column - Git-like Visualization */}
            <div className="hidden lg:block">
              <StoryTreeVisualization />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto px-6 pb-20 w-full">
        {/* Sort Controls */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-serif font-semibold text-slate-200">Explore Tales</h2>
          <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <button
              onClick={() => setSortBy('votes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                sortBy === 'votes'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Top Rated
            </button>
            <button
              onClick={() => setSortBy('recent')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                sortBy === 'recent'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              <Clock className="w-4 h-4" />
              Newest
            </button>
          </div>
        </div>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-20"
          >
            <div className="text-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-violet-400" />
              </motion.div>
              <p className="text-slate-400 font-serif text-lg">Loading tales...</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center py-20"
          >
            <Card className="p-8 text-center border-red-500/20">
              <p className="text-red-400 font-serif text-lg">Error loading tales</p>
              <p className="text-slate-500 text-sm mt-2">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </Card>
          </motion.div>
        )}

        {roots && roots.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-20"
          >
            <Card className="p-12 text-center max-w-md">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-500" />
              <p className="text-slate-300 font-serif text-lg">No tales available yet</p>
              <p className="text-slate-500 text-sm mt-2">
                Check back later for new adventures
              </p>
            </Card>
          </motion.div>
        )}

        {roots && roots.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {roots.map((root, index) => (
              <motion.div
                key={root.id}
                variants={itemVariants}
                custom={index}
              >
                <Card
                  hoverable
                  onClick={() => handleCardClick(root.id)}
                  className="h-full group cursor-pointer"
                >
                  <div className="p-6 sm:p-8">
                    {/* Title and Hot Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-xl font-serif font-semibold text-violet-300">
                        {root.title || 'Untitled'}
                      </h3>
                      {root.seriesVotes > 100 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-xs font-medium">
                          <Flame className="w-3 h-3" />
                          Hot
                        </span>
                      )}
                    </div>
                    
                    {/* Author and Series Votes */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                        <UserIcon className="w-3.5 h-3.5" />
                        {root.authorName && root.authorId ? (
                          <Link 
                            to={`/u/${root.authorId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-violet-400 hover:underline transition-colors"
                          >
                            By {root.authorName}
                          </Link>
                        ) : (
                          <span>By {root.authorName || 'Anonymous'}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-400 text-sm font-medium">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{root.seriesVotes.toLocaleString()} votes</span>
                      </div>
                    </div>
                    
                    {/* Preview */}
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-slate-300 font-serif text-base leading-relaxed flex-1 line-clamp-3">
                        {root.preview}
                      </p>
                      <motion.div
                        initial={{ x: 0 }}
                        whileHover={{ x: 4 }}
                        className="flex-shrink-0 mt-1"
                      >
                        <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-violet-400 transition-colors" />
                      </motion.div>
                    </div>
                  </div>
                  <div className="px-6 sm:px-8 pb-6">
                    <span className="inline-flex items-center text-sm text-slate-500 group-hover:text-violet-400 transition-colors">
                      Begin this tale
                      <motion.span
                        className="ml-1"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ 
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 0.5
                        }}
                      >
                        →
                      </motion.span>
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Load More Button */}
        {roots.length > 0 && hasNextPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mt-10"
          >
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 hover:text-violet-200 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More Tales'
              )}
            </button>
          </motion.div>
        )}

        {/* Loading spinner for fetching next page */}
        {isFetchingNextPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mt-6"
          >
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <Footer onFeedbackClick={() => setIsFeedbackOpen(true)} />

      {/* Create Story Modal */}
      <CreateStoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Feedback Modal */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </div>
  );
}
