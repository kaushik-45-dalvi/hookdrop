'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import styles from './Header.module.css';

interface HeaderProps {
  onNewBin: () => void;
}

export default function Header({ onNewBin }: HeaderProps) {
  const { connectionStatus, bin } = useStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const statusLabel = {
    connected: 'LIVE',
    connecting: 'CONNECTING...',
    disconnected: 'DISCONNECTED',
  }[connectionStatus];

  const statusColor = {
    connected: 'var(--accent)',
    connecting: 'var(--status-warning)',
    disconnected: 'var(--status-error)',
  }[connectionStatus];

  return (
    <>
      <header className={styles.header}>
        <div className={styles.logoCol}>
          <a href="/" className={styles.logo}>
            <span className={styles.logoNum}>00 //</span>
            <span className={styles.logoText}>
              HOOK<span className={styles.logoAccent}>DROPP</span>
            </span>
          </a>
        </div>

        <div className={styles.statusCol}>
          {bin && (
            <div className={styles.statusWrapper} style={{ '--status-color': statusColor } as React.CSSProperties}>
              <span className={styles.statusDot} />
              <span className={styles.statusLabel}>{statusLabel}</span>
            </div>
          )}
        </div>

        <div className={styles.actionsCol}>
          <button 
            className={styles.signInBtn}
            onClick={() => setShowAuthModal(true)}
          >
            SIGN IN
          </button>
          {bin && (
            <button 
              className={styles.newBinBtn}
              onClick={onNewBin}
              id="new-bin-button"
            >
              CREATE NEW BIN
            </button>
          )}
        </div>
      </header>

      {showAuthModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAuthModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>⚡ HYBRID INBOX</div>
              <button className={styles.modalClose} onClick={() => setShowAuthModal(false)}>×</button>
            </div>
            
            <div className={styles.modalBody}>
              <p className={styles.modalDesc}>
                HookDrop is <strong>zero-friction</strong>. You get a fully functional webhook session instantly without signing up. 
              </p>
              
              <div className={styles.featuresList}>
                <div className={styles.featureItem}>
                  <div className={styles.featureTitle}>🔗 Permanent Session URLs</div>
                  <div className={styles.featureText}>Keep your webhooks active forever. No 1-hour expiration limits.</div>
                </div>
                
                <div className={styles.featureItem}>
                  <div className={styles.featureTitle}>📁 Saved History Dashboard</div>
                  <div className={styles.featureText}>View and search past webhook payloads and headers anytime.</div>
                </div>

                <div className={styles.featureItem}>
                  <div className={styles.featureTitle}>✏️ Custom Bins & Labels</div>
                  <div className={styles.featureText}>Organize your urls (e.g. <code>stripe-prod</code>, <code>github-test</code>).</div>
                </div>
              </div>

              <div className={styles.comingSoonBadge}>
                MEMBERSHIP COMING SOON // GUEST ACCESS ENABLED
              </div>

              <button className={styles.modalBtn} onClick={() => setShowAuthModal(false)}>
                CONTINUE AS GUEST
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
