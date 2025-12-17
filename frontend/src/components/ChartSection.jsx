import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useTheme } from '../context/ThemeContext';

const ChartSection = ({ data, type = 'bar', title, className }) => {
  const { theme } = useTheme();
  const [resolvedTheme, setResolvedTheme] = useState(theme);

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');

      const handleChange = (e) => setResolvedTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  const isDark = resolvedTheme === 'dark';

  const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];
  
  const chartStyles = {
    grid: isDark ? "#334155" : "#f3f4f6",
    text: isDark ? "#94a3b8" : "#6b7280",
    tooltipBg: isDark ? "#1e293b" : "#ffffff",
    tooltipText: isDark ? "#f8fafc" : "#111827",
    barFill: "#0ea5e9"
  };

  return (
    <div className={`h-full ${className}`}>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{title}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer key={resolvedTheme} width="100%" height="90%">
          {type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartStyles.grid} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: chartStyles.text, fontSize: 12}} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: chartStyles.text, fontSize: 12}} 
              />
              <Tooltip 
                contentStyle={{
                  borderRadius: '12px', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  backgroundColor: isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.8)",
                  backdropFilter: 'blur(8px)',
                  color: chartStyles.tooltipText
                }}
                cursor={{fill: isDark ? '#334155' : '#f9fafb'}}
              />
              <Bar dataKey="value" fill={chartStyles.barFill} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  borderRadius: '12px', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  backgroundColor: isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.8)",
                  backdropFilter: 'blur(8px)',
                  color: chartStyles.tooltipText
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle" 
                formatter={(value) => <span style={{ color: chartStyles.text }}>{value}</span>}
              />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartSection;
