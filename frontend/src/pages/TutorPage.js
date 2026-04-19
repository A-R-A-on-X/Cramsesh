import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import AtomLogo from '../components/AtomLogo';
import './TutorPage.css';

export default function TutorPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get('/tutor/history'),
      api.get('/materials')
    ]).then(([histRes, matRes]) => {
      setMessages(histRes.data);
      setMaterials(matRes.data);
      setHistoryLoaded(true);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');

    const userMsg = { id: Date.now(), role: 'user', content: msg };
    setMessages(m => [...m, userMsg]);
    setLoading(true);

    try {
      const res = await api.post('/tutor/chat', { message: msg, materialId: selectedMaterial || undefined });
      setMessages(m => [...m, { id: res.data.messageId, role: 'assistant', content: res.data.response }]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI Tutor unavailable. Is Ollama running?');
      setMessages(m => m.filter(x => x.id !== userMsg.id));
      setInput(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const clearHistory = async () => {
    await api.delete('/tutor/history');
    setMessages([]);
    toast.success('Chat cleared');
  };

  return (
    <div className="tutor-page page-animate">
      {/* Header */}
      <div className="tutor-header">
        <div className="tutor-identity">
          <AtomLogo size={44} animated />
          <div>
            <h1 className="page-title" style={{ marginBottom: '0.1rem' }}>AI Tutor</h1>
            <p className="page-subtitle">Powered by Llama 3 (Ollama)</p>
          </div>
        </div>
        <div className="tutor-controls">
          <select
            className="input material-select"
            value={selectedMaterial}
            onChange={e => setSelectedMaterial(e.target.value)}
          >
            <option value="">General knowledge</option>
            {materials.map(m => (
              <option key={m.id} value={m.id}>{m.original_name}</option>
            ))}
          </select>
          {messages.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={clearHistory}>Clear</button>
          )}
        </div>
      </div>

      {/* Chat window */}
      <div className="chat-window">
        {!historyLoaded ? (
          <div className="chat-loading"><div className="atom-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="chat-welcome">
            <AtomLogo size={60} animated />
            <h2>Hey, I'm your AI Tutor!</h2>
            <p>Ask me anything about your study materials, or any topic you're curious about.</p>
            <div className="suggested-prompts">
              {['Explain this concept simply', 'Give me a summary of my material', 'Quiz me on a topic', 'What are the key points?'].map(p => (
                <button key={p} className="suggest-btn" onClick={() => setInput(p)}>{p}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages">
            {messages.map((msg, i) => (
              <div key={msg.id || i} className={`message ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="msg-avatar"><AtomLogo size={28} animated={false} /></div>
                )}
                <div className="msg-bubble">
                  {msg.content.split('\n').map((line, li) =>
                    line.trim() ? <p key={li}>{line}</p> : <br key={li} />
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="msg-avatar"><AtomLogo size={28} animated /></div>
                <div className="msg-bubble typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="chat-input-row">
        <textarea
          className="input chat-textarea"
          placeholder="Ask your AI tutor anything..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          disabled={loading}
        />
        <button className="btn btn-primary send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>
          {loading ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  );
}
