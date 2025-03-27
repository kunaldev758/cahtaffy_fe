'use client'

import React from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Progress {
  scrapingCompleted: number;
  minifyingCompleted: number;
  trainingCompleted: number;
  total: number;
  status: string;
  stage?: string;
  failed: number;
}

interface CompletionStats {
  totalPages: number;
  successfulPages: number;
  failedPages: number;
  processingTime: number;
}

interface ScrapeProgressTrackerProps {
  progress: Progress;
  isComplete: boolean;
  completionStats?: CompletionStats;
  onClose: () => void;
}

const ScrapeProgressTracker: React.FC<ScrapeProgressTrackerProps> = ({ progress, isComplete, completionStats, onClose }) => {
  const [expanded, setExpanded] = useState(true);
  
  // Calculate percentages for progress bars
  const calculatePercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };
  
  const scrapingPercentage = calculatePercentage(progress.scrapingCompleted, progress.total);
  const minifyingPercentage = calculatePercentage(progress.minifyingCompleted, progress.total);
  const trainingPercentage = calculatePercentage(progress.trainingCompleted, progress.total);
  
  // Auto-close after completion
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isComplete) {
      timer = setTimeout(() => {
        setExpanded(false);
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isComplete]);

  if (!expanded) {
    return (
      <div className="scrape-progress-minimized" onClick={() => setExpanded(true)}>
        <div className="progress-status">
          {isComplete ? 'Scraping Complete' : `${progress.status}: ${progress.stage}`}
        </div>
        <div className="progress-bar">
        </div>
      </div>
    );
  }

  return (
    <div className="scrape-progress-tracker">
      <div className="progress-header">
        <h3>Scraping Progress</h3>
        <div className="progress-actions">
          <button onClick={() => setExpanded(false)} className="minimize-btn">
            Minimize
          </button>
          <button onClick={onClose} className="close-btn">
            Close
          </button>
        </div>
      </div>
      
      <div className="progress-status">
        <strong>Status:</strong> {progress.status} 
        {progress.stage && <span> - {progress.stage}</span>}
      </div>
      
      <div className="progress-overview">
        <div className="progress-stat">
          <span>Total</span>
          <strong>{progress.total}</strong>
        </div>
        <div className="progress-stat">
          <span>Completed</span>
          <strong>{progress.scrapingCompleted}</strong>
        </div>
        <div className="progress-stat">
          <span>Failed</span>
          <strong>{progress.failed}</strong>
        </div>
      </div>
      
      <div className="progress-details">
        <div className="progress-stage">
          <div className="stage-label">Scraping</div>
          <div className="stage-progress">
            <div className="progress-bar">
              <div 
                className="progress-bar-inner" 
                style={{ width: `${scrapingPercentage}%` }}
              ></div>
            </div>
            <div className="progress-percentage">{scrapingPercentage}%</div>
          </div>
        </div>
        
        <div className="progress-stage">
          <div className="stage-label">Minifying</div>
          <div className="stage-progress">
            <div className="progress-bar">
              <div 
                className="progress-bar-inner" 
                style={{ width: `${minifyingPercentage}%` }}
              ></div>
            </div>
            <div className="progress-percentage">{minifyingPercentage}%</div>
          </div>
        </div>
        
        <div className="progress-stage">
          <div className="stage-label">Training</div>
          <div className="stage-progress">
            <div className="progress-bar">
              <div 
                className="progress-bar-inner" 
                style={{ width: `${trainingPercentage}%` }}
              ></div>
            </div>
            <div className="progress-percentage">{trainingPercentage}%</div>
          </div>
        </div>
      </div>
      
      {isComplete && completionStats && (
        <div className="completion-stats">
          <h4>Completion Summary</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span>Total Pages</span>
              <strong>{completionStats.totalPages}</strong>
            </div>
            <div className="stat-item">
              <span>Successfully Scraped</span>
              <strong>{completionStats.successfulPages}</strong>
            </div>
            <div className="stat-item">
              <span>Failed Pages</span>
              <strong>{completionStats.failedPages}</strong>
            </div>
            <div className="stat-item">
              <span>Processing Time</span>
              <strong>{completionStats.processingTime}s</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrapeProgressTracker;