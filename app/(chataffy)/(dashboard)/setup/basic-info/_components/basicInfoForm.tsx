'use client';

import { useEffect, useState } from "react";
import { getBasicInfoApi, setBasicInfoApi } from "@/app/_api/dashboard/action";
import { toast } from 'react-toastify';

export default function BasicInfoForm(Props:any) {
  const [basicInfo, setBasicInfo] = useState({
    website: '',
    organisation: '',
    fallbackMessage: '',
    email: '',
    phone: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalInfo, setOriginalInfo] = useState(basicInfo);

  const fetchBasicInfo = async () => {
    setIsLoading(true);
    try {
      const response = await getBasicInfoApi(basicInfo);
      if (response && response.status_code === 200) {
        setBasicInfo(response.data);
        setOriginalInfo(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch basic information");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBasicInfo();
  }, []);

  // Validation functions
  const validateField = (name:any, value:any) => {
    switch (name) {
      case 'website':
        if (!value.trim()) return 'Website is required';
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        if (!urlPattern.test(value)) return 'Please enter a valid website URL';
        return '';
        
      case 'organisation':
        if (!value.trim()) return 'Organisation name is required';
        if (value.trim().length < 2) return 'Organisation name must be at least 2 characters';
        return '';
        
      case 'fallbackMessage':
        if (!value.trim()) return 'Fallback message is required';
        if (value.trim().length < 10) return 'Fallback message must be at least 10 characters';
        if (value.trim().length > 500) return 'Fallback message must be less than 500 characters';
        return '';
        
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) return 'Please enter a valid email address';
        return '';
        
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phonePattern.test(value.replace(/[\s\-\(\)]/g, ''))) {
          return 'Please enter a valid phone number';
        }
        return '';
        
      default:
        return '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(basicInfo).forEach(key => {
      const error = validateField(key as any, basicInfo[key as keyof typeof basicInfo]);
      if (error) (newErrors as any)[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await setBasicInfoApi(basicInfo);
      if (!response || response.status_code != 200) {
        throw new Error('Failed to update data');
      }
      toast.success(response.message);
      setErrors({});
      setOriginalInfo(basicInfo);
    } catch (error) {
      toast.error("Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input change with real-time validation
  const handleChange = (e:any) => {
    const { name, value } = e.target;
    setBasicInfo({
      ...basicInfo,
      [name]: value,
    });

    // Clear error for this field and validate
    if ((errors as any)[name]) {
      const error = validateField(name, value);
      setErrors({
        ...errors,
        [name]: error
      });
    }
  };

  // Handle blur for validation
  const handleBlur = (e:any) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors({
      ...errors,
      [name]: error
    });
  };

  // Check if form has changed
  const isChanged = JSON.stringify(basicInfo) !== JSON.stringify(originalInfo);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <h1 className="text-2xl font-bold text-white">Basic Information</h1>
          <p className="text-blue-100 mt-2">Configure your chatbot's basic settings and contact information</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Website */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Website Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="website"
                  placeholder="https://yourwebsite.com"
                  value={basicInfo.website}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                    (errors as any).website 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
                  }`}
                />
                {(errors as any).website  && (
                  <p className="text-red-500 text-sm flex items-center mt-1">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {(errors as any).website }
                  </p>
                )}
              </div>

              {/* Organisation */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Organisation Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="organisation"
                  placeholder="Your company name"
                  value={basicInfo.organisation}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                    (errors as any).organisation 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
                  }`}
                />
                {(errors as any).organisation && (
                  <p className="text-red-500 text-sm flex items-center mt-1">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {(errors as any).organisation }
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="contact@yourcompany.com"
                  value={basicInfo.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                    (errors as any).email 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
                  }`}
                />
                {(errors as any).email && (
                  <p className="text-red-500 text-sm flex items-center mt-1">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {(errors as any).email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1 (555) 123-4567"
                  value={basicInfo.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                    (errors as any).phone 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
                  }`}
                />
                {(errors as any).phone && (
                  <p className="text-red-500 text-sm flex items-center mt-1">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {(errors as any).phone}
                  </p>
                )}
              </div>
            </div>

            {/* Fallback Message - Full Width */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Fallback Message <span className="text-red-500">*</span>
              </label>
              <textarea
                name="fallbackMessage"
                placeholder="This message will be shown when the AI cannot understand or respond to a query..."
                value={basicInfo.fallbackMessage}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-vertical ${
                  (errors as any).fallbackMessage  
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-300 hover:border-gray-400 focus:border-blue-500'
                }`}
              />
              <div className="flex justify-between items-center">
                {(errors as any).fallbackMessage  ? (
                  <p className="text-red-500 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {(errors as any).fallbackMessage }
                  </p>
                ) : (
                  <div></div>
                )}
                <span className="text-sm text-gray-500">
                  {basicInfo?.fallbackMessage?.length}/500
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !isChanged}
                className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 flex items-center space-x-2 ${
                  isSubmitting || !isChanged
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md hover:shadow-lg'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Information
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}