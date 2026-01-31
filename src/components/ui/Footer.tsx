import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

interface FooterProps {
  onFeedbackClick: () => void;
}

export function Footer({ onFeedbackClick }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="border-t border-white/10 bg-black/20 backdrop-blur-sm"
    >
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-center sm:text-left">
            <p className="text-slate-500 text-sm">
              © {currentYear} VoTales. All rights reserved.
            </p>
            <p className="text-xs text-slate-600 mt-1">
              VoTales is in active development. Stories may be pruned during major updates.
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/about"
              className="text-slate-400 hover:text-violet-400 text-sm transition-colors"
            >
              About
            </Link>
            <Link
              to="/privacy"
              className="text-slate-400 hover:text-violet-400 text-sm transition-colors"
            >
              Privacy
            </Link>
            <button
              onClick={onFeedbackClick}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-violet-400 text-sm transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Submit Feedback
            </button>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}

export default Footer;
