import React, { useEffect, useRef, useState } from 'react';
import { setActiveWorkspace, setWorkspaces } from '@/store/slices/workspaceSlice';
import { useDispatch, useSelector } from 'react-redux';

import { Menu } from 'lucide-react';
import SettingsButton from './SettingsButton';
import WorkspaceDropdown from './WorkspaceDropdown';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useNavigation } from '@/navbar/NavigationContext';

const Navbar = ({ onOpenSettings }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isLoggedIn, loginWithGoogle, logout, user } = useAuth();
  const { activePage, navigateTo } = useNavigation();
  const dispatch = useDispatch();
  const workspaces = useSelector(state => state.workspace.workspaces);
  const activeWorkspace = useSelector(state => state.workspace.activeWorkspace);
  const tasks = useSelector(state => state.tasks.tasks);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [sharedWorkspaces, setSharedWorkspaces] = useState({});

  // Load workspaces from Supabase on mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        dispatch(setWorkspaces([]));
        localStorage.removeItem('activeWorkspaceId');
        localStorage.removeItem('workspacesHydrated');
        return;
      }
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (!error && data) {
        dispatch(setWorkspaces(data));
        const savedId = localStorage.getItem('activeWorkspaceId');
        if (savedId) {
          const found = data.find(ws => ws.id === savedId);
          if (found) dispatch(setActiveWorkspace(found));
        }
      }
    };
    fetchWorkspaces();
  }, [dispatch]);

  // Clear workspaces if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      dispatch(setWorkspaces([]));
      localStorage.removeItem('activeWorkspaceId');
      localStorage.removeItem('workspacesHydrated');
    }
  }, [isLoggedIn, dispatch]);

  // Load friend requests from Supabase
  useEffect(() => {
    if (!user) {
      setReceivedRequests([]);
      setSentRequests([]);
      return;
    }
    const fetchRequests = async () => {
      const { data: rec } = await supabase
        .from('friend_requests')
        .select('*, from_user:profiles!friend_requests_from_user_id_fkey(username, avatar_url)')
        .eq('to_user_id', user.id)
        .eq('status', 'pending');
      const { data: sent } = await supabase
        .from('friend_requests')
        .select('*, to_user:profiles!friend_requests_to_user_id_fkey(username, avatar_url)')
        .eq('from_user_id', user.id)
        .eq('status', 'pending');
      setReceivedRequests(rec || []);
      setSentRequests(sent || []);
    };
    fetchRequests();
  }, [user]);

  const fetchFriends = async () => {
    if (!user) {
      setFriends([]);
      return;
    }
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .or(`user1.eq.${user.id},user2.eq.${user.id}`);
    if (error) {
      setFriends([]);
      return;
    }
    // Map to get the friend user id (the other one)
    const friendIds = data.map(row => row.user1 === user.id ? row.user2 : row.user1);
    // Fetch friend profiles
    if (friendIds.length === 0) {
      setFriends([]);
      return;
    }
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, email, avatar_url')
      .in('id', friendIds);
    if (profilesError) {
      setFriends([]);
      return;
    }
    setFriends(profiles);
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  useEffect(() => {
    // Calcular workspaces compartidos para cada amigo
    if (!user || !friends.length || !workspaces.length) {
      setSharedWorkspaces({});
      return;
    }
    // Cada workspace tiene un user_id (owner) y puede tener más miembros si tienes esa lógica
    // Si solo hay owner, solo compartes si el amigo es owner de algún workspace tuyo o viceversa
    // Si tienes una tabla de miembros, deberías consultar ahí
    // Aquí asumimos que solo el owner cuenta
    const shared = {};
    friends.forEach(friend => {
      shared[friend.id] = workspaces.filter(ws => ws.user_id === friend.id || ws.user_id === user.id);
    });
    setSharedWorkspaces(shared);
  }, [user, friends, workspaces]);

  // Workspace handlers
  const handleSelectWorkspace = ws => {
    dispatch(setActiveWorkspace(ws));
    localStorage.setItem('activeWorkspaceId', ws.id);
  };
  const handleCreateWorkspace = newWorkspace => {
    dispatch(setWorkspaces([...workspaces, newWorkspace]));
    dispatch(setActiveWorkspace(newWorkspace));
    localStorage.setItem('activeWorkspaceId', newWorkspace.id);
  };
  const handleEditWorkspace = updatedWorkspace => {
    dispatch(setWorkspaces(workspaces.map(ws => ws.id === updatedWorkspace.id ? updatedWorkspace : ws)));
    if (activeWorkspace?.id === updatedWorkspace.id) {
      dispatch(setActiveWorkspace(updatedWorkspace));
    }
  };
  const handleDeleteWorkspace = workspaceId => {
    const updatedWorkspaces = workspaces.filter(ws => ws.id !== workspaceId);
    dispatch(setWorkspaces(updatedWorkspaces));
    if (activeWorkspace?.id === workspaceId) {
      const newActiveWorkspace = updatedWorkspaces.length > 0 ? updatedWorkspaces[0] : null;
      dispatch(setActiveWorkspace(newActiveWorkspace));
    }
  };

  // SettingsButton handlers (dummy, replace with real logic as needed)
  const handleSendRequest = () => {};
  const handleAccept = async (request) => {
    try {
      console.log('[ACCEPT] Iniciando proceso para request:', request);
      // 1. Actualiza la solicitud a "accepted"
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);
      if (updateError) {
        alert('Error updating request: ' + updateError.message);
        return;
      }
      console.log('[ACCEPT] Solicitud actualizada a accepted');
      // 2. Inserta en la tabla friends (amistad simétrica)
      const [user1, user2] = [request.from_user_id, request.to_user_id].sort();
      const { error: insertError } = await supabase
        .from('friends')
        .insert([{ user1, user2 }]);
      if (insertError && !insertError.message.includes('duplicate key value')) {
        alert('Error creating friendship: ' + insertError.message);
        return;
      }
      if (insertError && insertError.message.includes('duplicate key value')) {
        console.log('[ACCEPT] Amistad ya existía, ignorando error de duplicado.');
      } else {
        console.log('[ACCEPT] Amistad insertada en tabla friends');
      }
      // 3. Refresca solicitudes y amigos
      await fetchRequests();
      await fetchFriends();
      console.log('[ACCEPT] Solicitudes y amigos refrescados');
      alert('Friend request accepted!');
    } catch (error) {
      alert('Unexpected error: ' + error.message);
      console.error('[ACCEPT] Error inesperado:', error);
    }
  };
  const handleReject = () => {};

  const handleRemoveFriend = async (friend) => {
    try {
      // Elimina la fila de friends donde estén ambos IDs (en cualquier orden)
      const { error } = await supabase
        .from('friends')
        .delete()
        .or(`and(user1.eq.${user.id},user2.eq.${friend.id}),and(user1.eq.${friend.id},user2.eq.${user.id})`);
      if (error) {
        alert('Error removing friend: ' + error.message);
        return;
      }
      await fetchFriends();
      alert('Friend removed!');
    } catch (error) {
      alert('Unexpected error: ' + error.message);
      console.error('[REMOVE FRIEND] Error:', error);
    }
  };

  // Navigation link class
  const isActive = page => activePage === page;
  const navLinkClass = page =>
    `px-4 py-2 rounded-md text-xl ${isActive(page) ? 'text-[var(--accent-primary)] ' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'}`;

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] z-[10000] overflow-x-hidden">
      <div className="w-full px-2 overflow-x-hidden">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <span className="text-[var(--text-primary)] font-bold text-2xl">Uni</span>
            <span className="text-[var(--accent-primary)] font-bold text-2xl">Tracker</span>
          </div>
          {/* Navigation links - Desktop only (lg+) - CENTERED */}
          <div className="hidden lg:flex flex-1 justify-center items-center space-x-4 lg:space-x-8">
            <button onClick={() => navigateTo('tasks')} className={navLinkClass('tasks') + ' text-base lg:text-xl'}>
              Tasks
            </button>
            <button onClick={() => navigateTo('calendar')} className={navLinkClass('calendar') + ' text-base lg:text-xl'}>
              Calendar
            </button>
            <button onClick={() => navigateTo('session')} className={navLinkClass('session') + ' text-base lg:text-xl'}>
              Session
            </button>
            <button onClick={() => navigateTo('notes')} className={navLinkClass('notes') + ' text-base lg:text-xl'}>
              Notes
            </button>
            <button onClick={() => navigateTo('stats')} className={navLinkClass('stats') + ' text-base lg:text-xl'}>
              Statistics
            </button>
          </div>
          {/* WorkspaceDropdown and SettingsButton */}
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <WorkspaceDropdown
              workspaces={workspaces}
              activeWorkspace={activeWorkspace}
              onSelectWorkspace={handleSelectWorkspace}
              onCreateWorkspace={handleCreateWorkspace}
              onEditWorkspace={handleEditWorkspace}
              onDeleteWorkspace={handleDeleteWorkspace}
              friends={friends}
            />
            <SettingsButton
              isLoggedIn={isLoggedIn}
              loginWithGoogle={loginWithGoogle}
              logout={logout}
              hasFriendRequests={receivedRequests.length > 0}
              receivedRequests={receivedRequests}
              sentRequests={sentRequests}
              onSendRequest={handleSendRequest}
              onAccept={handleAccept}
              onReject={handleReject}
              user={user}
              friends={friends}
              sharedWorkspaces={sharedWorkspaces}
              onRemoveFriend={handleRemoveFriend}
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 