import React, { useState, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const sectorColors = {
  'Technology': '#d95f02',
  'Economy': '#2b5c8f',
  'Politics': '#7570b3',
  'Pop Culture': '#e7298a',
  'Environment': '#1b9e77'
};

// Simple deterministic pseudo-random generator based on index to keep positions stable
const pseudoRandom = (seed) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

const SurroundParticleCloud = ({ articles, selectedYear }) => {
  const pointsRef = useRef();

  // Pre-calculate permanent coordinates for every article once so they never jump around
  const stableArticlesWithCoords = useMemo(() => {
    return articles.map((art, idx) => {
      const yr = art.year || 2012;
      const yearProximity = (yr - 2012) / 10;
      
      // Deterministic radius and angles based on particle index
      const rSeed = pseudoRandom(idx * 1.1);
      const thetaSeed = pseudoRandom(idx * 2.3);
      const phiSeed = pseudoRandom(idx * 3.7);

      const radius = 8 - (yearProximity * 5.5) + (rSeed - 0.5) * 2;
      const theta = thetaSeed * Math.PI * 2;
      const phi = Math.acos((phiSeed * 2) - 1);

      return {
        ...art,
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi)
      };
    });
  }, [articles]);

  // Filter positions and colors for the active year range while keeping spatial positions static
  const [positions, colors] = useMemo(() => {
    let filtered = stableArticlesWithCoords.filter(item => item.year <= selectedYear);
    
    if (!filtered || filtered.length === 0) {
      filtered = [stableArticlesWithCoords[0] || { year: 2012, sector: 'Technology', x: 0, y: 0, z: -5 }];
    }

    const pos = [];
    const col = [];
    const colorObj = new THREE.Color();

    filtered.forEach((art) => {
      pos.push(art.x, art.y, art.z);

      const hexColor = sectorColors[art.sector] || '#111111';
      colorObj.set(hexColor);
      col.push(colorObj.r, colorObj.g, colorObj.b);
    });

    return [new Float32Array(pos), new Float32Array(col)];
  }, [stableArticlesWithCoords, selectedYear]);

  // Slow continuous spatial rotation so the surround space feels alive
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.04;
      pointsRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.05;
    }
  });

  if (!positions || positions.length === 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry key={selectedYear}>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.28}
        vertexColors
        transparent
        opacity={0.82}
        blending={THREE.NormalBlending}
      />
    </points>
  );
};

const ParticlePlot3D = ({ fullAiArticles }) => {
  const [selectedYear, setSelectedYear] = useState(2012);

  const articles = useMemo(() => {
    if (fullAiArticles && fullAiArticles.length > 0) return fullAiArticles;
    
    const mock = [];
    const sectors = Object.keys(sectorColors);
    for (let i = 0; i < 1800; i++) {
      const rand = pseudoRandom(i);
      let yr;
      if (rand < 0.08) yr = 2012;
      else if (rand < 0.18) yr = 2013;
      else if (rand < 0.30) yr = 2014;
      else if (rand < 0.44) yr = 2015;
      else if (rand < 0.58) yr = 2016;
      else if (rand < 0.72) yr = 2017;
      else if (rand < 0.83) yr = 2018;
      else if (rand < 0.91) yr = 2019;
      else if (rand < 0.96) yr = 2020;
      else if (rand < 0.99) yr = 2021;
      else yr = 2022;

      const sector = sectors[Math.floor(pseudoRandom(i * 4) * sectors.length)];
      mock.push({ year: yr, sector });
    }
    return mock;
  }, [fullAiArticles]);

  const currentCount = articles.filter(a => a.year <= selectedYear).length;

  return (
    <div style={{
      backgroundColor: 'transparent',
      padding: '0',
      marginBottom: '32px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
        <div>
          <p style={{ fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#555', margin: '4px 0 0 0' }}>
            Articles encircle your viewpoint. As you advance through time, newer headlines press inward, crowding your field of vision.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#8b0000', fontWeight: 'bold' }}>YEAR: {selectedYear}</span>
          <p style={{ fontSize: '12px', fontFamily: 'monospace', color: '#666', margin: 0 }}>{currentCount.toLocaleString()} articles active</p>
        </div>
      </div>

      <div style={{ 
        width: '100%', 
        height: '460px', 
        backgroundColor: '#faf9f5', 
        border: '1px solid #111111', 
        position: 'relative', 
        overflow: 'hidden' 
      }}>
        <Canvas camera={{ position: [0, 0, 0], fov: 75 }}>
          <color attach="background" args={['#faf9f5']} />
          <ambientLight intensity={0.9} />
          <SurroundParticleCloud articles={articles} selectedYear={selectedYear} />
        </Canvas>

        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          backgroundColor: '#ffffff',
          padding: '8px 12px',
          border: '1px solid #111111',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {Object.entries(sectorColors).map(([sec, col]) => (
            <div key={sec} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col }}></span>
              <span style={{ fontSize: '11px', color: '#111', fontWeight: '600', fontFamily: 'sans-serif' }}>{sec}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '16px', padding: '0 4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontFamily: 'Georgia, serif' }}>
          <span style={{ color: '#333' }}>Scrubbing Temporal Saturation (2012–2022)</span>
          <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: '#8b0000' }}>{selectedYear}</span>
        </div>
        <input
          type="range"
          min="2012"
          max="2022"
          step="1"
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          style={{ width: '100%', cursor: 'pointer', accentColor: '#111111', height: '4px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666', marginTop: '4px', fontFamily: 'monospace' }}>
          <span>2012</span>
          <span>2016</span>
          <span>2020</span>
          <span>2022</span>
        </div>
      </div>
    </div>
  );
};

export default ParticlePlot3D;