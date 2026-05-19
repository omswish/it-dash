"use client";

import UptimeChart from './UptimeChart';
import { Activity, Radio, Wifi } from 'lucide-react';

interface NetworkCardProps {
  id: string;
  provider: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: number;
  latency: number;
  utilization: number;
  history: number[];
}

export default function NetworkCard({ id, provider, status, uptime, latency, utilization, history }: NetworkCardProps) {
  const getIcon = () => {
    if (provider.toLowerCase().includes('rjio')) {
      return <Wifi className="icon" size={16} color="var(--primary)" />;
    }
    return <Radio className="icon" size={16} color="var(--primary)" />;
  };

  // Split history into rx and tx deterministically (e.g., 62% rx, 38% tx with slight variance)
  const chartData = history.map((val, idx) => {
    const factor = idx % 2 === 0 ? 0.62 : 0.58;
    const rx = Math.round(val * factor);
    const tx = Math.round(val * (1 - factor));
    return {
      time: `${20 - idx}m ago`,
      rx,
      tx,
    };
  });

  const latestVal = history[history.length - 1] || utilization;
  const currentRx = Math.round(latestVal * 0.62);
  const currentTx = Math.round(latestVal * 0.38);

  return (
    <div className="glass-panel provider-card" style={{ width: '100%', padding: '1rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', overflow: 'hidden' }}>
      <div className="card-header" style={{ marginBottom: '2px' }}>
        <div className="card-title" style={{ fontSize: '0.9rem' }}>
          {getIcon()}
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{provider}</div>
            <div style={{ fontSize: '0.675rem', color: '#475569', fontWeight: 600 }}>ISP Gateway Connection</div>
          </div>
        </div>
        <div className={`card-status status-${status}`} style={{ padding: '0.15rem 0.4rem' }}>
          <span className={`status-dot ${status}`} style={{ width: '5px', height: '5px' }}></span>
          <span style={{ fontSize: '0.675rem', fontWeight: 700, textTransform: 'capitalize' }}>{status}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
        <div className="metric-box" style={{ padding: '0.35rem 0.5rem', display: 'flex', flexDirection: 'column', background: 'rgba(234, 88, 12, 0.02)', border: '1px solid rgba(234, 88, 12, 0.06)' }}>
          <span className="metric-label" style={{ fontSize: '0.675rem', color: '#475569', fontWeight: 700, fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Latency</span>
          <span className="metric-value" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-heading)' }}>{latency} ms</span>
        </div>
        <div className="metric-box" style={{ padding: '0.35rem 0.5rem', display: 'flex', flexDirection: 'column', background: 'rgba(234, 88, 12, 0.02)', border: '1px solid rgba(234, 88, 12, 0.06)' }}>
          <span className="metric-label" style={{ fontSize: '0.675rem', color: '#475569', fontWeight: 700, fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Uptime SLA</span>
          <span className="metric-value" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-heading)' }}>{uptime}%</span>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569', fontWeight: 700 }}>
            <Activity size={11} /> Total Load
          </span>
          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', fontFamily: 'var(--font-heading)' }}>{utilization}%</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${utilization}%`, height: '100%', background: 'linear-gradient(to right, #ea580c, #c2410c)', borderRadius: '3px', transition: 'width 0.5s ease-out' }}></div>
        </div>
      </div>

      {/* Rx / Tx splits */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.7rem', marginTop: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', background: 'rgba(194, 65, 12, 0.04)', border: '1px solid rgba(194, 65, 12, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
          <span style={{ fontWeight: 700 }}>Rx Traffic:</span>
          <span style={{ fontWeight: 800, color: '#c2410c' }}>{currentRx} Mbps</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', background: 'rgba(71, 85, 105, 0.04)', border: '1px solid rgba(71, 85, 105, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
          <span style={{ fontWeight: 700 }}>Tx Traffic:</span>
          <span style={{ fontWeight: 800, color: '#475569' }}>{currentTx} Mbps</span>
        </div>
      </div>

      <div style={{ marginTop: '2px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ fontSize: '0.675rem', color: '#64748b', marginBottom: '3px', fontWeight: 600 }}>Rx & Tx Load Trend (20m)</div>
        <div style={{ flex: 1, minHeight: '56px' }}>
          <UptimeChart data={chartData} status={status} />
        </div>
      </div>
    </div>
  );
}
