'use client';

import { useState, useEffect } from 'react';
import { useStore, formatCountdown } from '@/store';
import styles from './BinUrlBar.module.css';

export default function BinUrlBar() {
  const { bin } = useStore();
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const webhookUrl = bin ? `${origin}/h/${bin.slug}` : '';

  useEffect(() => {
    if (!bin) return;

    const updateTimer = () => {
      const remaining = bin.expiresAt - Date.now();
      if (remaining <= 0) {
        setTimeLeft('EXPIRED');
      } else {
        setTimeLeft(formatCountdown(bin.expiresAt));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [bin]);

  const handleCopy = async () => {
    if (!webhookUrl) return;
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy webhook URL:', err);
    }
  };

  if (!bin) return null;

  return (
    <div className={styles.bar}>
      <div className={styles.labelCol}>
        <span className={styles.num}>01 //</span> WEBHOOK URL
      </div>
      <div className={styles.urlCol}>
        <input 
          id="webhook-url-input"
          type="text" 
          readOnly 
          value={webhookUrl} 
          onClick={handleCopy}
          className={styles.input}
        />
      </div>
      <button 
        onClick={handleCopy}
        className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
        id="copy-webhook-url-button"
      >
        {copied ? 'COPIED ✓' : 'COPY URL'}
      </button>
      <div className={styles.timerCol}>
        <div className={styles.timerNum}>{timeLeft}</div>
        <div className={styles.timerLabel}>UNTIL AUTO-DELETE</div>
      </div>
    </div>
  );
}
