import { useAuth } from "@/hooks/useAuth";
import { useFriendManagement } from "@/hooks/useFriendManagement";
import { useWorkspace } from "@/store/appStore";
import { SettingsContent } from "@/modals/Settings";

const SettingsPage = () => {
  const { user } = useAuth();
  const { friends, handleRemoveFriend } = useFriendManagement(user?.id);
  const { workspaces } = useWorkspace();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] w-full max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <SettingsContent
        friends={friends}
        workspaces={workspaces}
        {...(handleRemoveFriend && { onRemoveFriend: handleRemoveFriend })}
        {...(user?.id && { currentUserId: user.id })}
      />
    </div>
  );
};

export default SettingsPage;
