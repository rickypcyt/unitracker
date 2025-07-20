import React, { useEffect, useRef, useState } from 'react';

import BaseModal from '@/modals/BaseModal';
import { Pencil } from 'lucide-react';
import UsernameInput from '@/components/UsernameInput';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

const UserModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameValid, setUsernameValid] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [usernameSaveSuccess, setUsernameSaveSuccess] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const fileInputRef = useRef();
  const usernameEditRef = useRef();

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
    function handleClickOutside(e) {
      if (usernameEditRef.current && !usernameEditRef.current.contains(e.target)) {
        setEditingUsername(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingUsername]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setSuccess(false);
    }
  };

  // Modular function to upload avatar
  const uploadAvatar = async (file, user) => {
    if (!user) {
      console.error('No authenticated user');
      return { success: false };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `avatar.${fileExt}`; // fixed name, but keeps extension
    const filePath = `${user.id}/${fileName}`;
    console.log('Uploading avatar:', { filePath, fileType: file.type, file });

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true, // overwrite if exists
        contentType: file.type,
      });

    if (error) {
      console.error('Error uploading avatar:', error);
      return { success: false };
    }

    // Get public URL
    const { data: publicUrlData, error: publicUrlError } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (publicUrlError) {
      console.error('Error getting public URL:', publicUrlError);
      return { success: false };
    }

    // Save to profiles
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
    const file = fileInputRef.current?.files?.[0];
    // Debug: Initial state
    console.log('DEBUG: Initial state', {
      user,
      file,
      fileInputRef,
      userId: user?.id,
      fileInputCurrent: fileInputRef.current,
      files: fileInputRef.current?.files,
    });
    if (!file) {
      console.error('No file selected:', fileInputRef.current?.files);
      return;
    }
    if (!user?.id) {
      console.error('No user ID:', user);
      return;
    }
    setUploading(true);
    setSuccess(false);
    try {
      const result = await uploadAvatar(file, user);
      if (result.success) {
        setAvatarUrl(result.publicUrl || null);
        setPreview(null);
        setSuccess(true);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
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
        .eq('id', user.id);
      if (error) {
        setUsernameError('Error saving username: ' + error.message);
        return;
      }
      setUsernameSaveSuccess(true);
    } catch (err) {
      setUsernameError('Unexpected error: ' + (err?.message || err));
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
          onClick={() => fileInputRef.current.click()}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-28 h-28 rounded-full object-cover border-2 border-[var(--accent-primary)]" />
          ) : avatarUrl ? (
            <img src={avatarUrl} alt="User avatar" className="w-28 h-28 rounded-full object-cover border-2 border-[var(--accent-primary)]" />
          ) : (
            <div className="w-28 h-28 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-5xl text-[var(--accent-primary)]">
              {user?.email?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          {/* Overlay on hover with pencil icon */}
          <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Pencil className="w-10 h-10 text-white" />
          </div>
        </div>
        <div className="text-lg font-semibold text-[var(--text-primary)]">
          {user?.email || user?.user_metadata?.email || user?.primary_email || 'No email found'}
        </div>
        {/* Username input modular */}
        <div className="w-full">
          {(!username || editingUsername) ? (
            <div ref={usernameEditRef}>
              <UsernameInput
                initialValue={username}
                userId={user?.id}
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
          accept="image/*"
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
        {/* If no username, blocking message */}
        {!username && (
          <div className="mt-4 text-red-600 text-center text-sm font-medium">You must choose a unique username to continue.</div>
        )}
      </div>
    </BaseModal>
  );
};

export default UserModal; 