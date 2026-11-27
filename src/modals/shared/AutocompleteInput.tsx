import { useEffect, useRef, useState } from 'react';

import React from 'react';

interface AutocompleteInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  id,
  value,
  onChange,
  suggestions = [],
  placeholder = '',
  error,
  required = false,
  className = '',
  inputClassName = '',
  ...props
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]); // Explicitly type as string[]
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (showSuggestions && filtered.length > 0 && activeIndex >= 0) {
      const el = document.getElementById(`${id}-suggestion-${activeIndex}`);
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, showSuggestions, filtered, id]);

  useEffect(() => {
    if (!showSuggestions) setActiveIndex(-1);
  }, [showSuggestions]);

  const resizeToContent = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (inputRef.current) resizeToContent(inputRef.current);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    resizeToContent(e.target);
    onChange(val);
    if (val) {
      const filtered = suggestions.filter(s =>
        s.toLowerCase().includes(val.toLowerCase())
      );
      setFiltered(filtered);
      setShowSuggestions(true);
    } else {
      setFiltered([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (!showSuggestions || filtered.length === 0)) {
      // Prevent newline insertion; let the form's onKeyDown handle submit
      e.preventDefault();
      return;
    }
    if (!showSuggestions || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setActiveIndex((prev) => (prev + 1) % filtered.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      setActiveIndex((prev) => {
        const nextIndex = prev < 0 ? 0 : prev + (e.shiftKey ? -1 : 1);
        return (nextIndex + filtered.length) % filtered.length;
      });
      return;
    }

    if (e.key === 'Enter') {
      const indexToUse = activeIndex >= 0 ? activeIndex : 0;
      if (filtered[indexToUse]) {
        e.preventDefault();
        e.stopPropagation();
        onChange(filtered[indexToUse]);
        setShowSuggestions(false);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.stopPropagation();
      setShowSuggestions(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <textarea
        id={id}
        ref={inputRef}
        rows={1}
        value={value}
        onChange={handleInputChange}
        onFocus={() => value && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-3 py-2 bg-(--bg-primary) border-2 ${
          error ? 'border-red-500' : 'border-(--border-primary)'
        } rounded-lg text-(--text-primary) placeholder-(--text-secondary) focus:outline-none focus:border-(--accent-primary) transition-all resize-none overflow-hidden leading-6 ${inputClassName}`}
        autoComplete="off"
        {...props}
      />
      {showSuggestions && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-9999 mt-1 w-full bg-(--bg-primary) border-2 border-(--border-primary) rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {filtered.map((suggestion, idx) => (
            <li
              id={`${id}-suggestion-${idx}`}
              key={suggestion}
              className={`px-4 py-2 cursor-pointer select-none ${
                idx === activeIndex
                  ? 'text-(--accent-primary) border-l-2 border-(--accent-primary)'
                  : 'text-(--text-primary) hover:bg-(--bg-secondary)'
              }`}
              onMouseDown={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-base text-red-500">{error}</p>}
    </div>
  );
};

export default AutocompleteInput; 