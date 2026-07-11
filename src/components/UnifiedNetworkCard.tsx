"use client";

import { NetworkData } from '@/lib/db';
import UptimeChart from './UptimeChart';
import { Activity, ShieldCheck, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';

interface UnifiedNetworkCardProps {
  networks: NetworkData[];
}

export default function UnifiedNetworkCard({ networks }: UnifiedNetworkCardProps) {
  const sdwanA = networks.find(n => n.provider.includes('HIL-UTK-EC-1'));
  const sdwanB = networks.find(n => n.provider.includes('HIL-UTK-EC-2'));
  const isp1 = networks.find(n => n.provider.includes('RJIO'));
  const isp2 = networks.find(n => n.provider.includes('RailTel'));

  const sdwanLinks = [sdwanA, sdwanB].filter(Boolean);
  const activeLinks = sdwanLinks.filter(n => n?.status === 'operational').length;
  const totalLinks = 2;

  // Derive overall health based on SD-WAN HA Status
  const isHealthy = activeLinks === totalLinks;
  
  // Weekly Availability % (Mock 99.98% if all good, lower otherwise)
  const availability = isHealthy ? 99.98 : 98.45;
  // Interruptions Count (Mock 0 if all good)
  const interruptions = isHealthy ? 0 : 2;

  const renderSparkline = (net: NetworkData | undefined, label: string, color: string) => {
    if (!net) return null;
    const history = net.history || Array(20).fill(0);
    const avgUtil = Math.round(history.reduce((a, b) => a + b, 0) / history.length);
    
    const chartData = history.map((val, idx) => ({
      time: `${20 - idx}m ago`,
      rx: Math.round(val * 0.62),
      tx: Math.round(val * 0.38),
    }));

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--foreground)' }}>{label}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)' }}>
            {net.latency ? `${net.latency}ms latency | ` : ''}{avgUtil}% Avg
          </span>
        </div>
        <div style={{ height: '50px', background: 'rgba(15, 23, 42, 0.02)', border: '1px solid var(--card-border)', borderRadius: '6px', overflow: 'hidden' }}>
          <UptimeChart data={chartData} status={net.status} strokeColor={color} />
        </div>
      </div>
    );
  };

  const getStatusIcon = (status: string | undefined) => {
    if (status === 'operational') return <CheckCircle2 size={14} color="var(--success)" />;
    if (status === 'degraded') return <AlertTriangle size={14} color="var(--warning)" />;
    return <XCircle size={14} color="var(--danger)" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
      {/* Top Row: Overall KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        <div className="provider-card" style={{ padding: '0.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>Overall Health</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {isHealthy ? <ShieldCheck size={16} color="var(--success)" /> : <AlertTriangle size={16} color="var(--warning)" />}
            <span style={{ fontSize: '1rem', fontWeight: 800, color: isHealthy ? 'var(--success)' : 'var(--warning)' }}>
              {isHealthy ? 'Optimal' : 'Degraded'}
            </span>
          </div>
        </div>
        
        <div className="provider-card" style={{ padding: '0.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>Weekly Availability</span>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--foreground)' }}>{availability}%</span>
        </div>

        <div className="provider-card" style={{ padding: '0.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>Interruptions (7d)</span>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--foreground)' }}>{interruptions}</span>
        </div>
      </div>

      {/* Middle Row: SDWAN HA Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
        <div className="provider-card" style={{ padding: '0.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--secondary)' }}>SDWAN-A (EC-1)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {getStatusIcon(sdwanA?.status)}
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'capitalize' }}>{sdwanA?.status || 'Unknown'}</span>
            {sdwanA?.latency ? (
              <span style={{ fontSize: '0.65rem', color: 'var(--secondary)', marginLeft: 'auto', fontWeight: 700 }}>
                {sdwanA.latency}ms
              </span>
            ) : null}
          </div>
        </div>
        
        <div className="provider-card" style={{ padding: '0.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--secondary)' }}>SDWAN-B (EC-2)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {getStatusIcon(sdwanB?.status)}
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'capitalize' }}>{sdwanB?.status || 'Unknown'}</span>
            {sdwanB?.latency ? (
              <span style={{ fontSize: '0.65rem', color: 'var(--secondary)', marginLeft: 'auto', fontWeight: 700 }}>
                {sdwanB.latency}ms
              </span>
            ) : null}
          </div>
        </div>

        <div className="provider-card" style={{ padding: '0.5rem', background: 'rgba(var(--primary-rgb), 0.04)', border: '1px solid rgba(var(--primary-rgb), 0.15)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>Links Up</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{activeLinks}/{totalLinks}</span>
        </div>
      </div>

      {/* Bottom Section: Combined SolarWinds Orion Chart Widget */}
      <div style={{ 
        marginTop: 'auto', 
        background: 'var(--card-bg)', 
        border: '1px solid var(--card-border)', 
        borderRadius: '8px', 
        padding: '0.625rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        fontSize: '0.7rem'
      }}>
        {/* Orion Chart Header & Time Picker */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(100, 116, 139, 0.1)', paddingBottom: '0.25rem' }}>
          <span style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '0.75rem' }}>ISP Link Performance</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.6rem', color: '#297994', fontWeight: 700 }}>
            <span>Last 12 hours</span>
          </div>
        </div>

        {/* Chart + Legend Columns */}
        <div style={{ display: 'flex', gap: '0.5rem', height: '100px' }}>
          {/* Left Chart Panel */}
          <div style={{ flex: 1.8, minWidth: 0, height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={Array.from({ length: 20 }, (_, idx) => ({
                time: `${20 - idx}m ago`,
                rjio: isp1?.history?.[idx] ?? 0,
                railtel: isp2?.history?.[idx] ?? 0,
              }))} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRjio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRailtel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fffdf9', 
                    border: '1px solid var(--card-border)',
                    borderRadius: '4px',
                    color: '#0f172a',
                    fontSize: '0.55rem',
                    padding: '2px 4px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="rjio" 
                  name="RJIO Util"
                  stroke="#0d9488" 
                  strokeWidth={1.5}
                  fillOpacity={1} 
                  fill="url(#colorRjio)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="railtel" 
                  name="RailTel Util"
                  stroke="#0284c7" 
                  strokeWidth={1.5}
                  fillOpacity={1} 
                  fill="url(#colorRailtel)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Right SolarWinds Legend Column */}
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'center' }}>
            
            {/* RJIO Legend Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Checkbox */}
              <div style={{ width: '10px', height: '10px', border: '1px solid #0d9488', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d9488' }}>
                <span style={{ fontSize: '7px', color: '#fff', fontWeight: 900 }}>✓</span>
              </div>
              {/* Big Number Tilebox */}
              <div style={{ 
                background: '#0d9488', 
                color: '#fff', 
                fontWeight: 800, 
                fontSize: '0.65rem', 
                padding: '1px 4px', 
                borderRadius: '3px',
                minWidth: '24px',
                textAlign: 'center'
              }}>
                {(isp1?.history?.[isp1.history.length - 1] ?? 0)}%
              </div>
              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.575rem', fontWeight: 700, color: 'var(--foreground)' }}>
                <span>Jio (ISP1)</span>
                {isp1?.latency ? <span style={{ opacity: 0.6, fontSize: '5px' }}>{isp1.latency}ms latency</span> : null}
              </div>
            </div>

            {/* RailTel Legend Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Checkbox */}
              <div style={{ width: '10px', height: '10px', border: '1px solid #0284c7', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0284c7' }}>
                <span style={{ fontSize: '7px', color: '#fff', fontWeight: 900 }}>✓</span>
              </div>
              {/* Big Number Tilebox */}
              <div style={{ 
                background: '#0284c7', 
                color: '#fff', 
                fontWeight: 800, 
                fontSize: '0.65rem', 
                padding: '1px 4px', 
                borderRadius: '3px',
                minWidth: '24px',
                textAlign: 'center'
              }}>
                {(isp2?.history?.[isp2.history.length - 1] ?? 0)}%
              </div>
              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.575rem', fontWeight: 700, color: 'var(--foreground)' }}>
                <span>RailTel (ISP2)</span>
                {isp2?.latency ? <span style={{ opacity: 0.6, fontSize: '5px' }}>{isp2.latency}ms latency</span> : null}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
