import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { 
  getUserProfile, 
  updateTale, 
  deleteTale,
  fetchTale,
  type TaleSummary 
} from '../services/api';
import { 
  Calendar, 
  Star, 
  BookOpen, 
  Pencil, 
  Trash2, 
  ChevronRight,
  GitBranch,
  TreeDeciduous,
  Settings
} from 'lucide-react';
import { Card, Navbar, Footer, Button, Modal, Input, Textarea, useToast } from './ui';
import FeedbackModal from './FeedbackModal';
import EditProfileModal from './EditProfileModal';
import type { User } from '@supabase/supabase-js';

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

const tabVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { duration: 0.2 }
  },
};

// Avatar component using DiceBear API
function Avatar({ username, avatarStyle = 'initials', size = 'lg' }: { username: string; avatarStyle?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  // Generate avatar URL using DiceBear API
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

// Tab Button Component
function TabButton({ 
  active, 
  onClick, 
  icon: Icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ElementType;
  label: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200
        ${active 
          ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' 
          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      {label}
    </motion.button>
  );
}

// Story Card with management actions
function StoryCard({ 
  tale, 
  onEdit, 
  onDelete,
  onNavigate
}: { 
  tale: TaleSummary; 
  onEdit: (tale: TaleSummary) => void;
  onDelete: (tale: TaleSummary) => void;
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

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(tale)}
                leftIcon={<Pencil className="w-3.5 h-3.5" />}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(tale)}
                leftIcon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                Delete
              </Button>
            </div>
            <motion.div
              initial={{ x: 0 }}
              whileHover={{ x: 4 }}
              className="cursor-pointer"
              onClick={() => onNavigate(tale.id)}
            >
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-violet-400 transition-colors" />
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Contribution Item (for branches)
function ContributionItem({ 
  tale, 
  onEdit, 
  onDelete,
  onNavigate
}: { 
  tale: TaleSummary; 
  onEdit: (tale: TaleSummary) => void;
  onDelete: (tale: TaleSummary) => void;
  onNavigate: (id: string) => void;
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ x: 4 }}
      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-2 rounded-lg bg-violet-500/20">
          <GitBranch className="w-4 h-4 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p 
            className="text-sm text-slate-300 mb-1 cursor-pointer hover:text-white transition-colors"
            onClick={() => onNavigate(tale.id)}
          >
            You wrote a branch
            {tale.title && (
              <>
                {' - '}
                <span className="text-violet-400 font-medium">
                  "{tale.title}"
                </span>
              </>
            )}
          </p>
          <p 
            className="text-slate-400 text-xs line-clamp-2 font-serif mb-3 cursor-pointer"
            onClick={() => onNavigate(tale.id)}
          >
            {tale.contentPreview}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                {new Date(tale.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="w-3 h-3" />
                <span className="text-xs">{tale.votesReceived}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(tale)}
                leftIcon={<Pencil className="w-3 h-3" />}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(tale)}
                leftIcon={<Trash2 className="w-3 h-3 text-red-400" />}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Edit Tale Modal
function EditTaleModal({
  isOpen,
  onClose,
  tale,
  onSave,
  isLoading,
  isRoot,
}: {
  isOpen: boolean;
  onClose: () => void;
  tale: TaleSummary | null;
  onSave: (id: string, title: string, content: string) => void;
  isLoading: boolean;
  isRoot: boolean;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFetchingContent, setIsFetchingContent] = useState(false);

  useEffect(() => {
    if (isOpen && tale) {
      setTitle(tale.title || '');
      // Fetch the full content when the modal opens
      setIsFetchingContent(true);
      fetchTale(tale.id)
        .then((fullTale) => {
          setContent(fullTale.content);
        })
        .catch(() => {
          // Fallback to preview if fetch fails
          setContent(tale.contentPreview);
        })
        .finally(() => {
          setIsFetchingContent(false);
        });
    } else if (!isOpen) {
      // Reset state when modal closes
      setContent('');
      setTitle('');
    }
  }, [isOpen, tale]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tale && content.trim()) {
      onSave(tale.id, title, content);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Chapter" size="lg">
      <form onSubmit={handleSubmit} className="p-6">
        {isRoot && (
          <div className="mb-4">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title..."
            />
          </div>
        )}
        <div className="mb-6">
          {isFetchingContent ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-slate-400">Loading content...</div>
            </div>
          ) : (
            <Textarea
              label="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your chapter..."
              rows={10}
              className="font-serif"
            />
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} disabled={!content.trim() || isFetchingContent}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({
  isOpen,
  onClose,
  tale,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  tale: TaleSummary | null;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Chapter" size="sm">
      <div className="p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20">
          <Trash2 className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-center text-slate-300 mb-2">
          Are you sure you want to delete
        </p>
        <p className="text-center text-white font-semibold mb-4">
          "{tale?.title || 'this chapter'}"?
        </p>
        <p className="text-center text-sm text-slate-500 mb-6">
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function ProfileView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'roots' | 'branches'>('roots');
  const [editingTale, setEditingTale] = useState<TaleSummary | null>(null);
  const [editingIsRoot, setEditingIsRoot] = useState(false);
  const [deletingTale, setDeletingTale] = useState<TaleSummary | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState<string>(user?.user_metadata?.avatarStyle || 'initials');
  const [bio, setBio] = useState<string>(user?.user_metadata?.bio || '');

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }
      setUser(session.user);
      setAvatarStyle(session.user.user_metadata?.avatarStyle || 'initials');
      setBio(session.user.user_metadata?.bio || '');
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate('/login');
        return;
      }
      setUser(session.user);
      setAvatarStyle(session.user.user_metadata?.avatarStyle || 'initials');
      setBio(session.user.user_metadata?.bio || '');
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch profile data (includes myRoots and myBranches)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
    enabled: !!user,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; title: string; content: string }) =>
      updateTale({ id: data.id, content: data.content, title: data.title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      setEditingTale(null);
      setEditingIsRoot(false);
      addToast('Chapter updated successfully!', 'success');
    },
    onError: () => {
      addToast('Failed to update chapter. Please try again.', 'error');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTale(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        setDeletingTale(null);
        addToast('Chapter deleted successfully!', 'success');
      } else if (result.hasBranches) {
        setDeletingTale(null);
        addToast(result.message || 'This chapter has branches! You can only edit it.', 'warning');
      }
    },
    onError: () => {
      addToast('Failed to delete chapter. Please try again.', 'error');
    },
  });

  const handleEditRoot = (tale: TaleSummary) => {
    setEditingTale(tale);
    setEditingIsRoot(true);
  };

  const handleEditBranch = (tale: TaleSummary) => {
    setEditingTale(tale);
    setEditingIsRoot(false);
  };

  const handleDelete = (tale: TaleSummary) => {
    setDeletingTale(tale);
  };

  const handleNavigate = (id: string) => {
    navigate(`/tale/${id}`);
  };

  const handleSaveEdit = (id: string, title: string, content: string) => {
    updateMutation.mutate({ id, title, content });
  };

  const handleConfirmDelete = () => {
    if (deletingTale) {
      deleteMutation.mutate(deletingTale.id);
    }
  };

  // Get tales from profile
  const rootTales = profile?.myRoots || [];
  const branchTales = profile?.myBranches || [];

  // Get display name from profile or user metadata
  const displayName = profile?.username ||
                      user?.user_metadata?.username || 
                      user?.user_metadata?.full_name || 
                      user?.email?.split('@')[0] || 
                      'Storyteller';

  const joinedDate = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Unknown';

  const isLoading = profileLoading;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <Navbar user={user} />

      {/* Profile Header */}
      <header className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center gap-8"
          >
            {/* Avatar with Settings Button */}
            <div className="relative">
              <Avatar username={displayName} avatarStyle={avatarStyle} size="xl" />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditProfileOpen(true)}
                className="absolute -bottom-1 -right-1 p-2 rounded-full bg-slate-800 border border-white/20 text-slate-300 hover:text-violet-400 hover:border-violet-500/50 transition-all shadow-lg"
                title="Edit Profile"
              >
                <Settings className="w-4 h-4" />
              </motion.button>
            </div>

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
              {bio && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-slate-300 text-base font-serif mb-3 max-w-lg"
                >
                  {bio}
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
                value={profile?.totalVotesReceived ?? 0}
                color="amber"
              />
              <StatsCard
                icon={BookOpen}
                label="Tales Spun"
                value={profile?.totalTalesWritten ?? 0}
                color="violet"
              />
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto px-6 pb-20 w-full">
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3 mb-8"
        >
          <TabButton
            active={activeTab === 'roots'}
            onClick={() => setActiveTab('roots')}
            icon={TreeDeciduous}
            label="My Sagas"
          />
          <TabButton
            active={activeTab === 'branches'}
            onClick={() => setActiveTab('branches')}
            icon={GitBranch}
            label="Contributions"
          />
        </motion.div>

        {/* Loading State */}
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
              <p className="text-slate-400 font-serif text-lg">Loading your tales...</p>
            </div>
          </motion.div>
        )}

        {/* Tab Content */}
        {!isLoading && (
          <AnimatePresence mode="wait">
            {activeTab === 'roots' && (
              <motion.div
                key="roots"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {rootTales.length === 0 ? (
                  <Card className="p-12 text-center">
                    <TreeDeciduous className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                    <p className="text-slate-300 font-serif text-lg">No sagas yet</p>
                    <p className="text-slate-500 text-sm mt-2">
                      Start your first story and watch it grow
                    </p>
                    <Button
                      variant="primary"
                      className="mt-6"
                      onClick={() => navigate('/')}
                    >
                      Create Your First Saga
                    </Button>
                  </Card>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {rootTales.map((tale) => (
                      <StoryCard
                        key={tale.id}
                        tale={tale}
                        onEdit={handleEditRoot}
                        onDelete={handleDelete}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'branches' && (
              <motion.div
                key="branches"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {branchTales.length === 0 ? (
                  <Card className="p-12 text-center">
                    <GitBranch className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                    <p className="text-slate-300 font-serif text-lg">No contributions yet</p>
                    <p className="text-slate-500 text-sm mt-2">
                      Explore stories and add your branches
                    </p>
                    <Button
                      variant="primary"
                      className="mt-6"
                      onClick={() => navigate('/')}
                    >
                      Explore Tales
                    </Button>
                  </Card>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col gap-4"
                  >
                    {branchTales.map((tale) => (
                      <ContributionItem
                        key={tale.id}
                        tale={tale}
                        onEdit={handleEditBranch}
                        onDelete={handleDelete}
                        onNavigate={handleNavigate}
                      />
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Footer */}
      <Footer onFeedbackClick={() => setIsFeedbackOpen(true)} />

      {/* Feedback Modal */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      {/* Edit Modal */}
      <EditTaleModal
        isOpen={!!editingTale}
        onClose={() => {
          setEditingTale(null);
          setEditingIsRoot(false);
        }}
        tale={editingTale}
        onSave={handleSaveEdit}
        isLoading={updateMutation.isPending}
        isRoot={editingIsRoot}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingTale}
        onClose={() => setDeletingTale(null)}
        tale={deletingTale}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={user}
        currentBio={bio}
        currentAvatarStyle={avatarStyle as 'initials' | 'notionists' | 'bottts' | 'adventurer'}
        onSave={async (data) => {
          // Update user metadata in Supabase
          const { error } = await supabase.auth.updateUser({
            data: {
              bio: data.bio,
              avatarStyle: data.avatarStyle,
            },
          });
          if (error) throw error;
          // Update local state
          setBio(data.bio);
          setAvatarStyle(data.avatarStyle);
        }}
        onDeleteAccount={async () => {
          // Sign out and delete account
          await supabase.auth.signOut();
          navigate('/');
        }}
      />
    </div>
  );
}
