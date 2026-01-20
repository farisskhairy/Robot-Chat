'use client';

import { useState, useEffect, useRef } from 'react';
import RobotFace from '../components/RobotFace';

export default function Home() {
  const [expression, setExpression] = useState('neutral');
  const [status, setStatus] = useState('Disconnected 🔴');
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const socketRef = useRef(null);

  // --- Voice Function ---
  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang === 'en-US');
    utterance.voice = englishVoice || null; 
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // --- Connection Function ---
  const connectToBrain = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;
    const socket = new WebSocket('ws://localhost:8000/ws');
    socketRef.current = socket;

    socket.onopen = () => setStatus('Connected 🟢');
    socket.onclose = () => setStatus('Disconnected 🔴');

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setIsThinking(false); // Stop thinking animation

      if (data.expression) setExpression(data.expression);
      if (data.reply) speak(data.reply);
    };
  };

  // --- Setup on Load ---
  useEffect(() => {
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    connectToBrain();
    return () => socketRef.current?.close();
  }, []);

  // --- Send Message Function ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const message = inputText;
    setInputText('');
    setIsThinking(true);

    try {
      await fetch(`http://localhost:8000/chat?user_text=${encodeURIComponent(message)}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error("Failed to send:", error);
      setIsThinking(false);
    }
  };

  return (
    <main style={{ 
      minHeight: '100vh',         // Allow page to grow if needed (enables scrolling)
      width: '100%',
      backgroundColor: '#111', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',   // Center everything together
      gap: '40px',                // Force space between Face and Chat
      padding: '40px 20px',       // Add padding around edges
      color: 'white',
      fontFamily: 'monospace',
      boxSizing: 'border-box'
    }}>
      
      {/* 1. Status Indicator (Top Left) */}
      <div style={{ position: 'absolute', top: 20, left: 20, color: '#666' }}>
        System Status: {status}
      </div>

      {/* 2. The Robot Face */}
      <div style={{ 
        transform: 'scale(1.2)',
        marginTop: '20px' 
      }}>
        <RobotFace expression={expression} />
      </div>

      {/* 3. The Chat Interface */}
      <div style={{ 
        width: '100%', 
        maxWidth: '600px',
        zIndex: 10
      }}>
        
        {/* Thinking Indicator */}
        <div style={{ 
          height: '24px', 
          marginBottom: '10px', 
          textAlign: 'center', 
          color: '#00ffcc',
          visibility: isThinking ? 'visible' : 'hidden',
          fontSize: '14px',
          letterSpacing: '1px'
        }}>
          ⟳ PROCESSING INPUT...
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message to the robot..."
            style={{
              flex: 1,
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #333',
              backgroundColor: '#222',
              color: 'white',
              fontSize: '16px',
              outline: 'none',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
            }}
          />
          <button 
            type="submit"
            style={{
              padding: '15px 30px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#00ffcc',
              color: '#111',
              fontWeight: 'bold',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}