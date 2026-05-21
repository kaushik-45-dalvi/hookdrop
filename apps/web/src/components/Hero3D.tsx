'use client';

import { useEffect, useRef } from 'react';
import styles from './Hero3D.module.css';

export default function Hero3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    let width = canvas.width = parent?.clientWidth || window.innerWidth;
    let height = canvas.height = parent?.clientHeight || 550;

    const handleResize = () => {
      width = canvas.width = parent?.clientWidth || window.innerWidth;
      height = canvas.height = parent?.clientHeight || 550;
    };
    window.addEventListener('resize', handleResize);

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };
    canvas.addEventListener('mousemove', handleMouse);

    // Interactive holographic grid
    interface Node3D { x: number; y: number; z: number; ox: number; oy: number; oz: number; }
    const nodes: Node3D[] = [];
    const rows = 12;
    const cols = 12;
    const spacing = 40;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - cols / 2) * spacing;
        const z = (r - rows / 2) * spacing;
        const y = 0;
        nodes.push({ x, y, z, ox: x, oy: y, oz: z });
      }
    }

    function project(x: number, y: number, z: number, rotY: number, rotX: number) {
      // Rotate Y
      let nx = x * Math.cos(rotY) - z * Math.sin(rotY);
      let nz = x * Math.sin(rotY) + z * Math.cos(rotY);
      // Rotate X
      let ny = y * Math.cos(rotX) - nz * Math.sin(rotX);
      nz = y * Math.sin(rotX) + nz * Math.cos(rotX);

      const perspective = 400;
      const scale = perspective / (perspective + nz + 150);
      return {
        x: nx * scale + width / 2,
        y: ny * scale + height / 2 - 35,
        depth: nz,
        scale
      };
    }

    let time = 0;

    function animate() {
      time += 0.005;
      ctx!.clearRect(0, 0, width, height);

      // Mouse positions in canvas coordinate space
      const mouseCanvasX = mouseRef.current.x * width;
      const mouseCanvasY = mouseRef.current.y * height;

      // Draw rich ambient blue glow around the cursor
      const mouseGlow = ctx!.createRadialGradient(
        mouseCanvasX, mouseCanvasY, 10,
        mouseCanvasX, mouseCanvasY, 200
      );
      mouseGlow.addColorStop(0, 'rgba(0, 229, 255, 0.12)');
      mouseGlow.addColorStop(0.5, 'rgba(0, 229, 255, 0.03)');
      mouseGlow.addColorStop(1, 'transparent');
      ctx!.fillStyle = mouseGlow;
      ctx!.fillRect(0, 0, width, height);

      // Central visual blue glow
      const ambientGlow = ctx!.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 300);
      ambientGlow.addColorStop(0, 'rgba(0, 229, 255, 0.08)');
      ambientGlow.addColorStop(1, 'transparent');
      ctx!.fillStyle = ambientGlow;
      ctx!.fillRect(0, 0, width, height);

      const mX = (mouseRef.current.x - 0.5) * 0.4;
      const mY = (mouseRef.current.y - 0.5) * 0.3;

      const rotY = time * 0.2 + mX;
      const rotX = 0.6 + Math.sin(time * 0.1) * 0.1 + mY;

      // Update node positions with wave animations and cursor interaction
      nodes.forEach((node) => {
        const distanceToCenter = Math.sqrt(node.ox * node.ox + node.oz * node.oz);
        const wave = Math.sin(distanceToCenter * 0.05 - time * 2) * 25;
        
        // Mouse force
        const cursorX = (mouseRef.current.x - 0.5) * 300;
        const cursorZ = (mouseRef.current.y - 0.5) * 300;
        const distToCursor = Math.sqrt(Math.pow(node.ox - cursorX, 2) + Math.pow(node.oz - cursorZ, 2));
        const cursorForce = Math.max(0, 150 - distToCursor) * 0.4;

        node.y = wave - cursorForce;
      });

      // Draw grid connections with blue accents closer to nodes/waves
      ctx!.lineWidth = 0.8;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const curr = project(nodes[idx].x, nodes[idx].y, nodes[idx].z, rotY, rotX);

          // Horizontal lines
          if (c < cols - 1) {
            const right = project(nodes[idx + 1].x, nodes[idx + 1].y, nodes[idx + 1].z, rotY, rotX);
            const alpha = Math.max(0.04, Math.min(0.35, (curr.depth + 200) / 400));
            
            // Mix of dark grey and cyan connections based on depth and cursor proximity
            const distToMouse = Math.sqrt(Math.pow(curr.x - mouseCanvasX, 2) + Math.pow(curr.y - mouseCanvasY, 2));
            if (distToMouse < 180) {
              ctx!.strokeStyle = `rgba(0, 229, 255, ${alpha * 1.5})`;
            } else {
              ctx!.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.6})`;
            }
            
            ctx!.beginPath();
            ctx!.moveTo(curr.x, curr.y);
            ctx!.lineTo(right.x, right.y);
            ctx!.stroke();
          }

          // Vertical lines
          if (r < rows - 1) {
            const down = project(nodes[idx + cols].x, nodes[idx + cols].y, nodes[idx + cols].z, rotY, rotX);
            const alpha = Math.max(0.04, Math.min(0.35, (curr.depth + 200) / 400));
            
            const distToMouse = Math.sqrt(Math.pow(curr.x - mouseCanvasX, 2) + Math.pow(curr.y - mouseCanvasY, 2));
            if (distToMouse < 180) {
              ctx!.strokeStyle = `rgba(0, 229, 255, ${alpha * 1.5})`;
            } else {
              ctx!.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.6})`;
            }

            ctx!.beginPath();
            ctx!.moveTo(curr.x, curr.y);
            ctx!.lineTo(down.x, down.y);
            ctx!.stroke();
          }

          // Draw node points in vibrant cyan
          if (r % 2 === 0 && c % 2 === 0) {
            const alpha = Math.max(0.3, Math.min(1.0, (curr.depth + 200) / 400));
            
            // Vibrant cyan base dot
            ctx!.fillStyle = `rgba(0, 229, 255, ${alpha})`;
            ctx!.beginPath();
            ctx!.arc(curr.x, curr.y, 2.5 * curr.scale, 0, Math.PI * 2);
            ctx!.fill();

            // Additional glowing ring around points for more "blue effect"
            ctx!.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.4})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.arc(curr.x, curr.y, 6 * curr.scale, 0, Math.PI * 2);
            ctx!.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouse);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <div className={styles.leftCol}>
          <div className={styles.metaLabel}>01 // LIVE CAPTURE ENGINE</div>
          <h1 className={styles.title}>
            DESIGNED FOR<br />
            STAYING POWER.
          </h1>
          <p className={styles.subtitle}>
            A zero-friction, ephemeral webhook catcher. Create a temporary URL instantly, point your integration, and inspect incoming payloads in real-time. No configuration required.
          </p>
        </div>
        <div className={styles.rightCol}>
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>
      </div>

      <div className={styles.statsSection}>
        <div className={styles.statBox}>
          <h3 className={styles.statNum}>&lt; 200ms</h3>
          <p className={styles.statLabel}>LATENCY CAPTURE</p>
          <p className={styles.statDesc}>Immediate ingestion of webhook payloads straight to memory cache.</p>
        </div>
        <div className={styles.statBox}>
          <h3 className={styles.statNum}>WSS://</h3>
          <p className={styles.statLabel}>REAL-TIME FANOUT</p>
          <p className={styles.statDesc}>Sub-second state broadcasts directly into active browser connections.</p>
        </div>
        <div className={styles.statBox}>
          <h3 className={styles.statNum}>100%</h3>
          <p className={styles.statLabel}>EPHEMERAL DATA</p>
          <p className={styles.statDesc}>All capture payloads are auto-purged from the database after one hour.</p>
        </div>
        <div className={styles.statBox}>
          <h3 className={styles.statNum}>0 //</h3>
          <p className={styles.statLabel}>CREATION FRICTION</p>
          <p className={styles.statDesc}>Zero signups, authorization credentials, or personal keys required.</p>
        </div>
      </div>
    </div>
  );
}
