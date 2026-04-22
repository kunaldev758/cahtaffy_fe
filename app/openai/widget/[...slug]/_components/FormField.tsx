import { AlertCircle } from "lucide-react";

// Field validation helpers
export const validateField = (field: any, value: any) => {
  const errors = [];

  if (field.required && (!value || value.trim() === '')) {
    errors.push(`${field.value} is required`);
    return errors;
  }

  if (value && value.trim() !== '') {
    switch (field.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${field.value} must be a valid email address`);
        }
        break;

      case 'tel':
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
          errors.push(`${field.value} must be a valid phone number`);
        }
        break;

      case 'number':
        if (isNaN(value)) {
          errors.push(`${field.value} must be a number`);
        }
        break;

      case 'url':
        try {
          new URL(value);
        } catch {
          errors.push(`${field.value} must be a valid URL`);
        }
        break;
    }

    if (field.validation?.minLength && value.length < field.validation.minLength) {
      errors.push(`${field.value} must be at least ${field.validation.minLength} characters`);
    }

    if (field.validation?.maxLength && value.length > field.validation.maxLength) {
      errors.push(`${field.value} must not exceed ${field.validation.maxLength} characters`);
    }

    if (field.validation?.pattern) {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        errors.push(`${field.value} format is invalid`);
      }
    }
  }

  return errors;
};

// Form validation component
export const FormField = ({ field, value, onChange, error }: { field: any; value: any; onChange: any; error: any }) => {
  const baseClasses = "w-full h-[40px] text-[13px] font-normal text-[#111827] px-[16px] py-[12px] border border-[#E2E8F0] rounded-[8px] focus:ring-0 focus:outline-none focus:border-transparent transition-colors placeholder:text-[#94A3B8]";
  const errorClasses = error ? "border-red-500 bg-red-50" : "border-gray-300 bg-white";

  const handleChange = (e: any) => {
    let newValue = e.target.value;

    if (field.type === 'tel') {
      newValue = newValue.replace(/[^\d\+\-\(\)\s]/g, '');
    }

    onChange(newValue);
  };

  if (field.type === 'textarea') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field.value}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={field.placeholder}
          required={field.required}
          rows={3}
          className={`${baseClasses} ${errorClasses} resize-none`}
        />
        {error && (
          <p className="text-red-500 text-xs mt-1 flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-[12px] font-medium text-[#64748B] mb-2 capitalize">
        {field.value}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={field.type}
        value={value}
        onChange={handleChange}
        placeholder={field.placeholder}
        required={field.required}
        min={field.type === 'number' ? field.validation?.minLength || 0 : undefined}
        max={field.type === 'number' ? field.validation?.maxLength || undefined : undefined}
        minLength={field.type !== 'number' ? field.validation?.minLength || undefined : undefined}
        maxLength={field.type !== 'number' ? field.validation?.maxLength || undefined : undefined}
        pattern={field.validation?.pattern || undefined}
        className={`${baseClasses} ${errorClasses}`}
      />
      {error && (
        <p className="text-red-500 text-xs mt-1 flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};