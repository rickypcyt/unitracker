import AIPreviewModal from './AIPreviewModal';
import BaseModal from '@/modals/BaseModal';
import { addTask } from '@/store/TaskActions';
import { normalizeNaturalOrYMDDate } from '@/hooks/tasks/useTaskDateUtils';
import { useRef } from 'react';
import { useTaskAI } from '@/hooks/tasks/useTaskAI';

type AITaskFormProps = {
  onClose: () => void;
  onSwitchToManual?: () => void;
};

const AITaskForm = ({ onClose, onSwitchToManual }: AITaskFormProps) => {
  const {
    AI_DEBUG,
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
    setAiAbortController,
    aiCancelledRef,
    handleCancelAI,
  } = useTaskAI('ai');

  // Simple cache to avoid repeated requests
  const aiCache = useRef<Map<string, any>>(new Map());

  function mapAITaskToFormData(task: any) {
    const normalizedDate = task.date && task.date !== 'null'
      ? normalizeNaturalOrYMDDate(task.date)
      : null;

    return {
      title: task.task || '',
      description: task.description || (task.subject ? `Asignatura: ${task.subject}` : ''),
      assignment: task.subject || '',
      deadline: normalizedDate,
      difficulty: task.difficulty?.toLowerCase() || 'medium',
      isRecurring: false,
      recurrence_weekdays: null,
      start_at: null,
      end_at: null,
    };
  }

  const handleAIAcceptAll = async (tasks: any[]) => {
    const mappedTasks = tasks.map(mapAITaskToFormData);
    if (AI_DEBUG) console.log('[AI][accept-all][count]', mappedTasks.length);

    await Promise.all(mappedTasks.map(addTask));
    setShowAIPreview(false);
    onClose();
  };

  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!aiPrompt.trim()) {
      setAiError('Prompt required');
      return;
    }

    setAiError('');
    setAiLoading(true);
    aiCancelledRef.current = false;

    const controller = new AbortController();
    setAiAbortController(controller);

    const tStart = performance.now();
    let debugInterval: number | null = null;

    if (AI_DEBUG) {
      debugInterval = window.setInterval(() => {
        const elapsed = (performance.now() - tStart) / 1000;
        console.info(`[AI][elapsed] ${elapsed.toFixed(1)}s`);
      }, 1000);
    }

    try {
      const result = await callAIAPI(controller);

      if (aiCancelledRef.current) {
        console.log('[AI] Request was cancelled');
        return;
      }

      if (debugInterval) clearInterval(debugInterval);

      if (!result.success || !result.data) {
        setAiError(result.error || 'Failed to generate task');
        return;
      }

      const aiTask = result.data;
      console.log('[AI] Generated task:', aiTask);

      const mappedData = mapAITaskToFormData(aiTask);
      console.log('[AI] Mapped data:', mappedData);

      // Show the AI preview modal with the generated tasks
      if (mappedData) {
        setAiParsedTasks([mappedData]);
        setShowAIPreview(true);
      } else {
        setAiError('No valid tasks were generated');
      }

      setAiPrompt('');
    } catch (error: any) {
      if (debugInterval) clearInterval(debugInterval);

      if (aiCancelledRef.current) {
        console.log('[AI] Request was cancelled by user');
        return;
      }

      console.error('[AI] Error:', error);
      setAiError(error.message || 'Failed to generate task');
    } finally {
      setAiLoading(false);
      setAiAbortController(null);
    }
  };

  async function callAIAPI(controller: AbortController): Promise<{ success: boolean; data?: any; error?: string }> {
    const apiKey = import.meta.env['VITE_OPENROUTER_API_KEY'];
    const now = new Date();
    const currentDate = now.toISOString().slice(0, 10);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Check cache first
    const cacheKey = `${aiPrompt}_${currentDate}`;
    if (aiCache.current.has(cacheKey)) {
      if (AI_DEBUG) console.log('[AI][CACHE] Using cached result for:', cacheKey);
      return { success: true, data: aiCache.current.get(cacheKey) };
    }

    const modelCandidates = getModelCandidates();

    if (AI_DEBUG) {
      console.log('[AI][DEBUG] Starting API call with models:', modelCandidates);
      console.log('[AI][DEBUG] Prompt length:', aiPrompt.length, 'characters');
      console.log('[AI][DEBUG] Current date:', currentDate, 'Timezone:', tz);
    }

    for (const model of modelCandidates) {
      if (AI_DEBUG) console.log('[AI][try-model]', model);

      const modelStart = performance.now();

      try {
        const requestBody = {
          model,
          messages: [
            {
              role: 'system',
              content: buildSystemPrompt(currentDate, tz)
            },
            {
              role: 'user',
              content: `Texto: "${aiPrompt}"`
            }
          ],
          temperature: 0.0,
          stream: false
        };

        if (AI_DEBUG) {
          console.log('[AI][DEBUG] Request body for', model, ':', JSON.stringify(requestBody, null, 2));
          console.log('[AI][DEBUG] System prompt length:', requestBody.messages[0]?.content?.length || 0, 'characters');
        }

        const fetchStart = performance.now();
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        const fetchEnd = performance.now();
        const fetchDuration = fetchEnd - fetchStart;

        if (aiCancelledRef.current) {
          return { success: false, error: 'Cancelled' };
        }

        if (AI_DEBUG) {
          console.log(`[AI][${model}] Fetch time: ${fetchDuration.toFixed(0)}ms`);
          console.log(`[AI][${model}] Response status: ${response.status} ${response.statusText}`);
        }

        if (response.ok) {
          const parseStart = performance.now();
          const data = await response.json();
          const parseEnd = performance.now();
          const parseDuration = parseEnd - parseStart;

          if (AI_DEBUG) {
            console.log(`[AI][${model}] JSON parse time: ${parseDuration.toFixed(0)}ms`);
            console.log(`[AI][${model}] Raw response:`, JSON.stringify(data, null, 2));

            // Log token usage if available
            if (data.usage) {
              console.log(`[AI][${model}] Token usage:`, {
                prompt_tokens: data.usage.prompt_tokens,
                completion_tokens: data.usage.completion_tokens,
                total_tokens: data.usage.total_tokens
              });
            }

            // Log model info
            console.log(`[AI][${model}] Model used:`, data.model || 'Not specified');

            // Log finish reason
            if (data.choices?.[0]?.finish_reason) {
              console.log(`[AI][${model}] Finish reason:`, data.choices[0].finish_reason);
            }
          }

          const parsed = parseAIResponse(data);
          const parseAIEnd = performance.now();
          const parseAIDuration = parseAIEnd - parseEnd;

          if (AI_DEBUG) {
            console.log(`[AI][${model}] AI parsing time: ${parseAIDuration.toFixed(0)}ms`);
            console.log(`[AI][${model}] Parsed result:`, JSON.stringify(parsed, null, 2));
          }

          if (!parsed) {
            if (AI_DEBUG) console.log(`[AI][${model}] Failed to parse response`);
            continue;
          }

          const modelEnd = performance.now();
          const duration = modelEnd - modelStart;

          if (AI_DEBUG) {
            console.log(`[AI][${model}] Total success time: ${duration.toFixed(0)}ms`);
            console.log(`[AI][${model}] Time breakdown - Fetch: ${fetchDuration.toFixed(0)}ms, Parse: ${parseDuration.toFixed(0)}ms, AI: ${parseAIDuration.toFixed(0)}ms`);

            // Calculate tokens per second if usage data available
            if (data.usage?.total_tokens) {
              const tokensPerSec = (data.usage.total_tokens / (fetchDuration / 1000)).toFixed(1);
              console.log(`[AI][${model}] Performance: ${tokensPerSec} tokens/second`);
            }
          }

          // Cache the successful result
          aiCache.current.set(cacheKey, parsed);
          if (AI_DEBUG) console.log('[AI][CACHE] Cached result for:', cacheKey);

          return { success: true, data: parsed };
        } else {
          // Handle different HTTP error codes with specific debugging
          const errorData = await response.text();

          if (AI_DEBUG) {
            console.error(`[AI][${model}] HTTP ${response.status}:`, response.statusText);
            console.error(`[AI][${model}] Response:`, errorData);

            if (response.status === 404) {
              console.error(`[AI][${model}] Model not found in OpenRouter`);
            } else if (response.status === 401) {
              console.error(`[AI][${model}] Authentication failed - check API key`);
            } else if (response.status === 429) {
              console.error(`[AI][${model}] Rate limit exceeded`);
            } else if (response.status === 403) {
              console.error(`[AI][${model}] Access forbidden - model may not be available`);
            } else if (response.status >= 500) {
              console.error(`[AI][${model}] OpenRouter server error`);
            }
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          if (AI_DEBUG) console.log('[AI] request aborted');
          return { success: false, error: 'Aborted' };
        }

        // Enhanced debugging for different error types
        if (AI_DEBUG) {
          console.error(`[AI][${model}] Network/Request Error:`, err.message);

          if (err.message.includes('fetch')) {
            console.error(`[AI][${model}] Network connectivity issue`);
          } else if (err.message.includes('timeout')) {
            console.error(`[AI][${model}] Request timeout - model may be slow`);
          } else if (err.message.includes('CORS')) {
            console.error(`[AI][${model}] CORS issue - check OpenRouter configuration`);
          } else {
            console.error(`[AI][${model}] Unexpected error:`, err);
          }
        }
      }
    }

    // Enhanced debugging when all models fail
    if (AI_DEBUG) {
      console.error('[AI] All models failed. Summary:');
      console.error('[AI] Models attempted:', modelCandidates.join(', '));
      console.error('[AI] Check the following:');
      console.error('[AI] 1. API Key is valid and active');
      console.error('[AI] 2. Models are available in your OpenRouter plan');
      console.error('[AI] 3. Network connectivity to openrouter.ai');
      console.error('[AI] 4. Rate limits not exceeded');
    }

    return { success: false, error: 'All AI models failed' };
  }

  function getModelCandidates(): string[] {
    const baseModels = [
      'arcee-ai/trinity-large-preview:free', // Primary
      'stepfun/step-3.5-flash:free', // Second option
      'tngtech/deepseek-r1t2-chimera:free', // Third option
      'z-ai/glm-4.5-air:free', // Fourth option
      'deepseek/deepseek-r1-0528:free', // Last resort
    ];

    const envModel = import.meta.env['VITE_OPENROUTER_MODEL'];
    const envList = envModel ? [String(envModel)] : [];

    // Try models in order of preference
    const candidates = [...envList, ...baseModels];

    // Deduplicate
    return candidates.filter((m: string, i: number, arr: string[]) => arr.indexOf(m) === i);
  }

  function buildSystemPrompt(currentDate: string, tz: string): string {
    return `ULTRA_DETERMINISTIC_MODE: JSON_OUTPUT_ONLY. NO_MARKDOWN. NO_QUOTES. NO_EXPLANATIONS. NO_META_CONTENT.

[${currentDate} ${tz}] [{"task":"name","description":"short","date":"YYYY-MM-DD","subject":"Subject","difficulty":"medium"}]

STRICT_RULES:
- INPUT_LANGUAGE → OUTPUT_LANGUAGE
- TODAY=${currentDate}, TOMORROW=${new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
- MAX_50_CHARS_PER_DESCRIPTION
- RESPONSE_MUST_START_WITH_[ AND_END_WITH_]
- ABSOLUTELY_NO_MARKDOWN_FENCES
- ABSOLUTELY_NO_EXTRA_TEXT
- ABSOLUTELY_NO_QUOTES_AROUND_RESPONSE
- ONLY_VALID_JSON_ARRAY

ES:[{"task":"Hacer matemáticas","description":"Ejercicios","date":"2025-11-30","subject":"Matemáticas","difficulty":"medium"}]
EN:[{"task":"Do math","description":"Exercises","date":"2025-11-30","subject":"Math","difficulty":"medium"}]`;
  }

  // Cached regex patterns - compiled once for better performance
  const regexCache = useRef({
    markdownFence: /```(?:json)?\r?\n([\s\S]*?)```/i,
    markdownCleanup: /```(?:json)?|```/gi,
    modelPrefixes: /^(?:<s>\s*\[OUT\]\s*|<s>|\[OUT\]\s*)/,
    smartQuotes: /[\u201C\u201D\u2018\u2019]/g,
    trailingCommas: /,(\s*[}\]])/g
  });

  function parseAIResponse(data: any): any {
    const choice = data?.choices?.[0];
    const msg = choice?.message || {};

    if (AI_DEBUG) {
      console.log('[AI][PARSE] Data keys:', Object.keys(data || {}));
      console.log('[AI][PARSE] Choice exists:', !!choice);
      console.log('[AI][PARSE] Message keys:', Object.keys(msg || {}));
    }

    let content = '';

    // Extract content from various formats
    if (typeof msg.content === 'string' && msg.content.trim()) {
      content = msg.content;
      if (AI_DEBUG) console.log('[AI][PARSE] Content from msg.content');
    } else if (Array.isArray(msg.tool_calls) && msg.tool_calls.length) {
      const arg = msg.tool_calls[0]?.function?.arguments;
      if (typeof arg === 'string' && arg.trim()) {
        content = arg;
        if (AI_DEBUG) console.log('[AI][PARSE] Content from tool_calls');
      }
    } else if (Array.isArray(msg.content)) {
      const firstText = msg.content.find((p: any) => typeof p?.text === 'string' && p.text.trim());
      if (firstText?.text) {
        content = firstText.text;
        if (AI_DEBUG) console.log('[AI][PARSE] Content from array content');
      }
    } else if (typeof choice?.text === 'string') {
      content = choice.text;
      if (AI_DEBUG) console.log('[AI][PARSE] Content from choice.text');
    }

    if (AI_DEBUG) {
      console.log('[AI][PARSE] Extracted content length:', content.length);
      console.log('[AI][PARSE] Raw content:', content);
    }

    if (!content.trim()) {
      if (AI_DEBUG) console.warn('[AI][empty-content]');
      return null;
    }

    const parseStart = performance.now();

    // Fast path: Try parsing directly first (most common case)
    try {
      const trimmed = content.trim();
      if ((trimmed[0] === '[' || trimmed[0] === '{') &&
        (trimmed[trimmed.length - 1] === ']' || trimmed[trimmed.length - 1] === '}')) {
        const result = JSON.parse(trimmed);
        if (AI_DEBUG) {
          console.log('[AI][TIMING] Fast path parse:', (performance.now() - parseStart).toFixed(0), 'ms');
          console.log('[AI][PARSE] Successfully parsed JSON with', Array.isArray(result) ? result.length : 1, 'items');
        }
        return result;
      }
    } catch {
      // Continue to cleanup path
    }

    // Cleanup path: Remove markdown fences
    const fenceMatch = content.match(regexCache.current.markdownFence);
    if (fenceMatch?.[1]) {
      content = fenceMatch[1].trim();
      if (AI_DEBUG) console.log('[AI][PARSE] Content from markdown fence');
    } else if (content.includes('```')) {
      content = content.replace(regexCache.current.markdownCleanup, '').trim();
      if (AI_DEBUG) console.log('[AI][PARSE] Content after markdown cleanup');
    }

    // Remove model prefixes (single pass)
    if (content.startsWith('<s>') || content.startsWith('[OUT]')) {
      const originalContent = content;
      content = content.replace(regexCache.current.modelPrefixes, '').trim();

      if (AI_DEBUG && originalContent !== content) {
        console.log('[AI][PARSE] Content after prefix cleanup');
        console.log('[AI][PARSE] Original length:', originalContent.length, 'Cleaned length:', content.length);
      }
    }

    if (AI_DEBUG) {
      console.log('[AI][PARSE] Final content to parse:', content);
      console.log('[AI][PARSE] Content preview (first 200 chars):', content.substring(0, 200));
    }

    // Try direct parse after cleanup
    try {
      const result = JSON.parse(content);
      if (AI_DEBUG) {
        console.log('[AI][TIMING] Cleanup path parse:', (performance.now() - parseStart).toFixed(0), 'ms');
        console.log('[AI][PARSE] Successfully parsed JSON with', Array.isArray(result) ? result.length : 1, 'items');
      }
      return result;
    } catch (error) {
      if (AI_DEBUG) {
        console.error('[AI][PARSE] JSON parse error:', error);
      }

      // Normalize and try again
      try {
        const normalized = normalizeJSON(content);
        const result = JSON.parse(normalized);
        if (AI_DEBUG) {
          console.log('[AI][TIMING] Normalized parse:', (performance.now() - parseStart).toFixed(0), 'ms');
          console.log('[AI][PARSE] Successfully parsed JSON with', Array.isArray(result) ? result.length : 1, 'items');
        }
        return result;
      } catch {
        // Last resort: extract balanced brackets
        const extracted = fastExtractBalanced(content);

        if (extracted) {
          if (AI_DEBUG) console.log('[AI][PARSE] Trying extracted content');
          try {
            const result = JSON.parse(normalizeJSON(extracted));
            if (AI_DEBUG) {
              console.log('[AI][TIMING] Extract+parse:', (performance.now() - parseStart).toFixed(0), 'ms');
              console.log('[AI][PARSE] Successfully parsed extracted JSON with', Array.isArray(result) ? result.length : 1, 'items');
            }
            return result;
          } catch (extractError) {
            if (AI_DEBUG) console.error('[AI][PARSE] Extracted content parse error:', extractError);
          }
        }
      }
    }

    if (AI_DEBUG) {
      console.log('[AI][TIMING] Total failed parse time:', (performance.now() - parseStart).toFixed(0), 'ms');
    }
    return null;
  }

  function normalizeJSON(text: string): string {
    // Single pass replacement for smart quotes (most common issue)
    const quotesFixed = text.replace(regexCache.current.smartQuotes, (match) =>
      match === '\u201C' || match === '\u201D' ? '"' : "'"
    );

    // Remove trailing commas
    return quotesFixed.replace(regexCache.current.trailingCommas, '$1').trim();
  }

  function fastExtractBalanced(text: string): string {
    // Try array first (most common in our use case)
    let start = text.indexOf('[');
    if (start !== -1) {
      let depth = 0;
      const len = text.length;
      for (let i = start; i < len; i++) {
        const char = text[i];
        if (char === '[') depth++;
        else if (char === ']') {
          depth--;
          if (depth === 0) return text.slice(start, i + 1);
        }
      }
      // Incomplete array, return what we have
      return text.slice(start);
    }

    // Try object
    start = text.indexOf('{');
    if (start !== -1) {
      let depth = 0;
      const len = text.length;
      for (let i = start; i < len; i++) {
        const char = text[i];
        if (char === '{') depth++;
        else if (char === '}') {
          depth--;
          if (depth === 0) return text.slice(start, i + 1);
        }
      }
      // Incomplete object, return what we have
      return text.slice(start);
    }

    return '';
  }

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="AI Task Generator"
      maxWidth="max-w-2xl"
      showCloseButton={true}
    >
      <div className="space-y-4">
        {/* Tab Selector */}
        <div className="w-full flex justify-center items-center select-none mb-4 sm:mb-4 px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className="cursor-pointer font-semibold transition-colors duration-150 text-sm sm:text-base text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"
              onClick={onSwitchToManual}
            >
              Manual
            </span>
            <span className="text-[var(--border-primary)] font-bold text-sm sm:text-base mx-1">|</span>
            <span className="cursor-pointer font-semibold transition-colors duration-150 text-sm sm:text-base text-[var(--accent-primary)]">
              Auto (AI)
            </span>
          </div>
        </div>

        <form className="flex flex-col h-full items-stretch justify-start space-y-3 sm:space-y-4" onSubmit={handleAISubmit}>
          <div className="w-full">
            <textarea
              id="aiPrompt"
              ref={aiTextareaRef}
              value={aiPrompt}
              onChange={e => {
                setAiPrompt(e.target.value);
                localStorage.setItem('aiPromptDraft', e.target.value);
              }}
              className="w-full min-h-[150px] sm:min-h-[120px] px-3 py-2 text-sm sm:text-base bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              placeholder="Example: Create tasks for: finish math worksheet by tomorrow (medium), study biology chapter 4 next Wednesday (hard), and write a short English essay this weekend (easy)."
              disabled={aiLoading}
            />
          </div>

          {aiError && <div className="text-red-500 text-xs sm:text-sm text-center">{aiError}</div>}

          <div className="w-full">
            <button
              type="submit"
              onClick={aiLoading ? handleCancelAI : handleAISubmit}
              disabled={false}
              title={aiLoading ? "Click to cancel" : "Send"}
              className={`w-full px-4 py-2 border-2 rounded-lg font-medium transition-colors duration-200 text-base sm:text-lg shadow-none ${aiLoading
                  ? 'border-red-500 bg-transparent text-red-500 hover:text-red-600 focus:text-red-600'
                  : 'border-[var(--accent-primary)] bg-transparent text-[var(--accent-primary)] hover:bg-transparent hover:text-[var(--accent-primary)] focus:bg-transparent focus:text-[var(--accent-primary)] disabled:opacity-70'
                }`}
            >
              {aiLoading ? 'Cancel' : 'Send'}
            </button>
          </div>
        </form>
      </div>

      <AIPreviewModal
        isOpen={showAIPreview}
        tasks={aiParsedTasks || []}
        onAcceptAll={handleAIAcceptAll}
        onCancel={() => setShowAIPreview(false)}
      />
    </BaseModal>
  );
};

export default AITaskForm;