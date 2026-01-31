import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTale, voteForTale, getStoryMap, getTaleChoices, type StoryMapResponse, type TaleChoice } from '../services/api';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { 
  ArrowLeft, 
  BookOpen, 
  Heart, 
  GitBranch, 
  ChevronDown, 
  ChevronUp,
  Feather,
  Sparkles,
  LogIn,
  Archive,
  Loader2
} from 'lucide-react';
import { Button, GlassContainer, Modal } from './ui';
import StoryGraph from './StoryGraph';
import ContributionForm from './ContributionForm';
import StoryActionBar from './StoryActionBar';

// Animation variants
const pageVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' as const }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

const contentVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut' as const,
      staggerChildren: 0.1,
    },
  },
};

const paragraphVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

const choiceContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const choiceVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 120,
      damping: 18,
    },
  },
};

// Helper to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Drop cap component for the first letter
const DropCapParagraph = ({ text }: { text: string }) => {
  if (!text || text.length === 0) return null;
  
  const firstLetter = text.charAt(0);
  const restOfText = text.slice(1);
  
  return (
    <p className="first-paragraph">
      <span className="float-left text-6xl md:text-7xl font-serif font-bold text-violet-400 mr-3 mt-1 leading-none select-none">
        {firstLetter}
      </span>
      {restOfText}
    </p>
  );
};

export default function ReaderView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // URL param is the source of truth - no local state for tale ID
  const currentTaleId = id || '';
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [votedTales, setVotedTales] = useState<Set<string>>(new Set());
  const [optimisticVotes, setOptimisticVotes] = useState<Record<string, number>>({});
  const [user, setUser] = useState<User | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [storyMapData, setStoryMapData] = useState<StoryMapResponse | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  // State for paginated choices
  const [displayedChoices, setDisplayedChoices] = useState<TaleChoice[]>([]);
  const [choicesPage, setChoicesPage] = useState(1);
  const [isLoadingMoreChoices, setIsLoadingMoreChoices] = useState(false);
  const [totalChoices, setTotalChoices] = useState(0);

  // Fetch story map when graph is opened or tale changes
  useEffect(() => {
    const fetchMapData = async () => {
      if (!id) return;
      
      setIsMapLoading(true);
      try {
        const mapData = await getStoryMap(id);
        setStoryMapData(mapData);
      } catch (error) {
        console.error('Failed to fetch story map:', error);
        setStoryMapData(null);
      } finally {
        setIsMapLoading(false);
      }
    };

    // Fetch on load (we can also conditionally fetch only when graph is opened)
    fetchMapData();
  }, [id]);

  // Check auth session
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

  const voteMutation = useMutation({
    mutationFn: voteForTale,
    onMutate: async (taleId: string) => {
      // Optimistic update: immediately show vote
      setVotedTales(prev => new Set(prev).add(taleId));
      setOptimisticVotes(prev => ({
        ...prev,
        [taleId]: (prev[taleId] ?? 0) + 1
      }));
    },
    onError: (_error, taleId) => {
      // Rollback on error
      setVotedTales(prev => {
        const newSet = new Set(prev);
        newSet.delete(taleId);
        return newSet;
      });
      setOptimisticVotes(prev => ({
        ...prev,
        [taleId]: (prev[taleId] ?? 1) - 1
      }));
    },
  });

  const handleVote = (e: React.MouseEvent, taleId: string) => {
    e.stopPropagation();
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (!votedTales.has(taleId)) {
      voteMutation.mutate(taleId);
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['tale', id],
    queryFn: () => fetchTale(id!),
    enabled: !!id,
  });

  // Initialize displayed choices when tale data loads or id changes
  useEffect(() => {
    if (data) {
      setDisplayedChoices(data.choices || []);
      setTotalChoices(data.totalChoices || data.choices?.length || 0);
      setChoicesPage(1); // Reset page when tale changes
    }
  }, [data, id]);

  // Handler to load more choices
  const handleLoadMoreChoices = async () => {
    if (!id || isLoadingMoreChoices) return;
    
    setIsLoadingMoreChoices(true);
    try {
      const nextPage = choicesPage + 1;
      const response = await getTaleChoices({ taleId: id, page: nextPage, size: 10 });
      setDisplayedChoices(prev => [...prev, ...response.items]);
      setChoicesPage(nextPage);
    } catch (error) {
      console.error('Failed to load more choices:', error);
    } finally {
      setIsLoadingMoreChoices(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.4, 1, 0.4],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <BookOpen className="w-16 h-16 mx-auto mb-6 text-violet-400" />
          </motion.div>
          <p className="text-slate-400 font-serif text-xl italic">Opening the pages...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <GlassContainer className="p-10 text-center max-w-md border-red-500/30">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-400 font-serif text-2xl mb-2">Tale Not Found</p>
          <p className="text-slate-500 mb-8">
            {error instanceof Error ? error.message : 'This chapter seems to have vanished into the mist...'}
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Return to Library
          </Button>
        </GlassContainer>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const handleChoiceClick = (choiceId: string) => {
    // Navigate to the new tale - URL is the source of truth
    navigate(`/tale/${choiceId}`);
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler for when a node is clicked in the StoryGraph
  const handleNodeClick = (nodeId: string) => {
    navigate(`/tale/${nodeId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler for when ContributionForm successfully creates a new tale
  const handleContributionSuccess = (newTaleId?: string) => {
    // Invalidate queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ['tale', id] });
    queryClient.invalidateQueries({ queryKey: ['storyMap'] });
    
    // Re-fetch the story map to show the new node
    const fetchMapData = async () => {
      if (!id) return;
      try {
        const mapData = await getStoryMap(id);
        setStoryMapData(mapData);
      } catch (error) {
        console.error('Failed to fetch story map:', error);
      }
    };
    fetchMapData();

    // Optionally navigate to the new tale if provided
    if (newTaleId) {
      navigate(`/tale/${newTaleId}`);
    }
  };

  const paragraphs = data.content.split('\n\n').filter(p => p.trim());

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="min-h-screen"
    >
      {/* ===== IMMERSIVE HEADER (Sticky) ===== */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="sticky top-0 z-50"
      >
        <GlassContainer 
          blur="lg"
          className="mx-4 mt-4 rounded-2xl border-white/10 bg-slate-900/80"
        >
          <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
            {/* Left: Back Button */}
            <Link 
              to="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline text-sm font-medium">Library</span>
            </Link>

            {/* Center: Title & Author */}
            <div className="text-center flex-1 px-4 min-w-0">
              <div className="flex items-center justify-center gap-2">
                <h1 className={`font-serif text-lg md:text-xl font-bold truncate ${data.isDeleted ? 'text-slate-500' : 'text-slate-100'}`}>
                  {data.title || 'Untitled Tale'}
                </h1>
                {data.isDeleted && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 text-xs font-medium">
                    <Archive className="w-3 h-3" />
                    Archived
                  </span>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-slate-500">
                <span>by {data.authorName || 'Anonymous'}</span>
                {data.createdAt && (
                  <>
                    <span className="text-slate-700">•</span>
                    <span>{formatDate(data.createdAt)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Right: Map Toggle */}
            <button
              onClick={() => setIsGraphOpen(!isGraphOpen)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all
                ${isGraphOpen 
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <GitBranch className="w-4 h-4" />
              <span className="hidden sm:inline">Map</span>
            </button>
          </div>
        </GlassContainer>
      </motion.header>

      {/* ===== MAIN READING SURFACE ===== */}
      <main className="px-4 py-12 md:py-16">
        <AnimatePresence mode="wait">
          <motion.article
            key={currentTaleId}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl mx-auto"
          >
            {/* The Book Content */}
            <div className="prose prose-invert prose-xl max-w-none">
              <div 
                className={`font-serif text-xl md:text-2xl leading-loose space-y-8 tracking-wide ${data.isDeleted ? 'text-slate-500' : 'text-slate-200'}`}
                style={{ fontFamily: "'Lora', Georgia, serif", lineHeight: '2' }}
              >
                {paragraphs.map((paragraph, index) => (
                  <motion.div key={index} variants={paragraphVariants}>
                    {index === 0 ? (
                      <DropCapParagraph text={paragraph} />
                    ) : (
                      <p>{paragraph}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ===== APPRECIATION BAR ===== */}
            <StoryActionBar
              taleId={data.id}
              votes={(data.votes ?? 0) + (optimisticVotes[data.id] ?? 0)}
              hasVoted={data.hasVoted || votedTales.has(data.id)}
              authorName={data.authorName}
              authorId={data.authorId}
              createdAt={data.createdAt}
              isDeleted={data.isDeleted}
              isLeafNode={!data.choices || data.choices.length === 0}
              onVote={(taleId) => handleVote({ stopPropagation: () => {} } as React.MouseEvent, taleId)}
            />
          </motion.article>
        </AnimatePresence>

        {/* ===== CHOICES ENGINE (Game HUD) ===== */}
        {displayedChoices && displayedChoices.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="max-w-3xl mx-auto mt-16"
          >
            {/* Section Header */}
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-violet-500/50" />
                <Sparkles className="w-5 h-5 text-violet-400" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-violet-500/50" />
              </div>
              <h2 className="text-2xl font-serif text-slate-200 mb-2">
                Choose Your Path
              </h2>
              <p className="text-sm text-slate-500">
                The story branches here. Your choice shapes the narrative.
              </p>
            </div>

            {/* Choices Grid */}
            <motion.div
              variants={choiceContainerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {displayedChoices.map((choice, index) => (
                <motion.div
                  key={choice.id}
                  variants={choiceVariants}
                  custom={index}
                >
                  <button
                    onClick={() => handleChoiceClick(choice.id)}
                    className="w-full text-left group"
                  >
                    <GlassContainer
                      blur="md"
                      className="p-6 h-full cursor-pointer bg-slate-900/60 border-white/5 hover:border-violet-500/30 hover:bg-slate-800/60 transition-all duration-300"
                    >
                      {/* Choice Title - Primary Action Header */}
                      <h3 className="font-bold text-lg text-violet-200 mb-2 group-hover:text-violet-100 transition-colors">
                        {choice.title || `Option ${index + 1}`}
                      </h3>
                      
                      {/* Preview Text - Secondary Body */}
                      <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-2">
                        {choice.previewText || 'Continue reading...'}
                      </p>
                      
                      {/* Vote Count */}
                      <div className="flex items-center justify-between">
                        <motion.div
                          onClick={(e) => !data.isDeleted && handleVote(e, choice.id)}
                          whileTap={!data.isDeleted ? { scale: 1.2 } : undefined}
                          className={`flex items-center gap-2 text-sm font-sans transition-colors ${
                            data.isDeleted
                              ? 'text-slate-600 cursor-not-allowed'
                              : votedTales.has(choice.id)
                                ? 'text-amber-400 cursor-pointer'
                                : 'text-slate-500 hover:text-amber-400 cursor-pointer'
                          }`}
                          title={data.isDeleted ? 'Cannot vote on archived content' : undefined}
                        >
                          <Heart 
                            className="w-4 h-4" 
                            fill={votedTales.has(choice.id) ? 'currentColor' : 'none'}
                          />
                          <span>
                            {choice.votes + (optimisticVotes[choice.id] ?? 0)}{' '}
                            {choice.votes + (optimisticVotes[choice.id] ?? 0) === 1 ? 'vote' : 'votes'}
                          </span>
                        </motion.div>
                        
                        {/* Arrow indicator */}
                        <div className="text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all">
                          →
                        </div>
                      </div>
                    </GlassContainer>
                  </button>
                </motion.div>
              ))}
            </motion.div>

            {/* Show More Choices Button */}
            {totalChoices > displayedChoices.length && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center mt-6"
              >
                <button
                  onClick={handleLoadMoreChoices}
                  disabled={isLoadingMoreChoices}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 hover:text-violet-200 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingMoreChoices ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Show more options...
                      <span className="text-violet-400/70">
                        ({displayedChoices.length} of {totalChoices})
                      </span>
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </motion.section>
        )}

        {/* ===== END OF STORY CTA ===== */}
        {(!displayedChoices || displayedChoices.length === 0) && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-2xl mx-auto mt-8 text-center"
          >
            <GlassContainer className="p-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500/20 to-amber-500/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-violet-400" />
              </div>
              <p className="text-slate-400 mb-6 font-serif text-sm">
                Perhaps you could write what happens next?
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Explore More Tales
              </Button>
            </GlassContainer>
          </motion.section>
        )}

        {/* ===== DIVIDER ===== */}
        <div className="max-w-2xl mx-auto mt-20 mb-12">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <Feather className="w-5 h-5 text-slate-600" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          </div>
        </div>

        {/* ===== CONTRIBUTION FORM ===== */}
        {!data.isDeleted ? (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-xl font-serif text-slate-300 mb-2">
                Continue the Story
              </h2>
              <p className="text-sm text-slate-500">
                Add your own chapter to this tale
              </p>
            </div>
            <GlassContainer className="p-6 md:p-8 bg-slate-900/40">
              <ContributionForm 
                parentTaleId={currentTaleId} 
                onSuccess={handleContributionSuccess}
              />
          </GlassContainer>
        </motion.section>
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <GlassContainer className="p-6 md:p-8 bg-slate-900/40 text-center">
              <div className="flex items-center justify-center gap-2 text-slate-500">
                <Archive className="w-5 h-5" />
                <p className="text-sm">
                  This tale has been archived. You cannot branch off from archived content.
                </p>
              </div>
            </GlassContainer>
          </motion.section>
        )}
      </main>

      {/* ===== STORY GRAPH PANEL (Collapsible) ===== */}
      <AnimatePresence>
        {isGraphOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-40"
          >
            <GlassContainer
              blur="xl"
              className="mx-4 mb-4 rounded-2xl border-white/10 bg-slate-900/95 overflow-hidden"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <GitBranch className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-medium text-slate-300">Story Map</span>
                </div>
                <button
                  onClick={() => setIsGraphOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              
              {/* Graph Content */}
              <div className="h-[400px]">
                <StoryGraph 
                  mapData={storyMapData}
                  currentTaleId={currentTaleId}
                  isLoading={isMapLoading}
                  onNodeClick={handleNodeClick}
                />
              </div>
            </GlassContainer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Graph Toggle Button (Fixed, when panel is closed) */}
      {!isGraphOpen && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setIsGraphOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-violet-600/90 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25 backdrop-blur-sm transition-all hover:scale-105"
        >
          <GitBranch className="w-4 h-4" />
          <span className="text-sm font-medium">View Map</span>
          <ChevronUp className="w-4 h-4" />
        </motion.button>
      )}

      {/* Login Prompt Modal */}
      <Modal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title="Sign in to Vote"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Heart className="w-8 h-8 text-violet-400" />
          </div>
          <p className="text-slate-400 mb-6">
            You need to be signed in to vote for your favorite story paths.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              variant="primary"
              onClick={() => navigate(`/login?redirect=/tale/${currentTaleId}`)}
              leftIcon={<LogIn className="w-4 h-4" />}
              className="w-full"
            >
              Sign In
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowLoginPrompt(false)}
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
