"use client";

import { useState } from 'react';
import { Shield, Settings, Server, Radio, Database, Key, Check, Loader2, AlertCircle, X } from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  configs: {
    nutanix: { connected: boolean; endpoint: string; username: string; authMethod: string };
    symphony: { connected: boolean; endpoint: string; username: string; authMethod: string };
    isms: { connected: boolean; endpoint: string; username: string; authMethod: string };
    compliance: { connected: boolean; endpoint: string; username: string; authMethod: string };
  };
  onSave: () => void;
}

type TabType = 'nutanix' | 'symphony' | 'isms' | 'compliance';

export default function ConfigModal({ isOpen, onClose, configs, onSave }: ConfigModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('nutanix');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);

  // Form states initialized with existing config if available
  const [form, setForm] = useState({
    nutanix: { endpoint: configs.nutanix.endpoint || '10.20.40.12', username: configs.nutanix.username || 'nutanix_admin', secret: '••••••••••••••••', method: configs.nutanix.authMethod },
    symphony: { endpoint: configs.symphony.endpoint || 'https://summit.internal/api/v2', username: configs.symphony.username || 'symphony_agent', secret: '••••••••••••••••', method: configs.symphony.authMethod },
    isms: { endpoint: configs.isms.endpoint || 'https://apex.internal/ords/isms', username: configs.isms.username || 'apex_oauth', secret: '••••••••••••••••', method: configs.isms.authMethod },
    compliance: { endpoint: configs.compliance.endpoint || 'https://apex.internal/ords/compliance', username: configs.compliance.username || 'apex_compliance', secret: '••••••••••••••••', method: configs.compliance.authMethod },
  });

  if (!isOpen) return null;

  const handleTestConnection = async (system: TabType) => {
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
          username: form[system].username,
          authMethod: form[system].method,
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

  const handleDisconnect = async (system: TabType) => {
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
      backgroundColor: 'rgba(0,0,0,0.7)',
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
        border: '1px solid rgba(255,255,255,0.1)',
        background: '#0e131f'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Settings size={22} color="var(--primary)" />
            <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>Configure Integration Sources</span>
          </div>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            transition: 'color 0.2s'
          }} onMouseOver={(e) => e.currentTarget.style.color = 'white'} onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}>
            <X size={20} />
          </button>
        </div>

        {/* Body Container */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Navigation */}
          <div style={{
            width: '240px',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            background: 'rgba(0,0,0,0.15)'
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
              onClick={() => { setActiveTab('isms'); setTestResult(null); }}
              style={getTabStyle(activeTab === 'isms')}
            >
              <Database size={16} />
              <span>ISMS Portal (APEX)</span>
              {configs.isms.connected && <span className="connected-badge"></span>}
            </button>
            <button 
              onClick={() => { setActiveTab('compliance'); setTestResult(null); }}
              style={getTabStyle(activeTab === 'compliance')}
            >
              <Shield size={16} />
              <span>IT Compliance (APEX)</span>
              {configs.compliance.connected && <span className="connected-badge"></span>}
            </button>
          </div>

          {/* Right Inputs Content */}
          <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '4px' }}>
                  {activeTab === 'nutanix' && 'Nutanix CLI Hypervisor Access'}
                  {activeTab === 'symphony' && 'Symphony Summit Service API'}
                  {activeTab === 'isms' && 'ISMS Objectives Portal (Oracle APEX)'}
                  {activeTab === 'compliance' && 'IT Compliance Engine (Oracle APEX)'}
                </h3>
                <p style={{ fontSize: '0.825rem', color: '#64748b' }}>
                  {activeTab === 'nutanix' && 'Establish SSH connection to Nutanix Acropolis hypervisor to retrieve system utilization.'}
                  {activeTab === 'symphony' && 'Provide endpoint credentials to Summit ITSM suite to retrieve incident and SLA lists.'}
                  {activeTab === 'isms' && 'Establish connection with Oracle APEX ISMS Objectives repository via secured REST endpoints.'}
                  {activeTab === 'compliance' && 'Connect to Oracle APEX client compliance suite to sync workstation and AV patch scores.'}
                </p>
              </div>

              {/* Endpoint Address */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.825rem', color: '#94a3b8', fontWeight: 500 }}>
                  {activeTab === 'nutanix' ? 'Host IP Address / Domain' : 'REST Endpoint URL'}
                </label>
                <input 
                  type="text" 
                  value={form[activeTab].endpoint}
                  onChange={(e) => setForm({ ...form, [activeTab]: { ...form[activeTab], endpoint: e.target.value }})}
                  className="config-input" 
                />
              </div>

              {/* Username & Creds */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.825rem', color: '#94a3b8', fontWeight: 500 }}>
                    {activeTab === 'nutanix' ? 'CLI SSH Username' : 'Client ID / User'}
                  </label>
                  <input 
                    type="text" 
                    value={form[activeTab].username}
                    onChange={(e) => setForm({ ...form, [activeTab]: { ...form[activeTab], username: e.target.value }})}
                    className="config-input" 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.825rem', color: '#94a3b8', fontWeight: 500 }}>
                    {activeTab === 'nutanix' ? 'SSH Private Key / Password' : 'Client Secret Key / Token'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="password" 
                      value={form[activeTab].secret}
                      onChange={(e) => setForm({ ...form, [activeTab]: { ...form[activeTab], secret: e.target.value }})}
                      className="config-input" 
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <Key size={14} style={{ position: 'absolute', right: '12px', top: '12px', color: '#64748b' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Controls / Status */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: '1.5rem',
              marginTop: '1rem'
            }}>
              <div>
                {testing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontSize: '0.875rem' }}>
                    <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Verifying Secure Access Handshake...</span>
                  </div>
                )}
                {testResult === 'success' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '0.875rem' }}>
                    <Check size={16} />
                    <span>Connection Established Successfully!</span>
                  </div>
                )}
                {testResult === 'failed' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontSize: '0.875rem' }}>
                    <AlertCircle size={16} />
                    <span>Handshake Failed. Verify Endpoint Credentials.</span>
                  </div>
                )}
                {!testing && !testResult && configs[activeTab].connected && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontSize: '0.875rem' }}>
                    <Check size={16} />
                    <span>Connected ({form[activeTab].method})</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {configs[activeTab].connected ? (
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
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          padding: 0.625rem 0.875rem;
          color: white;
          font-family: inherit;
          font-size: 0.875rem;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }
        .config-input:focus {
          border-color: var(--primary);
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
          font-weight: 500;
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
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 0.5rem 1.25rem;
          border-radius: 6px;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-danger:hover {
          background: rgba(239, 68, 68, 0.2);
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
    background: active ? 'rgba(37, 99, 235, 0.15)' : 'none',
    border: '1px solid',
    borderColor: active ? 'rgba(37, 99, 235, 0.3)' : 'transparent',
    borderRadius: '8px',
    color: active ? 'white' : '#94a3b8',
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s'
  };
}
