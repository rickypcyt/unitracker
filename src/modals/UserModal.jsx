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

  // Obtiene el avatar y username actual desde la tabla profiles
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
          setEditingUsername(!data.username); // Si no tiene username, forzar edición
        } else {
          setAvatarUrl(null);
          setUsername('');
          setEditingUsername(true);
        }
      }
    };
    if (isOpen) fetchProfile();
  }, [user, isOpen]);

  // Cerrar edición de username al hacer click fuera
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

  // Nueva función modular para subir el avatar
  const uploadAvatar = async (file, user) => {
    if (!user) {
      console.error('No authenticated user');
      alert('No hay usuario autenticado.');
      return { success: false };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `avatar.${fileExt}`; // nombre fijo, pero mantiene extensión
    const filePath = `${user.id}/${fileName}`;
    console.log('Subiendo avatar:', { filePath, fileType: file.type, file });

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true, // sobrescribe si ya existe
        contentType: file.type,
      });

    if (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar: ' + error.message);
      return { success: false };
    }

    // Obtener la URL pública
    const { data: publicUrlData, error: publicUrlError } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (publicUrlError) {
      console.error('Error getting public URL:', publicUrlError);
      alert('Error getting public URL: ' + publicUrlError.message);
      return { success: false };
    }

    // Guardar en profiles
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrlData.publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      alert('Error updating profile: ' + updateError.message);
      return { success: false };
    }

    alert('¡Avatar subido y guardado correctamente!');
    return { success: true, publicUrl: publicUrlData.publicUrl };
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    // Debug: Estado inicial
    console.log('DEBUG: Estado inicial', {
      user,
      file,
      fileInputRef,
      userId: user?.id,
      fileInputCurrent: fileInputRef.current,
      files: fileInputRef.current?.files,
    });
    if (!file) {
      alert('No se seleccionó ningún archivo.');
      console.error('No file selected:', fileInputRef.current?.files);
      return;
    }
    if (!user?.id) {
      alert('No hay usuario autenticado.');
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
      console.error('Error inesperado:', err);
      alert('Error inesperado: ' + (err?.message || err));
    } finally {
      setUploading(false);
    }
  };

  // Guardar username en Supabase
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
        setUsernameError('Error al guardar username: ' + error.message);
        return;
      }
      setUsernameSaveSuccess(true);
    } catch (err) {
      setUsernameError('Error inesperado: ' + (err?.message || err));
    } finally {
      setUsernameLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={(!username && !usernameValid) ? () => {} : onClose}
      title="User Info"
      maxWidth="max-w-md"
      showCloseButton={!!username && usernameValid}
    >
      <div className="flex flex-col items-center gap-4 py-6">
        {/* Avatar y email */}
        <div
          className="relative group mb-2 cursor-pointer"
          style={{ width: '5rem', height: '5rem' }}
          onClick={() => fileInputRef.current.click()}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-[var(--accent-primary)]" />
          ) : avatarUrl ? (
            <img src={avatarUrl} alt="User avatar" className="w-20 h-20 rounded-full object-cover border-2 border-[var(--accent-primary)]" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-3xl text-[var(--accent-primary)]">
              {user?.email?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          {/* Overlay al hacer hover solo con ícono lápiz */}
          <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Pencil className="w-7 h-7 text-white" />
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
                {usernameLoading ? 'Guardando...' : 'Guardar username'}
              </button>
              {usernameSaveSuccess && (
                <div className="mt-1 text-green-600 text-sm">¡Username guardado!</div>
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
                  aria-label="Editar username"
                >
                  <Pencil className="w-5 h-5 text-[var(--accent-primary)]" />
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Avatar file input y botones */}
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
            {uploading ? 'Subiendo...' : 'Subir avatar'}
          </button>
        )}
        {success && (
          <div className="mt-2 text-green-600 font-medium">¡Avatar actualizado!</div>
        )}
        {/* Si no tiene username, mensaje bloqueante */}
        {!username && (
          <div className="mt-4 text-red-600 text-center text-sm font-medium">Debes elegir un username único para continuar.</div>
        )}
      </div>
    </BaseModal>
  );
};

export default UserModal; 