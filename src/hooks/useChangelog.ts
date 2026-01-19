import { useState, useEffect } from 'react';
import { changelogData } from '../data/changelog';

// Generate hash from changelog content to detect changes
const generateChangelogHash = (changelog: typeof changelogData): string => {
  const content = JSON.stringify(changelog);
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

export const useChangelog = () => {
  const [hasNewChanges, setHasNewChanges] = useState(false);

  useEffect(() => {
    // Generate hash for current changelog content
    const currentHash = generateChangelogHash(changelogData);
    const lastSeenHash = localStorage.getItem('newFeaturesSeenHash');

    // Check if content has changed
    const hasChanges = lastSeenHash !== currentHash;
    setHasNewChanges(hasChanges);
  }, []);

  const markAsSeen = () => {
    const currentHash = generateChangelogHash(changelogData);
    localStorage.setItem('newFeaturesSeenHash', currentHash);
    setHasNewChanges(false);
  };

  return {
    hasNewChanges,
    markAsSeen
  };
};