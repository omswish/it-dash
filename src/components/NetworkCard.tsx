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
    <div className="glass-panel provider-card" style={{ width: '100%', padding: '0.625rem 0.75rem' }}>
      <div className="card-header" style={{ marginBottom: '4px' }}>
        <div className="card-title">
          {getIcon()}
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{provider}</div>
            <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '1px' }}>ISP Gateway Connection</div>
          </div>
        </div>
        <div className={`card-status status-${status}`} style={{ padding: '0.1rem 0.3rem' }}>
          <span className={`status-dot ${status}`} style={{ width: '4px', height: '4px' }}></span>
          <span style={{ fontSize: '0.6rem', textTransform: 'capitalize' }}>{status}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', fontSize: '0.725rem' }}>
        <div className="metric-box" style={{ padding: '0.35rem 0.5rem', display: 'flex', flexDirection: 'column' }}>
          <span className="metric-label" style={{ fontSize: '0.625rem' }}>Latency</span>
          <span className="metric-value" style={{ fontSize: '1.2rem', fontWeight: 800 }}>{latency} ms</span>
        </div>
        <div className="metric-box" style={{ padding: '0.35rem 0.5rem', display: 'flex', flexDirection: 'column' }}>
          <span className="metric-label" style={{ fontSize: '0.625rem' }}>Uptime SLA</span>
          <span className="metric-value" style={{ fontSize: '1.2rem', fontWeight: 800 }}>{uptime}%</span>
        </div>
      </div>

      <div style={{ marginTop: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '0.7rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#94a3b8' }}>
            <Activity size={10} /> Bandwidth Utilization
          </span>
          <span style={{ fontWeight: 700, fontSize: '0.825rem', color: 'white' }}>{utilization}%</span>
        </div>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${utilization}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px', transition: 'width 0.5s ease-out' }}></div>
        </div>
      </div>

      <div style={{ marginTop: '2px' }}>
        <div style={{ fontSize: '0.6rem', color: '#64748b', marginBottom: '2px' }}>Bandwidth Load Trend (20m)</div>
        <UptimeChart data={chartData} status={status} />
      </div>
    </div>
  );
}
