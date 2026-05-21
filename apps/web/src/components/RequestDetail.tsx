'use client';

import { useState, useMemo } from 'react';
import { useStore, METHOD_COLORS, formatAbsoluteTime, formatRelativeTime, generateCurlCommand, formatBytes } from '@/store';
import styles from './RequestDetail.module.css';

function syntaxHighlightJSON(json: string): string {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
    .replace(/: (null)/g, ': <span class="json-null">$1</span>');
}

export default function RequestDetail() {
  const { requests, selectedRequestId, selectRequest } = useStore();
  const [headersOpen, setHeadersOpen] = useState(true);
  const [queryOpen, setQueryOpen] = useState(true);
  const [bodyOpen, setBodyOpen] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const request = useMemo(
    () => requests.find(r => r.id === selectedRequestId),
    [requests, selectedRequestId]
  );

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  if (!request) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
            <rect x="8" y="6" width="32" height="36" rx="0" stroke="currentColor" strokeWidth="1"/>
            <path d="M16 16H32M16 22H28M16 28H24" stroke="currentColor" strokeWidth="1" strokeLinecap="square"/>
          </svg>
        </div>
        <p className={styles.emptyTitle}>NO RUN SELECTED</p>
        <p className={styles.emptySubtitle}>Select an incoming request from the list to inspect</p>
      </div>
    );
  }

  const hasQuery = Object.keys(request.queryParams).length > 0;
  const headerCount = Object.keys(request.headers).length;

  let formattedBody = request.body || '';
  let isJSON = false;
  if (request.bodyParsed) {
    try {
      formattedBody = JSON.stringify(request.bodyParsed, null, 2);
      isJSON = true;
    } catch {
      formattedBody = request.body || '';
    }
  }

  return (
    <div className={styles.container}>
      {/* Detail Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span 
            className={styles.methodBadge}
            style={{ color: METHOD_COLORS[request.method] || '#ffffff' }}
          >
            {request.method}
          </span>
          <span className={styles.path}>{request.path}</span>
        </div>
        <button 
          className={styles.closeBtn}
          onClick={() => selectRequest(null)}
          aria-label="Close details"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1" strokeLinecap="square"/>
          </svg>
        </button>
      </div>

      {/* Meta grid */}
      <div className={styles.metaGrid}>
        <div className={styles.metaCell}>
          <div className={styles.metaLabel}>TIME</div>
          <div className={styles.metaValue}>{formatAbsoluteTime(request.timestamp)}</div>
          <div className={styles.metaSub}>{formatRelativeTime(request.timestamp)}</div>
        </div>
        <div className={styles.metaCell}>
          <div className={styles.metaLabel}>SIZE</div>
          <div className={styles.metaValue}>{formatBytes(request.size)}</div>
        </div>
        <div className={styles.metaCell}>
          <div className={styles.metaLabel}>CONTENT TYPE</div>
          <div className={styles.metaValue} title={request.contentType}>
            {request.contentType.split(';')[0] || 'N/A'}
          </div>
        </div>
        <div className={styles.metaCell}>
          <div className={styles.metaLabel}>RUN ID</div>
          <div className={styles.metaValueMono}>{request.id.slice(0, 12)}</div>
        </div>
      </div>

      {/* Accordions */}
      <div className={styles.content}>
        {/* Headers */}
        <div className={styles.section}>
          <button 
            className={styles.sectionHeader}
            onClick={() => setHeadersOpen(!headersOpen)}
          >
            <span className={styles.sectionTitle}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className={`${styles.chevron} ${headersOpen ? styles.chevronOpen : ''}`}>
                <path d="M4 5L6 7L8 5" stroke="currentColor" strokeWidth="1" strokeLinecap="square" strokeLinejoin="miter"/>
              </svg>
              HEADERS <span className={styles.badge}>{headerCount}</span>
            </span>
          </button>
          {headersOpen && (
            <div className={styles.tableWrapper}>
              <table className={styles.kvTable}>
                <tbody>
                  {Object.entries(request.headers).map(([key, value]) => (
                    <tr key={key} className={styles.kvRow}>
                      <td className={styles.kvKey}>{key}</td>
                      <td className={styles.kvValue}>
                        <span className={styles.valueText}>{value}</span>
                        <button 
                          className={`${styles.copyBtnSmall} ${copiedField === `header-${key}` ? styles.copiedSmall : ''}`}
                          onClick={() => copyToClipboard(value, `header-${key}`)}
                        >
                          {copiedField === `header-${key}` ? 'COPIED' : 'COPY'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Query Params */}
        {hasQuery && (
          <div className={styles.section}>
            <button 
              className={styles.sectionHeader}
              onClick={() => setQueryOpen(!queryOpen)}
            >
              <span className={styles.sectionTitle}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className={`${styles.chevron} ${queryOpen ? styles.chevronOpen : ''}`}>
                  <path d="M4 5L6 7L8 5" stroke="currentColor" strokeWidth="1" strokeLinecap="square" strokeLinejoin="miter"/>
                </svg>
                QUERY PARAMETERS <span className={styles.badge}>{Object.keys(request.queryParams).length}</span>
              </span>
            </button>
            {queryOpen && (
              <div className={styles.tableWrapper}>
                <table className={styles.kvTable}>
                  <tbody>
                    {Object.entries(request.queryParams).map(([key, value]) => (
                      <tr key={key} className={styles.kvRow}>
                        <td className={styles.kvKey}>{key}</td>
                        <td className={styles.kvValue}>
                          <span className={styles.valueText}>{value}</span>
                          <button 
                            className={`${styles.copyBtnSmall} ${copiedField === `query-${key}` ? styles.copiedSmall : ''}`}
                            onClick={() => copyToClipboard(value, `query-${key}`)}
                          >
                            {copiedField === `query-${key}` ? 'COPIED' : 'COPY'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Body */}
        {request.body && (
          <div className={styles.section}>
            <button 
              className={styles.sectionHeader}
              onClick={() => setBodyOpen(!bodyOpen)}
            >
              <span className={styles.sectionTitle}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className={`${styles.chevron} ${bodyOpen ? styles.chevronOpen : ''}`}>
                  <path d="M4 5L6 7L8 5" stroke="currentColor" strokeWidth="1" strokeLinecap="square" strokeLinejoin="miter"/>
                </svg>
                PAYLOAD {isJSON && <span className={styles.jsonTag}>JSON</span>}
              </span>
            </button>
            {bodyOpen && (
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>
                  <span className={styles.codeLang}>{isJSON ? 'JSON' : 'PLAINTEXT'}</span>
                  <button 
                    className={`${styles.codeCopy} ${copiedField === 'body' ? styles.copiedSmall : ''}`}
                    onClick={() => copyToClipboard(formattedBody, 'body')}
                  >
                    {copiedField === 'body' ? 'COPIED ✓' : 'COPY BODY'}
                  </button>
                </div>
                <pre className={styles.codeContent}>
                  {isJSON ? (
                    <code dangerouslySetInnerHTML={{ __html: syntaxHighlightJSON(formattedBody) }} />
                  ) : (
                    <code>{formattedBody}</code>
                  )}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className={styles.actionsRow}>
        <button 
          className={styles.actionBtn}
          onClick={() => copyToClipboard(generateCurlCommand(request), 'curl')}
        >
          {copiedField === 'curl' ? 'COPIED CURL ✓' : 'GENERATE CURL'}
        </button>
        <button 
          className={styles.actionBtn}
          onClick={() => copyToClipboard(JSON.stringify(request, null, 2), 'raw')}
        >
          {copiedField === 'raw' ? 'COPIED RAW ✓' : 'COPY RAW PAYLOAD'}
        </button>
      </div>
    </div>
  );
}
