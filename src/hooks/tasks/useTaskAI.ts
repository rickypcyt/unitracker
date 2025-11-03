import { useCallback, useEffect, useRef, useState } from 'react';

type AiParsedTask = {
  task?: string;
  description?: string;
  date?: string | null;
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
};

const DEFAULT_MODEL = 'deepseek/deepseek-chat-v3-0324:free';

export function useTaskAI() {
  const AI_DEBUG = import.meta.env['VITE_AI_DEBUG'] === 'true';
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('ai');
  const [aiPrompt, setAiPrompt] = useState<string>(() => localStorage.getItem('aiPromptDraft') || '');
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const saved = localStorage.getItem('aiSelectedModel');
    return saved && saved !== 'auto' ? saved : DEFAULT_MODEL;
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [aiParsedTasks, setAiParsedTasks] = useState<AiParsedTask[] | null>(null);
  const aiTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [aiCancelHover, setAiCancelHover] = useState(false);
  const [aiAbortController, setAiAbortController] = useState<AbortController | null>(null);
  const aiCancelledRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('aiSelectedModel', selectedModel);
  }, [selectedModel]);

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

  // Recommended models: DeepSeek is best for Spanish, fast and reliable
  // Fallbacks in case DeepSeek is unavailable
  const MODEL_OPTIONS: { value: string; label: string }[] = [
    { value: 'deepseek/deepseek-chat-v3-0324:free', label: 'DeepSeek Chat v3 (Recommended)' },
    { value: 'qwen/qwen-2.5-7b-instruct:free', label: 'Qwen 2.5 7B (Good for Spanish)' },
    { value: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Llama 3.2 3B (Alternative)' },
    { value: 'openai/gpt-oss-20b:free', label: 'OpenAI: gpt-oss-20b (Fallback)' },
  ];

  return {
    AI_DEBUG,
    activeTab,
    setActiveTab,
    aiPrompt,
    setAiPrompt,
    selectedModel,
    setSelectedModel,
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
    MODEL_OPTIONS,
  };
}


