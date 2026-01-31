import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { createTale } from '../services/api';
import { Modal, Button, Input, Textarea } from './ui';
import type { User } from '@supabase/supabase-js';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateStoryModal({ isOpen, onClose }: CreateStoryModalProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    
    if (isOpen) {
      checkSession();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a story');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title for your story');
      return;
    }

    if (!content.trim()) {
      setError('Please enter some content for your story');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await createTale({
        content: content.trim(),
        parentTaleId: null,
        authorId: user.id,
        title: title.trim(),
      });
      
      onClose();
      setTitle('');
      setContent('');
      navigate(`/tale/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start a New Story"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div className="mb-4">
          <Input
            label="Story Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your story title..."
            required
          />
        </div>

        <div className="mb-6">
          <Textarea
            label="Write the first chapter of your story"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Once upon a time..."
            rows={10}
            className="font-serif"
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
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            disabled={!title.trim() || !content.trim()}
          >
            {loading ? 'Creating...' : 'Create Story'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
