import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, GitBranch, Vote, BookOpen, Sparkles } from 'lucide-react';
import { GlassContainer, Navbar, Footer } from './ui';
import FeedbackModal from './FeedbackModal';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function AboutView() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/30 to-slate-950 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-violet-400 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </motion.button>

          {/* Hero Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <h1 className="font-['Lora'] text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-amber-400 mb-4">
              Democratizing the Narrative.
            </h1>
            <div className="flex justify-center gap-2 mt-6">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <GitBranch className="w-5 h-5 text-violet-400" />
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
          </motion.div>

          {/* Section 1: The Philosophy */}
          <GlassContainer className="p-8 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="font-['Lora'] text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-violet-400" />
                The Philosophy
              </h2>
              <p className="text-slate-300 leading-relaxed text-lg">
                VoTales (Vote + Tales) is a collaborative fiction platform where stories have traditionally 
                been monologues—one author speaking to many readers. VoTales changes the conversation. 
                We believe fiction is fluid. Inspired by software version control, we treat every plot 
                point as a commit and every alternate ending as a valid branch.
              </p>
            </motion.div>
          </GlassContainer>

          {/* Section 2: How It Works */}
          <GlassContainer className="p-8 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="font-['Lora'] text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <GitBranch className="w-6 h-6 text-violet-400" />
                How It Works
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Read</h3>
                    <p className="text-slate-300">
                      Explore the multiverse of community-created fiction.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Vote className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Vote</h3>
                    <p className="text-slate-300">
                      Your voice determines the 'Canon' path.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <GitBranch className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Fork</h3>
                    <p className="text-slate-300">
                      Don't like the ending? Write your own branch and see if the community follows you.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </GlassContainer>

          {/* Section 3: The Vision */}
          <GlassContainer className="p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="font-['Lora'] text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-amber-400" />
                The Vision
              </h2>
              <p className="text-slate-300 leading-relaxed text-lg">
                We are building the world's largest library of non-linear fiction. A place where 
                characters don't just die; they respawn in a different timeline.
              </p>
            </motion.div>
          </GlassContainer>
        </div>
      </main>

      <Footer onFeedbackClick={() => setShowFeedback(true)} />
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  );
}
