import { motion } from 'framer-motion';
import { Heart, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from './ui/Toast';

interface StoryActionBarProps {
  taleId: string;
  votes: number;
  hasVoted: boolean;
  authorName: string | null;
  authorId: string | null;
  createdAt: string;
  isDeleted?: boolean;
  isLeafNode?: boolean;
  onVote: (taleId: string) => void;
}

// Helper to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function StoryActionBar({
  taleId,
  votes,
  hasVoted,
  authorName,
  authorId,
  createdAt,
  isDeleted = false,
  isLeafNode = false,
  onVote,
}: StoryActionBarProps) {
  const { addToast } = useToast();

  const handleVoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDeleted && !hasVoted) {
      onVote(taleId);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.href);
    addToast('Story link copied to clipboard.', 'success');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="flex flex-col gap-4"
    >
      {/* Appreciation Bar */}
      <div className="flex items-center justify-between mt-8 mb-8 pt-6 border-t border-slate-800">
        {/* Left Side: Vote Button */}
        <motion.button
          onClick={handleVoteClick}
          whileTap={!isDeleted && !hasVoted ? { scale: 1.15 } : undefined}
          disabled={isDeleted}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300
            ${isDeleted
              ? 'text-slate-600 cursor-not-allowed'
              : hasVoted
                ? 'text-amber-400 bg-amber-500/10 cursor-default glow-gold'
                : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 cursor-pointer'
            }
          `}
          title={
            isDeleted 
              ? 'Cannot vote on archived content' 
              : hasVoted 
                ? 'You appreciated this chapter' 
                : 'Show appreciation for this chapter'
          }
        >
          <motion.div
            animate={hasVoted ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Heart 
              className="w-5 h-5" 
              fill={hasVoted ? 'currentColor' : 'none'}
              strokeWidth={hasVoted ? 0 : 2}
            />
          </motion.div>
          <span className="text-sm font-medium font-sans">
            {votes} {votes === 1 ? 'appreciation' : 'appreciations'}
          </span>
        </motion.button>

        {/* Right Side: Author Signature + Share */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-slate-400 font-serif italic">
              —{' '}
              {authorName && authorId ? (
                <Link 
                  to={`/u/${authorId}`}
                  className="hover:text-violet-400 hover:underline transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {authorName}
                </Link>
              ) : (
                'Anonymous'
              )}
            </p>
            <p className="text-xs text-slate-600">
              {formatDate(createdAt)}
            </p>
          </div>
          <motion.button
            onClick={handleShareClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-300"
            title="Share this story"
          >
            <Share2 className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Leaf Node Message */}
      {isLeafNode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-3"
        >
          <p className="text-sm text-slate-500 italic font-serif">
            ✦ This timeline ends here. ✦
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
