import React, { useState } from 'react';
import PostureFramework from './PostureFramework';
import Architecture from './Architecture';

export default function App() {
  const [view, setView] = useState('architecture'); // Toggle state

  const btnStyle = (active) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    backgroundColor: active ? '#00c8ff' : '#141630',
    color: active ? '#05060e' : '#c8ccf0',
    border: 'none',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: '12px',
    marginRight: '10px'
  });

  return (
    <div style={{ backgroundColor: '#05060e', minHeight: '100vh' }}>
      {/* Navigation Switcher */}
      <nav style={{ padding: '20px', borderBottom: '1px solid #141630', textAlign: 'center' }}>
        <button 
          style={btnStyle(view === 'architecture')} 
          onClick={() => setView('architecture')}
        >
          🛡️ VIEW ARCHITECTURE
        </button>
        <button 
          style={btnStyle(view === 'framework')} 
          onClick={() => setView('framework')}
        >
          📊 VIEW FRAMEWORK
        </button>
      </nav>

      {/* Render the selected component */}
      {view === 'architecture' ? <Architecture /> : <PostureFramework />}
    </div>
  );
}