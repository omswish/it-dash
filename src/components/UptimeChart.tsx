"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';

interface UptimeData {
  day: string;
  uptime: number;
}

interface UptimeChartProps {
  data: UptimeData[];
  status: 'operational' | 'degraded' | 'down';
}

export default function UptimeChart({ data, status }: UptimeChartProps) {
  let color = '#3b82f6'; // success (business blue)
  if (status === 'degraded') color = '#64748b'; // degraded (slate grey)
  if (status === 'down') color = '#ef4444'; // down (red)

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`colorUptime-${status}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" hide />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fffdf9', 
              borderColor: 'rgba(234, 88, 12, 0.25)',
              borderRadius: '8px',
              color: '#0f172a',
              boxShadow: '0 4px 12px rgba(120, 110, 90, 0.15)'
            }}
            itemStyle={{ color: '#0f172a', fontWeight: 600 }}
            formatter={(value: any) => [`${value}%`, 'Uptime']}
            labelStyle={{ color: '#475569', fontWeight: 500, marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="uptime" 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill={`url(#colorUptime-${status})`} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
