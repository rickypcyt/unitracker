import {
  BookOpen,
  Briefcase,
  Coffee,
  FolderOpen,
  Gamepad2,
  Heart,
  Home,
  Music,
  Plane,
  ShoppingBag,
  Smartphone,
  Star,
  Target,
  Trophy,
  Umbrella,
  User,
  Users,
  Wifi,
  Workflow,
  Zap,
} from 'lucide-react';
import type React from 'react';

// Icons a workspace can use, keyed by the name stored in workspace.icon
export const workspaceIconOptions: { [key: string]: React.ComponentType<any> } = {
  Briefcase,
  FolderOpen,
  Home,
  User,
  Users,
  Zap,
  BookOpen,
  Coffee,
  Gamepad2,
  Heart,
  Music,
  Plane,
  ShoppingBag,
  Smartphone,
  Star,
  Target,
  Trophy,
  Umbrella,
  Wifi,
  Workflow,
};

export const getWorkspaceIconComponent = (name?: string | null): React.ComponentType<any> =>
  workspaceIconOptions[name || 'Briefcase'] || Briefcase;
