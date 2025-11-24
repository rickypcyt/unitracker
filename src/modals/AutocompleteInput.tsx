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
  ...props
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]); // Explicitly type as string[]
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (activeIndex >= 0 && filtered[activeIndex]) {
        e.preventDefault();
        onChange(filtered[activeIndex]);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => value && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 bg-[var(--bg-primary)] border-2 ${
          error ? 'border-red-500' : 'border-[var(--border-primary)]'
        } rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]`}
        autoComplete="off"
        {...props}
      />
      {showSuggestions && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-[9999] mt-1 w-full bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {filtered.map((suggestion, idx) => (
            <li
              id={`${id}-suggestion-${idx}`}
              key={suggestion}
              className={`px-4 py-2 cursor-pointer select-none ${
                idx === activeIndex
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
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