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
        <div className="metric-box" style={{ padding: '0.35rem 0.5rem', display: 'flex', flexDirection: 'column', background: 'rgba(234, 88, 12, 0.03)', border: '1px solid rgba(234, 88, 12, 0.08)' }}>
          <span className="metric-label" style={{ fontSize: '0.625rem', color: '#475569', fontWeight: 600 }}>Latency</span>
          <span className="metric-value" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{latency} ms</span>
        </div>
        <div className="metric-box" style={{ padding: '0.35rem 0.5rem', display: 'flex', flexDirection: 'column', background: 'rgba(234, 88, 12, 0.03)', border: '1px solid rgba(234, 88, 12, 0.08)' }}>
          <span className="metric-label" style={{ fontSize: '0.625rem', color: '#475569', fontWeight: 600 }}>Uptime SLA</span>
          <span className="metric-value" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{uptime}%</span>
        </div>
      </div>

      <div style={{ marginTop: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '0.7rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#475569', fontWeight: 500 }}>
            <Activity size={10} /> Bandwidth Utilization
          </span>
          <span style={{ fontWeight: 800, fontSize: '0.825rem', color: '#0f172a' }}>{utilization}%</span>
        </div>
        <div style={{ height: '5px', background: 'rgba(15, 23, 42, 0.06)', borderRadius: '2.5px', overflow: 'hidden' }}>
          <div style={{ width: `${utilization}%`, height: '100%', background: 'linear-gradient(to right, #ea580c, #c2410c)', borderRadius: '2.5px', transition: 'width 0.5s ease-out' }}></div>
        </div>
      </div>

      <div style={{ marginTop: '2px' }}>
        <div style={{ fontSize: '0.6rem', color: '#64748b', marginBottom: '2px' }}>Bandwidth Load Trend (20m)</div>
        <UptimeChart data={chartData} status={status} />
      </div>
    </div>
  );
}
