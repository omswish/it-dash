"use client";

import { useEffect, useState } from 'react';
import NetworkCard from '@/components/NetworkCard';
import ConfigModal from '@/components/ConfigModal';
import { ServerData, DbSchema } from '@/lib/db';
import { 
  ShieldCheck, AlertTriangle, RefreshCw, Cpu, Server, Network, 
  Settings, Key, ChevronRight, Database, Radio, Check, X, Info
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, XAxis, Tooltip } from 'recharts';





function renderTicketCategoryVerticalBarChart(
  title: string,
  total: number,
  breakdown: { new: number; assigned: number; inProgress: number; pending: number } | undefined,
  chartColor: string,
  slaContent?: React.ReactNode
) {
  const chartData = [
    { name: 'New', value: breakdown?.new ?? 0 },
    { name: 'Assigned', value: breakdown?.assigned ?? 0 },
    { name: 'In Progress', value: breakdown?.inProgress ?? 0 },
    { name: 'Pending', value: breakdown?.pending ?? 0 }
  ];

  const hasNewTickets = (breakdown?.new ?? 0) > 0;
  
  return (
    <div className="metric-box" style={{ 
      padding: '0.45rem 0.55rem', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between',
      height: '100%',
      minHeight: 0,
      background: 'rgba(var(--primary-rgb), 0.02)',
      border: '1px solid rgba(var(--primary-rgb), 0.1)',
      borderRadius: '8px'
    }}>
      {/* Category Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.15rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span className="metric-label" style={{ 
            fontSize: '0.625rem', 
            fontWeight: 800, 
            fontFamily: 'var(--font-heading)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.025em',
            color: 'var(--foreground)'
          }}>
            {title}
          </span>
          {slaContent ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              fontSize: '0.525rem', 
              color: 'var(--foreground)',
              opacity: 0.8,
              lineHeight: 1.2
            }}>
              {slaContent}
            </div>
          ) : (
            <div style={{ 
              fontSize: '0.525rem', 
              color: 'var(--foreground)',
              opacity: 0.5,
              lineHeight: 1.2
            }}>
              SLA: N/A
            </div>
          )}
        </div>
        <span className="metric-value" style={{ 
          fontSize: '6.5rem', 
          fontWeight: 900, 
          color: hasNewTickets || chartColor === 'var(--danger)' ? 'var(--danger)' : 'var(--foreground)', 
          fontFamily: 'var(--font-heading)', 
          lineHeight: 0.8 
        }}>
          {total}
        </span>
      </div>
      
      {/* Vertical Bar Chart Container (allocated more vertical space: 100px) */}
      <div style={{ height: '100px', width: '100%', marginTop: '0.25rem', marginBottom: '0.15rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 12, right: 5, left: 5, bottom: 2 }}>
            <XAxis 
              dataKey="name" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fontSize: 7, fill: 'var(--foreground)', fontWeight: 700 }}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'var(--card-bg)', 
                border: '1px solid var(--card-border)', 
                borderRadius: '4px',
                fontSize: '9px',
                color: 'var(--foreground)',
                padding: '2px 4px'
              }}
              labelStyle={{ fontWeight: 800 }}
            />
            <Bar 
              dataKey="value" 
              radius={[3, 3, 0, 0]} 
              barSize={22}
              label={{ position: 'top', fill: 'var(--foreground)', fontSize: 8, fontWeight: 800 }}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.name === 'New' && entry.value > 0 ? 'var(--danger)' : chartColor} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DbSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const [time, setTime] = useState(new Date());

  // Stateful server hover sparkline popover
  const [hoveredServer, setHoveredServer] = useState<ServerData | null>(null);
  const [popoverCoords, setPopoverCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });



  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    Promise.resolve().then(() => {
      fetchData();
    });
    const interval = setInterval(fetchData, 10000); // 10s auto sync
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--secondary)', background: '#f5f4ef' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <RefreshCw size={48} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
          <p style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>Initializing Utkal Alumina NOC Panel...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const serverAlerts = data.servers.filter(s => s.status !== 'operational' || s.backupStatus === 'failed').length;

  const totalNetworks = data.networks.length;
  const operationalNetworks = data.networks.filter(n => n.status === 'operational').length;
  const networkAlerts = totalNetworks - operationalNetworks;

  // Group connected sources count (excluding ISMS APEX since it is removed)
  const activeSourcesCount = [
    data.configs.nutanix,
    data.configs.symphony,
    data.configs.solarwinds
  ].filter(c => c && c.connected).length;

  const getNodeColor = (status: string) => {
    if (status === 'down') return '#be123c';
    if (status === 'degraded') return '#ea580c';
    return '#22c55e';
  };



  const sec = time.getSeconds();
  const min = time.getMinutes();
  const hr = time.getHours();

  const secAngle = sec * 6; // 360 / 60
  const minAngle = min * 6 + sec * 0.1;
  const hrAngle = (hr % 12) * 30 + min * 0.5;

  return (
    <main className="layout-container">
      {/* Header */}
      <header className="header" style={{ marginBottom: '0.625rem' }}>
        <Server size={28} color="var(--primary)" />
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.875rem', lineHeight: 1 }}>
            Utkal Alumina IT Dashboard
          </h1>
          <p style={{ fontSize: '0.725rem', color: 'var(--secondary)', marginTop: '2px', fontWeight: 600 }}>Enterprise IT Infrastructure & Gateway Monitoring — NOC Widescreen Console</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.725rem', background: 'rgba(var(--primary-rgb), 0.04)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(var(--primary-rgb), 0.12)' }}>
            <span style={{ width: '4px', height: '4px', background: 'var(--primary)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 10s infinite' }}></span>
            <span style={{ fontWeight: 700, fontFamily: 'var(--font-heading)' }}>10s Sync</span>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
            Sync: {lastUpdated?.toLocaleTimeString()}
          </span>
          <button 
            onClick={() => setIsConfigOpen(true)}
            style={{
              background: 'rgba(var(--primary-rgb), 0.06)',
              border: '1px solid rgba(var(--primary-rgb), 0.22)',
              padding: '0.3rem 0.625rem',
              borderRadius: '6px',
              color: 'var(--primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              transition: 'all 0.2s',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.12)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.06)'; }}
          >
            <Settings size={12} />
            Configure Sources
          </button>
        </div>
      </header>

      {/* Corporate KPIs */}
      <div className="global-stats" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
        
        {/* Card 1: HCI Health Card (linked to Nutanix source connection!) */}
        <div 
          onClick={() => !data.configs.nutanix.connected && setIsConfigOpen(true)}
          className="glass-panel stat-box" 
          style={{ 
            padding: '0.625rem 1.25rem', 
            flex: '1.6 1 0%', 
            cursor: data.configs.nutanix.connected ? 'default' : 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { if(!data.configs.nutanix.connected) e.currentTarget.style.borderColor = 'var(--primary)'; }}
          onMouseOut={(e) => { if(!data.configs.nutanix.connected) e.currentTarget.style.borderColor = 'var(--card-border)'; }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <span className="stat-label">HCI Health</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className={`status-dot ${data.configs.nutanix.connected ? 'operational' : 'down'}`} style={{ width: '5px', height: '5px' }}></span>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: data.configs.nutanix.connected ? 'var(--success)' : 'var(--danger)', textTransform: 'uppercase' }}>
                {data.configs.nutanix.connected ? (data.configs.nutanix.authMethod === 'Web Authentication (Prism Console)' ? 'Web Active' : 'CLI Active') : 'Disconnected'}
              </span>
            </div>
          </div>
          
          {data.configs.nutanix.connected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '2px' }}>
              {/* CPU / RAM */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Cpu size={16} color="var(--primary)" />
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--foreground)', fontFamily: 'var(--font-heading)' }}>
                  {data.nutanix.historyCpu?.[data.nutanix.historyCpu.length - 1] ?? 0}% <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 700 }}>CPU</span> / {data.nutanix.historyMem?.[data.nutanix.historyMem.length - 1] ?? 0}% <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 700 }}>RAM</span>
                </span>
              </div>
              {/* Divider */}
              <div style={{ width: '1px', height: '14px', background: 'rgba(100, 116, 139, 0.2)' }}></div>
              {/* Storage usage */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Database size={16} color="var(--secondary)" />
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--foreground)', fontFamily: 'var(--font-heading)' }}>
                  {data.nutanix.storageUsage}% <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 700 }}>Storage</span>
                </span>
              </div>
              {/* Divider */}
              <div style={{ width: '1px', height: '14px', background: 'rgba(100, 116, 139, 0.2)' }}></div>
              {/* Nodes Status Indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Server size={16} color="var(--secondary)" style={{ marginRight: '1px' }} />
                <div style={{ display: 'flex', gap: '5px' }}>
                  {(data.nutanix.nodeStatuses || ['normal', 'normal', 'normal']).map((status, index) => {
                    const color = getNodeColor(status);
                    return (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(15, 23, 42, 0.03)', padding: '0.15rem 0.35rem', borderRadius: '4px', border: '1px solid rgba(15, 23, 42, 0.06)' }}>
                        <span className="status-dot" style={{ width: '5px', height: '5px', backgroundColor: color, animation: status !== 'normal' ? 'pulse 2s infinite' : 'none' }}></span>
                        <span style={{ fontSize: '0.675rem', fontWeight: 800, color: 'var(--foreground)' }}>N{index + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '2px', color: 'var(--secondary)' }}>
              <Key size={14} color="var(--danger)" />
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--secondary)' }}>Click to configure Nutanix connection details</span>
            </div>
          )}
        </div>

        {/* Card 2: Integrations Connected */}
        <div className="glass-panel stat-box" style={{ padding: '0.625rem 1rem', flex: '0.8 1 0%' }}>
          <span className="stat-label">Integrations Connected</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
            <Database size={18} color={activeSourcesCount > 0 ? 'var(--primary)' : 'var(--secondary)'} />
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>{activeSourcesCount} / 3 <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 700 }}>Active</span></span>
          </div>
        </div>

        {/* Card 3: System Health Status */}
        <div className="glass-panel stat-box" style={{ padding: '0.625rem 1rem', flex: '0.8 1 0%' }}>
          <span className="stat-label">System Health Status</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: (serverAlerts + networkAlerts) === 0 ? 'var(--success)' : 'var(--warning)', marginTop: '2px' }}>
            {(serverAlerts + networkAlerts) === 0 ? <ShieldCheck size={18} color="var(--success)" /> : <AlertTriangle size={18} color="var(--warning)" />}
            <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              {(serverAlerts + networkAlerts) === 0 ? 'Healthy' : `${serverAlerts + networkAlerts} Warnings`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (2/3) and Right Column (1/3) */}
      <div style={{ display: 'flex', gap: '0.75rem', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        
        {/* LEFT COLUMN: Service Desk & ISP Gateways */}
        <div style={{ flex: '1 1 66%', display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: 0 }}>
          
          {/* 1. Hindalco Service Desk Card */}
          <div style={{ height: '350px', display: 'flex', flexDirection: 'column', minHeight: 0, flexShrink: 0 }}>
            <h2 className="section-title" style={{ fontSize: '0.95rem', marginBottom: '0.375rem', flexShrink: 0 }}>
              <Radio size={14} color="var(--primary)" />
              Hindalco Service Desk
            </h2>
            {data.configs.symphony.connected ? (
              <div className="glass-panel provider-card" style={{ flex: 1, padding: '0.5rem 0.65rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0 }}>
                {(() => {
                  const hasCriticalIncident = data.symphony.activeIncidents?.some(
                    inc => inc.priority === 'P1' || inc.priority === 'P2'
                  ) ?? false;
                  
                  return (
                    <>
                      <div className="card-header" style={{ marginBottom: '0.25rem' }}>
                        <div className="card-title" style={{ fontSize: '0.85rem' }}>
                          <Radio size={14} color="var(--primary)" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            color: 'var(--secondary)', 
                            fontWeight: 800,
                            background: 'rgba(var(--primary-rgb), 0.06)',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            border: '1px solid rgba(var(--primary-rgb), 0.15)',
                            fontFamily: 'var(--font-heading)'
                          }}>
                            SLA {data.symphony.serviceRequestsSla}%
                          </span>
                          <div className="card-status status-operational" style={{ padding: '0.15rem 0.4rem' }}>
                            <span className="status-dot operational" style={{ width: '5px', height: '5px' }}></span>
                            <span style={{ fontSize: '0.675rem', fontWeight: 700 }}>Active</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 1x4 Ticket Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', minHeight: 0, margin: '0.15rem 0', flex: 1 }}>
                        {renderTicketCategoryVerticalBarChart(
                          'Open Incidents',
                          data.symphony.openIncidents,
                          data.symphony.openIncidentsBreakdown,
                          hasCriticalIncident ? 'var(--danger)' : '#1e3a8a',
                          <>
                            <span>Resp: <strong>{data.symphony.incidentsResponseSla}%</strong></span>
                            <span>Reso: <strong>{data.symphony.incidentsResolutionSla}%</strong></span>
                          </>
                        )}

                        {renderTicketCategoryVerticalBarChart(
                          'Service Requests',
                          data.symphony.serviceRequests,
                          data.symphony.serviceRequestsBreakdown,
                          '#d946ef',
                          <>
                            <span>Resp: <strong>{data.symphony.requestsResponseSla}%</strong></span>
                            <span>Reso: <strong>{data.symphony.requestsResolutionSla}%</strong></span>
                          </>
                        )}

                        {renderTicketCategoryVerticalBarChart(
                          'Work Orders',
                          data.symphony.workOrders,
                          data.symphony.workOrdersBreakdown,
                          'var(--primary)'
                        )}

                        {renderTicketCategoryVerticalBarChart(
                          'Change Requests',
                          data.symphony.changeRequests,
                          data.symphony.changeRequestsBreakdown,
                          'var(--primary)'
                        )}
                      </div>

                      {/* Active Incident List */}
                      <div style={{ marginTop: '0.45rem', borderTop: '1px solid var(--card-border)', paddingTop: '0.45rem', flexShrink: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.025em', color: 'var(--foreground)' }}>
                            Active Incidents
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }} className="custom-scroll">
                          {data.symphony.activeIncidents && data.symphony.activeIncidents.length > 0 ? (
                            data.symphony.activeIncidents.map((inc) => {
                              const isCritical = inc.priority === 'P1' || inc.priority === 'P2';
                              return (
                                <div 
                                  key={inc.id} 
                                  style={{ 
                                    flex: '0 0 auto',
                                    width: '180px',
                                    padding: '0.35rem 0.5rem',
                                    background: isCritical ? 'rgba(185, 28, 28, 0.02)' : 'rgba(var(--primary-rgb), 0.02)',
                                    border: isCritical ? '1px solid var(--danger)' : '1px solid var(--card-border)',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1px'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ 
                                      fontSize: '0.675rem', 
                                      fontWeight: 800, 
                                      color: isCritical ? 'var(--danger)' : 'var(--foreground)',
                                      fontFamily: 'var(--font-heading)',
                                      border: isCritical ? '1px solid var(--danger)' : 'none',
                                      padding: isCritical ? '0px 3px' : '0',
                                      borderRadius: isCritical ? '3px' : '0'
                                    }}>
                                      {inc.id}
                                    </span>
                                    <span style={{ 
                                      fontSize: '0.55rem', 
                                      fontWeight: 800, 
                                      padding: '0.05rem 0.2rem', 
                                      borderRadius: '3px',
                                      background: isCritical ? 'var(--danger)' : 'rgba(var(--primary-rgb), 0.1)',
                                      color: isCritical ? '#fff' : 'var(--foreground)'
                                    }}>
                                      {inc.priority}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.575rem', color: 'var(--foreground)', opacity: 0.8, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                    {inc.title}
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1px', fontSize: '0.55rem' }}>
                                    <span style={{ 
                                      color: isCritical ? 'var(--danger)' : 'var(--secondary)', 
                                      fontWeight: 700,
                                      border: isCritical ? '1px solid var(--danger)' : 'none',
                                      padding: isCritical ? '0px 3px' : '0',
                                      borderRadius: isCritical ? '2px' : '0'
                                    }}>
                                      👤 {inc.caller}
                                    </span>
                                    <span style={{ opacity: 0.7 }}>{inc.status}</span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <span style={{ fontSize: '0.625rem', color: 'var(--secondary)' }}>No active incidents logged.</span>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <DisconnectCard system="Hindalco ITSM" icon={<Radio size={16} color="var(--secondary)" />} onConnect={() => setIsConfigOpen(true)} />
            )}
          </div>

          {/* 2. ISP Gateway Status Card */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <h2 className="section-title" style={{ fontSize: '0.95rem', marginBottom: '0.375rem', flexShrink: 0 }}>
              <Network size={14} color="var(--primary)" />
              SDWAN & ILL Links (Side-by-Side)
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minHeight: 0, flexWrap: 'wrap' }}>
              {data.networks.map((net) => (
                <div key={net.id} style={{ flex: '1 1 calc(50% - 0.5rem)', display: 'flex', minHeight: '120px' }}>
                  <NetworkCard {...net} />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Server Nodes & Printer Cartridge Stock */}
        <div style={{ flex: '1 1 34%', display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: 0 }}>
          
          {/* 1. Utkal Alumina Server Nodes */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <h2 className="section-title" style={{ fontSize: '0.95rem', marginBottom: '0.375rem', flexShrink: 0 }}>
              <Server size={14} color="var(--primary)" />
              Utkal Alumina Server Nodes
            </h2>
            <div className="glass-panel" style={{ flex: 1, overflow: 'hidden', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.7rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(100, 116, 139, 0.05)', borderBottom: '1px solid rgba(100, 116, 139, 0.1)', color: 'var(--secondary)' }}>
                      <th style={{ padding: '0.45rem 0.55rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Node Name</th>
                      <th style={{ padding: '0.45rem 0.55rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Status</th>
                      <th style={{ padding: '0.45rem 0.55rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>CPU</th>
                      <th style={{ padding: '0.45rem 0.55rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>RAM</th>
                      <th style={{ padding: '0.45rem 0.55rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Disk</th>
                      <th style={{ padding: '0.45rem 0.55rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Backup</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.servers.map((server) => (
                      <tr key={server.id} style={{ borderBottom: '1px solid rgba(100, 116, 139, 0.06)', transition: 'background 0.2s' }} className="table-row-hover">
                        <td style={{ padding: '0.45rem 0.55rem', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Server size={10} color="var(--primary)" />
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '60px' }}>{server.name}</span>
                          <Info 
                            size={11} 
                            color="var(--primary)" 
                            style={{ cursor: 'pointer', marginLeft: 'auto', opacity: 0.8, transition: 'all 0.2s' }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredServer(server);
                              setPopoverCoords({
                                x: rect.left + window.scrollX + 16,
                                y: rect.top + window.scrollY - 55
                              });
                            }}
                            onMouseLeave={() => setHoveredServer(null)}
                            className="info-icon-hover"
                          />
                        </td>
                        <td style={{ padding: '0.45rem 0.55rem' }}>
                          <span style={getStatusBadgeStyle(server.status)}>
                            <span className={`status-dot ${server.status}`} style={{ margin: 0, width: '3px', height: '3px' }}></span>
                            <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>{server.status}</span>
                          </span>
                        </td>
                        <td style={{ padding: '0.45rem 0.55rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                            <span style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '0.75rem' }}>{server.cpu}%</span>
                            <div style={{ width: '35px', height: '2px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1px', overflow: 'hidden' }}>
                              <div style={{ width: `${server.cpu}%`, height: '100%', background: server.cpu > 85 ? 'var(--danger)' : 'var(--primary)' }}></div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.45rem 0.55rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                            <span style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '0.75rem' }}>{server.memory}%</span>
                            <div style={{ width: '35px', height: '2px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1px', overflow: 'hidden' }}>
                              <div style={{ width: `${server.memory}%`, height: '100%', background: server.memory > 85 ? 'var(--danger)' : 'var(--primary)' }}></div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.45rem 0.55rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                            <span style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '0.75rem' }}>{server.disk}%</span>
                            <div style={{ width: '35px', height: '2px', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '1px', overflow: 'hidden' }}>
                              <div style={{ width: `${server.disk}%`, height: '100%', background: server.disk > 90 ? 'var(--danger)' : 'var(--primary)' }}></div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.45rem 0.55rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '1px',
                            fontSize: '0.575rem',
                            fontWeight: 700,
                            padding: '0.08rem 0.25rem',
                            borderRadius: '3px',
                            background: server.backupStatus === 'successful' ? 'rgba(71, 85, 105, 0.06)' : 'rgba(185, 28, 28, 0.06)',
                            border: '1px solid',
                            borderColor: server.backupStatus === 'successful' ? 'rgba(71, 85, 105, 0.15)' : 'rgba(185, 28, 28, 0.15)',
                            color: server.backupStatus === 'successful' ? 'var(--success)' : 'var(--danger)'
                          }}>
                            {server.backupStatus === 'successful' ? <Check size={8} /> : <X size={8} />}
                            {server.backupStatus === 'successful' ? 'Success' : 'Failed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Notifications, Integration Connection Statuses, Analog Clock */}
      <footer className="glass-panel" style={{
        flexShrink: 0,
        height: '64px',
        marginTop: '0.5rem',
        padding: '0.4rem 1rem',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fffdf9',
        border: '1px solid rgba(var(--primary-rgb), 0.22)',
        gap: '1rem',
        overflow: 'hidden'
      }}>
        {/* Left Section: NOC Console Feed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.725rem', borderRight: '1px solid rgba(100, 116, 139, 0.15)', paddingRight: '1.25rem' }}>
            <span style={{ fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>NOC Feed:</span>
            <span style={{ color: 'var(--foreground)', fontWeight: 700 }}>
              {activeSourcesCount === 3 ? 'All integrations active' : `${3 - activeSourcesCount} systems offline`}
            </span>
          </div>
        </div>

        {/* Middle Section: Live Integration Status Badges */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.675rem', fontWeight: 800, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Endpoint Feeds:</span>
          
          {/* Symphony */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: data?.configs.symphony?.connected ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.06)',
            border: `1px solid ${data?.configs.symphony?.connected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            color: data?.configs.symphony?.connected ? 'var(--success)' : 'var(--danger)',
            fontSize: '0.7rem',
            fontWeight: 800
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: data?.configs.symphony?.connected ? 'var(--success)' : 'var(--danger)', display: 'inline-block' }}></span>
            <span>Hindalco ITSM (Symphony)</span>
          </div>

          {/* Nutanix */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: data?.configs.nutanix?.connected ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.06)',
            border: `1px solid ${data?.configs.nutanix?.connected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            color: data?.configs.nutanix?.connected ? 'var(--success)' : 'var(--danger)',
            fontSize: '0.7rem',
            fontWeight: 800
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: data?.configs.nutanix?.connected ? 'var(--success)' : 'var(--danger)', display: 'inline-block' }}></span>
            <span>Nutanix HCI</span>
          </div>

          {/* SolarWinds */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: data?.configs.solarwinds?.connected ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.06)',
            border: `1px solid ${data?.configs.solarwinds?.connected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            color: data?.configs.solarwinds?.connected ? 'var(--success)' : 'var(--danger)',
            fontSize: '0.7rem',
            fontWeight: 800
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: data?.configs.solarwinds?.connected ? 'var(--success)' : 'var(--danger)', display: 'inline-block' }}></span>
            <span>SolarWinds Orion</span>
          </div>
        </div>

        {/* Right Section: Date, Time & Analog Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.6rem', fontWeight: 700, color: 'var(--secondary)' }}>
            <span>{time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--foreground)', fontFamily: 'var(--font-heading)' }}>{time.toLocaleTimeString()}</span>
          </div>
          {/* SVG Clock */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="#fffdf9" stroke="var(--primary)" strokeWidth="5" />
              {/* ticks */}
              {[...Array(12)].map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const x1 = 50 + 38 * Math.sin(angle);
                const y1 = 50 - 38 * Math.cos(angle);
                const x2 = 50 + 43 * Math.sin(angle);
                const y2 = 50 - 43 * Math.cos(angle);
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />;
              })}
              {/* Hour hand */}
              <line x1="50" y1="50" x2={50 + 22 * Math.sin((hrAngle * Math.PI) / 180)} y2={50 - 22 * Math.cos((hrAngle * Math.PI) / 180)} stroke="var(--foreground)" strokeWidth="6" strokeLinecap="round" />
              {/* Minute hand */}
              <line x1="50" y1="50" x2={50 + 32 * Math.sin((minAngle * Math.PI) / 180)} y2={50 - 32 * Math.cos((minAngle * Math.PI) / 180)} stroke="var(--secondary)" strokeWidth="4" strokeLinecap="round" />
              {/* Second hand */}
              <line x1="50" y1="50" x2={50 + 38 * Math.sin((secAngle * Math.PI) / 180)} y2={50 - 38 * Math.cos((secAngle * Math.PI) / 180)} stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" />
              {/* center dot */}
              <circle cx="50" cy="50" r="3.5" fill="var(--foreground)" />
            </svg>
          </div>
        </div>
      </footer>



      {/* Dynamic Stateful 7D Server CPU History Tooltip Popover */}
      {hoveredServer && (
        <div style={{
          position: 'absolute',
          left: `${popoverCoords.x}px`,
          top: `${popoverCoords.y}px`,
          width: '160px',
          backgroundColor: '#fffdf9',
          border: '1px solid rgba(var(--primary-rgb), 0.22)',
          borderRadius: '8px',
          boxShadow: '0 8px 20px -4px rgba(120, 110, 90, 0.2)',
          padding: '0.4rem',
          zIndex: 9999,
          pointerEvents: 'none',
          animation: 'fadeIn 0.12s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--foreground)', fontFamily: 'var(--font-heading)' }}>
              {hoveredServer.name} 7D Load
            </span>
            <span style={{ fontSize: '0.575rem', fontWeight: 800, color: 'var(--primary)' }}>
              Avg: {hoveredServer.history && Array.isArray(hoveredServer.history) && hoveredServer.history.length > 0 
                ? Math.round(hoveredServer.history.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, hoveredServer.history.length)) 
                : 0}%
            </span>
          </div>
          
          {/* Mini 7D CPU area sparkline */}
          <div style={{ height: '32px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(hoveredServer.history && Array.isArray(hoveredServer.history) ? hoveredServer.history : []).slice(-7).map((val, idx) => ({ day: `D${idx+1}`, load: val }))} margin={{ top: 1, right: 1, left: 1, bottom: 1 }}>
                <defs>
                  <linearGradient id="hoverCpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="load" stroke="var(--primary)" strokeWidth={1.5} fill="url(#hoverCpuGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .section-title {
          font-family: var(--font-heading);
          font-size: 0.95rem; 
          font-weight: 800; 
          color: var(--foreground); 
          margin-bottom: 0.375rem; 
          border-bottom: 1px solid rgba(100, 116, 139, 0.15); 
          padding-bottom: 0.2rem; 
          display: flex; 
          align-items: center; 
          gap: 0.375rem;
          letter-spacing: -0.01em;
        }
        .metric-box {
          background: rgba(var(--primary-rgb), 0.02); 
          border-radius: 4px; 
          border: 1px solid rgba(var(--primary-rgb), 0.06);
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .metric-label {
          color: var(--secondary); 
          font-size: 0.55rem;
        }
        .metric-value {
          font-size: 0.775rem; 
          font-weight: 700; 
          color: var(--foreground);
        }
        .table-row-hover:hover {
          background: rgba(var(--primary-rgb), 0.02);
        }
        .custom-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.12);
          border-radius: 1.5px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.2);
        }
        .info-icon-hover:hover {
          opacity: 1 !important;
          transform: scale(1.15);
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
    gap: '2px',
    padding: '0.08rem 0.25rem',
    borderRadius: '3px',
    fontSize: '0.575rem',
    fontWeight: 700,
    background: isOk ? 'rgba(71, 85, 105, 0.06)' : isDegraded ? 'rgba(var(--primary-rgb), 0.06)' : 'rgba(185, 28, 28, 0.06)',
    border: '1px solid',
    borderColor: isOk ? 'rgba(71, 85, 105, 0.15)' : isDegraded ? 'rgba(var(--primary-rgb), 0.15)' : 'rgba(185, 28, 28, 0.15)',
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
      padding: '0.75rem 1rem',
      textAlign: 'center',
      borderStyle: 'dashed',
      borderColor: 'rgba(var(--primary-rgb), 0.15)',
      background: 'rgba(var(--primary-rgb), 0.01)',
      height: '100%',
      width: '100%'
    }}>
      <div style={{
        background: 'rgba(var(--primary-rgb), 0.03)',
        padding: '0.35rem',
        borderRadius: '50%',
        marginBottom: '0.35rem',
        border: '1px solid rgba(var(--primary-rgb), 0.06)',
        display: 'inline-flex'
      }}>
        {icon}
      </div>
      <div>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '2px', fontFamily: 'var(--font-heading)' }}>{system}</h4>
        <p style={{ fontSize: '0.675rem', color: 'var(--secondary)', maxWidth: '160px', margin: '0 auto 0.5rem', lineHeight: 1.3 }}>
          Credentials required.
        </p>
      </div>
      <button 
        onClick={onConnect}
        style={{
          background: 'rgba(var(--primary-rgb), 0.06)',
          border: '1px solid rgba(var(--primary-rgb), 0.18)',
          padding: '0.25rem 0.55rem',
          borderRadius: '4px',
          color: 'var(--primary)',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          transition: 'all 0.2s',
          fontFamily: 'var(--font-heading)'
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = 'transparent'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.06)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'rgba(var(--primary-rgb), 0.18)'; }}
      >
        <span>Connect</span>
        <ChevronRight size={8} />
      </button>
    </div>
  );
}
