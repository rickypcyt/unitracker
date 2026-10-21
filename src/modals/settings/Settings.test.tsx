import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsContent } from './Settings';

const mocks = vi.hoisted(() => ({ seen: vi.fn() }));
vi.mock('@/hooks/auth/useAuth', () => ({ useAuth: () => ({ user: null, isLoggedIn: false, loginWithGoogle: vi.fn(), logout: vi.fn() }) }));
vi.mock('@/hooks/settings/useTheme', () => ({ default: () => ({ accentPalette: '#0A84FF', setAccentPalette: vi.fn(), themePreference: 'auto', handleThemeChange: vi.fn(), currentTheme: 'dark' }) }));
vi.mock('@/hooks/settings/useChangelog', () => ({ useChangelog: () => ({ hasNewChanges: true, markAsSeen: mocks.seen }) }));
vi.mock('@/components/settings/TimezoneSelector', () => ({ default: () => <div>Timezone selector</div> }));
vi.mock('@/components/settings/DataExportImportPanel', () => ({ default: () => <div>Export and import data</div> }));
vi.mock('@/modals/friends/AddFriendModal', () => ({ default: () => null }));
vi.mock('@/modals/friends/FriendsModal', () => ({ default: () => null }));
vi.mock('@/modals/tasks/ManageAssignmentsModal', () => ({ default: () => null }));
vi.mock('@/modals/tasks/ManageCompletedTasksModal', () => ({ default: () => null }));
vi.mock('@/modals/session/ManageSessionsModal', () => ({ default: () => null }));
vi.mock('@/modals/auth/UserModal', () => ({ default: () => null }));

describe('Settings mobile navigation', () => {
  beforeEach(() => mocks.seen.mockClear());

  it('shows every section in a mobile grid instead of a horizontal scrolling row', () => {
    render(<SettingsContent />);
    const sections = screen.getByRole('group', { name: 'Settings sections' });
    expect(sections).toHaveClass('grid', 'grid-cols-3', 'sm:flex', 'shrink-0');
    expect(sections).not.toHaveClass('overflow-x-auto');
    for (const name of ['Appearance', 'Account', 'Data', "What's New", 'About']) {
      expect(within(sections).getByRole('button', { name })).toHaveClass('min-w-0');
    }
  });

  it('selects every section directly and updates the active button', () => {
    render(<SettingsContent />);
    for (const [name, content] of [['Account', 'User Profile'], ['Data', 'Export and import data'], ["What's New", 'Added'], ['About', 'The Story'], ['Appearance', 'Theme']] as const) {
      const button = screen.getByRole('button', { name });
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getAllByText(content).length).toBeGreaterThan(0);
    }
    expect(mocks.seen).toHaveBeenCalled();
  });

  it('uses vertical scrolling for content while keeping section navigation outside it', () => {
    render(<SettingsContent />);
    const content = screen.getByText('Timezone selector').closest('.overflow-y-auto');
    expect(content).toHaveClass('min-h-0', 'min-w-0', 'overflow-x-hidden', 'p-4', 'sm:p-6');
    expect(content).not.toContainElement(screen.getByRole('group', { name: 'Settings sections' }));
  });
});
