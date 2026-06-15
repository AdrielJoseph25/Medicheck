import { useState, useEffect, useRef } from 'react'
import { 
  HeartPulse, 
  Send, 
  Trash2, 
  ShieldAlert, 
  BookOpen, 
  X, 
  Activity, 
  AlertCircle, 
  Sparkles, 
  Stethoscope, 
  Brain, 
  ChevronRight 
} from 'lucide-react'
import './App.css'

const API_BASE = 'http://127.0.0.1:8000/api'

const QUICK_SUGGESTIONS = [
  {
    title: "Migraine symptoms",
    text: "I have a sudden sharp headache on one side of my head and sensitivity to light and sound."
  },
  {
    title: "Chest pain warning",
    text: "I feel a severe tightness and chest pain that spreads to my arm, accompanied by shortness of breath."
  },
  {
    title: "Common cold vs flu",
    text: "I have a low-grade fever, runny nose, slight body aches, and a sore throat. How long does a cold last?"
  },
  {
    title: "Persistent fatigue",
    text: "I've been feeling extreme fatigue and unexplained tiredness for the past three weeks."
  }
]

function App() {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [healthStatus, setHealthStatus] = useState('checking') // 'online' | 'offline' | 'checking'
  const [selectedCitation, setSelectedCitation] = useState(null)

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Autoscroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth()
    const interval = setInterval(checkBackendHealth, 10000) // check every 10s
    return () => clearInterval(interval)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [inputValue])

  const checkBackendHealth = async () => {
    try {
      const response = await fetch(`${API_BASE}/health/`)
      if (response.ok) {
        setHealthStatus('online')
      } else {
        setHealthStatus('offline')
      }
    } catch (err) {
      setHealthStatus('offline')
    }
  }

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputValue).trim()
    if (!query) return

    if (query.length < 3) {
      setErrorMsg('Symptom description must be at least 3 characters long.')
      return
    }

    setErrorMsg('')
    setInputValue('')
    setLoading(true)

    // Add user message
    const userMessageId = Date.now()
    const newMessages = [...messages, { id: userMessageId, sender: 'user', text: query }]
    setMessages(newMessages)

    try {
      const response = await fetch(`${API_BASE}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      })

      const data = await response.json()

      if (response.ok) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: data.answer,
            citations: data.citations || [],
            disclaimer: data.disclaimer || '',
            sourcesFound: data.sources_found || 0
          }
        ])
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'bot',
            text: data.error || 'Something went wrong. Please try again.',
            isError: true
          }
        ])
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Failed to connect to the medical knowledge server. Please ensure the backend is running.',
          isError: true
        }
      ])
      setHealthStatus('offline')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearChat = () => {
    setMessages([])
    setErrorMsg('')
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">
            <HeartPulse size={20} color="#fff" />
          </div>
          <span className="logo-text">MediCheck</span>
        </div>

        <div className="sidebar-content">
          <div>
            <span className="section-title">System Status</span>
            <div className="health-status" style={{ marginTop: '8px' }}>
              <span className={`status-dot ${healthStatus}`} />
              <span>
                {healthStatus === 'online' ? 'Connected to Medical Knowledge' : 'Offline / Checking Server'}
              </span>
            </div>
          </div>

          <div>
            <span className="section-title">Symptom Search Templates</span>
            <div className="suggestions-list" style={{ marginTop: '12px' }}>
              {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  className="suggestion-card"
                  onClick={() => handleSend(suggestion.text)}
                  disabled={loading}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{suggestion.title}</span>
                    <ChevronRight size={14} style={{ opacity: 0.7 }} />
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {suggestion.text}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="clear-btn" onClick={clearChat}>
            <Trash2 size={16} />
            <span>Clear Conversation</span>
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="main-chat-area">
        {messages.length === 0 ? (
          <div className="welcome-screen">
            <div className="welcome-logo">
              <Activity size={32} color="#fff" />
            </div>
            <h1 className="welcome-title">AI Medical Reference Search</h1>
            <p className="welcome-desc">
              Describe your symptoms below. MediCheck uses Retrieve-and-Generate (RAG) technology to fetch verified, grounded medical details from official databases like MedlinePlus, Mayo Clinic, and the NHS.
            </p>

            <div className="features-grid">
              <div className="feature-box">
                <Brain className="feature-box-icon" size={20} />
                <h3 className="feature-box-title">Grounded AI</h3>
                <p className="feature-box-desc">Answers are derived strictly from verified clinical sources.</p>
              </div>
              <div className="feature-box">
                <BookOpen className="feature-box-icon" size={20} />
                <h3 className="feature-box-title">Transparency</h3>
                <p className="feature-box-desc">Every symptom description links to the exact source page with relevance scores.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="messages-container">
            <div className="messages-list-wrapper">
              {messages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.sender}`}>
                  <div className="message-bubble">
                    {msg.text}

                    {/* Citations & Sources (Bot Only) */}
                    {msg.sender === 'bot' && msg.citations && msg.citations.length > 0 && (
                      <div className="citations-section">
                        <div className="citations-header">
                          <BookOpen size={13} />
                          <span>Sources Referenced ({msg.citations.length})</span>
                        </div>
                        <div className="citations-grid">
                          {msg.citations.map((cit) => (
                            <div 
                              key={cit.number} 
                              className="citation-card"
                              onClick={() => setSelectedCitation(cit)}
                            >
                              <span className="citation-badge">{cit.number}</span>
                              <span className="citation-source">{cit.source}</span>
                              <span className="citation-score">{(cit.relevance_score * 100).toFixed(0)}% match</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Disclaimer (Bot Only) */}
                    {msg.sender === 'bot' && msg.disclaimer && (
                      <div className="disclaimer-box">
                        <ShieldAlert size={16} />
                        <div>{msg.disclaimer}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Animation */}
              {loading && (
                <div className="message-row bot">
                  <div className="message-bubble" style={{ minWidth: '80px', display: 'flex', justifyContent: 'center' }}>
                    <div className="typing-indicator">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="input-area">
          <div className="input-container-wrapper">
            <div className="input-form">
              <textarea
                ref={textareaRef}
                className="input-textbox"
                placeholder="Describe your symptoms (e.g., 'I have a high fever and headache...')"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading}
              />
              
              <div className="input-controls">
                <div>
                  {errorMsg ? (
                    <span className="input-error-msg">
                      <AlertCircle size={12} />
                      {errorMsg}
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={11} color="hsl(var(--primary))" />
                      Grounded in verified documentation
                    </span>
                  )}
                </div>
                
                <button
                  type="button"
                  className="submit-btn"
                  onClick={() => handleSend()}
                  disabled={loading || !inputValue.trim()}
                >
                  <Send size={13} />
                  <span>Search</span>
                </button>
              </div>
            </div>
            
            <div className="disclaimer-footer">
              MediCheck is a RAG-powered reference assistant. It does not replace professional medical judgment, diagnosis, or advice.
            </div>
          </div>
        </div>
      </main>

      {/* Citation Inspector Modal */}
      {selectedCitation && (
        <div className="citation-modal-overlay" onClick={() => setSelectedCitation(null)}>
          <div className="citation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <BookOpen size={18} color="hsl(var(--primary))" />
                <span>Citation Details — Source [{selectedCitation.number}]</span>
              </div>
              <button className="close-btn" onClick={() => setSelectedCitation(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-meta-row">
                <span className="modal-meta-label">Origin Database:</span>
                <span style={{ fontWeight: '600' }}>{selectedCitation.source}</span>
              </div>
              <div className="modal-meta-row">
                <span className="modal-meta-label">Relevance Score:</span>
                <span className="citation-score" style={{ display: 'inline-block' }}>
                  {(selectedCitation.relevance_score * 100).toFixed(0)}% Confidence Match
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span className="modal-meta-label">Reference Snippet:</span>
                <div className="modal-snippet-box">
                  {selectedCitation.text || "No snippet content was retrieved."}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
