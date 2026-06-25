'use client'

import React from 'react';
import { ExternalLink, FileText, Globe, MessageSquare, Pencil } from 'lucide-react';

const SOURCE_LABELS: Record<number, string> = {
  0: 'Web Page',
  1: 'File',
  2: 'Snippet',
  3: 'FAQ',
  4: 'Revised Answer',
};

const SOURCE_ICONS: Record<number, React.ReactNode> = {
  0: <Globe className="w-3.5 h-3.5" />,
  1: <FileText className="w-3.5 h-3.5" />,
  2: <FileText className="w-3.5 h-3.5" />,
  3: <MessageSquare className="w-3.5 h-3.5" />,
  4: <Pencil className="w-3.5 h-3.5" />,
};

interface Source {
  type: number | null;
  title: string | null;
  url: string | null;
}

interface InformationSourcesProps {
  sources: Source[];
}

const UTILITY_SOURCE_PATTERNS = [
  /privacy[-\s]?policy/i,
  /terms[-\s]?(of[-\s]?(use|service)|and[-\s]?conditions)/i,
  /cookie[-\s]?policy/i,
  /\/contact(?:\/|$|\?|#)/i,
  /\bcontact[-\s]us\b/i,
  /\/legal(?:\/|$|\?|#)/i,
  /disclaimer/i,
  /\bgdpr\b/i,
  /\/cookies(?:\/|$|\?|#)/i,
];

function isUtilitySource(source: Source) {
  const haystack = `${source.title || ''} ${source.url || ''}`;
  return UTILITY_SOURCE_PATTERNS.some((pattern) => pattern.test(haystack));
}

function filterDisplaySources(sources: Source[]) {
  const seen = new Set<string>();
  return sources
    .filter((source) => source && (source.url || source.title))
    .filter((source) => !isUtilitySource(source))
    .filter((source) => {
      const key = source.url || source.title || '';
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

export default function InformationSources({ sources }: InformationSourcesProps) {
  const displaySources = filterDisplaySources(sources || []);
  if (!displaySources.length) return null;

  return (
    <div className="sourceChat-show" style={{
      position: 'absolute',
      bottom: '100%',
      left: 0,
      zIndex: 50,
      minWidth: '240px',
      maxWidth: '320px',
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      padding: '8px 0',
      marginBottom: '6px',
    }}>
      <div style={{
        fontSize: '10px',
        fontWeight: 600,
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '4px 12px 6px',
        borderBottom: '1px solid #f3f4f6',
      }}>
        Sources
      </div>
      {displaySources.map((source, index) => {
        const typeLabel = source.type !== null ? (SOURCE_LABELS[source.type] ?? 'Source') : 'Source';
        const icon = source.type !== null ? (SOURCE_ICONS[source.type] ?? <FileText className="w-3.5 h-3.5" />) : <FileText className="w-3.5 h-3.5" />;
        const display = source.title || source.url || 'Unknown source';

        return (
          <div key={index} style={{
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            borderBottom: index < displaySources.length - 1 ? '1px solid #f9fafb' : 'none',
          }}>
            <span style={{ color: '#6b7280', marginTop: '2px', flexShrink: 0 }}>
              {icon}
            </span>
            <span style={{ fontSize: '12px', lineHeight: '1.4', flex: 1 }}>
              <strong style={{ color: '#374151' }}>{typeLabel}</strong>
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    color: '#3b82f6',
                    textDecoration: 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '220px',
                  }}
                  title={source.url}
                >
                  {display}
                  <ExternalLink className="inline w-2.5 h-2.5 ml-1 opacity-60" />
                </a>
              ) : (
                <span style={{ display: 'block', color: '#6b7280' }}>{display}</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
