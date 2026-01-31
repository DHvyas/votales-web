import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { BookOpen, Mail, Lock, ArrowLeft, Sparkles, User } from 'lucide-react';
import { Button, Input, Card } from './ui';

type AuthTab = 'signin' | 'signup' | 'reset-password';

export default function AuthView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [penName, setPenName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      navigate(redirectTo);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!penName.trim()) {
      setError('Please enter a pen name');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: penName.trim(),
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      navigate(redirectTo);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:5173/update-password',
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccessMessage('Check your email for the reset link.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
            className="mb-6"
          >
            <div className="relative inline-block">
              <BookOpen className="w-14 h-14 text-violet-400" />
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="w-5 h-5 text-amber-400" />
              </motion.div>
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-amber-200">
            VoTales
          </h1>
          <p className="text-slate-500 mt-2">Enter the Library of Forklore</p>
        </div>

        {/* Card */}
        <Card variant="glass" className="overflow-hidden">
          {/* Tabs */}
          {activeTab !== 'reset-password' && (
            <div className="flex border-b border-white/10">
              <button
                onClick={() => {
                  setActiveTab('signin');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-4 text-center font-medium transition-all relative ${
                  activeTab === 'signin'
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Sign In
                {activeTab === 'signin' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-amber-500"
                  />
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab('signup');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-4 text-center font-medium transition-all relative ${
                  activeTab === 'signup'
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Sign Up
                {activeTab === 'signup' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-amber-500"
                  />
                )}
              </button>
            </div>
          )}

          {/* Reset Password Header */}
          {activeTab === 'reset-password' && (
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white text-center">Reset Password</h2>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={
              activeTab === 'signin'
                ? handleSignIn
                : activeTab === 'signup'
                ? handleSignUp
                : handleResetPassword
            }
            className="p-6 space-y-5"
          >
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm"
                >
                  {successMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            {activeTab !== 'reset-password' && (
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
              />
            )}

            {activeTab === 'signin' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('reset-password');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {activeTab === 'signup' && (
              <Input
                label="Pen Name"
                type="text"
                value={penName}
                onChange={(e) => setPenName(e.target.value)}
                required
                placeholder="Your author name"
                leftIcon={<User className="w-4 h-4" />}
              />
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={loading}
            >
              {loading
                ? 'Please wait...'
                : activeTab === 'signin'
                ? 'Sign In'
                : activeTab === 'signup'
                ? 'Sign Up'
                : 'Send Reset Link'}
            </Button>

            {activeTab === 'reset-password' && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setActiveTab('signin');
                  setError(null);
                  setSuccessMessage(null);
                }}
              >
                Back to Sign In
              </Button>
            )}
          </form>
        </Card>

        {/* Back to home link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8"
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
      </motion.div>
    </div>
  );
}
