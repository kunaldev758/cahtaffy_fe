'use client'

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { reviseAnswer } from '@/app/_api/dashboard/action';

interface ReviseAnswerModalProps {
  visitorMessage: string;
  agentResponse: string;
  agentId: string;
  userId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReviseAnswerModal({
  visitorMessage,
  agentResponse,
  agentId,
  userId,
  onClose,
  onSuccess,
}: ReviseAnswerModalProps) {
  const [expectedResponse, setExpectedResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!expectedResponse.trim()) {
      setError('Please enter the expected response.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await reviseAnswer({
        visitorMessage,
        agentResponse,
        expectedResponse: expectedResponse.trim(),
        agentId,
        userId,
      });
      if (result?.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(result?.error || 'Failed to save. Please try again.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '480px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px',
          borderBottom: '1px solid #f3f4f6',
        }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>
            Improve answer
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {/* Visitor Message */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              Visitor Message
            </label>
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '14px',
              color: '#374151',
              lineHeight: 1.5,
            }}>
              {visitorMessage}
            </div>
          </div>

          {/* Agent Response */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              Agent Response
            </label>
            <div
              style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '14px',
                color: '#374151',
                lineHeight: 1.5,
                maxHeight: '120px',
                overflowY: 'auto',
              }}
              dangerouslySetInnerHTML={{ __html: agentResponse }}
            />
          </div>

          {/* Expected Response */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              Expected Response
            </label>
            <textarea
              value={expectedResponse}
              onChange={(e) => { setExpectedResponse(e.target.value); setError(''); }}
              placeholder="Enter expected response here..."
              rows={5}
              style={{
                width: '100%',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '14px',
                color: '#111827',
                lineHeight: 1.5,
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.15)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
            {error && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#ef4444' }}>{error}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          gap: '10px',
          padding: '16px 20px',
          borderTop: '1px solid #f3f4f6',
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: '#fff',
              color: '#374151',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !expectedResponse.trim()}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: loading || !expectedResponse.trim() ? '#9ca3af' : '#111827',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading || !expectedResponse.trim() ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Saving...' : 'Update Answer'}
          </button>
        </div>
      </div>
    </div>
  );
}
