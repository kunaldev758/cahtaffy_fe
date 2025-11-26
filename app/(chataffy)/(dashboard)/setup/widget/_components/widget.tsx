'use client'

import React, { useEffect, useState, useReducer } from 'react'
import { 
  Upload, 
  Settings, 
  MapPin, 
  MessageSquare, 
  Sliders, 
  Save,
  Plus,
  X,
  Eye,
  AlertCircle,
  CheckCircle,
  Trash2,
  Edit3,
  Code
} from 'lucide-react'
import { updateThemeSettings,getThemeSettings,uploadLogo } from '@/app/_api/dashboard/action';
import EmbeddingCode from './embeddingCode';

// Enhanced field types for pre-chat form
const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'tel', label: 'Phone', icon: '📞' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'url', label: 'URL', icon: '🔗' },
  { value: 'textarea', label: 'Long Text', icon: '📄' }
];

// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['jpg', 'jpeg', 'png'];


// Initial state with enhanced structure
const initialState = {
  logo: '/images/widget/human-avatar.png',
  titleBar: "Support Chat",
  welcomeMessage: "👋 Hi there! How can I help?",
  showLogo: true,
  showWhiteLabel: false,
  isPreChatFormEnabled: true,
  fields: [
    { 
      id: 1, 
      name: 'Name', 
      value: 'Name', 
      type: 'text', 
      placeholder: 'Enter your name', 
      required: true,
      validation: { minLength: 2, maxLength: 50 }
    },
    { 
      id: 2, 
      name: 'Email', 
      value: 'Email', 
      type: 'email', 
      placeholder: 'Enter your email', 
      required: true,
      validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }
    },
  ],
  colorFields: [
    { id: 1, name: 'title_bar', value: '#000000' },
    { id: 2, name: 'title_bar_text', value: '#FFFFFF' },
    { id: 3, name: 'visitor_bubble', value: '#000000' },
    { id: 4, name: 'visitor_bubble_text', value: '#FFFFFF' },
    { id: 5, name: 'ai_bubble', value: '#000000' },
    { id: 6, name: 'ai_bubble_text', value: '#FFFFFF' },
  ],
  position: {
    align: 'right',
    sideSpacing: 20,
    bottomSpacing: 20
  }
};

// Enhanced action types
const actionTypes = {
  SET_THEME_DATA: 'SET_THEME_DATA',
  SET_LOGO: 'SET_LOGO',
  SET_TITLE_BAR: 'SET_TITLE_BAR',
  SET_WELCOME_MESSAGE: 'SET_WELCOME_MESSAGE',
  TOGGLE_PRE_CHAT_FORM: 'TOGGLE_PRE_CHAT_FORM',
  TOGGLE_SHOW_LOGO: 'TOGGLE_SHOW_LOGO',
  TOGGLE_WHITE_LABEL: 'TOGGLE_WHITE_LABEL',
  UPDATE_COLOR: 'UPDATE_COLOR',
  UPDATE_POSITION: 'UPDATE_POSITION',
  ADD_FIELD: 'ADD_FIELD',
  UPDATE_FIELD: 'UPDATE_FIELD',
  REMOVE_FIELD: 'REMOVE_FIELD',
  TOGGLE_FIELD_REQUIRED: 'TOGGLE_FIELD_REQUIRED'
};

// Enhanced reducer
const reducer = (state:any, action:any) => {
  switch (action.type) {
    case actionTypes.SET_THEME_DATA:
      return { 
        ...state, 
        ...action.payload,
        fields: action.payload.fields?.length ? action.payload.fields : state.fields,
        colorFields: action.payload.colorFields?.length ? action.payload.colorFields : state.colorFields,
        position: action.payload.position || state.position
      };
      
    case actionTypes.SET_LOGO:
      return { ...state, logo: action.payload };
      
    case actionTypes.SET_TITLE_BAR:
      return { ...state, titleBar: action.payload };
      
    case actionTypes.SET_WELCOME_MESSAGE:
      return { ...state, welcomeMessage: action.payload };
      
    case actionTypes.TOGGLE_PRE_CHAT_FORM:
      return { ...state, isPreChatFormEnabled: !state.isPreChatFormEnabled };
      
    case actionTypes.TOGGLE_SHOW_LOGO:
      return { ...state, showLogo: !state.showLogo };
      
    case actionTypes.TOGGLE_WHITE_LABEL:
      return { ...state, showWhiteLabel: !state.showWhiteLabel };
      
    case actionTypes.UPDATE_COLOR:
      return {
        ...state,
        colorFields: state.colorFields.map((field: any) =>
          field.id === action.payload.id
            ? { ...field, value: action.payload.value }
            : field
        )
      };
      
    case actionTypes.UPDATE_POSITION:
      return {
        ...state,
        position: { ...state.position, ...action.payload }
      };
      
    case actionTypes.ADD_FIELD:
      return {
        ...state,
        fields: [...state.fields, action.payload]
      };
      
    case actionTypes.UPDATE_FIELD:
      return {
        ...state,
        fields: state.fields.map((field: any) =>
          field.id === action.payload.id
            ? { ...field, ...action.payload.updates }
            : field
        )
      };
      
    case actionTypes.REMOVE_FIELD:
      return {
        ...state,
        fields: state.fields.filter((field: any) => field.id !== action.payload.id)
      };
      
    case actionTypes.TOGGLE_FIELD_REQUIRED:
      return {
        ...state,
        fields: state.fields.map((field: any) =>
          field.id === action.payload.id
            ? { ...field, required: !field.required }
            : field
        )
      };
      
    default:
      return state;
  }
};

// Field creation modal component
const FieldCreationModal = ({ isOpen, onClose, onSave }: { isOpen: any, onClose: any, onSave: any }) => {
  const [fieldData, setFieldData] = useState({
    name: '',
    value: '',
    type: 'text',
    placeholder: '',
    required: false,
    validation: { minLength: 0, maxLength: 255, pattern: '' }
  });

  const [errors, setErrors] = useState({});

  const validateField = () => {
    const newErrors = {};
    
    if (!(fieldData as any).name.trim()) {
      (newErrors as any).name = 'Field name is required';
    }
    
    if (!(fieldData as any).value.trim()) {
      (newErrors as any).value = 'Field label is required';
    }
    
    if (!(fieldData as any).placeholder.trim()) {
      (newErrors as any).placeholder = 'Placeholder is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateField()) {
      onSave({
        ...fieldData,
        id: Date.now(),
        validation: {
          minLength: parseInt(fieldData.validation.minLength as any) || 0,
          maxLength: parseInt(fieldData.validation.maxLength as any) || 255,
          pattern: fieldData.validation.pattern
        }
      });
      setFieldData({
        name: '',
        value: '',
        type: 'text',
        placeholder: '',
        required: false,
        validation: { minLength: 0, maxLength: 255, pattern: '' }
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Add New Field</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Field Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Name *
            </label>
            <input
              type="text"
              value={fieldData.name}
              onChange={(e) => setFieldData({ ...fieldData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                (errors as any).name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Name, Company"
            />
            {(errors as any).name && <p className="text-red-500 text-xs mt-1">{(errors as any).name}</p>}
          </div>

          {/* Field Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Label *
            </label>
            <input
              type="text"
              value={fieldData.value}
              onChange={(e) => setFieldData({ ...fieldData, value: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                (errors as any).value ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Label shown to users"
            />
            {(errors as any).value && <p className="text-red-500 text-xs mt-1">{(errors as any).value}</p>}
          </div>

          {/* Field Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Type *
            </label>
            <select
              value={fieldData.type}
              onChange={(e) => setFieldData({ ...fieldData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {FIELD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Placeholder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder *
            </label>
            <input
              type="text"
              value={fieldData.placeholder}
              onChange={(e) => setFieldData({ ...fieldData, placeholder: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                (errors as any).placeholder ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Placeholder text"
            />
            {(errors as any).placeholder && <p className="text-red-500 text-xs mt-1">{(errors as any).placeholder}</p>}
          </div>

          {/* Validation Settings */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Validation (Optional)</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Length</label>
                <input
                  type="number"
                  value={fieldData.validation.minLength}
                  onChange={(e) => setFieldData({
                    ...fieldData,
                    validation: { ...fieldData.validation, minLength: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Length</label>
                <input
                  type="number"
                  value={fieldData.validation.maxLength}
                  onChange={(e) => setFieldData({
                    ...fieldData,
                    validation: { ...fieldData.validation, maxLength: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Required Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Required Field</span>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={fieldData.required}
                onChange={(e) => setFieldData({ ...fieldData, required: e.target.checked })}
                className="sr-only"
              />
              <div className={`relative w-11 h-6 rounded-full transition-colors ${
                fieldData.required ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                  fieldData.required ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </div>
            </label>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Field
          </button>
        </div>
      </div>
    </div>
  );
};

// File validation helper
const validateFile = (file:any) => {
  const errors = [];
  
  if (!file) {
    errors.push('No file selected');
    return { isValid: false, errors };
  }
  
  // Check file type
  const fileExtension = file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
    errors.push(`File type .${fileExtension} is not allowed. Only ${ALLOWED_FILE_TYPES.join(', ')} are allowed.`);
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    errors.push(`File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const uploadLogoFunc = async (formData:any,userId:any) => {
  if (!userId) {
    throw new Error('User ID is required for logo upload');
  }
  await uploadLogo(formData, userId);
  return new Promise(resolve => setTimeout(resolve, 1000));
};


// Main component
export default function EnhancedWidgetSettings() {
  const [userId, setUserId] = useState<string | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [selectedLogo, setSelectedLogo] = useState('/images/widget/human-avatar.png');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [fileValidationErrors, setFileValidationErrors] = useState([]);
  const [originalSettings, setOriginalSettings] = useState(state);

  useEffect(() => {
    // Ensure this code runs only on the client side
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('userId');
      setUserId(storedUserId);
    } 
  }, []);

 
  // Handle logo file selection and validation
  const handleLogoChange = async (e:any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file before upload
    const validation = validateFile(file);
    console.log(validation,"Validation log")
    if (!validation.isValid) {
      setFileValidationErrors(validation.errors as any);
      return;
    }
    
    // Clear any previous errors
    setFileValidationErrors([]);
    
    const formData = new FormData();
    formData.append("logo", file);
    
    try {
      setIsLoading(true);
      await uploadLogoFunc(formData,userId);
      const previewUrl = URL.createObjectURL(file);
      setSelectedLogo(previewUrl);
      dispatch({ type: actionTypes.SET_LOGO, payload: previewUrl });
    } catch (error) {
      setError("Failed to upload logo. Please try again." as any);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form field addition
  const handleAddField = (fieldData:any) => {
    dispatch({ type: actionTypes.ADD_FIELD, payload: fieldData });
  };

  // Handle form field updates
  const handleUpdateField = (fieldId:any, updates:any) => {
    dispatch({ 
      type: actionTypes.UPDATE_FIELD, 
      payload: { id: fieldId, updates } 
    });
  };

  // Handle saving all settings
  const handleSaveSettings = async () => {
    const themeSettings = {
      logo: state.logo,
      titleBar: state.titleBar,
      welcomeMessage: state.welcomeMessage,
      showLogo: state.showLogo,
      showWhiteLabel: state.showWhiteLabel,
      isPreChatFormEnabled: state.isPreChatFormEnabled,
      fields: state.fields,
      colorFields: state.colorFields,
      position: state.position,
    };
  
    try {
      setIsLoading(true);
      await updateThemeSettings({ themeSettings });
      setOriginalSettings(state); // Update originalSettings after successful save
      // Show success message
    } catch (error) {
      setError('Failed to save widget settings. Please try again.' as any);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    async function fetchData() {
      if (userId) {
        const data = await getThemeSettings(userId);
        if (data) {
          dispatch({ type: actionTypes.SET_THEME_DATA, payload: data.data });
          setOriginalSettings({ ...state, ...data.data });
        }
        if (data?.data?.logo) {
          setSelectedLogo(`${process.env.NEXT_PUBLIC_FILE_HOST}${data.data?.logo}`);
        }
      }
      //  setThemeData(data);
    }
    fetchData()
  }, [userId])

  // Color field labels
  const colorFieldLabels = {
    'title_bar': 'Title Bar Background',
    'title_bar_text': 'Title Bar Text',
    'visitor_bubble': 'Your Message Background',
    'visitor_bubble_text': 'Your Message Text',
    'ai_bubble': 'AI Message Background',
    'ai_bubble_text': 'AI Message Text'
  };

  // Check if settings have changed
  const isChanged = JSON.stringify(state) !== JSON.stringify(originalSettings);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Widget Settings</h1>
          <p className="text-gray-600 mt-2">Customize your chat widget appearance and behavior</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <div className="space-y-6">

            
            {/* Embed Code Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Code className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Embed Code</h3>
                </div>
              </div>
              <div className="p-6">
                <EmbeddingCode />
              </div>
            </div>

            
            {/* Appearance Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Appearance</h3>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Logo Upload with Enhanced Validation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Logo</label>
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors border-2 border-dashed border-gray-300"
                      onClick={() => (document.getElementById('logoUpload') as any).click()}
                    >
                      {selectedLogo ? (
                        <img src={`${process.env.NEXT_PUBLIC_FILE_HOST}${selectedLogo}`} alt="Logo" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <Upload className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <button
                        onClick={() => (document.getElementById('logoUpload') as any).click()}
                        disabled={isLoading}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {isLoading ? 'Uploading...' : 'Choose File'}
                      </button>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG or PNG (max 5MB)
                      </p>
                      {fileValidationErrors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {fileValidationErrors.map((error, index) => (
                            <div key={index} className="flex items-center space-x-2 text-red-600 text-xs">
                              <AlertCircle className="w-3 h-3" />
                              <span>{error}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      id="logoUpload"
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleLogoChange}
                    />
                  </div>
                </div>

                {/* Title Bar Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title Bar Text</label>
                  <input
                    type="text"
                    value={state.titleBar}
                    onChange={(e) => dispatch({ type: actionTypes.SET_TITLE_BAR, payload: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter title"
                  />
                </div>

                {/* Welcome Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Welcome Message</label>
                  <textarea
                    value={state.welcomeMessage}
                    onChange={(e) => dispatch({ type: actionTypes.SET_WELCOME_MESSAGE, payload: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Welcome message here"
                  />
                </div>

                {/* Color Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Colors</label>
                  <div className="grid grid-cols-2 gap-4">
                    {state.colorFields.map((field:any) => (
                      <div key={field.id} className="space-y-2">
                        <label className="block text-xs font-medium text-gray-600">
                          {(colorFieldLabels as any)[field.name] || field.name}
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={field.value}
                            onChange={(e) => dispatch({
                              type: actionTypes.UPDATE_COLOR,
                              payload: { id: field.id, value: e.target.value }
                            })}
                            className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                          />
                          <span className="text-xs text-gray-500 font-mono">{field.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Widget Position Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Widget Position</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Align to</label>
                    <select
                      value={state.position.align}
                      onChange={(e) => dispatch({
                        type: actionTypes.UPDATE_POSITION,
                        payload: { align: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="right">Right</option>
                      <option value="left">Left</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Side spacing</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="200"
                        value={state.position.sideSpacing}
                        onChange={(e) => dispatch({
                          type: actionTypes.UPDATE_POSITION,
                          payload: { sideSpacing: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-sm text-gray-500">px</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bottom spacing</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="200"
                        value={state.position.bottomSpacing}
                        onChange={(e) => dispatch({
                          type: actionTypes.UPDATE_POSITION,
                          payload: { bottomSpacing: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-sm text-gray-500">px</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Pre-Chat Form Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Pre-Chat Form</h3>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.isPreChatFormEnabled}
                      onChange={() => dispatch({ type: actionTypes.TOGGLE_PRE_CHAT_FORM })}
                      className="sr-only"
                    />
                    <div className={`relative w-11 h-6 rounded-full transition-colors ${
                      state.isPreChatFormEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                        state.isPreChatFormEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </div>
                  </label>
                </div>
              </div>
              {state.isPreChatFormEnabled && (
                <div className="p-6 space-y-4">
                  {/* Form Fields */}
                  {state.fields.map((field:any) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">
                            {FIELD_TYPES.find(t => t.value === field.type)?.icon || '📝'}
                          </span>
                          <div>
                            <h4 className="font-medium text-gray-900">{field.value}</h4>
                            <p className="text-sm text-gray-500">
                              {FIELD_TYPES.find(t => t.value === field.type)?.label} 
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <label className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={() => dispatch({
                                type: actionTypes.TOGGLE_FIELD_REQUIRED,
                                payload: { id: field.id }
                              })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-700">Required</span>
                          </label>
                          
                          <button
                            onClick={() => dispatch({
                              type: actionTypes.REMOVE_FIELD,
                              payload: { id: field.id }
                            })}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Field Preview */}
                      <div className="mt-3">
                        {field.type === 'textarea' ? (
                          <textarea
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                            rows={3}
                            disabled
                          />
                        ) : (
                          <input
                            type={field.type}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                            disabled
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Field Button */}
                  <button
                    onClick={() => setIsFieldModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-2 border-dashed border-blue-300 w-full justify-center"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Field</span>
                  </button>
                </div>
              )}
            </div>

            {/* Additional Tweaks Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Sliders className="w-4 h-4 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Additional Tweaks</h3>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Show Logo</span>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.showLogo}
                      onChange={() => dispatch({ type: actionTypes.TOGGLE_SHOW_LOGO })}
                      className="sr-only"
                    />
                    <div className={`relative w-11 h-6 rounded-full transition-colors ${
                      state.showLogo ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                        state.showLogo ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">White Label Widget</span>
                    <p className="text-xs text-gray-500">Remove "Powered by Chataffy" branding</p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.showWhiteLabel}
                      onChange={() => dispatch({ type: actionTypes.TOGGLE_WHITE_LABEL })}
                      className="sr-only"
                    />
                    <div className={`relative w-11 h-6 rounded-full transition-colors ${
                      state.showWhiteLabel ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                        state.showWhiteLabel ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={isLoading || !isChanged}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
              </div>
              <div className="p-6">
                <div className="bg-gray-100 rounded-lg p-8 relative min-h-[500px]">
                  {/* Widget Preview */}
                  <div 
                    className={`absolute ${state.position.align === 'left' ? 'left-0' : 'right-0'} bottom-0 w-80`}
                    style={{
                      [state.position.align]: `${state.position.sideSpacing}px`,
                      bottom: `${state.position.bottomSpacing}px`
                    }}
                  >
                    {/* Widget Button */}
                    <div className="flex justify-end mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    {/* Widget Chat Window */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                      {/* Header */}
                      <div 
                        className="p-4 text-white"
                        style={{ backgroundColor: state.colorFields[0]?.value }}
                      >
                        <div className="flex items-center space-x-3">
                          {state.showLogo && (
                            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                              <img src={`${process.env.NEXT_PUBLIC_FILE_HOST}${selectedLogo}`} alt="Logo" className="w-6 h-6 rounded-full" />
                            </div>
                          )}
                          <div>
                            <div 
                              className="font-semibold text-sm"
                              style={{ color: state.colorFields[1]?.value }}
                            >
                              {state.titleBar}
                            </div>
                            <div className="flex items-center space-x-1 text-xs opacity-90">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span>Online</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="p-4 h-64 overflow-y-auto bg-gray-50">
                        {/* AI Message */}
                        <div className="flex items-start space-x-2 mb-4">
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0"></div>
                          <div 
                            className="px-3 py-2 rounded-lg text-sm max-w-xs"
                            style={{ 
                              backgroundColor: state.colorFields[4]?.value,
                              color: state.colorFields[5]?.value
                            }}
                          >
                            {state.welcomeMessage}
                          </div>
                        </div>

                        {/* User Message */}
                        <div className="flex justify-end mb-4">
                          <div 
                            className="px-3 py-2 rounded-lg text-sm max-w-xs"
                            style={{ 
                              backgroundColor: state.colorFields[2]?.value,
                              color: state.colorFields[3]?.value
                            }}
                          >
                            Hello! I need help with my order.
                          </div>
                        </div>
                      </div>

                      {/* Input */}
                      <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="text" 
                            placeholder="Type a message..." 
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            disabled
                          />
                          <button className="p-2 bg-blue-600 text-white rounded-lg">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* White Label Footer */}
                      {!state.showWhiteLabel && (
                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                          <div className="text-xs text-gray-500 text-center">
                            Powered by <span className="font-semibold text-blue-600">Chataffy</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Field Creation Modal */}
      <FieldCreationModal
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        onSave={handleAddField}
      />
    </div>
  );
}