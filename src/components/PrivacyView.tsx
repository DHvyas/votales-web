import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { Navbar, Footer } from './ui';
import FeedbackModal from './FeedbackModal';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function PrivacyView() {
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

  const effectiveDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-violet-400" />
              <h1 className="font-['Lora'] text-3xl md:text-4xl font-bold text-white">
                Privacy Policy
              </h1>
            </div>
            <p className="text-slate-400 text-sm">
              Effective Date: {effectiveDate}
            </p>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-invert max-w-none"
          >
            {/* Section 1: Introduction */}
            <section className="mb-8">
              <h2 className="font-['Lora'] text-xl font-semibold text-white mb-3">
                1. Introduction
              </h2>
              <p className="text-slate-300 leading-relaxed">
                Welcome to VoTales. We respect your privacy and are committed to protecting 
                your personal data. This privacy policy explains how we collect, use, and 
                safeguard your information when you use our platform.
              </p>
            </section>

            {/* Section 2: Data We Collect */}
            <section className="mb-8">
              <h2 className="font-['Lora'] text-xl font-semibold text-white mb-3">
                2. Data We Collect
              </h2>
              <ul className="text-slate-300 space-y-3 list-none pl-0">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 font-bold">•</span>
                  <span>
                    <strong className="text-white">Identity:</strong> We collect your email 
                    and pen name via Supabase Auth to manage your account.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 font-bold">•</span>
                  <span>
                    <strong className="text-white">Content:</strong> Any stories, branches, 
                    or comments you post are public User-Generated Content (UGC).
                  </span>
                </li>
              </ul>
            </section>

            {/* Section 3: How We Use Your Data */}
            <section className="mb-8">
              <h2 className="font-['Lora'] text-xl font-semibold text-white mb-3">
                3. How We Use Your Data
              </h2>
              <p className="text-slate-300 leading-relaxed">
                To provide the service, manage voting integrity, and prevent spam. We do not 
                sell your personal data to third parties.
              </p>
            </section>

            {/* Section 4: Content Ownership */}
            <section className="mb-8">
              <h2 className="font-['Lora'] text-xl font-semibold text-white mb-3">
                4. Content Ownership
              </h2>
              <p className="text-slate-300 leading-relaxed">
                You retain the copyright to your original writing. However, by posting on 
                VoTales, you grant us a perpetual, non-exclusive license to display, distribute, 
                and allow others to fork your content within the platform.
              </p>
            </section>

            {/* Section 5: Contact */}
            <section className="mb-8">
              <h2 className="font-['Lora'] text-xl font-semibold text-white mb-3">
                5. Contact
              </h2>
              <p className="text-slate-300 leading-relaxed">
                For data deletion requests, please contact the admin through the feedback 
                form or reach out via our official channels.
              </p>
            </section>
          </motion.div>
        </div>
      </main>

      <Footer onFeedbackClick={() => setShowFeedback(true)} />
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  );
}
