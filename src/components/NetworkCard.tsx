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

export default function NetworkCard({ provider, status, uptime, latency, utilization, history }: NetworkCardProps) {
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

  const isCritical = status === 'degraded' || status === 'down' || utilization >= 80;
  const normalColor = provider.toLowerCase().includes('rjio') ? '#0d9488' : '#0284c7'; // teal vs blue
  const normalBg = provider.toLowerCase().includes('rjio') ? 'rgba(13, 148, 136, 0.02)' : 'rgba(2, 132, 199, 0.02)';
  const normalBorder = provider.toLowerCase().includes('rjio') ? 'rgba(13, 148, 136, 0.08)' : 'rgba(2, 132, 199, 0.08)';
  const normalRxBg = provider.toLowerCase().includes('rjio') ? 'rgba(13, 148, 136, 0.04)' : 'rgba(2, 132, 199, 0.04)';
  const normalRxBorder = provider.toLowerCase().includes('rjio') ? 'rgba(13, 148, 136, 0.12)' : 'rgba(2, 132, 199, 0.12)';
  
  const primaryColor = isCritical ? '#ef4444' : normalColor;
  const accentBg = isCritical ? 'rgba(239, 68, 68, 0.02)' : normalBg;
  const accentBorder = isCritical ? 'rgba(239, 68, 68, 0.08)' : normalBorder;
  const rxBg = isCritical ? 'rgba(239, 68, 68, 0.04)' : normalRxBg;
  const rxBorder = isCritical ? 'rgba(239, 68, 68, 0.1)' : normalRxBorder;
  const rxTextColor = isCritical ? '#ef4444' : normalColor;
  const loadGradient = isCritical 
    ? 'linear-gradient(to right, #ef4444, #dc2626)' 
    : provider.toLowerCase().includes('rjio')
      ? 'linear-gradient(to right, #0d9488, #14b8a6)' 
      : 'linear-gradient(to right, #0284c7, #0ea5e9)';

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
        <div className={`card-status status-${status}`} style={{ padding: '0.15rem 0.4rem', color: primaryColor, backgroundColor: accentBg, border: `1px solid ${accentBorder}` }}>
          <span className={`status-dot ${status}`} style={{ width: '5px', height: '5px', backgroundColor: primaryColor }}></span>
          <span style={{ fontSize: '0.675rem', fontWeight: 700, textTransform: 'capitalize' }}>{status}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
        <div className="metric-box" style={{ padding: '0.35rem 0.5rem', display: 'flex', flexDirection: 'column', background: accentBg, border: `1px solid ${accentBorder}` }}>
          <span className="metric-label" style={{ fontSize: '0.675rem', color: '#475569', fontWeight: 700, fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Latency</span>
          <span className="metric-value" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-heading)' }}>{latency} ms</span>
        </div>
        <div className="metric-box" style={{ padding: '0.35rem 0.5rem', display: 'flex', flexDirection: 'column', background: accentBg, border: `1px solid ${accentBorder}` }}>
          <span className="metric-label" style={{ fontSize: '0.675rem', color: '#475569', fontWeight: 700, fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Uptime SLA</span>
          <span className="metric-value" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-heading)' }}>{uptime}%</span>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569', fontWeight: 700 }}>
            <Activity size={11} color={primaryColor} /> Total Load
          </span>
          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', fontFamily: 'var(--font-heading)' }}>{utilization}%</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${utilization}%`, height: '100%', background: loadGradient, borderRadius: '3px', transition: 'width 0.5s ease-out' }}></div>
        </div>
      </div>

      {/* Rx / Tx splits */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.7rem', marginTop: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', background: rxBg, border: `1px solid ${rxBorder}`, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
          <span style={{ fontWeight: 700 }}>Rx Traffic:</span>
          <span style={{ fontWeight: 800, color: rxTextColor }}>{currentRx} Mbps</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', background: 'rgba(71, 85, 105, 0.04)', border: '1px solid rgba(71, 85, 105, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
          <span style={{ fontWeight: 700 }}>Tx Traffic:</span>
          <span style={{ fontWeight: 800, color: '#475569' }}>{currentTx} Mbps</span>
        </div>
      </div>

      <div style={{ marginTop: '2px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ fontSize: '0.675rem', color: '#64748b', marginBottom: '3px', fontWeight: 600 }}>Rx & Tx Load Trend (20m)</div>
        <div style={{ flex: 1, minHeight: '56px' }}>
          <UptimeChart data={chartData} status={status} strokeColor={primaryColor} />
        </div>
      </div>
    </div>
  );
}
