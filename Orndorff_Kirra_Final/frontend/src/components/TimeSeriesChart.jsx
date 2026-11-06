import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TimeSeriesChart = ({ data }) => {
  const sectors = [
    { key: 'Technology', color: '#d95f02' },
    { key: 'Economy', color: '#2b5c8f' },
    { key: 'Politics', color: '#7570b3' },
    { key: 'Pop Culture', color: '#e7298a' },
    { key: 'Environment', color: '#1b9e77' }
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <div className="mb-4">
        <p style={{ fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#555', margin: '4px 0 0 0' }}>
          Tracking the percentage of AI-related headlines per sector over time.
        </p>
      </div>
      
      {/* Explicit inline height guarantees the ResponsiveContainer has dimensions to render into */}
      <div style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" stroke="#888888" fontSize={12} />
            <YAxis stroke="#888888" fontSize={12} unit="%" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value) => [`${value}%`, 'Saturation']}
            />
            <Legend wrapperStyle={{ paddingTop: '15px' }} />
            {sectors.map((sec) => (
              <Line 
                key={sec.key}
                type="monotone" 
                dataKey={sec.key} 
                stroke={sec.color} 
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimeSeriesChart;