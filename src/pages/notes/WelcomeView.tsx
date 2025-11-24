import { Calendar, Plus } from 'lucide-react';
import React, { useRef, useState } from 'react';

import DatePicker from 'react-datepicker';
import ReactMarkdown from 'react-markdown';

interface WelcomeViewProps {
  onCreateNote: () => void;
}

const WelcomeView: React.FC<WelcomeViewProps> = ({ onCreateNote }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('Welcome to Notes');
  const [tempDate, setTempDate] = useState(new Date().toISOString().split('T')[0] || '');
  const datePickerRef = useRef<any>(null);
  
  const originalTitle = 'Welcome to Notes';
  const description = `Select a note from the sidebar to start viewing and editing your content. Here you can organize your thoughts, create markdown documents, and keep track of your assignments.

## Features

📝 Create and edit notes with rich markdown support

📚 Organize notes by assignments

✨ Format text with bold, italic, lists, and more

🔍 Quick search and filtering capabilities`;

  const handleTitleEdit = () => {
    setIsEditingTitle(true);
  };

  const handleTitleCancel = () => {
    setTempTitle(originalTitle);
    setIsEditingTitle(false);
  };

  const handleDateSave = async (newDate: Date | null) => {
    if (!newDate) return;
    
    try {
      const dateString = newDate.toISOString().split('T')[0] || '';
      setTempDate(dateString);
      // Don't save automatically, just update temp state
    } catch (error) {
      console.error('Error updating date:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-[var(--border-primary)] p-3 sm:p-6">
        <div className="flex justify-center mb-3 sm:mb-4">
          {/* No navigation buttons for welcome view */}
        </div>

        <div className="mb-2 sm:mb-3 text-center">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTitleCancel();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleTitleCancel();
                }
              }}
              onBlur={handleTitleCancel}
              className="w-full px-0 py-0 bg-transparent border-0 border-b-2 border-[var(--accent-primary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] text-2xl sm:text-3xl font-bold transition-colors text-center"
              placeholder="Note Title"
              autoFocus
            />
          ) : (
            <h1 
              className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] break-words cursor-text hover:bg-[var(--bg-secondary)] rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors inline-block"
              onClick={handleTitleEdit}
              title="Click to edit title"
            >
              {tempTitle}
            </h1>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-2 sm:gap-4 text-[var(--text-secondary]">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <DatePicker
              ref={datePickerRef}
              selected={tempDate ? new Date(tempDate) : new Date()}
              onChange={handleDateSave}
              dateFormat="dd/MM/yyyy"
              placeholderText="DD/MM/YYYY"
              popperPlacement="bottom-start"
              calendarClassName="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg shadow-lg text-[var(--text-primary)]"
              dayClassName={(date) =>
                (date.getDay() === 0 || date.getDay() === 6) ? 'text-red-500' : ''
              }
              showPopperArrow={false}
              customInput={
                <div 
                  className="flex items-center gap-1 sm:gap-2 cursor-text hover:bg-[var(--bg-secondary)] rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                  title="Click to edit date"
                >
                  <Calendar size={12} className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{tempDate ? new Date(tempDate).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  }) : new Date().toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</span>
                </div>
              }
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        <div className="max-w-none sm:max-w-4xl mx-auto">
          <div className="prose prose-sm sm:prose-lg max-w-none dark:prose-invert text-center">
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
          
          <div className="mt-8 text-center">
            <button
              onClick={onCreateNote}
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] rounded-lg hover:bg-[var(--accent-primary)]/10 transition-colors text-sm sm:text-base"
            >
              Create New Note
              <Plus size={16} className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeView;
