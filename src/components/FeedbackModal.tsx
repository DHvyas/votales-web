import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { submitFeedback } from '../services/api';
import { Modal, Button, Input, Textarea } from './ui';
import { CheckCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        setEmail(session.user.email);
      }
    };
    
    if (isOpen) {
      checkSession();
      // Reset state when opening
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter your feedback message');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await submitFeedback(email.trim() || '', message.trim());
      setSuccess(true);
      setMessage('');
      
      // Auto-close after showing success
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail(user?.email || '');
    setMessage('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Submit Feedback"
      size="md"
    >
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            >
              <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
            </motion.div>
            <h3 className="text-xl font-serif font-semibold text-slate-200 mb-2">
              Thank You!
            </h3>
            <p className="text-slate-400">
              Your feedback has been submitted successfully.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="p-6"
          >
            <p className="text-slate-400 text-sm mb-6">
              We'd love to hear your thoughts! Share your feedback, suggestions, or report any issues.
            </p>

            <div className="mb-4">
              <Input
                label={user ? 'Email (auto-filled)' : 'Email (Optional)'}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={!!user}
              />
              {!user && (
                <p className="mt-1 text-xs text-slate-500">
                  Provide your email if you'd like us to follow up
                </p>
              )}
            </div>

            <div className="mb-6">
              <Textarea
                label="Your Feedback"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you think..."
                rows={5}
              />
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                disabled={!message.trim()}
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Modal>
  );
}
