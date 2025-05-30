import { useState, useEffect, useRef } from 'react';

// Helper function to do deep comparison of objects
const isEqual = (obj1, obj2) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

export const useFormState = (initialState = {}, initialValidation = {}) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const prevInitialStateRef = useRef(initialState);

  // Reset form when initial state changes, but only if the actual values are different
  useEffect(() => {
    if (!isEqual(prevInitialStateRef.current, initialState)) {
      setFormData(initialState);
      setErrors({});
      setIsDirty(false);
      prevInitialStateRef.current = initialState;
    }
  }, [initialState]);

  const handleChange = (field, value) => {
    // Update form data
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Mark form as dirty
    if (!isDirty) {
      setIsDirty(true);
    }

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateField = (field, value) => {
    const rules = initialValidation[field];
    if (!rules) return null;

    if (rules.required && (!value || value.trim() === '')) {
      return 'This field is required';
    }

    if (rules.minLength && value.length < rules.minLength) {
      return `Minimum length is ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `Maximum length is ${rules.maxLength} characters`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message || 'Invalid format';
    }

    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Validate all fields
    Object.keys(initialValidation).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const resetForm = () => {
    setFormData(initialState);
    setErrors({});
    setIsDirty(false);
  };

  return {
    formData,
    errors,
    isDirty,
    handleChange,
    validateForm,
    resetForm,
    setFormData
  };
}; 