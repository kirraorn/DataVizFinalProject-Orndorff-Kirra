import React, { useState } from 'react';

const KeywordExplorer = ({ sectors }) => {
  const [activeSector, setActiveSector] = useState(sectors[0]?.sector || 'Technology');
  const currentSectorData = sectors.find((s) => s.sector === activeSector) || sectors[0];

  const terms = currentSectorData.top_terms || [];
  const [selectedTerm, setSelectedTerm] = useState(terms[0]?.term || '');

  // Update selected term default when switching sectors
  const handleSectorChange = (sectorName) => {
    setActiveSector(sectorName);
    const sec = sectors.find((s) => s.sector === sectorName);
    if (sec && sec.top_terms && sec.top_terms.length > 0) {
      setSelectedTerm(sec.top_terms[0].term);
    }
  };

  // Dense relative placement coordinates for a compact 2-column word cloud
  const cloudLayoutProps = [
    { size: '32px', weight: '900', rotate: '-3deg', top: '38%', left: '42%' }, // Center primary term
    { size: '22px', weight: '700', rotate: '4deg', top: '18%', left: '22%' },
    { size: '17px', weight: '600', rotate: '-6deg', top: '64%', left: '18%' },
    { size: '20px', weight: '700', rotate: '5deg', top: '22%', left: '68%' },
    { size: '13px', weight: '500', rotate: '-2deg', top: '72%', left: '62%' },
    { size: '15px', weight: '600', rotate: '7deg', top: '48%', left: '78%' },
    { size: '12px', weight: '400', rotate: '-4deg', top: '12%', left: '46%' },
    { size: '14px', weight: '500', rotate: '3deg', top: '76%', left: '40%' },
  ];

  const maxScore = Math.max(...terms.map((t) => parseFloat(t.score || 0)), 0.01);

  return (
    <div style={{ backgroundColor: 'transparent', padding: '0', marginBottom: '32px' }}>
      
      {/* Header & Sector Selector Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        <div>
          <p style={{ fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#555', margin: '4px 0 0 0' }}>
            Interactive keyword cloud paired with quantitative TF-IDF term importance metrics.
          </p>
        </div>
        
        {/* Sector Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
          {sectors.map((sec) => (
            <button
              key={sec.sector}
              onClick={() => handleSectorChange(sec.sector)}
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '6px 12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: activeSector === sec.sector ? '#111111' : '#ffffff',
                color: activeSector === sec.sector ? '#ffffff' : '#111111',
                border: '1px solid #111111',
                borderRadius: '0px'
              }}
            >
              {sec.sector}
            </button>
          ))}
        </div>
      </div>

      {/* Two-Column Linked Visualizations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'stretch' }}>
        
        {/* COLUMN 1: Dense Clustered Word Cloud */}
        <div style={{
          position: 'relative',
          height: '260px',
          backgroundColor: '#faf9f5',
          border: '1px solid #111111',
          overflow: 'hidden',
          padding: '16px'
        }}>
          <div style={{ position: 'absolute', top: '8px', left: '12px', fontSize: '10px', fontFamily: 'monospace', color: '#888', textTransform: 'uppercase' }}>
            Word Cloud // {activeSector}
          </div>

          {terms.map((item, idx) => {
            const layout = cloudLayoutProps[idx % cloudLayoutProps.length];
            const isSelected = selectedTerm === item.term;
            
            return (
              <div
                key={item.term}
                onClick={() => setSelectedTerm(item.term)}
                style={{
                  position: 'absolute',
                  top: layout.top,
                  left: layout.left,
                  transform: `translate(-50%, -50%) rotate(${layout.rotate}) scale(${isSelected ? 1.15 : 1})`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                  textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = `translate(-50%, -50%) scale(1.2) rotate(${layout.rotate})`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = `translate(-50%, -50%) scale(${isSelected ? 1.15 : 1}) rotate(${layout.rotate})`;
                }}
              >
                <span style={{
                  fontFamily: idx === 0 ? 'Georgia, serif' : 'sans-serif',
                  fontSize: layout.size,
                  fontWeight: layout.weight,
                  color: isSelected ? '#8b0000' : (idx === 0 ? '#111111' : '#333333'),
                  borderBottom: isSelected ? '2px solid #8b0000' : 'none',
                  letterSpacing: '-0.02em',
                  lineHeight: '1'
                }}>
                  {item.term}
                </span>
              </div>
            );
          })}
        </div>

        {/* COLUMN 2: Linked TF-IDF Term Weight Bar Chart */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #111111',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
              <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#8b0000', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Quantative Ranking
              </span>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#666' }}>
                Sector: {activeSector}
              </span>
            </div>

            {/* Horizontal Bar Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {terms.map((item) => {
                const isSelected = selectedTerm === item.term;
                const scoreVal = parseFloat(item.score || 0);
                const widthPct = Math.min((scoreVal / maxScore) * 100, 100);

                return (
                  <div 
                    key={item.term}
                    onClick={() => setSelectedTerm(item.term)}
                    style={{ cursor: 'pointer', opacity: selectedTerm && !isSelected ? 0.6 : 1 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'monospace', marginBottom: '2px' }}>
                      <span style={{ fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? '#8b0000' : '#111111' }}>
                        {item.term} {isSelected ? '◀' : ''}
                      </span>
                      <span style={{ color: '#555' }}>{item.score}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#eee', width: '100%' }}>
                      <div style={{
                        height: '100%',
                        width: `${widthPct}%`,
                        backgroundColor: isSelected ? '#8b0000' : '#111111',
                        transition: 'width 0.3s ease, background-color 0.2s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed #ccc', fontSize: '11px', fontFamily: 'Georgia, serif', color: '#666', fontStyle: 'italic' }}>
            * Higher TF-IDF scores indicate terms uniquely distinctive to {activeSector} reporting.
          </div>
        </div>

      </div>
    </div>
  );
};

export default KeywordExplorer;