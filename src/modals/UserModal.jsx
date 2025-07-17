import React, { useEffect, useRef, useState } from 'react';

import BaseModal from '@/modals/BaseModal';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

const UserModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef();

  // Obtiene el avatar actual desde la tabla profiles
  useEffect(() => {
    const fetchAvatar = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        if (!error && data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        } else {
          setAvatarUrl(null);
        }
      }
    };
    if (isOpen) fetchAvatar();
  }, [user, isOpen]);

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

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="User Info" maxWidth="max-w-md">
      <div className="flex flex-col items-center gap-4 py-6">
        {preview ? (
          <img src={preview} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-[var(--accent-primary)] mb-2" />
        ) : avatarUrl ? (
          <img src={avatarUrl} alt="User avatar" className="w-20 h-20 rounded-full object-cover border-2 border-[var(--accent-primary)] mb-2" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-3xl text-[var(--accent-primary)] mb-2">
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="text-lg font-semibold text-[var(--text-primary)]">{user?.email || 'No email found'}</div>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90 mt-2"
          onClick={() => fileInputRef.current.click()}
        >
          Elegir imagen
        </button>
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
      </div>
    </BaseModal>
  );
};

export default UserModal; 