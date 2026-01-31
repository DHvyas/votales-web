import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTale } from '../services/api';
import { BookOpen, ChevronRight } from 'lucide-react';

interface TaleReaderProps {
  initialTaleId?: string;
}

export default function TaleReader({ initialTaleId = '' }: TaleReaderProps) {
  const [currentTaleId, setCurrentTaleId] = useState(initialTaleId);
  const [taleHistory, setTaleHistory] = useState<string[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['tale', currentTaleId],
    queryFn: () => fetchTale(currentTaleId),
    enabled: !!currentTaleId,
  });

  const handleChoiceClick = (choiceId: string) => {
    setTaleHistory([...taleHistory, currentTaleId]);
    setCurrentTaleId(choiceId);
  };

  const handleGoBack = () => {
    if (taleHistory.length > 0) {
      const previousTale = taleHistory[taleHistory.length - 1];
      setTaleHistory(taleHistory.slice(0, -1));
      setCurrentTaleId(previousTale);
    }
  };

  if (!currentTaleId) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-stone-400" />
          <h2 className="text-2xl font-serif text-stone-700 mb-2">Welcome to VoTales</h2>
          <p className="text-stone-500">Enter a tale ID to begin your journey</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-stone-400" />
          </div>
          <p className="text-stone-500 font-serif">Loading tale...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-serif">Error loading tale</p>
          <p className="text-stone-500 text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Reading Area */}
      <div className="max-w-3xl mx-auto px-6 sm:px-8 md:px-12 py-12 sm:py-16 md:py-20">
        {/* Back Button */}
        {taleHistory.length > 0 && (
          <button
            onClick={handleGoBack}
            className="mb-8 text-stone-500 hover:text-stone-700 transition-colors text-sm flex items-center gap-1 font-serif"
          >
            ← Go Back
          </button>
        )}

        {/* Tale Content */}
        <article className="prose prose-lg prose-stone max-w-none">
          <div className="font-serif text-stone-800 leading-relaxed text-lg sm:text-xl space-y-6">
            {data?.content.split('\n\n').map((paragraph: string, index: number) => (
              <p key={index} className="indent-8 first:indent-0">
                {paragraph}
              </p>
            ))}
          </div>
        </article>
      </div>

      {/* Choices Section - Fixed at bottom */}
      {data?.choices && data.choices.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-stone-200 shadow-2xl">
          <div className="max-w-3xl mx-auto px-6 sm:px-8 md:px-12 py-6">
            <h3 className="text-sm uppercase tracking-wider text-stone-500 mb-4 font-sans">
              Choose Your Path
            </h3>
            <div className="space-y-3">
              {data.choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleChoiceClick(choice.id)}
                  className="w-full group relative overflow-hidden bg-stone-50 hover:bg-stone-100 transition-all duration-200 rounded-lg border border-stone-200 hover:border-stone-300"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1 text-left">
                      <p className="text-stone-800 font-serif text-base sm:text-lg leading-snug">
                        {choice.previewText}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-stone-500 font-sans">
                          {choice.votes} {choice.votes === 1 ? 'vote' : 'votes'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-stone-600 group-hover:translate-x-1 transition-all ml-4 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spacer to prevent content from being hidden behind fixed choices */}
      {data?.choices && data.choices.length > 0 && (
        <div className="h-48 sm:h-56" />
      )}
    </div>
  );
}
