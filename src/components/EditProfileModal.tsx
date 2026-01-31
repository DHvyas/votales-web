import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check } from 'lucide-react';
import { Modal, Button, Textarea, Input, useToast } from './ui';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Avatar styles available from DiceBear
const AVATAR_STYLES = ['initials', 'notionists', 'bottts', 'adventurer'] as const;
type AvatarStyle = typeof AVATAR_STYLES[number];

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SupabaseUser | null;
  currentBio?: string;
  currentAvatarStyle?: AvatarStyle;
  onSave: (data: { bio: string; avatarStyle: AvatarStyle }) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

// Avatar Preview Component
function AvatarPreview({ 
  style, 
  username, 
  isSelected, 
  onClick 
}: { 
  style: AvatarStyle; 
  username: string; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const avatarUrl = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(username)}`;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden 
        ring-4 transition-all duration-200
        ${isSelected 
          ? 'ring-violet-500 shadow-lg shadow-violet-500/30' 
          : 'ring-white/10 hover:ring-white/30'
        }
      `}
    >
      <img 
        src={avatarUrl} 
        alt={`${style} avatar style`}
        className="w-full h-full object-cover"
      />
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-violet-500/30"
        >
          <Check className="w-6 h-6 text-white" />
        </motion.div>
      )}
      <span className="sr-only">{style} style</span>
    </motion.button>
  );
}

export default function EditProfileModal({
  isOpen,
  onClose,
  user,
  currentBio = '',
  currentAvatarStyle = 'initials',
  onSave,
  onDeleteAccount,
}: EditProfileModalProps) {
  const { addToast } = useToast();
  const [bio, setBio] = useState(currentBio);
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>(currentAvatarStyle);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const displayName = user?.user_metadata?.username || 
                      user?.user_metadata?.full_name || 
                      user?.email?.split('@')[0] || 
                      'User';

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setBio(currentBio);
      setSelectedStyle(currentAvatarStyle);
      setDeleteConfirmText('');
      setShowDeleteConfirm(false);
    }
  }, [isOpen, currentBio, currentAvatarStyle]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ bio, avatarStyle: selectedStyle });
      addToast('Profile updated successfully!', 'success');
      onClose();
    } catch (error) {
      addToast('Failed to update profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    
    setIsDeleting(true);
    try {
      await onDeleteAccount();
      addToast('Account deleted successfully.', 'success');
      onClose();
    } catch (error) {
      addToast('Failed to delete account. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const bioCharCount = bio.length;
  const maxBioLength = 300;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" size="md">
      <div className="p-6 space-y-8">
        {/* Avatar Picker */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-4">
            Choose Your Avatar Style
          </label>
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {AVATAR_STYLES.map((style) => (
              <AvatarPreview
                key={style}
                style={style}
                username={displayName}
                isSelected={selectedStyle === style}
                onClick={() => setSelectedStyle(style)}
              />
            ))}
          </div>
          <p className="text-center text-xs text-slate-500 mt-3">
            Preview using your display name: <span className="text-violet-400">{displayName}</span>
          </p>
        </div>

        {/* Bio Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-300">
              About Me
            </label>
            <span className={`text-xs ${bioCharCount > maxBioLength ? 'text-red-400' : 'text-slate-500'}`}>
              {bioCharCount}/{maxBioLength}
            </span>
          </div>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, maxBioLength))}
            placeholder="Tell the community about yourself..."
            rows={4}
            className="font-serif"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={bioCharCount > maxBioLength}
          >
            Save Changes
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="pt-6 border-t border-red-500/20">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
            </div>
            
            <AnimatePresence mode="wait">
              {!showDeleteConfirm ? (
                <motion.div
                  key="initial"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-sm text-slate-400 mb-4">
                    Deleting your account is permanent and cannot be undone. 
                    All your tales and contributions will remain but will be attributed to "Anonymous".
                  </p>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <p className="text-sm text-red-300 mb-4">
                    Type <span className="font-mono font-bold">DELETE</span> to confirm account deletion:
                  </p>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="mb-4 border-red-500/30 focus:ring-red-500/50"
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE'}
                      isLoading={isDeleting}
                    >
                      Permanently Delete Account
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Modal>
  );
}
