import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookX, Home } from 'lucide-react';
import { Button } from './ui';

export default function NotFoundView() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/30 to-slate-950 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
          className="mb-8"
        >
          <BookX className="w-20 h-20 text-violet-400 mx-auto" />
        </motion.div>

        {/* Title */}
        <h1 className="font-['Lora'] text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-amber-400 mb-6">
          404: Timeline Severed.
        </h1>

        {/* Description */}
        <p className="text-slate-400 text-lg leading-relaxed mb-8">
          The story branch you are looking for has been pruned or never existed.
        </p>

        {/* Button */}
        <Button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Return to the Library
        </Button>
      </motion.div>

      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
