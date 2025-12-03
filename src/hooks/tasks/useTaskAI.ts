import { useCallback, useEffect, useRef, useState } from 'react';

type AiParsedTask = {
  task?: string;
  description?: string;
  date?: string | null;
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
};

export function useTaskAI(initialTab: 'manual' | 'ai' = 'ai') {
  const AI_DEBUG = import.meta.env['VITE_AI_DEBUG'] === 'true';
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>(initialTab);
  const [aiPrompt, setAiPrompt] = useState<string>(() => localStorage.getItem('aiPromptDraft') || '');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [aiParsedTasks, setAiParsedTasks] = useState<AiParsedTask[] | null>(null);
  const aiTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [aiCancelHover, setAiCancelHover] = useState(false);
  const [aiAbortController, setAiAbortController] = useState<AbortController | null>(null);
  const aiCancelledRef = useRef(false);

  useEffect(() => {
    if (activeTab === 'ai' && aiTextareaRef.current) {
      try { aiTextareaRef.current.focus(); } catch {}
    }
  }, [activeTab]);

  const handleCancelAI = useCallback(() => {
    aiCancelledRef.current = true;
    if (aiAbortController) aiAbortController.abort();
    setAiLoading(false);
    setAiAbortController(null);
  }, [aiAbortController]);

  useEffect(() => {
    if (!aiLoading) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelAI(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aiLoading, handleCancelAI]);

  return {
    AI_DEBUG,
    activeTab,
    setActiveTab,
    aiPrompt,
    setAiPrompt,
    aiLoading,
    setAiLoading,
    aiError,
    setAiError,
    showAIPreview,
    setShowAIPreview,
    aiParsedTasks,
    setAiParsedTasks,
    aiTextareaRef,
    aiCancelHover,
    setAiCancelHover,
    aiAbortController,
    setAiAbortController,
    aiCancelledRef,
    handleCancelAI,
  };
}


