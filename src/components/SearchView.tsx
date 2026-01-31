import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Loader2, BookOpen, ArrowLeft } from 'lucide-react';
import { Navbar } from './ui/Navbar';
import { GlassContainer } from './ui/GlassContainer';
import { Button } from './ui/Button';
import { searchTales, type SearchResult } from '../services/api';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function SearchView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    try {
      const data = await searchTales(searchQuery, 50);
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  const handleResultClick = (id: string) => {
    navigate(`/tale/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950">
      <Navbar user={user} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Home
          </Button>
        </motion.div>

        {/* Search Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Search Tales
          </h1>
          <p className="text-slate-400">
            Discover stories from the VoTales community
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="mb-8"
        >
          <GlassContainer className="p-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title, content, or author..."
                  className="w-full pl-12 pr-4 py-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 hover:border-white/20 hover:bg-white/[0.07]"
                  autoFocus
                />
              </div>
              <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </GlassContainer>
        </motion.form>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          ) : hasSearched && results.length === 0 ? (
            <GlassContainer className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">
                No tales found
              </h3>
              <p className="text-slate-500">
                Try adjusting your search terms or explore our featured tales
              </p>
            </GlassContainer>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-400 mb-4">
                Found {results.length} tale{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassContainer
                    className="p-5 cursor-pointer hover:bg-white/10 transition-all duration-200"
                    onClick={() => handleResultClick(result.id)}
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {result.title || 'Untitled Tale'}
                    </h3>
                    <p className="text-slate-400 text-sm line-clamp-3 mb-3">
                      {result.content}
                    </p>
                    {result.authorName && (
                      <p className="text-xs text-violet-400">
                        by {result.authorName}
                      </p>
                    )}
                  </GlassContainer>
                </motion.div>
              ))}
            </div>
          ) : null}
        </motion.div>
      </main>
    </div>
  );
}
