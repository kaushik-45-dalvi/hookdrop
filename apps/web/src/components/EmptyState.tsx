'use client';

import styles from './EmptyState.module.css';

export default function EmptyState() {
  return (
    <div className={styles.container}>
      <div className={styles.visualBox}>
        <div className={styles.oscillator}>
          <div className={styles.scanLine} />
          <div className={styles.gridOverlay} />
        </div>
        <div className={styles.statusLabel}>LISTENING ON PORT 3001 //</div>
      </div>

      <h3 className={styles.title}>AWAITING INCOMING PAYLOADS</h3>
      <p className={styles.subtitle}>
        Send an HTTP request from any external system or tool. The payload will materialize below in real-time.
      </p>

      {/* Integration Chips */}
      <div className={styles.integrations}>
        <span className={styles.metaLabel}>COMPATIBLE CHANNELS</span>
        <div className={styles.logos}>
          {['STRIPE', 'GITHUB', 'SHOPIFY', 'SLACK', 'RAZORPAY', 'ZAPIER'].map((name) => (
            <div key={name} className={styles.logoChip}>
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* Guide Steps */}
      <div className={styles.hints}>
        <div className={styles.hint}>
          <span className={styles.hintStep}>01 //</span>
          <span>Copy the generated URL above.</span>
        </div>
        <div className={styles.hint}>
          <span className={styles.hintStep}>02 //</span>
          <span>Add the URL as a webhook endpoint in your platform settings.</span>
        </div>
        <div className={styles.hint}>
          <span className={styles.hintStep}>03 //</span>
          <span>Trigger an action to broadcast a webhook payload.</span>
        </div>
      </div>

      {/* Testing Section */}
      <div className={styles.curlSection}>
        <span className={styles.metaLabel}>MANUAL TEST RIG</span>
        <div className={styles.curlBox}>
          <code>
            <span className={styles.curlCmd}>curl</span> -X POST [URL] \<br />
            &nbsp;&nbsp;-H <span className={styles.curlString}>&quot;Content-Type: application/json&quot;</span> \<br />
            &nbsp;&nbsp;-d <span className={styles.curlString}>&apos;&#123;&quot;event&quot;: &quot;test.ping&quot;, &quot;ok&quot;: true&#125;&apos;</span>
          </code>
        </div>
      </div>
    </div>
  );
}
