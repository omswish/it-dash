"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';

interface TrafficData {
  time: string;
  rx: number;
  tx: number;
}

interface UptimeChartProps {
  data: TrafficData[];
  status: 'operational' | 'degraded' | 'down';
}

export default function UptimeChart({ data, status }: UptimeChartProps) {
  // Rx is primary dark orange
  const rxColor = '#c2410c';
  // Tx is secondary slate/charcoal grey
  const txColor = '#475569';

  return (
    <div className="chart-container" style={{ height: '100%', minHeight: '48px', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={`colorRx-${status}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={rxColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={rxColor} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`colorTx-${status}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={txColor} stopOpacity={0.2} />
              <stop offset="95%" stopColor={txColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" hide />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fffdf9', 
              borderColor: 'rgba(234, 88, 12, 0.25)',
              borderRadius: '6px',
              color: '#0f172a',
              fontSize: '0.625rem',
              padding: '0.25rem 0.5rem',
              boxShadow: '0 4px 10px rgba(120, 110, 90, 0.12)'
            }}
            itemStyle={{ color: '#0f172a', fontWeight: 600, padding: 0 }}
            labelStyle={{ color: '#475569', fontWeight: 700, marginBottom: '2px', fontSize: '0.575rem' }}
          />
          <Area 
            type="monotone" 
            dataKey="rx" 
            name="Rx (Download)"
            stroke={rxColor} 
            strokeWidth={1.5}
            fillOpacity={1} 
            fill={`url(#colorRx-${status})`} 
          />
          <Area 
            type="monotone" 
            dataKey="tx" 
            name="Tx (Upload)"
            stroke={txColor} 
            strokeWidth={1.5}
            fillOpacity={1} 
            fill={`url(#colorTx-${status})`} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
