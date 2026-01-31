import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { LogIn, Send, Feather } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { createTale } from '../services/api';
import type { User } from '@supabase/supabase-js';

interface ContributionFormProps {
  parentTaleId: string;
  onSuccess?: (newTaleId?: string) => void;
}

export default function ContributionForm({ parentTaleId, onSuccess }: ContributionFormProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to contribute');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title for your chapter');
      return;
    }

    if (!content.trim()) {
      setError('Please enter some content for your chapter');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newTale = await createTale({
        content: content.trim(),
        parentTaleId,
        authorId: user.id,
        title: title.trim(),
      });
      
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['tale', parentTaleId] });
      queryClient.invalidateQueries({ queryKey: ['storyMap'] });
      
      setTitle('');
      setContent('');
      setSuccess(true);
      
      if (onSuccess) {
        onSuccess(newTale.id);
      }
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit contribution');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-slate-700/50 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-slate-700/50 rounded"></div>
      </div>
    );
  }

  // User is not logged in - show login prompt
  if (!user) {
    return (
      <div className="text-center py-4">
        <Feather className="w-8 h-8 mx-auto mb-4 text-slate-600" />
        <p className="text-slate-400 mb-6 font-serif">
          Want to add the next chapter to this story?
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600/80 hover:bg-violet-500 text-white rounded-xl transition-colors font-medium"
        >
          <LogIn className="w-4 h-4" />
          <span>Log in to contribute</span>
        </Link>
      </div>
    );
  }

  // User is logged in - show contribution form
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-violet-300 mb-2">
          Choice Action <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What action does the protagonist take? (e.g., 'Go Left', 'Fight the Dragon')"
          required
          className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 font-serif text-slate-200 placeholder:text-slate-600 transition-all"
        />
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Continue the story in your own words..."
        rows={6}
        className="w-full px-4 py-4 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 resize-none font-serif text-slate-200 placeholder:text-slate-600 mb-4 transition-all"
      />

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
          Your chapter has been submitted successfully!
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !content.trim() || !title.trim()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
        >
          <Send className="w-4 h-4" />
          <span>{loading ? 'Submitting...' : 'Submit Chapter'}</span>
        </button>
      </div>
    </form>
  );
}
