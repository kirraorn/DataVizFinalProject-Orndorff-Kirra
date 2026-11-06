import React, { useState, useEffect } from 'react';
import TimeSeriesChart from './components/TimeSeriesChart';
import KeywordExplorer from './components/KeywordExplorer';
import ParticlePlot3D from './components/ParticlePlot3D';

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/dashboard_data.json')
      .then((res) => res.json())
      .then((data) => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading dashboard data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#faf9f5', fontFamily: 'Georgia, serif' }}>
        <p style={{ fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555' }}>Loading Data...</p>
      </div>
    );
  }

  const meta = dashboardData?.metadata || {};

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#faf9f5', // Warm newsprint parchment tone
      color: '#111111', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', 
      padding: '60px 24px',
      borderTop: '6px solid #111111'
    }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        
        {/* Editorial Broadsheet Header */}
        <header style={{ marginBottom: '48px', borderBottom: '2px solid #111111', paddingBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-baseline', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#8b0000' }}>
              Data Visualization Final Project &bull; Fall 2026
            </span>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#666' }}>
              Kirra Orndorff (FSU)
            </span>
          </div>

          <h1 style={{ 
            fontFamily: 'Georgia, serif', 
            fontSize: '38px', 
            fontWeight: 'normal', 
            letterSpacing: '-0.02em', 
            lineHeight: '1.15', 
            color: '#111111', 
            margin: '16px 0 16px 0' 
          }}>
            Quantifying the AI Buzzword Explosion
          </h1>

          {/* Full-width introductory narrative and motivation */}
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', color: '#333', width: '100%', lineHeight: '1.7', margin: '0 0 28px 0' }}>
            <p style={{ margin: '0 0 14px 0' }}>
              Over the last decade, artificial intelligence shifted from quiet computer science labs into everyday conversation. But how did the news media talk about it before the massive generative AI boom? By examining <strong>209,527 news headlines</strong> published by HuffPost between 2012 and 2022, this project maps exactly when, where, and how AI terminology saturated public reporting.
            </p>
            <p style={{ margin: 0, fontStyle: 'italic', color: '#444' }}>
              <strong>Why this matters:</strong> When the media constantly bombards readers with sensationalized breakthroughs or alarmist "AI doom" headlines, it often backfires. Oversaturation breeds deep public skepticism and "anti-AI" fatigue. Instead of helping people stay informed, it creates mental barriers—leaving everyday professionals overwhelmed, misinformed, and hesitant to update the digital skills they need in a changing workforce.
            </p>
          </div>

          {/* Editorial Data Callout Ticker */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1px', 
            backgroundColor: '#111111', 
            border: '1px solid #111111',
            marginTop: '24px'
          }}>
            <div style={{ backgroundColor: '#ffffff', padding: '14px 18px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666' }}>Statistical Proof</span>
              <p style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'Georgia, serif', margin: '4px 0 0 0', color: '#111' }}>Chi-Square Validated</p>
              <span style={{ fontSize: '11px', color: '#8b0000' }}>p &lt; 0.001 (Not Random)</span>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '14px 18px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666' }}>Topic Grouping</span>
              <p style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'Georgia, serif', margin: '4px 0 0 0', color: '#111' }}>5 Core Clusters</p>
              <span style={{ fontSize: '11px', color: '#444' }}>Unsupervised AI ML Model</span>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '14px 18px' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666' }}>Overall Saturation</span>
              <p style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'Georgia, serif', margin: '4px 0 0 0', color: '#111' }}>{meta.overall_ai_saturation || '0.73'}% Global</p>
              <span style={{ fontSize: '11px', color: '#444' }}>Top Sector: Tech (6.68%)</span>
            </div>
          </div>
        </header>

        {/* Main Content Sections */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
          {dashboardData && (
            <>
              {/* Section 1 */}
              <article>
                <div style={{ marginBottom: '16px', borderBottom: '1px solid #111111', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'monospace', color: '#8b0000', letterSpacing: '0.1em' }}>FIGURE 01</span>
                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 'normal', margin: '4px 0 0 0' }}>Growth of AI News Stories Across Different Topics (2012–2022)</h2>
                </div>
                <TimeSeriesChart data={dashboardData.saturation_timeline} />
              </article>

              {/* Section 2 */}
              <article>
                <div style={{ marginBottom: '16px', borderBottom: '1px solid #111111', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'monospace', color: '#8b0000', letterSpacing: '0.1em' }}>FIGURE 02</span>
                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 'normal', margin: '4px 0 0 0' }}>Semantic Topography: Dominant Vocabulary & Term Importance by Sector</h2>
                </div>
                <KeywordExplorer sectors={dashboardData.sector_saturation} />
              </article>

              {/* Section 3 */}
              <article>
                <div style={{ marginBottom: '16px', borderBottom: '1px solid #111111', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'monospace', color: '#8b0000', letterSpacing: '0.1em' }}>FIGURE 03</span>
                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 'normal', margin: '4px 0 0 0' }}>Multidimensional Space & Exponential Media Crowding</h2>
                </div>
                <ParticlePlot3D />
              </article>
            </>
          )}
        </main>

        {/* Editorial Colophon Footer */}
        <footer style={{ marginTop: '80px', borderTop: '2px solid #111111', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: '#555', fontFamily: 'Georgia, serif' }}>
          <p style={{ margin: 0 }}>Kirra Orndorff &bull; Florida State University &bull; Fall 2026</p>
        </footer>

      </div>
    </div>
  );
}

export default App;