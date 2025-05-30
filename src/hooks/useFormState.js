import { useState, useEffect } from 'react';

export const useFormState = (initialState = {}, initialValidation = {}) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [validationRules, setValidationRules] = useState(initialValidation);

  useEffect(() => {
    // Reset form when initial state changes
    setFormData(initialState);
    setErrors({});
    setIsDirty(false);
  }, [initialState]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
    validateField(field, value);
  };

  const validateField = (field, value) => {
    if (!validationRules[field]) return;

    const rules = validationRules[field];
    const fieldErrors = [];

    if (rules.required && (!value || value.trim() === '')) {
      fieldErrors.push('This field is required');
    }

    if (rules.minLength && value.length < rules.minLength) {
      fieldErrors.push(`Minimum length is ${rules.minLength} characters`);
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      fieldErrors.push(`Maximum length is ${rules.maxLength} characters`);
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      fieldErrors.push(rules.message || 'Invalid format');
    }

    setErrors(prev => ({
      ...prev,
      [field]: fieldErrors.length > 0 ? fieldErrors[0] : null
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(field => {
      validateField(field, formData[field]);
      if (errors[field]) {
        newErrors[field] = errors[field];
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

  const hasErrors = () => {
    return Object.values(errors).some(error => error !== null);
  };

  return {
    formData,
    errors,
    isDirty,
    handleChange,
    validateForm,
    resetForm,
    hasErrors,
    setFormData,
    setValidationRules
  };
}; 