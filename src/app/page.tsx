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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#94a3b8', background: '#0b0f19' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <RefreshCw size={48} style={{ animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
          <p>Initializing Utkal Alumina NOC Panel...</p>
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
        <Server size={28} color="#3b82f6" />
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.875rem', lineHeight: 1 }}>
            Utkal Alumina IT Dashboard
          </h1>
          <p style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '1px' }}>Enterprise IT Infrastructure & Gateway Monitoring — NOC Widescreen Console</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.725rem', background: 'rgba(255,255,255,0.02)', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ width: '4px', height: '4px', background: '#3b82f6', borderRadius: '50%', display: 'inline-block', animation: 'pulse 10s infinite' }}></span>
            <span>10s Sync</span>
          </div>
          <span style={{ fontSize: '0.75rem' }}>
            Sync: {lastUpdated?.toLocaleTimeString()}
          </span>
          <button 
            onClick={() => setIsConfigOpen(true)}
            style={{
              background: 'rgba(37, 99, 235, 0.1)',
              border: '1px solid rgba(37, 99, 235, 0.25)',
              padding: '0.3rem 0.625rem',
              borderRadius: '6px',
              color: '#3b82f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              transition: 'all 0.2s',
              fontSize: '0.75rem',
              fontWeight: 500
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(37, 99, 235, 0.2)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)'; }}
          >
            <Settings size={12} />
            Configure Sources
          </button>
        </div>
      </header>

      {/* Corporate KPIs */}
      <div className="global-stats" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div className="glass-panel stat-box" style={{ padding: '0.5rem 0.875rem' }}>
          <span className="stat-label" style={{ fontSize: '0.7rem' }}>Location Node</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--foreground)' }}>
            <Server size={15} color="#64748b" />
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Utkal Alumina</span>
          </div>
        </div>

        <div className="glass-panel stat-box" style={{ padding: '0.5rem 0.875rem' }}>
          <span className="stat-label" style={{ fontSize: '0.7rem' }}>Avg Core Load</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--foreground)' }}>
            <Cpu size={15} color="#3b82f6" />
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{avgCpu}% CPU / {avgMemory}% RAM</span>
          </div>
        </div>

        <div className="glass-panel stat-box" style={{ padding: '0.5rem 0.875rem' }}>
          <span className="stat-label" style={{ fontSize: '0.7rem' }}>Integrations Connected</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: activeSourcesCount > 0 ? '#3b82f6' : '#64748b' }}>
            <Database size={15} color={activeSourcesCount > 0 ? '#3b82f6' : '#64748b'} />
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{activeSourcesCount} / 4 Connected</span>
          </div>
        </div>

        <div className="glass-panel stat-box" style={{ padding: '0.5rem 0.875rem' }}>
          <span className="stat-label" style={{ fontSize: '0.7rem' }}>System Health Status</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: (serverAlerts + networkAlerts) === 0 ? '#3b82f6' : '#f59e0b' }}>
            {(serverAlerts + networkAlerts) === 0 ? <ShieldCheck size={15} /> : <AlertTriangle size={15} />}
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>
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
              <Radio size={14} color="#3b82f6" />
              Symphony Summit Service Desk
            </h2>
            {data.configs.symphony.connected ? (
              <div className="glass-panel provider-card" style={{ height: '145px', padding: '0.625rem 0.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div className="card-header" style={{ marginBottom: '2px' }}>
                  <div className="card-title">
                    <Radio size={15} color="#3b82f6" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Summit ITSM</div>
                      <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Operations Queues</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 600 }}>SLA {data.symphony.serviceRequestsSla}%</span>
                    <div className="card-status status-operational" style={{ padding: '0.1rem 0.3rem' }}>
                      <span className="status-dot operational" style={{ width: '4px', height: '4px' }}></span>
                      <span style={{ fontSize: '0.6rem' }}>Active</span>
                    </div>
                  </div>
                </div>
                
                {/* 2x2 Operations Ticket Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', flex: 1, minHeight: 0, margin: '0.25rem 0' }}>
                  <div className="metric-box" style={{ padding: '0.2rem 0.375rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-label" style={{ fontSize: '0.625rem' }}>Open Incidents</span>
                    <span className="metric-value" style={{ fontSize: '0.8rem', color: data.symphony.openIncidents > 0 ? '#ef4444' : '#10b981' }}>{data.symphony.openIncidents}</span>
                  </div>
                  <div className="metric-box" style={{ padding: '0.2rem 0.375rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-label" style={{ fontSize: '0.625rem' }}>Service Requests</span>
                    <span className="metric-value" style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>{data.symphony.serviceRequests}</span>
                  </div>
                  <div className="metric-box" style={{ padding: '0.2rem 0.375rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-label" style={{ fontSize: '0.625rem' }}>Work Orders</span>
                    <span className="metric-value" style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>{data.symphony.workOrders}</span>
                  </div>
                  <div className="metric-box" style={{ padding: '0.2rem 0.375rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="metric-label" style={{ fontSize: '0.625rem' }}>Change Requests</span>
                    <span className="metric-value" style={{ fontSize: '0.8rem', color: '#f59e0b' }}>{data.symphony.changeRequests}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ height: '145px' }}>
                <DisconnectCard system="Symphony ITSM" icon={<Radio size={18} color="#64748b" />} onConnect={() => setIsConfigOpen(true)} />
              </div>
            )}
          </div>

          {/* B. ISP Status (RJIO & RailTel) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, gap: '0.375rem' }}>
            <h2 className="section-title" style={{ fontSize: '0.95rem', margin: 0 }}>
              <Network size={14} color="#3b82f6" />
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
            <Server size={14} color="#3b82f6" />
            Utkal Alumina Server Nodes
          </h2>
          <div className="glass-panel" style={{ flex: 1, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.725rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                  <th style={{ padding: '0.5rem 0.625rem', fontWeight: 600 }}>Node</th>
                  <th style={{ padding: '0.5rem 0.625rem', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '0.5rem 0.625rem', fontWeight: 600 }}>CPU</th>
                  <th style={{ padding: '0.5rem 0.625rem', fontWeight: 600 }}>RAM</th>
                  <th style={{ padding: '0.5rem 0.625rem', fontWeight: 600 }}>Disk</th>
                  <th style={{ padding: '0.5rem 0.625rem', fontWeight: 600 }}>Backup</th>
                </tr>
              </thead>
              <tbody>
                {data.servers.map((server) => (
                  <tr key={server.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="table-row-hover">
                    <td style={{ padding: '0.55rem 0.625rem', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Server size={11} color="#3b82f6" />
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
                        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{server.cpu}%</span>
                        <div style={{ width: '40px', height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden' }}>
                          <div style={{ width: `${server.cpu}%`, height: '100%', background: server.cpu > 85 ? 'var(--danger)' : 'var(--primary)' }}></div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.55rem 0.625rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{server.memory}%</span>
                        <div style={{ width: '40px', height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden' }}>
                          <div style={{ width: `${server.memory}%`, height: '100%', background: server.memory > 85 ? 'var(--danger)' : 'var(--primary)' }}></div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.55rem 0.625rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{server.disk}%</span>
                        <div style={{ width: '40px', height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden' }}>
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
                        fontWeight: 600,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '3px',
                        background: server.backupStatus === 'successful' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid',
                        borderColor: server.backupStatus === 'successful' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: server.backupStatus === 'successful' ? '#10b981' : '#ef4444'
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

        {/* COLUMN 3: Rest of Integrations (Nutanix, ISMS Oracle APEX, Compliance APEX) */}
        <div style={{ flex: '1 1 36%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, gap: '0.375rem' }}>
          <h2 className="section-title" style={{ fontSize: '0.95rem', marginBottom: '0.375rem', flexShrink: 0 }}>
            <Database size={14} color="#3b82f6" />
            Nutanix & APEX Portal Integrations
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minHeight: 0 }}>
            
            {/* Nutanix Cluster */}
            <div style={{ flex: '1 1 50%', display: 'flex', minHeight: 0 }}>
              {data.configs.nutanix.connected ? (
                <div className="glass-panel provider-card" style={{ flex: 1, padding: '0.75rem' }}>
                  <div className="card-header">
                    <div className="card-title">
                      <Server size={15} color="#3b82f6" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Nutanix Cluster</div>
                        <div style={{ fontSize: '0.6rem', color: '#64748b' }}>CLI SSH Handshake Active</div>
                      </div>
                    </div>
                    <div className="card-status status-operational" style={{ padding: '0.1rem 0.3rem' }}>
                      <span className="status-dot operational" style={{ width: '4px', height: '4px' }}></span>
                      <span style={{ fontSize: '0.6rem' }}>Active</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', fontSize: '0.675rem' }}>
                    <div className="metric-box" style={{ padding: '0.25rem 0.375rem' }}>
                      <span className="metric-label">Uptime</span>
                      <span className="metric-value" style={{ fontSize: '0.725rem' }}>{data.nutanix.uptime.replace(' 12m', '')}</span>
                    </div>
                    <div className="metric-box" style={{ padding: '0.25rem 0.375rem' }}>
                      <span className="metric-label">Hosts</span>
                      <span className="metric-value" style={{ fontSize: '0.725rem' }}>{data.nutanix.nodesCount} Nodes</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px', fontSize: '0.675rem' }}>
                      <span style={{ color: '#94a3b8' }}>Storage Pool</span>
                      <span style={{ fontWeight: 500 }}>{data.nutanix.storageUsage}%</span>
                    </div>
                    <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                      <div style={{ width: `${data.nutanix.storageUsage}%`, height: '100%', background: 'var(--primary)' }}></div>
                    </div>
                  </div>
                  <div style={{ marginTop: '1px' }}>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', marginBottom: '2px' }}>CPU Load History (20m)</div>
                    <UptimeChart data={data.nutanix.historyCpu.map((v, i) => ({ day: `${i}`, uptime: v }))} status="operational" />
                  </div>
                </div>
              ) : (
                <DisconnectCard system="Nutanix CLI" icon={<Server size={18} color="#64748b" />} onConnect={() => setIsConfigOpen(true)} />
              )}
            </div>

            {/* Row containing ISMS Objectives Portal & IT Compliance APEX side-by-side to save height */}
            <div style={{ flex: '1 1 50%', display: 'flex', gap: '0.5rem', minHeight: 0 }}>
              
              {/* ISMS APEX */}
              <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                {data.configs.isms.connected ? (
                  <div className="glass-panel provider-card" style={{ flex: 1, padding: '0.75rem' }}>
                    <div className="card-header">
                      <div className="card-title">
                        <Database size={15} color="#3b82f6" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>ISMS APEX</div>
                          <div style={{ fontSize: '0.6rem', color: '#64748b' }}>ISO 27001 Metrics</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.625rem', marginTop: '0.25rem' }}>
                      {data.isms.slice(0, 3).map((obj) => (
                        <div key={obj.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px', color: '#e2e8f0' }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '70px' }}>{obj.name}</span>
                            <span style={{ fontWeight: 600 }}>{obj.progress}%</span>
                          </div>
                          <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                            <div style={{ width: `${obj.progress}%`, height: '100%', background: obj.progress === 100 ? '#10b981' : 'var(--primary)' }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <DisconnectCard system="ISMS Oracle APEX" icon={<Database size={18} color="#64748b" />} onConnect={() => setIsConfigOpen(true)} />
                )}
              </div>

              {/* Compliance APEX */}
              <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                {data.configs.compliance.connected ? (
                  <div className="glass-panel provider-card" style={{ flex: 1, padding: '0.75rem' }}>
                    <div className="card-header">
                      <div className="card-title">
                        <Shield size={15} color="#3b82f6" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Compliance</div>
                          <div style={{ fontSize: '0.6rem', color: '#64748b' }}>Oracle APEX API</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.625rem', marginTop: '0.25rem' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px' }}>
                          <span style={{ color: '#94a3b8' }}>OS Patches</span>
                          <span style={{ fontWeight: 600, color: 'white' }}>{data.compliance.workstationsPatched}%</span>
                        </div>
                        <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                          <div style={{ width: `${data.compliance.workstationsPatched}%`, height: '100%', background: 'var(--primary)' }}></div>
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px' }}>
                          <span style={{ color: '#94a3b8' }}>Antivirus Active</span>
                          <span style={{ fontWeight: 600, color: 'white' }}>{data.compliance.antivirusActive}%</span>
                        </div>
                        <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                          <div style={{ width: `${data.compliance.antivirusActive}%`, height: '100%', background: '#10b981' }}></div>
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px' }}>
                          <span style={{ color: '#94a3b8' }}>DLP Enforced</span>
                          <span style={{ fontWeight: 600, color: 'white' }}>{data.compliance.dlpEnabled}%</span>
                        </div>
                        <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '1.5px', overflow: 'hidden' }}>
                          <div style={{ width: `${data.compliance.dlpEnabled}%`, height: '100%', background: 'var(--primary)' }}></div>
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
          font-weight: 600; 
          color: #f8fafc; 
          margin-bottom: 0.375rem; 
          border-bottom: 1px solid rgba(255,255,255,0.05); 
          padding-bottom: 0.2rem; 
          display: flex; 
          align-items: center; 
          gap: 0.375rem;
        }
        .metric-box {
          background: rgba(255,255,255,0.02); 
          border-radius: 4px; 
          border: 1px solid rgba(255,255,255,0.03);
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .metric-label {
          color: #94a3b8; 
          font-size: 0.55rem;
        }
        .metric-value {
          font-size: 0.775rem; 
          font-weight: 600; 
          color: var(--foreground);
        }
        .table-row-hover:hover {
          background: rgba(255,255,255,0.015);
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
    fontWeight: 500,
    background: isOk ? 'rgba(59, 130, 246, 0.08)' : isDegraded ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
    border: '1px solid',
    borderColor: isOk ? 'rgba(59, 130, 246, 0.2)' : isDegraded ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
    color: isOk ? '#3b82f6' : isDegraded ? '#f59e0b' : '#ef4444'
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
      borderColor: 'rgba(255,255,255,0.08)',
      height: '100%'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        padding: '0.25rem',
        borderRadius: '50%',
        marginBottom: '0.2rem',
        border: '1px solid rgba(255,255,255,0.04)',
        display: 'inline-flex'
      }}>
        {icon}
      </div>
      <div>
        <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1px' }}>{system}</h4>
        <p style={{ fontSize: '0.55rem', color: '#64748b', maxWidth: '120px', margin: '0 auto 0.25rem', lineHeight: 1.2 }}>
          Credentials required.
        </p>
      </div>
      <button 
        onClick={onConnect}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '0.2rem 0.4rem',
          borderRadius: '4px',
          color: '#e2e8f0',
          cursor: 'pointer',
          fontSize: '0.625rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.borderColor = 'transparent'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
      >
        <span>Connect</span>
        <ChevronRight size={8} />
      </button>
    </div>
  );
}
