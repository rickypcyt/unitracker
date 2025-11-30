import React from 'react';

interface FormInputProps {
  id: string;
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'email' | 'password' | 'date';
  error?: string;
  className?: string;
  required?: boolean;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
}

export const FormInput: React.FC<FormInputProps> = ({
  id,
  label,
  value,
  onChange,
  type = 'text',
  error,
  className = '',
  required = false,
  placeholder = '',
  min,
  max,
  ...props
}) => (
  <div className="flex flex-col h-full">
    <div className="flex-1 flex flex-col">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--text-primary)] mb-2 min-h-[20px]">
          {label} {required && (!value || String(value).trim() === '') && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex-1 flex flex-col">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 bg-[var(--bg-primary)] border-2 ${
            error ? 'border-red-500' : 'border-[var(--border-primary)]'
          } rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] ${className}`}
          placeholder={placeholder}
          min={min}
          max={max}
          {...props}
        />
      </div>
    </div>
    {error && <p className="mt-1 text-base text-red-500">{error}</p>}
  </div>
);

interface FormTextareaProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  id,
  label,
  value,
  onChange,
  error,
  className = '',
  required = false,
  placeholder = '',
  rows = 3,
  ...props
}) => (
  <div className="mb-4">
    {label && (
      <label htmlFor={id} className="block text-base font-medium text-[var(--text-primary)] mb-2">
        {label} {required && (!value || value.trim() === '') && <span className="text-red-500">*</span>}
      </label>
    )}
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 bg-[var(--bg-primary)] border-2 ${
        error ? 'border-red-500' : 'border-[var(--border-primary)]'
      } rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] ${className}`}
      placeholder={placeholder}
      rows={rows}
      {...props}
    />
    {error && <p className="mt-1 text-base text-red-500">{error}</p>}
  </div>
);

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  className?: string;
  required?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  error,
  className = '',
  required = false,
  ...props
}) => (
  <div className="mb-4">
    {label && (
      <label htmlFor={id} className="block text-base font-medium text-[var(--text-primary)] mb-2">
        {label} {required && (!value || value.trim() === '') && <span className="text-red-500">*</span>}
      </label>
    )}
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 bg-[var(--bg-primary)] border-2 ${
        error ? 'border-red-500' : 'border-[var(--border-primary)]'
      } rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] ${className}`}
      {...props}
    >
      {options.map((option: SelectOption) => (
        <option key={option.value} value={option.value} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-base text-red-500">{error}</p>}
  </div>
);

type ButtonType = 'button' | 'submit' | 'reset';
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'custom';

interface FormButtonProps {
  type?: ButtonType;
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const FormButton: React.FC<FormButtonProps> = ({
  type = 'button',
  variant = 'primary',
  children,
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = 'px-4 py-2 border-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2';
  const variantClasses = {
    primary: 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/80',
    secondary: 'bg-transparent text-[var(--text-secondary)] border border-[var(--text-secondary)] hover:bg-transparent hover:text-[var(--text-primary)]',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    custom: '',
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant as ButtonVariant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({ children, className = '' }) => (
  <div className={`flex flex-row justify-center gap-2 mb-4 ${className}`}>
    {children}
  </div>
); 