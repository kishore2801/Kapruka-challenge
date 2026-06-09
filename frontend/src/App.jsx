import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Send, ShoppingBag, ChevronDown, Loader2, Bot } from 'lucide-react';

const API_URL = 'http://localhost:8000/api/chat';

const SUGGESTIONS = [
  'Search for birthday gifts',
  'Show me electronics',
  'Check delivery to Colombo',
  'Track my order',
];

const WELCOME = {
  id: 'welcome',
  role: 'bot',
  text: "Hi! I'm **Kopi**, your Kapruka shopping assistant. I can help you search for products, check delivery, track orders, and more. How can I help you today?",
  timestamp: new Date(),
};

function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div
      className="message-enter"
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '14px',
        gap: '10px',
        alignItems: 'flex-end',
      }}
    >
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #10B981, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Bot size={16} color="#fff" />
        </div>
      )}
      <div style={{
        maxWidth: '72%',
        padding: '11px 15px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser
          ? 'linear-gradient(135deg, #10B981, #059669)'
          : 'rgba(255,255,255,0.07)',
        color: 'rgba(255,255,255,0.92)',
        fontSize: '14px',
        lineHeight: '1.55',
        border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
      }}
        dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
      />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="message-enter" style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 14 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'linear-gradient(135deg, #10B981, #059669)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Bot size={16} color="#fff" />
      </div>
      <div style={{
        padding: '14px 18px',
        borderRadius: '18px 18px 18px 4px',
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} className="typing-dot" style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#10B981', display: 'block',
            animationDelay: `${i * 0.18}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScroll(distFromBottom > 120);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const send = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: trimmed, timestamp: new Date() }]);
    setLoading(true);

    try {
      const { data } = await axios.post(API_URL, { message: trimmed });
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        text: data.message || 'Sorry, I could not process that.',
        timestamp: new Date(),
      }]);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        text: detail || 'Something went wrong. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [input, loading]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={{
      height: '100%', width: '100%',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1a14 50%, #050d1a 100%)',
      position: 'relative', display: 'flex', flexDirection: 'column',
    }}>
      {/* Background blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Header */}
      <header style={{
        position: 'relative', zIndex: 10,
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'linear-gradient(135deg, #10B981, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShoppingBag size={18} color="#fff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Kopi</span>
            <div className="status-dot" />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Kapruka Shopping Assistant</span>
        </div>
      </header>

      {/* Message list */}
      <div ref={listRef} style={{
        flex: 1, overflowY: 'auto', padding: '20px 16px 8px',
        position: 'relative', zIndex: 1,
      }}>
        {messages.map(msg => <Message key={msg.id} msg={msg} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom button */}
      {showScroll && (
        <button
          className="scroll-btn"
          onClick={scrollToBottom}
          style={{
            position: 'absolute', bottom: 100, right: 20,
            zIndex: 20, width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <ChevronDown size={16} color="rgba(255,255,255,0.7)" />
        </button>
      )}

      {/* Suggestions (shown only when no conversation yet) */}
      {messages.length === 1 && (
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap',
          padding: '0 16px 10px', position: 'relative', zIndex: 1,
        }}>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              className="chip"
              onClick={() => send(s)}
              style={{
                padding: '7px 13px', borderRadius: 20,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.65)',
                fontSize: 13, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{
        position: 'relative', zIndex: 10,
        padding: '10px 14px 14px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        background: 'rgba(0,0,0,0.25)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 10,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 18, padding: '8px 8px 8px 16px',
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about products, delivery, orders…"
            rows={1}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              resize: 'none', color: 'rgba(255,255,255,0.88)',
              fontSize: 14, lineHeight: '1.5', maxHeight: 120,
              overflowY: 'auto', paddingTop: 2,
            }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            className="send-btn"
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #10B981, #059669)'
                : 'rgba(255,255,255,0.08)',
              border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            {loading
              ? <Loader2 size={16} color="rgba(255,255,255,0.5)" className="spinner" />
              : <Send size={15} color={input.trim() ? '#fff' : 'rgba(255,255,255,0.3)'} />
            }
          </button>
        </div>
      </div>
    </div>
  );
}
