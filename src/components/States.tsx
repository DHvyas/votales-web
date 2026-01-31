import { BookOpen } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading tale...' }: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-stone-400" />
        </div>
        <p className="text-stone-500 font-serif">{message}</p>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  details?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, details, onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <p className="text-red-600 font-serif text-xl mb-2">{message}</p>
        {details && (
          <p className="text-stone-500 text-sm mt-2 mb-4">{details}</p>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 px-6 py-2 bg-stone-800 hover:bg-stone-900 text-white font-serif rounded-lg transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
      <div className="text-center">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-stone-400" />
        <h2 className="text-2xl font-serif text-stone-700 mb-2">{title}</h2>
        {description && (
          <p className="text-stone-500">{description}</p>
        )}
      </div>
    </div>
  );
}
