"use client";

import { useEffect, useState } from 'react';
import NetworkCard from '@/components/NetworkCard';
import ConfigModal from '@/components/ConfigModal';
import UptimeChart from '@/components/UptimeChart';
import { ServerData, NetworkData, DbSchema } from '@/lib/db';
import { 
  Activity, ShieldCheck, AlertTriangle, RefreshCw, Cpu, Server, Network, 
  Settings, Key, AlertCircle, CheckCircle2, ChevronRight, Lock, Database, Wifi, Shield, Radio, Check, X
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<DbSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/status');
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch IT parameters:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s auto sync
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#334155', background: '#f8f6ec' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <RefreshCw size={48} style={{ animation: 'spin 1s linear infinite', color: '#c2410c' }} />
          <p style={{ fontWeight: 600 }}>Initializing Utkal Alumina NOC Panel...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const totalServers = data.servers.length;
  const operationalServers = data.servers.filter(s => s.status === 'operational').length;
  const serverAlerts = data.servers.filter(s => s.status !== 'operational' || s.backupStatus === 'failed').length;

  const totalNetworks = data.networks.length;
  const operationalNetworks = data.networks.filter(n => n.status === 'operational').length;
  const networkAlerts = totalNetworks - operationalNetworks;

  const avgCpu = Math.round(data.servers.reduce((acc, s) => acc + s.cpu, 0) / totalServers);
  const avgMemory = Math.round(data.servers.reduce((acc, s) => acc + s.memory, 0) / totalServers);

  // Group connected sources count
  const activeSourcesCount = Object.values(data.configs).filter(c => c.connected).length;

  return (
    <main className="layout-container">
      {/* Header */}
      <header className="header" style={{ marginBottom: '0.625rem' }}>
        <Server size={28} color="var(--primary)" />
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.875rem', lineHeight: 1 }}>
            Utkal Alumina IT Dashboard
          </h1>
          <p style={{ fontSize: '0.725rem', color: '#475569', marginTop: '1px', fontWeight: 500 }}>Enterprise IT Infrastructure & Gateway Monitoring — NOC Widescreen Console</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.725rem', background: 'rgba(234, 88, 12, 0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(234, 88, 12, 0.15)' }}>
            <span style={{ width: '4px', height: '4px', background: 'var(--primary)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 10s infinite' }}></span>
            <span style={{ fontWeight: 600 }}>10s Sync</span>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
            Sync: {lastUpdated?.toLocaleTimeString()}
          </span>
          <button 
            onClick={() => setIsConfigOpen(true)}
            style={{
              background: 'rgba(234, 88, 12, 0.08)',
              border: '1px solid rgba(234, 88, 12, 0.25)',
              padding: '0.3rem 0.625rem',
              borderRadius: '6px',
              color: '#c2410c',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              transition: 'all 0.2s',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(234, 88, 12, 0.15)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(234, 88, 12, 0.08)'; }}
          >
            <Settings size={12} />
            Configure Sources
          </button>
        </div>
      </header>

      {/* Corporate KPIs (Enlarged Figures) */}
      <div className="global-stats" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div className="glass-panel stat-box" style={{ padding: '0.625rem 1rem' }}>
          <span className="stat-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Location Node</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)', marginTop: '2px' }}>
            <Server size={18} color="var(--primary)" />
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.025em' }}>Utkal Alumina</span>
          </div>
        </div>

        <div className="glass-panel stat-box" style={{ padding: '0.625rem 1rem' }}>
          <span className="stat-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Avg Core Load</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--foreground)', marginTop: '2px' }}>
            <Cpu size={18} color="var(--secondary)" />
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{avgCpu}% <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>CPU</span> / {avgMemory}% <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>RAM</span></span>
          </div>
        </div>

        <div className="glass-panel stat-box" style={{ padding: '0.625rem 1rem' }}>
          <span className="stat-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Integrations Connected</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: activeSourcesCount > 0 ? 'var(--primary)' : '#64748b', marginTop: '2px' }}>
            <Database size={18} color={activeSourcesCount > 0 ? 'var(--primary)' : '#64748b'} />
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{activeSourcesCount} / 4 <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Active</span></span>
          </div>
        </div>

        <div className="glass-panel stat-box" style={{ padding: '0.625rem 1rem' }}>
          <span className="stat-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>System Health Status</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: (serverAlerts + networkAlerts) === 0 ? 'var(--success)' : 'var(--warning)', marginTop: '2px' }}>
            {(serverAlerts + networkAlerts) === 0 ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
            <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {(serverAlerts + networkAlerts) === 0 ? 'Healthy' : `${serverAlerts + networkAlerts} Warnings`}
            </span>
          </div>
        </div>
      </div>

      {/* 3-Column NOC Layout Wrapper */}
      <div style={{ display: 'flex', flex: 1, gap: '0.75rem', overflow: 'hidden', minHeight: 0, marginBottom: '0.375rem' }}>
        
        {/* COLUMN 1: Symphony Summit First, then ISP Status */}
        <div style={{ flex: '1 1 30%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, gap: '0.625rem' }}>
          
          {/* A. Symphony Summit Card */}
          <div style={{ flexShrink: 0 }}>
            <h2 className="section-title" style={{ fontSize: '0.95rem', marginBottom: '0.375rem' }}>
              <Radio size={14} color="var(--primary)" />
              Symphony Summit Service Desk
            </h2>
            {data.configs.symphony.connected ? (
              <div className="glass-panel provider-card" style={{ height: '145px', padding: '0.625rem 0.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div className="card-header" style={{ marginBottom: '2px' }}>
                  <div className="card-title">
                    <Radio size={15} color="var(--primary)" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>Summit ITSM</div>
                      <div style={{ fontSize: '0.6rem', color: '#475569', fontWeight: 500 }}>Operations Queues</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: 'var(--secondary)', 
                      fontWeight: 800,
                      background: 'rgba(13, 148, 136, 0.08)',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '3px',
                      border: '1px solid rgba(13, 148, 136, 0.18)'
                    }}>
                      SLA {data.symphony.serviceRequestsSla}%
                    </span>
                    <div className="card-status status-operational" style={{ padding: '0.1rem 0.3rem' }}>
                      <span className="status-dot operational" style={{ width: '4px', height: '4px' }}></span>
                      <span style={{ fontSize: '0.6rem' }}>Active</span>
                    </div>
                  </div>
                </div>
                
                {/* 2x2 Operations Ticket Grid with VERY Large Bold Numbers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', flex: 1, minHeight: 0, margin: '0.25rem 0' }}>
                  <div className="metric-box" style={{ padding: '0.4rem 0.5rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-label" style={{ fontSize: '0.675rem', fontWeight: 600 }}>Open Incidents</span>
                    <span className="metric-value" style={{ fontSize: '1.25rem', fontWeight: 800, color: data.symphony.openIncidents > 0 ? 'var(--danger)' : 'var(--success)' }}>{data.symphony.openIncidents}</span>
                  </div>
                  <div className="metric-box" style={{ padding: '0.4rem 0.5rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-label" style={{ fontSize: '0.675rem', fontWeight: 600 }}>Service Requests</span>
                    <span className="metric-value" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{data.symphony.serviceRequests}</span>
                  </div>
                  <div className="metric-box" style={{ padding: '0.4rem 0.5rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-label" style={{ fontSize: '0.675rem', fontWeight: 600 }}>Work Orders</span>
                    <span className="metric-value" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{data.symphony.workOrders}</span>
                  </div>
                  <div className="metric-box" style={{ padding: '0.4rem 0.5rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-label" style={{ fontSize: '0.675rem', fontWeight: 600 }}>Change Requests</span>
                    <span className="metric-value" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning)' }}>{data.symphony.changeRequests}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ height: '145px' }}>
                <DisconnectCard system="Symphony ITSM" icon={<Radio size={18} color="#64748b" />} onConnect={() => setIsConfigOpen(true)} />
              </div>
            )}
          </div>

          {/* B. ISP Gateway Status */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, gap: '0.375rem' }}>
            <h2 className="section-title" style={{ fontSize: '0.95rem', margin: 0 }}>
              <Network size={14} color="var(--primary)" />
              ISP Gateway Status
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minHeight: 0 }}>
              {data.networks.map((net) => (
                <div key={net.id} style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                  <NetworkCard key={net.id} {...net} />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLUMN 2: Local Server Clusters (Smartface, CLMS, DHCP, ILMS APP, ILMS DB) */}
        <div style={{ flex: '1 1 34%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <h2 className="section-title" style={{ fontSize: '0.95rem', marginBottom: '0.375rem', flexShrink: 0 }}>
            <Server size={14} color="var(--primary)" />
            Utkal Alumina Server Nodes
          </h2>
          <div className="glass-panel" style={{ flex: 1, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.725rem' }}>
              <thead>
                <tr style={{ background: 'rgba(234, 88, 12, 0.04)', borderBottom: '1px solid rgba(234, 88, 12, 0.1)', color: '#475569' }}>
                  <th style={{ padding: '0.5rem 0.625rem', fontWeight: 700 }}>Node</th>
                  <th style={{ padding: '0.5rem 0.625rem', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '0.5rem 0.625rem', fontWeight: 700 }}>CPU</th>
                  <th style={{ padding: '0.5rem 0.625rem', fontWeight: 700 }}>RAM</th>
                  <th style={{ padding: '0.5rem 0.625rem', fontWeight: 700 }}>Disk</th>
                  <th style={{ padding: '0.5rem 0.625rem', fontWeight: 700 }}>Backup</th>
                </tr>
              </thead>
              <tbody>
                {data.servers.map((server) => (
                  <tr key={server.id} style={{ borderBottom: '1px solid rgba(234, 88, 12, 0.06)', transition: 'background 0.2s' }} className="table-row-hover">
                    <td style={{ padding: '0.55rem 0.625rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Server size={11} color="var(--primary)" />
                      {server.name}
                    </td>
                    <td style={{ padding: '0.55rem 0.625rem' }}>
                      <span style={getStatusBadgeStyle(server.status)}>
                        <span className={`status-dot ${server.status}`} style={{ margin: 0, width: '4px', height: '4px' }}></span>
                        <span style={{ textTransform: 'capitalize' }}>{server.status}</span>
                      </span>
                    </td>
                    <td style={{ padding: '0.55rem 0.625rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem' }}>{server.cpu}%</span>
                        <div style={{ width: '40px', height: '2px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1px', overflow: 'hidden' }}>
                          <div style={{ width: `${server.cpu}%`, height: '100%', background: server.cpu > 85 ? 'var(--danger)' : 'var(--primary)' }}></div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.55rem 0.625rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem' }}>{server.memory}%</span>
                        <div style={{ width: '40px', height: '2px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1px', overflow: 'hidden' }}>
                          <div style={{ width: `${server.memory}%`, height: '100%', background: server.memory > 85 ? 'var(--danger)' : 'var(--primary)' }}></div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.55rem 0.625rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem' }}>{server.disk}%</span>
                        <div style={{ width: '40px', height: '2px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1px', overflow: 'hidden' }}>
                          <div style={{ width: `${server.disk}%`, height: '100%', background: server.disk > 90 ? 'var(--danger)' : 'var(--primary)' }}></div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.55rem 0.625rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '3px',
                        background: server.backupStatus === 'successful' ? 'rgba(15, 118, 110, 0.08)' : 'rgba(190, 18, 60, 0.08)',
                        border: '1px solid',
                        borderColor: server.backupStatus === 'successful' ? 'rgba(15, 118, 110, 0.2)' : 'rgba(190, 18, 60, 0.2)',
                        color: server.backupStatus === 'successful' ? 'var(--success)' : 'var(--danger)'
                      }}>
                        {server.backupStatus === 'successful' ? <Check size={10} /> : <X size={10} />}
                        {server.backupStatus === 'successful' ? 'Success' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMN 3: Nutanix, ISMS Oracle APEX, and IT Compliance stacked vertically */}
        <div style={{ flex: '1 1 36%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, gap: '0.375rem' }}>
          <h2 className="section-title" style={{ fontSize: '0.95rem', marginBottom: '0.375rem', flexShrink: 0 }}>
            <Database size={14} color="var(--primary)" />
            Nutanix & APEX Portal Integrations
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minHeight: 0 }}>
            
            {/* Nutanix Cluster (Top, 22% height) */}
            <div style={{ height: '115px', display: 'flex', minHeight: 0, flexShrink: 0 }}>
              {data.configs.nutanix.connected ? (
                <div className="glass-panel provider-card" style={{ flex: 1, padding: '0.5rem 0.625rem', gap: '0.25rem' }}>
                  <div className="card-header" style={{ marginBottom: '1px' }}>
                    <div className="card-title" style={{ fontSize: '0.8rem' }}>
                      <Server size={14} color="var(--primary)" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>Nutanix Cluster</div>
                        <div style={{ fontSize: '0.55rem', color: '#475569', fontWeight: 500 }}>CLI SSH Handshake Active</div>
                      </div>
                    </div>
                    <div className="card-status status-operational" style={{ padding: '0.1rem 0.25rem' }}>
                      <span className="status-dot operational" style={{ width: '4px', height: '4px' }}></span>
                      <span style={{ fontSize: '0.55rem' }}>Active</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', fontSize: '0.625rem' }}>
                    <div className="metric-box" style={{ padding: '0.3rem 0.5rem' }}>
                      <span className="metric-label" style={{ fontSize: '0.625rem' }}>Uptime</span>
                      <span className="metric-value" style={{ fontSize: '1.05rem', fontWeight: 800 }}>{data.nutanix.uptime.replace(' 12m', '')}</span>
                    </div>
                    <div className="metric-box" style={{ padding: '0.3rem 0.5rem' }}>
                      <span className="metric-label" style={{ fontSize: '0.625rem' }}>Hosts</span>
                      <span className="metric-value" style={{ fontSize: '1.05rem', fontWeight: 800 }}>{data.nutanix.nodesCount} Nodes</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifycontent: 'space-between', marginBottom: '1px', fontSize: '0.675rem' }}>
                      <span style={{ color: '#475569', fontWeight: 600 }}>Storage Pool</span>
                      <span style={{ fontWeight: 800, fontSize: '0.775rem', color: '#0f172a', float: 'right' }}>{data.nutanix.storageUsage}%</span>
                    </div>
                    <div style={{ height: '5px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '2.5px', overflow: 'hidden', clear: 'both' }}>
                      <div style={{ width: `${data.nutanix.storageUsage}%`, height: '100%', background: 'var(--primary)' }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <DisconnectCard system="Nutanix CLI" icon={<Server size={15} color="#64748b" />} onConnect={() => setIsConfigOpen(true)} />
              )}
            </div>

            {/* ISMS APEX Objectives (Middle, 20% height) */}
            <div style={{ height: '105px', display: 'flex', minHeight: 0, flexShrink: 0 }}>
              {data.configs.isms.connected ? (
                <div className="glass-panel provider-card" style={{ flex: 1, padding: '0.5rem 0.625rem', justifyContent: 'flex-start', gap: '0.25rem' }}>
                  <div className="card-header" style={{ marginBottom: '1px' }}>
                    <div className="card-title" style={{ fontSize: '0.8rem' }}>
                      <Database size={14} color="var(--primary)" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a' }}>ISMS APEX</div>
                        <div style={{ fontSize: '0.55rem', color: '#475569', fontWeight: 500 }}>ISO 27001 Objectives</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', fontSize: '0.625rem', flex: 1, alignItems: 'center' }}>
                    {data.isms.slice(0, 4).map((obj) => (
                      <div key={obj.id} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f172a' }}>
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100px', fontSize: '0.575rem', color: '#475569', fontWeight: 600 }}>{obj.name}</span>
                          <span style={{ fontWeight: 800, fontSize: '0.725rem', color: '#0f172a' }}>{obj.progress}%</span>
                        </div>
                        <div style={{ height: '3px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                          <div style={{ width: `${obj.progress}%`, height: '100%', background: obj.progress === 100 ? 'var(--success)' : 'var(--primary)' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <DisconnectCard system="ISMS Oracle APEX" icon={<Database size={15} color="#64748b" />} onConnect={() => setIsConfigOpen(true)} />
              )}
            </div>

            {/* IT Compliance Card (Bottom, stacked, full width) */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              {data.configs.compliance.connected ? (
                <div className="glass-panel provider-card" style={{ flex: 1, padding: '0.625rem 0.875rem', gap: '0.5rem', justifyContent: 'flex-start' }}>
                  
                  {/* Header (with ENLARGED dynamic Average score badge) */}
                  <div className="card-header" style={{ marginBottom: '1px', flexShrink: 0 }}>
                    <div className="card-title" style={{ fontSize: '0.85rem' }}>
                      <Shield size={16} color="var(--primary)" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>IT Compliance</div>
                        <div style={{ fontSize: '0.55rem', color: '#475569', fontWeight: 500 }}>Oracle APEX Compliance Portal</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        color: 'var(--success)',
                        background: 'rgba(15, 118, 110, 0.08)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(15, 118, 110, 0.25)',
                        boxShadow: '0 0 10px rgba(15, 118, 110, 0.06)'
                      }}>
                        Average Compliance: {data.compliance.endpointAverage}%
                      </span>
                    </div>
                  </div>

                  {/* Body divided side-by-side */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1rem', flex: 1, minHeight: 0 }}>
                    
                    {/* Left Sub-Column: Server Compliance + Large KPI Ring */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', justifyContent: 'center' }}>
                      
                      {/* Server Compliance (Enlarged) */}
                      <div style={{ background: 'rgba(234, 88, 12, 0.03)', border: '1px solid rgba(234, 88, 12, 0.08)', padding: '0.4rem 0.5rem', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.625rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.025em', marginBottom: '4px' }}>
                          Server Compliance
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', marginBottom: '2px' }}>
                              <span style={{ color: '#475569', fontWeight: 600 }}>OS Compliance</span>
                              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.75rem' }}>{data.compliance.serverOs}%</span>
                            </div>
                            <div style={{ height: '3px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                              <div style={{ width: `${data.compliance.serverOs}%`, height: '100%', background: 'var(--primary)' }}></div>
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', marginBottom: '2px' }}>
                              <span style={{ color: '#475569', fontWeight: 600 }}>Patch Compliance</span>
                              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.75rem' }}>{data.compliance.serverPatch}%</span>
                            </div>
                            <div style={{ height: '3px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                              <div style={{ width: `${data.compliance.serverPatch}%`, height: '100%', background: 'var(--primary)' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Unified Average Badge box */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(15, 118, 110, 0.03)',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(15, 118, 110, 0.1)',
                        textAlign: 'center'
                      }}>
                        <ShieldCheck size={24} color="var(--success)" style={{ marginBottom: '2px' }} />
                        <span style={{ fontSize: '0.55rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Security Index</span>
                        <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--success)', marginTop: '1px', letterSpacing: '0.05em' }}>SECURE</span>
                      </div>
                    </div>

                    {/* Right Sub-Column: Endpoint Compliance single column list of 11 parameters */}
                    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                      <div style={{ fontSize: '0.625rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.025em', marginBottom: '4px', flexShrink: 0 }}>
                        Endpoint Compliance Parameters (Single Column List)
                      </div>
                      
                      {/* Highly-visible, clean list table */}
                      <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        paddingRight: '2px'
                      }} className="custom-scroll">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.625rem', background: 'rgba(234, 88, 12, 0.03)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                          <span style={{ color: '#334155', fontWeight: 600 }}>CrowdStrike Client</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end', marginLeft: '1rem' }}>
                            <div style={{ width: '60px', height: '3px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                              <div style={{ width: `${data.compliance.endpointCsClient}%`, height: '100%', background: 'var(--primary)' }}></div>
                            </div>
                            <span style={{ fontWeight: 800, color: '#0f172a', minWidth: '22px', textAlign: 'right', fontSize: '0.675rem' }}>{data.compliance.endpointCsClient}%</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.625rem', background: 'rgba(234, 88, 12, 0.03)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                          <span style={{ color: '#334155', fontWeight: 600 }}>CrowdStrike Patch</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end', marginLeft: '1rem' }}>
                            <div style={{ width: '60px', height: '3px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                              <div style={{ width: `${data.compliance.endpointCsPatch}%`, height: '100%', background: 'var(--primary)' }}></div>
                            </div>
                            <span style={{ fontWeight: 800, color: '#0f172a', minWidth: '22px', textAlign: 'right', fontSize: '0.675rem' }}>{data.compliance.endpointCsPatch}%</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.625rem', background: 'rgba(234, 88, 12, 0.03)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                          <span style={{ color: '#334155', fontWeight: 600 }}>Intune Client</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end', marginLeft: '1rem' }}>
                            <div style={{ width: '60px', height: '3px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                              <div style={{ width: `${data.compliance.endpointIntuneClient}%`, height: '100%', background: 'var(--primary)' }}></div>
                            </div>
                            <span style={{ fontWeight: 800, color: '#0f172a', minWidth: '22px', textAlign: 'right', fontSize: '0.675rem' }}>{data.compliance.endpointIntuneClient}%</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.625rem', background: 'rgba(234, 88, 12, 0.03)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                          <span style={{ color: '#334155', fontWeight: 600 }}>Intune Patch</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end', marginLeft: '1rem' }}>
                            <div style={{ width: '60px', height: '3px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                              <div style={{ width: `${data.compliance.endpointIntunePatch}%`, height: '100%', background: 'var(--primary)' }}></div>
                            </div>
                            <span style={{ fontWeight: 800, color: '#0f172a', minWidth: '22px', textAlign: 'right', fontSize: '0.675rem' }}>{data.compliance.endpointIntunePatch}%</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.625rem', background: 'rgba(234, 88, 12, 0.03)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                          <span style={{ color: '#334155', fontWeight: 600 }}>ClearPass Agent</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end', marginLeft: '1rem' }}>
                            <div style={{ width: '60px', height: '3px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                              <div style={{ width: `${data.compliance.endpointClearpass}%`, height: '100%', background: 'var(--primary)' }}></div>
                            </div>
                            <span style={{ fontWeight: 800, color: '#0f172a', minWidth: '22px', textAlign: 'right', fontSize: '0.675rem' }}>{data.compliance.endpointClearpass}%</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.625rem', background: 'rgba(234, 88, 12, 0.03)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                          <span style={{ color: '#334155', fontWeight: 600 }}>Supported OS</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end', marginLeft: '1rem' }}>
                            <div style={{ width: '60px', height: '3px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                              <div style={{ width: `${data.compliance.endpointSupportedOs}%`, height: '100%', background: 'var(--primary)' }}></div>
                            </div>
                            <span style={{ fontWeight: 800, color: '#0f172a', minWidth: '22px', textAlign: 'right', fontSize: '0.675rem' }}>{data.compliance.endpointSupportedOs}%</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.625rem', background: 'rgba(234, 88, 12, 0.03)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                          <span style={{ color: '#334155', fontWeight: 600 }}>SAM Agent</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end', marginLeft: '1rem' }}>
                            <div style={{ width: '60px', height: '3px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                              <div style={{ width: `${data.compliance.endpointSamAgent}%`, height: '100%', background: 'var(--primary)' }}></div>
                            </div>
                            <span style={{ fontWeight: 800, color: '#0f172a', minWidth: '22px', textAlign: 'right', fontSize: '0.675rem' }}>{data.compliance.endpointSamAgent}%</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.625rem', background: 'rgba(234, 88, 12, 0.03)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                          <span style={{ color: '#334155', fontWeight: 600 }}>HSD Compliance</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end', marginLeft: '1rem' }}>
                            <div style={{ width: '60px', height: '3px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                              <div style={{ width: `${data.compliance.endpointHsd}%`, height: '100%', background: 'var(--success)' }}></div>
                            </div>
                            <span style={{ fontWeight: 800, color: 'var(--success)', minWidth: '22px', textAlign: 'right', fontSize: '0.675rem' }}>{data.compliance.endpointHsd}%</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.625rem', background: 'rgba(234, 88, 12, 0.03)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                          <span style={{ color: '#334155', fontWeight: 600 }}>Domain Compliance</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end', marginLeft: '1rem' }}>
                            <div style={{ width: '60px', height: '3px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                              <div style={{ width: `${data.compliance.endpointDomain}%`, height: '100%', background: 'var(--primary)' }}></div>
                            </div>
                            <span style={{ fontWeight: 800, color: '#0f172a', minWidth: '22px', textAlign: 'right', fontSize: '0.675rem' }}>{data.compliance.endpointDomain}%</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.625rem', background: 'rgba(234, 88, 12, 0.03)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                          <span style={{ color: '#334155', fontWeight: 600 }}>BitLocker Active</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'flex-end', marginLeft: '1rem' }}>
                            <div style={{ width: '60px', height: '3px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                              <div style={{ width: `${data.compliance.endpointBitlocker}%`, height: '100%', background: 'var(--primary)' }}></div>
                            </div>
                            <span style={{ fontWeight: 800, color: '#0f172a', minWidth: '22px', textAlign: 'right', fontSize: '0.675rem' }}>{data.compliance.endpointBitlocker}%</span>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              ) : (
                <DisconnectCard system="IT Compliance APEX" icon={<Shield size={18} color="#64748b" />} onConnect={() => setIsConfigOpen(true)} />
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Config Panel Modal */}
      <ConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        configs={data.configs}
        onSave={fetchData}
      />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .section-title {
          font-size: 0.95rem; 
          font-weight: 700; 
          color: #1e293b; 
          margin-bottom: 0.375rem; 
          border-bottom: 1px solid rgba(234, 88, 12, 0.15); 
          padding-bottom: 0.2rem; 
          display: flex; 
          align-items: center; 
          gap: 0.375rem;
        }
        .metric-box {
          background: rgba(234, 88, 12, 0.03); 
          border-radius: 4px; 
          border: 1px solid rgba(234, 88, 12, 0.08);
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .metric-label {
          color: #475569; 
          font-size: 0.55rem;
        }
        .metric-value {
          font-size: 0.775rem; 
          font-weight: 700; 
          color: var(--foreground);
        }
        .table-row-hover:hover {
          background: rgba(234, 88, 12, 0.025);
        }
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(234, 88, 12, 0.12);
          border-radius: 2px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(234, 88, 12, 0.2);
        }
      `}} />
    </main>
  );
}

function getStatusBadgeStyle(status: string): React.CSSProperties {
  const isOk = status === 'operational';
  const isDegraded = status === 'degraded';
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    padding: '0.1rem 0.35rem',
    borderRadius: '3px',
    fontSize: '0.625rem',
    fontWeight: 600,
    background: isOk ? 'rgba(13, 148, 136, 0.08)' : isDegraded ? 'rgba(234, 88, 12, 0.08)' : 'rgba(190, 18, 60, 0.08)',
    border: '1px solid',
    borderColor: isOk ? 'rgba(13, 148, 136, 0.2)' : isDegraded ? 'rgba(234, 88, 12, 0.2)' : 'rgba(190, 18, 60, 0.2)',
    color: isOk ? 'var(--success)' : isDegraded ? 'var(--warning)' : 'var(--danger)'
  };
}

interface DisconnectCardProps {
  system: string;
  icon: React.ReactNode;
  onConnect: () => void;
}

function DisconnectCard({ system, icon, onConnect }: DisconnectCardProps) {
  return (
    <div className="glass-panel provider-card" style={{
      justifyContent: 'center',
      alignItems: 'center',
      padding: '0.5rem',
      textAlign: 'center',
      borderStyle: 'dashed',
      borderColor: 'rgba(234, 88, 12, 0.18)',
      background: 'rgba(234, 88, 12, 0.01)',
      height: '100%',
      width: '100%'
    }}>
      <div style={{
        background: 'rgba(234, 88, 12, 0.04)',
        padding: '0.25rem',
        borderRadius: '50%',
        marginBottom: '0.2rem',
        border: '1px solid rgba(234, 88, 12, 0.08)',
        display: 'inline-flex'
      }}>
        {icon}
      </div>
      <div>
        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a', marginBottom: '1px' }}>{system}</h4>
        <p style={{ fontSize: '0.55rem', color: '#475569', maxWidth: '120px', margin: '0 auto 0.25rem', lineHeight: 1.2 }}>
          Credentials required.
        </p>
      </div>
      <button 
        onClick={onConnect}
        style={{
          background: 'rgba(234, 88, 12, 0.06)',
          border: '1px solid rgba(234, 88, 12, 0.18)',
          padding: '0.2rem 0.4rem',
          borderRadius: '4px',
          color: '#c2410c',
          cursor: 'pointer',
          fontSize: '0.625rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = 'transparent'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(234, 88, 12, 0.06)'; e.currentTarget.style.color = '#c2410c'; e.currentTarget.style.borderColor = 'rgba(234, 88, 12, 0.18)'; }}
      >
        <span>Connect</span>
        <ChevronRight size={8} />
      </button>
    </div>
  );
}
