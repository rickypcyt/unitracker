import { isSupportedType, processAvatarFile } from '@/utils/avatarImage';
import { useEffect, useRef, useState } from 'react';

import BaseModal from '@/modals/BaseModal';
import { ChangeEvent } from 'react';
import { Pencil } from 'lucide-react';
import UsernameInput from '@/components/UsernameInput';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    email?: string;
  };
}

interface UploadResult {
  success: boolean;
  publicUrl?: string;
}

const UserModal = ({ isOpen, onClose }: UserModalProps) => {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processed, setProcessed] = useState<{
    blob: Blob;
    width: number;
    height: number;
    type: 'image/png' | 'image/jpeg' | 'image/webp';
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [username, setUsername] = useState('');
  const [usernameValid, setUsernameValid] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameSaveSuccess, setUsernameSaveSuccess] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const usernameEditRef = useRef<HTMLDivElement>(null);

  // Fetch avatar and username from profiles table
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, username')
          .eq('id', user.id)
          .single();
        if (!error && data) {
          setAvatarUrl(data.avatar_url);
          setUsername(data.username || '');
          setEditingUsername(!data.username); // If no username, force edit
        } else {
          setAvatarUrl(null);
          setUsername('');
          setEditingUsername(true);
        }
      }
    };
    if (isOpen) fetchProfile();
  }, [user, isOpen]);

  // Close username edit on outside click
  useEffect(() => {
    if (!editingUsername) return;
    function handleClickOutside(e: globalThis.MouseEvent) {
      if (usernameEditRef.current && !usernameEditRef.current.contains(e.target as Node)) {
        setEditingUsername(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingUsername]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError('');
    setSuccess(false);
    setProcessed(null);
    if (!file) return;

    // Validación rápida de tipo/size de entrada (antes de procesar)
    if (!isSupportedType(file.type)) {
      setUploadError('Formato no soportado. Usa PNG, JPEG o WebP.');
      return;
    }
    if (file.size > 10_000_000) { // hard cap de entrada 10 MB
      setUploadError('El archivo es demasiado grande. Máximo 10 MB.');
      return;
    }

    try {
      const { blob, previewUrl, width, height, type } = await processAvatarFile(file, {
        minSize: 256,
        maxSize: 512,
        maxBytes: 1_000_000,
        preferFormat: 'auto',
        quality: 0.82,
      });
      setPreview(previewUrl);
      setProcessed({ blob, width, height, type });
    } catch (err: any) {
      setUploadError(err?.message || 'Error procesando la imagen.');
    }
  };

  // Modular function to upload avatar (expects processed blob)
  const uploadAvatar = async (file: Blob, user: User | null): Promise<UploadResult> => {
    if (!user) {
      console.error('No authenticated user');
      return { success: false };
    }
    // Determine extension by mime
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/jpeg' ? 'jpg' : 'webp';
    // Versioned immutable filename for cache-busting
    const version = Date.now();
    const fileName = `avatar_v${version}.${ext}`;
    const filePath = `${user.id}/${fileName}`;
    console.warn('Uploading avatar:', { filePath, fileType: file.type, size: file.size });

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: false, // keep immutable versions
        contentType: file.type,
        cacheControl: '31536000', // 1 year, safe with versioned filenames
      });

    if (error) {
      console.error('Error uploading avatar:', error);
      return { success: false };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (!publicUrlData.publicUrl) {
      console.error('No public URL returned');
      return { success: false };
    }

    // Save to profiles (point to latest version)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrlData.publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return { success: false };
    }

    return { success: true, publicUrl: publicUrlData.publicUrl };
  };

  const handleUpload = async () => {
    const proc = processed;
    // Debug: Initial state
    console.warn('DEBUG: Initial state', {
      user,
      processed: proc,
      userId: user?.id,
    });
    if (!proc) {
      console.error('No file selected');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const result = await uploadAvatar(proc.blob, user);
      if (result.success) {
        setSuccess(true);
        // Mantener preview, pero limpiar input
        if (fileInputRef.current) fileInputRef.current.value = '';
        setProcessed(null);
        // Forzar recarga de perfil: vuelve a leer avatar_url
        // (opcional: setAvatarUrl(result.publicUrl))
        if (result.publicUrl) {
          setAvatarUrl(result.publicUrl);
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError('Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Save username to Supabase
  const handleSaveUsername = async () => {
    if (!usernameValid || !username) return;
    setUsernameLoading(true);
    setUsernameError('');
    setUsernameSaveSuccess(false);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user?.id!);
      if (error) {
        setUsernameError('Error saving username: ' + error.message);
        return;
      }
      setUsernameSaveSuccess(true);
    } catch (err) {
      setUsernameError('Unexpected error: ' + (err as Error)?.message || String(err));
    } finally {
      setUsernameLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="User Info"
      maxWidth="max-w-md"
      showCloseButton={!!username && usernameValid}
    >
      <div className="flex flex-col items-center gap-4 py-6">
        {/* Avatar and email */}
        <div
          className="relative group mb-2 cursor-pointer"
          style={{ width: '7rem', height: '7rem' }}
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-28 h-28 rounded-full object-cover border-2 border-[var(--accent-primary)]" />
          ) : avatarUrl ? (
            <img src={avatarUrl} alt="User avatar" className="w-28 h-28 rounded-full object-cover border-2 border-[var(--accent-primary)]" />
          ) : (
            <div className="w-28 h-28 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-5xl text-[var(--accent-primary)]">
              {user?.email?.[0]?.toUpperCase() || user?.user_metadata?.['email']?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          {/* Overlay on hover with pencil icon */}
          <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Pencil className="w-10 h-10 text-white" />
          </div>
        </div>
        <div className="text-lg font-semibold text-[var(--text-primary)]">
          {user?.email || user?.user_metadata?.['email'] || 'No email found'}
        </div>
        {/* Username input modular */}
        <div className="w-full">
          {(!username || editingUsername) ? (
            <div ref={usernameEditRef}>
              <UsernameInput
                initialValue={username}
                userId={user?.id || ''}
                onUsernameChange={(val, valid) => {
                  setUsername(val);
                  setUsernameValid(valid);
                  setUsernameSaveSuccess(false);
                }}
                disabled={usernameLoading}
              />
              <button
                className="mt-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90 w-full disabled:opacity-60"
                onClick={async () => {
                  await handleSaveUsername();
                  if (usernameValid && username) setEditingUsername(false);
                }}
                disabled={!usernameValid || usernameLoading || !username}
              >
                {usernameLoading ? 'Saving...' : 'Save username'}
              </button>
              {usernameSaveSuccess && (
                <div className="mt-1 text-green-600 text-sm">Username saved!</div>
              )}
              {usernameError && (
                <div className="mt-1 text-red-600 text-sm">{usernameError}</div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[var(--accent-primary)] break-all">{username}</span>
                <button
                  className="p-1 rounded-full hover:bg-[var(--bg-secondary)] border-2 border-transparent hover:border-[var(--accent-primary)] transition-colors"
                  onClick={() => setEditingUsername(true)}
                  aria-label="Edit username"
                >
                  <Pencil className="w-5 h-5 text-[var(--accent-primary)]" />
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Avatar file input and buttons */}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        {preview && (
          <button
            className="px-4 py-2 rounded-lg bg-[var(--bg-primary)] text-[var(--accent-primary)] border border-[var(--accent-primary)] hover:bg-[var(--bg-secondary)] mt-2"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload avatar'}
          </button>
        )}
        {success && (
          <div className="mt-2 text-green-600 font-medium">Avatar updated!</div>
        )}
        {uploadError && (
          <div className="mt-2 text-red-600 text-sm">{uploadError}</div>
        )}
        {/* If no username, blocking message */}
        {!username && (
          <div className="mt-4 text-red-600 text-center text-sm font-medium">You must choose a unique username to continue.</div>
        )}
      </div>
    </BaseModal>
  );
};

export default UserModal; 