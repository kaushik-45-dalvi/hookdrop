'use client';

import { useStore } from '@/store';
import BinUrlBar from './BinUrlBar';
import RequestList from './RequestList';
import RequestDetail from './RequestDetail';
import EmptyState from './EmptyState';
import styles from './BinViewer.module.css';

interface BinViewerProps {
  onClearRequests: () => void;
  onDeleteBin: () => void;
}

export default function BinViewer({ onClearRequests, onDeleteBin }: BinViewerProps) {
  const { bin, requests, showDetailPanel, selectRequest } = useStore();

  if (!bin) return null;

  return (
    <div className={styles.container}>
      <BinUrlBar />

      {/* Grid Action bar */}
      <div className={styles.actionBar}>
        <div className={styles.actionBarLeft}>
          <span className={styles.num}>02 //</span>
          <span className={styles.binSlug}>
            SESSION: <span className={styles.slugValue}>{bin.slug}</span>
          </span>
        </div>
        <div className={styles.actionBarRight}>
          {requests.length > 0 && (
            <button 
              className={styles.clearBtn}
              onClick={onClearRequests}
              id="clear-requests-button"
            >
              CLEAR RUN
            </button>
          )}
          <button 
            className={styles.deleteBtn}
            onClick={onDeleteBin}
            id="delete-bin-button"
          >
            TERMINATE SESSION
          </button>
        </div>
      </div>

      {/* Main content grid split */}
      <div className={styles.main}>
        {requests.length === 0 ? (
          <EmptyState />
        ) : (
          <div className={styles.splitView}>
            <div className={styles.sidebar}>
              <RequestList />
            </div>
            <div className={`${styles.detail} ${showDetailPanel ? styles.detailOpen : ''}`}>
              <RequestDetail />
            </div>
            {/* Mobile overlay */}
            {showDetailPanel && (
              <div 
                className={styles.mobileOverlay}
                onClick={() => selectRequest(null)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
