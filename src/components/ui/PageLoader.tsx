import { FC } from 'react';

const PageLoader: FC<{ fullScreen?: boolean }> = ({ fullScreen = false }) => (
  <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'min-h-[40vh]'}`}>
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
    </div>
  </div>
);

export default PageLoader;
