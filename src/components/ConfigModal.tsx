"use client";

import { useState } from 'react';
import { Settings, Server, Radio, Database, Key, Check, Loader2, AlertCircle, X, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  configs: {
    nutanix: { connected: boolean; endpoint: string; username: string; authMethod: string; secret?: string };
    symphony: { connected: boolean; endpoint: string; username: string; authMethod: string; secret?: string };
    solarwinds?: { connected: boolean; endpoint: string; endpointNetwork?: string; username: string; authMethod: string; secret?: string };
  };
  onSave: () => void;
}

type TabType = 'nutanix' | 'symphony' | 'solarwinds';

export default function ConfigModal({ isOpen, onClose, configs, onSave }: ConfigModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('nutanix');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);

  // Form states initialized with existing config if available
  const [form, setForm] = useState({
    nutanix: { endpoint: configs.nutanix.endpoint || 'https://10.23.50.27:9440/console/#login', username: configs.nutanix.username || 'nutanix_admin', secret: configs.nutanix.secret || '', method: configs.nutanix.authMethod || 'SSH Key' },
    symphony: { endpoint: configs.symphony.endpoint || 'https://hsd.adityabirla.com/MDLIncidentMgmt/SDE_Dashboard.aspx', username: configs.symphony.username || 'symphony_agent', secret: configs.symphony.secret || '', method: configs.symphony.authMethod || 'SAML SSO (Chrome Session)' },
    solarwinds: { endpoint: configs.solarwinds?.endpoint || 'http://10.36.91.45/Orion/Login.aspx', endpointNetwork: configs.solarwinds?.endpointNetwork || 'http://10.36.91.46/Orion/Login.aspx', username: configs.solarwinds?.username || 'hil-dor.itdashboard@adityabirla.com', secret: configs.solarwinds?.secret || '', method: configs.solarwinds?.authMethod || 'Basic Authentication' },
  });

  if (!isOpen) return null;

  const handleTestConnection = async (system: 'nutanix' | 'symphony' | 'solarwinds') => {
    setTesting(true);
    setTestResult(null);
    
    // Simulate testing connection delay (1.5 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    try {
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system,
          endpoint: form[system].endpoint,
          endpointNetwork: system === 'solarwinds' ? form.solarwinds.endpointNetwork : undefined,
          username: form[system].username,
          authMethod: form[system].method,
          secret: form[system].secret,
          connected: true
        })
      });
      
      if (res.ok) {
        setTestResult('success');
        onSave(); // trigger parent update
      } else {
        setTestResult('failed');
      }
    } catch {
      setTestResult('failed');
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async (system: 'nutanix' | 'symphony' | 'solarwinds') => {
    setTesting(true);
    setTestResult(null);
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system,
          connected: false
        })
      });
      onSave();
    } catch (e) {
      console.error(e);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="glass-panel" style={{
        width: '800px',
        height: '520px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(var(--primary-rgb), 0.2)',
        background: '#fffdf9',
        boxShadow: '0 10px 30px rgba(120, 110, 90, 0.15)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(var(--primary-rgb), 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Settings size={22} color="var(--primary)" />
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)' }}>Configure Integration Sources</span>
          </div>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            color: 'var(--secondary)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            transition: 'color 0.2s'
          }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--foreground)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--secondary)'}>
            <X size={20} />
          </button>
        </div>

        {/* Body Container */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Navigation */}
          <div style={{
            width: '240px',
            borderRight: '1px solid rgba(var(--primary-rgb), 0.12)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            background: '#f8f6ec'
          }}>
            <button 
              onClick={() => { setActiveTab('nutanix'); setTestResult(null); }}
              style={getTabStyle(activeTab === 'nutanix')}
            >
              <Server size={16} />
              <span>Nutanix CLI Console</span>
              {configs.nutanix.connected && <span className="connected-badge"></span>}
            </button>
            <button 
              onClick={() => { setActiveTab('symphony'); setTestResult(null); }}
              style={getTabStyle(activeTab === 'symphony')}
            >
              <Radio size={16} />
              <span>Symphony Summit ITSM</span>
              {configs.symphony.connected && <span className="connected-badge"></span>}
            </button>
            <button 
              onClick={() => { setActiveTab('solarwinds'); setTestResult(null); }}
              style={getTabStyle(activeTab === 'solarwinds')}
            >
              <Server size={16} />
              <span>SolarWinds Orion API</span>
              {configs.solarwinds?.connected && <span className="connected-badge"></span>}
            </button>
          </div>

          {/* Right Inputs Content */}
          <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#ffffff' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px' }}>
                    {activeTab === 'nutanix' && 'Nutanix CLI Hypervisor Access'}
                    {activeTab === 'symphony' && 'Symphony Summit Service API'}
                    {activeTab === 'solarwinds' && 'SolarWinds Orion API Client'}
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--secondary)', lineHeight: 1.3 }}>
                    {activeTab === 'nutanix' && 'Establish SSH connection to Nutanix Acropolis hypervisor to retrieve system utilization.'}
                    {activeTab === 'symphony' && 'Provide endpoint credentials to Summit ITSM suite to retrieve incident and SLA lists.'}
                    {activeTab === 'solarwinds' && 'Connect to SWIS REST API to fetch live server utilization and WAN/ISP interface bandwidth.'}
                  </p>
                </div>

                {/* Endpoint Address */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.825rem', color: '#334155', fontWeight: 600 }}>
                    {activeTab === 'nutanix' ? 'Nutanix Prism Portal URL' : activeTab === 'solarwinds' ? 'SolarWinds Server Portal URL' : 'Symphony Service Endpoint URL'}
                  </label>
                  <input 
                    type="text" 
                    value={form[activeTab].endpoint}
                    onChange={(e) => setForm({ ...form, [activeTab]: { ...form[activeTab], endpoint: e.target.value }})}
                    className="config-input" 
                  />
                </div>

                {activeTab === 'solarwinds' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.825rem', color: '#334155', fontWeight: 600 }}>
                      SolarWinds Network Portal URL
                    </label>
                    <input 
                      type="text" 
                      value={form.solarwinds.endpointNetwork}
                      onChange={(e) => setForm({ ...form, solarwinds: { ...form.solarwinds, endpointNetwork: e.target.value }})}
                      className="config-input" 
                    />
                  </div>
                )}

                {/* Authentication Method Dropdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.825rem', color: '#334155', fontWeight: 600 }}>
                    Authentication Method
                  </label>
                  <select 
                    value={form[activeTab].method}
                    onChange={(e) => setForm({ ...form, [activeTab]: { ...form[activeTab], method: e.target.value }})}
                    className="config-input"
                    style={{ background: '#faf9f5' }}
                  >
                    {activeTab === 'nutanix' && (
                      <>
                        <option value="SSH Key">SSH Key</option>
                        <option value="Password">Password</option>
                        <option value="Web Authentication (Prism Console)">Web Authentication (Prism Console)</option>
                      </>
                    )}
                    {activeTab === 'symphony' && (
                      <>
                        <option value="SAML SSO (Chrome Session)">SAML SSO (Chrome Session)</option>
                        <option value="Basic Authentication">Basic Authentication</option>
                        <option value="REST API Key">REST API Key</option>
                      </>
                    )}

                    {activeTab === 'solarwinds' && (
                      <>
                        <option value="Basic Authentication">Basic Authentication</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Username & Creds */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.825rem', color: '#334155', fontWeight: 600 }}>
                      {activeTab === 'nutanix' ? (form.nutanix.method === 'Web Authentication (Prism Console)' ? 'Prism Console Username' : 'CLI SSH Username') : activeTab === 'solarwinds' ? 'Orion User Account' : 'Client ID / User'}
                    </label>
                    <input 
                      type="text" 
                      value={form[activeTab].username}
                      onChange={(e) => setForm({ ...form, [activeTab]: { ...form[activeTab], username: e.target.value }})}
                      className="config-input" 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.825rem', color: '#334155', fontWeight: 600 }}>
                      {activeTab === 'nutanix' ? (form.nutanix.method === 'Web Authentication (Prism Console)' ? 'Prism Console Password' : 'SSH Private Key / Password') : activeTab === 'solarwinds' ? 'Account Password' : 'Client Secret Key / Token'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="password" 
                        value={form[activeTab].secret}
                        onChange={(e) => setForm({ ...form, [activeTab]: { ...form[activeTab], secret: e.target.value }})}
                        className="config-input" 
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <Key size={14} style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--secondary)' }} />
                    </div>
                  </div>
                </div>
              </div>

            {/* Bottom Controls / Status */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(var(--primary-rgb), 0.12)',
              paddingTop: '1.5rem',
              marginTop: '1rem',
              width: '100%'
            }}>
              <div>
                {testing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 700 }}>
                    <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Verifying Secure Access Handshake...</span>
                  </div>
                )}
                {testResult === 'success' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '0.875rem', fontWeight: 700 }}>
                    <Check size={16} />
                    <span>Connection Established Successfully!</span>
                  </div>
                )}
                {testResult === 'failed' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 700 }}>
                    <AlertCircle size={16} />
                    <span>Handshake Failed. Verify Credentials.</span>
                  </div>
                )}
                {!testing && !testResult && configs[activeTab]?.connected && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '0.875rem', fontWeight: 700 }}>
                    <Check size={16} />
                    <span>Connected ({form[activeTab].method})</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {configs[activeTab]?.connected ? (
                    <button 
                      onClick={() => handleDisconnect(activeTab)}
                      disabled={testing}
                      className="btn-danger"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleTestConnection(activeTab)}
                      disabled={testing}
                      className="btn-primary"
                    >
                      Test & Connect
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .config-input {
          background: #faf9f5;
          border: 1px solid rgba(var(--primary-rgb), 0.25);
          border-radius: 6px;
          padding: 0.625rem 0.875rem;
          color: var(--foreground);
          font-family: inherit;
          font-size: 0.875rem;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }
        .config-input:focus {
          border-color: var(--primary);
          background: #ffffff;
        }
        .connected-badge {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--success);
          margin-left: auto;
          box-shadow: 0 0 8px var(--success);
        }
        .btn-primary {
          background: var(--primary);
          border: none;
          color: white;
          padding: 0.5rem 1.25rem;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: filter 0.2s;
        }
        .btn-primary:hover {
          filter: brightness(1.1);
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-danger {
          background: rgba(190, 18, 60, 0.08);
          border: 1px solid rgba(190, 18, 60, 0.2);
          color: var(--danger);
          padding: 0.5rem 1.25rem;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-danger:hover {
          background: rgba(190, 18, 60, 0.15);
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}

function getTabStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.75rem 1rem',
    background: active ? 'rgba(var(--primary-rgb), 0.12)' : 'none',
    border: '1px solid',
    borderColor: active ? 'rgba(var(--primary-rgb), 0.25)' : 'transparent',
    borderRadius: '8px',
    color: active ? 'var(--primary)' : 'var(--secondary)',
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s'
  };
}
