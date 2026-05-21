'use client';

import { useStore, METHOD_COLORS } from '@/store';
import { useState, useMemo } from 'react';
import styles from './RequestList.module.css';

export default function RequestList() {
  const { requests, selectedRequestId, selectRequest } = useStore();
  const [search, setSearch] = useState('');
  const [activeMethod, setActiveMethod] = useState<string>('ALL');

  const methods = useMemo(() => {
    const list = new Set(requests.map(r => r.method));
    return ['ALL', ...Array.from(list)];
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = req.path.toLowerCase().includes(search.toLowerCase()) || 
        req.id.toLowerCase().includes(search.toLowerCase()) ||
        (req.body && req.body.toLowerCase().includes(search.toLowerCase()));
      const matchesMethod = activeMethod === 'ALL' || req.method === activeMethod;
      return matchesSearch && matchesMethod;
    });
  }, [requests, search, activeMethod]);

  return (
    <div className={styles.container}>
      {/* Search & Filter Grid */}
      <div className={styles.filterSection}>
        <div className={styles.searchBox}>
          <input 
            type="text"
            placeholder="FILTER RUNS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.methodsRow}>
          {methods.map(method => (
            <button
              key={method}
              onClick={() => setActiveMethod(method)}
              className={`${styles.methodTab} ${activeMethod === method ? styles.activeTab : ''}`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Request Stack List */}
      <div className={styles.list}>
        {filteredRequests.length === 0 ? (
          <div className={styles.empty}>
            NO MATCHING RUNS FOUND.
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isSelected = req.id === selectedRequestId;
            const time = new Date(req.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit',
              hour12: false 
            });

            return (
              <div
                key={req.id}
                onClick={() => selectRequest(req.id)}
                className={`${styles.item} ${isSelected ? styles.selectedItem : ''}`}
                style={{ '--method-color': METHOD_COLORS[req.method] || '#6b7280' } as React.CSSProperties}
              >
                <div className={styles.itemHeader}>
                  <span className={styles.methodBadge}>{req.method}</span>
                  <span className={styles.time}>{time}</span>
                </div>
                <div className={styles.path} title={req.path}>
                  {req.path}
                </div>
                <div className={styles.metaRow}>
                  <span>ID: {req.id.slice(0, 6)}</span>
                  <span>{(req.size / 1024).toFixed(2)} KB</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
