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
              backgroundColor: 'rgba(9, 11, 14, 0.95)', 
              borderColor: 'rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: '#f1f5f9'
            }}
            itemStyle={{ color: '#f1f5f9' }}
            formatter={(value: any) => [`${value}%`, 'Uptime']}
            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
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
