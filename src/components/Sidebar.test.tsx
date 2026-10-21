import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Navbar from './Sidebar';

const mocks = vi.hoisted(() => ({ navigateTo: vi.fn(), openSettings: vi.fn() }));
vi.mock('@/navbar/NavigationContext', () => ({ useNavigation: () => ({ activePage: 'session', ...mocks }) }));

describe('Top navbar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders one horizontal navigation without sidebar or hamburger', () => {
    const { container } = render(<Navbar />);
    const navigation = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(within(navigation).getAllByRole('button')).toHaveLength(6);
    expect(screen.getByRole('button', { name: 'Study' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument();
    expect(container.querySelector('aside')).toBeNull();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('navigates directly and opens settings', () => {
    render(<Navbar />);
    fireEvent.click(screen.getByRole('button', { name: 'Tasks' }));
    expect(mocks.navigateTo).toHaveBeenCalledWith('tasks');
    fireEvent.click(screen.getByRole('button', { name: 'UniTracker home' }));
    expect(mocks.navigateTo).toHaveBeenCalledWith('session');
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(mocks.openSettings).toHaveBeenCalledOnce();
  });
});
