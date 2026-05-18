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
    if (id.includes('att')) return <Wifi className="icon" size={22} color="#3b82f6" />;
    return <Radio className="icon" size={22} color="#3b82f6" />;
  };

  const chartData = history.map((val, idx) => ({
    day: `t-${20 - idx}`,
    uptime: val, // map value to uptime field of UptimeChart
  }));

  return (
    <div className="glass-panel provider-card">
      <div className="card-header">
        <div className="card-title">
          {getIcon()}
          <div>
            <div style={{ fontWeight: 600 }}>{provider}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>ISP Gateway Connection</div>
          </div>
        </div>
        <div className={`card-status status-${status}`}>
          <span className={`status-dot ${status}`}></span>
          <span style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>{status}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '4px' }}>Latency</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--foreground)' }}>{latency} ms</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '4px' }}>Uptime SLA</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--foreground)' }}>{uptime}%</div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.875rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
            <Activity size={14} /> Bandwidth Utilization
          </span>
          <span style={{ fontWeight: 500 }}>{utilization}%</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${utilization}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px', transition: 'width 0.5s ease-out' }}></div>
        </div>
      </div>

      <div style={{ marginTop: '0.5rem' }}>
        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>Bandwidth Load Trend (20m)</div>
        <UptimeChart data={chartData} status={status} />
      </div>
    </div>
  );
}
