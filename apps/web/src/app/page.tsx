'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  useStore, 
  createBin, 
  deleteBinApi, 
  clearRequestsApi, 
  connectWebSocket, 
  disconnectWebSocket 
} from '@/store';
import Hero3D from '@/components/Hero3D';
import Header from '@/components/Header';
import BinViewer from '@/components/BinViewer';
import styles from './page.module.css';

export default function Home() {
  const { 
    bin, 
    setBin, 
    setBinLoading, 
    setRequests, 
    binLoading, 
    clearRequests, 
    reset 
  } = useStore();
  
  const [error, setError] = useState<string | null>(null);
  const [showHero, setShowHero] = useState(true);

  const initBin = useCallback(async () => {
    setBinLoading(true);
    setError(null);
    
    try {
      const data = await createBin();
      const binData = {
        slug: data.slug,
        createdAt: Date.now(),
        expiresAt: data.expiresAt,
        requestCount: 0,
      };
      setBin(binData);
      setRequests([]);
      connectWebSocket(data.slug);
      setShowHero(false);
      toast.success('Webhook session created!');
    } catch (err) {
      const msg = 'Failed to create webhook session. Make sure server is running.';
      setError(msg);
      toast.error(msg);
      console.error('Failed to create bin:', err);
    } finally {
      setBinLoading(false);
    }
  }, [setBin, setBinLoading, setRequests]);

  const handleNewBin = useCallback(async () => {
    if (bin) {
      disconnectWebSocket();
      try {
        await deleteBinApi(bin.slug);
      } catch {}
    }
    reset();
    await initBin();
  }, [bin, reset, initBin]);

  const handleClearRequests = useCallback(async () => {
    if (!bin) return;
    try {
      await clearRequestsApi(bin.slug);
      clearRequests();
      toast.success('Requests cleared');
    } catch (err) {
      toast.error('Failed to clear requests');
      console.error('Failed to clear requests:', err);
    }
  }, [bin, clearRequests]);

  const handleDeleteBin = useCallback(async () => {
    if (!bin) return;
    disconnectWebSocket();
    try {
      await deleteBinApi(bin.slug);
    } catch {}
    reset();
    setShowHero(true);
    toast('Session terminated', { icon: '🗑️' });
  }, [bin, reset]);

  // Auto-create bin on page load
  useEffect(() => {
    initBin();
    return () => {
      disconnectWebSocket();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.app}>
      <Header onNewBin={handleNewBin} />

      {showHero && !bin && (
        <div className={styles.heroSection}>
          <Hero3D />
          <div className={styles.ctaGrid}>
            <div className={styles.ctaPrompt}>
              <span className={styles.promptNum}>05 // ACTION</span>
              <h2 className={styles.promptTitle}>GET STARTED INSTANTLY</h2>
              <p className={styles.promptDesc}>Generate a unique URL to start catching payloads in less than 2 seconds.</p>
            </div>
            <div className={styles.ctaActionCell}>
              <button 
                className={styles.ctaButton}
                onClick={initBin}
                disabled={binLoading}
                id="create-bin-cta"
              >
                {binLoading ? (
                  <>
                    <span className={styles.spinner} />
                    INITIALIZING CATCHER...
                  </>
                ) : (
                  <>
                    GENERATE DISPOSABLE URL
                  </>
                )}
              </button>
              {error && (
                <div className={styles.errorBanner}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M8 5V9M8 11V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {bin && (
        <div className={styles.viewerSection}>
          <BinViewer 
            onClearRequests={handleClearRequests}
            onDeleteBin={handleDeleteBin}
          />
        </div>
      )}

      {!showHero && !bin && (
        <div className={styles.loadingSection}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinnerRing} />
          </div>
          <p className={styles.loadingText}>ALLOCATING WEBHOOK INSTANCE...</p>
        </div>
      )}
    </div>
  );
}
