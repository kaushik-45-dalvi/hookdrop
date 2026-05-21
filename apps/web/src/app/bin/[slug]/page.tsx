'use client';

import { useEffect, useCallback } from 'react';
import { use } from 'react';
import toast from 'react-hot-toast';
import { 
  useStore, 
  fetchBin,
  deleteBinApi, 
  clearRequestsApi, 
  connectWebSocket, 
  disconnectWebSocket 
} from '@/store';
import Header from '@/components/Header';
import BinViewer from '@/components/BinViewer';
import styles from './bin.module.css';

interface BinPageProps {
  params: Promise<{ slug: string }>;
}

export default function BinPage({ params }: BinPageProps) {
  const { slug } = use(params);
  const { 
    bin, 
    setBin, 
    setRequests, 
    binLoading,
    setBinLoading,
    clearRequests, 
    reset 
  } = useStore();

  const loadBin = useCallback(async () => {
    if (!slug) return;
    setBinLoading(true);
    
    try {
      const data = await fetchBin(slug);
      setBin(data.bin);
      setRequests(data.requests);
      connectWebSocket(slug);
    } catch {
      toast.error('Bin not found or expired. It may have been deleted.');
    } finally {
      setBinLoading(false);
    }
  }, [slug, setBin, setRequests, setBinLoading]);

  const handleNewBin = useCallback(async () => {
    if (bin) {
      disconnectWebSocket();
      try { await deleteBinApi(bin.slug); } catch {}
    }
    reset();
    // Redirect home to create a new bin
    window.location.href = '/';
  }, [bin, reset]);

  const handleClearRequests = useCallback(async () => {
    if (!bin) return;
    try {
      await clearRequestsApi(bin.slug);
      clearRequests();
      toast.success('Requests cleared');
    } catch {
      toast.error('Failed to clear requests');
    }
  }, [bin, clearRequests]);

  const handleDeleteBin = useCallback(async () => {
    if (!bin) return;
    disconnectWebSocket();
    try { await deleteBinApi(bin.slug); } catch {}
    reset();
    toast('Session terminated', { icon: '🗑️' });
    window.location.href = '/';
  }, [bin, reset]);

  useEffect(() => {
    loadBin();
    return () => { disconnectWebSocket(); };
  }, [loadBin]);

  return (
    <div className={styles.app}>
      <Header onNewBin={handleNewBin} />

      {binLoading && (
        <div className={styles.loadingSection}>
          <div className={styles.spinnerRing} />
          <p className={styles.loadingText}>LOADING SESSION...</p>
        </div>
      )}

      {!binLoading && !bin && (
        <div className={styles.notFound}>
          <div className={styles.notFoundCode}>404</div>
          <h2 className={styles.notFoundTitle}>BIN NOT FOUND</h2>
          <p className={styles.notFoundDesc}>
            This webhook session has expired or been deleted. Sessions are auto-deleted after 1 hour.
          </p>
          <a href="/" className={styles.homeLink}>
            ← CREATE NEW SESSION
          </a>
        </div>
      )}

      {!binLoading && bin && (
        <div className={styles.viewerSection}>
          <BinViewer 
            onClearRequests={handleClearRequests}
            onDeleteBin={handleDeleteBin}
          />
        </div>
      )}
    </div>
  );
}
