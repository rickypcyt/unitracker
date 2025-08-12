
export const FormInput = ({
  id,
  label,
  value,
  onChange,
  type = 'text',
  error,
  className = '',
  required = false,
  placeholder = '',
  ...props
}) => (
  <div className="mb-1">
    {label && (
      <label htmlFor={id} className="block text-base font-medium text-[var(--text-primary)] mb-2">
        {label} {required && (!value || value.trim() === '') && <span className="text-red-500">*</span>}
      </label>
    )}
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 bg-[var(--bg-primary)] border-2 ${
        error ? 'border-red-500' : 'border-[var(--border-primary)]'
      } rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] ${className}`}
      placeholder={placeholder}
      {...props}
    />
    {error && <p className="mt-1 text-base text-red-500">{error}</p>}
  </div>
);

export const FormTextarea = ({
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

export const FormSelect = ({
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
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-base text-red-500">{error}</p>}
  </div>
);

export const FormButton = ({
  type = 'button',
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2';
  const variantClasses = {
    primary: 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/80',
    secondary: 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/80 border border-[var(--border-primary)]',
    danger: 'bg-red-500 text-white hover:bg-red-600'
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const FormActions = ({ children, className = '' }) => (
  <div className={`flex justify-end gap-2 ${className}`}>
    {children}
  </div>
); 