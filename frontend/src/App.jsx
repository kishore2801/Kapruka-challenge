import React, { useState, useRef, useEffect, useCallback, Component } from 'react';
import axios from 'axios';
import { Send, ShoppingBag, ChevronDown, Loader2, X, RotateCcw, Trash2, Plus, Minus } from 'lucide-react';
import KopiMascot from './KopiMascot';

const _BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_URL = `${_BASE}/api/chat`;
const PRODUCTS_URL = `${_BASE}/api/products`;

const CURRENCIES = [
  { code: 'LKR', flag: '🇱🇰', name: 'Sri Lankan Rupee' },
  { code: 'USD', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'GBP', flag: '🇬🇧', name: 'British Pound' },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro' },
  { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar' },
  { code: 'CAD', flag: '🇨🇦', name: 'Canadian Dollar' },
  { code: 'SGD', flag: '🇸🇬', name: 'Singapore Dollar' },
  { code: 'INR', flag: '🇮🇳', name: 'Indian Rupee' },
];

const LANGUAGES = [
  {
    code: 'english',
    native: 'English',
    label: 'English',
    emoji: '🇬🇧',
    welcome: "Hey there! 🐿️ I'm **Korpi**, your personal shopping squirrel at Kapruka, Sri Lanka's favourite online gift store. Tell me who you're shopping for and I'll find something truly special. What's the occasion?",
    suggestions: [
      { text: 'I want to buy: ', label: '🛒 I want to buy...' },
      { text: 'I need a gift for: ', label: '🎁 I need a gift for...' },
      { text: 'Check delivery to (city/date): ', label: '🚚 Check delivery to...' },
      { text: 'Track my order: ', label: '📦 Track my order...' },
    ],
  },
  {
    code: 'sinhala',
    native: 'සිංහල',
    label: 'Sinhala',
    emoji: '🇱🇰',
    welcome: "ආයුබෝවන්! 🐿️ මම **Korpi**, Kapruka ගස මත ජීවත් වෙන ඔබේ සාප්පු සහකාරයා. ඔබ කාට හෝ විශේෂ තෑග්ගක් ගන්න සොයනවාද? කියන්න, මම හොඳම දේ හොයාගෙන එනවා!",
    suggestions: [
      { text: 'මට මිලදී ගැනීමට අවශ්‍යයි: ', label: '🛒 මිලදී ගැනීමට...' },
      { text: 'මට තෑග්ගක් අවශ්‍යයි: ', label: '🎁 තෑග්ගක් අවශ්‍යයි...' },
      { text: 'බෙදාහැරීම් පරීක්ෂා කරන්න (නගරය/දිනය): ', label: '🚚 බෙදාහැරීම් පරීක්ෂාව...' },
      { text: 'මගේ ඇණවුම නිරීක්ෂණය කරන්න: ', label: '📦 ඇණවුම නිරීක්ෂණය...' },
    ],
  },
  {
    code: 'tamil',
    native: 'தமிழ்',
    label: 'Tamil',
    emoji: '🇱🇰',
    welcome: "வணக்கம்! 🐿️ நான் **கோர்பி**, Kapruka மரத்தில் வாழும் உங்கள் சொந்த ஷாப்பிங் அணில். யாருக்காவது ஒரு அன்பான பரிசு தேடுகிறீர்களா? சொல்லுங்க, சிறந்ததை கண்டுபிடிக்கிறேன்!",
    suggestions: [
      { text: 'நான் வாங்க விரும்புகிறேன்: ', label: '🛒 வாங்க விரும்புகிறேன்...' },
      { text: 'எனக்கு ஒரு பரிசு வேண்டும்: ', label: '🎁 பரிசு வேண்டும்...' },
      { text: 'டெலிவரி சரிபார் (நகரம்/தேதி): ', label: '🚚 டெலிவரி சரிபார்...' },
      { text: 'என் ஆர்டரை கண்காணி: ', label: '📦 ஆர்டரை கண்காணி...' },
    ],
  },
];

const OCCASIONS = [
  {
    emoji: '🎂',
    labels: { english: 'Birthday', sinhala: 'උපන් දිනය', tamil: 'பிறந்தநாள்' },
    prompt: { english: 'I need a great birthday gift. What do you recommend?', sinhala: 'මට ලස්සන උපන්දින තෑග්ගක් ඕනෙ. මොනවද හොඳ?', tamil: 'எனக்கு ஒரு நல்ல பிறந்தநாள் பரிசு வேண்டும். என்ன பரிந்துரைக்கிறீர்கள்?' },
  },
  {
    emoji: '💍',
    labels: { english: 'Anniversary', sinhala: 'සංවත්සරය', tamil: 'ஆண்டுவிழா' },
    prompt: { english: 'Looking for an anniversary gift. What do you have?', sinhala: 'සංවත්සර තෑග්ගක් හොයනවා. මොනවද තියෙන්නේ?', tamil: 'ஆண்டுவிழா பரிசு தேடுகிறேன். என்ன இருக்கிறது?' },
  },
  {
    emoji: '🎓',
    labels: { english: 'Graduation', sinhala: 'උපාධිය', tamil: 'பட்டமளிப்பு' },
    prompt: { english: 'I need a graduation gift. What do you recommend?', sinhala: 'උපාධි තෑග්ගක් ඕනෙ. මොනවද හොඳ?', tamil: 'பட்டமளிப்பு பரிசு வேண்டும். என்ன பரிந்துரைக்கிறீர்கள்?' },
  },
  {
    emoji: '👶',
    labels: { english: 'New Baby', sinhala: 'අළුත් දරුවා', tamil: 'புதிய குழந்தை' },
    prompt: { english: 'Looking for a new baby gift.', sinhala: 'අලුත් ළදරුවෙකුට තෑග්ගක් හොයනවා.', tamil: 'புதிய குழந்தைக்கு பரிசு தேடுகிறேன்.' },
  },
  {
    emoji: '💐',
    labels: { english: "Mother's Day", sinhala: 'මව් දිනය', tamil: 'தாய் தினம்' },
    prompt: { english: "I need a special Mother's Day gift.", sinhala: 'අම්මාට විශේෂ මව් දින තෑග්ගක් ඕනෙ.', tamil: 'அம்மாவுக்கு சிறப்பான தாய் தின பரிசு வேண்டும்.' },
  },
  {
    emoji: '🕊️',
    labels: { english: 'Condolence', sinhala: 'අනුතාපය', tamil: 'இரங்கல்' },
    prompt: { english: 'Someone close to me passed away. I need to send something thoughtful and respectful.', sinhala: 'මගේ ආදරණීයයෙකු අය වී ගියා. ගෞරවසහගත දෙයක් යවන්න ඕනෙ.', tamil: 'என்னோடு நெருங்கிய ஒருவர் இறந்துவிட்டார். ஒரு மரியாதையான பரிசு அனுப்ப வேண்டும்.' },
  },
  {
    emoji: '🏥',
    labels: { english: 'Get Well', sinhala: 'සුවය ලබා ගන්න', tamil: 'குணமடையட்டும்' },
    prompt: { english: 'A friend is in hospital. I want to send a get-well gift.', sinhala: 'මගේ යාළුවා රෝහලේ. සුව ලැබෙන්න තෑග්ගක් යවන්න ඕනෙ.', tamil: 'என் நண்பர் மருத்துவமனையில் இருக்கிறார். குணமடைவதற்கான பரிசு அனுப்ப விரும்புகிறேன்.' },
  },
  {
    emoji: '💑',
    labels: { english: 'Wedding', sinhala: 'විවාහය', tamil: 'திருமணம்' },
    prompt: { english: 'I need a wedding gift. Something elegant and memorable.', sinhala: 'විවාහ තෑග්ගක් ඕනෙ. අලංකාර සහ මතකයේ රැඳෙන දෙයක්.', tamil: 'திருமண பரிசு வேண்டும். அழகான மற்றும் நினைவில் நிற்கக்கூடிய ஒன்று.' },
  },
];

function fireConfetti() {
  const colors = ['#DA532C', '#F59E0B', '#10B981', '#ffffff', '#f472b6'];
  for (let i = 0; i < 22; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-particle';
    el.style.left = `${Math.random() * 100}vw`;
    el.style.top = '0px';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDelay = `${Math.random() * 0.8}s`;
    el.style.width = `${6 + Math.random() * 6}px`;
    el.style.height = `${6 + Math.random() * 6}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }
}

const BG = 'linear-gradient(135deg, #0a0f1e 0%, #0d1a14 50%, #050d1a 100%)';

/* ─── Text formatter ──────────────────────────────────────────────────────── */
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag]));
}

function formatInline(text) {
  return escapeHTML(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.15);padding:2px 6px;border-radius:4px;font-size:13px;font-family:monospace;">$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#DA532C;text-decoration:underline;">$1</a>');
}

function formatText(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const parts = [];
  let listItems = [];
  const flushList = () => {
    if (listItems.length) {
      parts.push(`<ul>${listItems.join('')}</ul>`);
      listItems = [];
    }
  };
  for (const line of lines) {
    const t = line.trim();
    if (/^[*-] /.test(t)) {
      listItems.push(`<li>${formatInline(t.slice(2))}</li>`);
    } else {
      flushList();
      parts.push(t === '' ? '' : `<p>${formatInline(t)}</p>`);
    }
  }
  flushList();
  return `<div class="markdown-content">${parts.join('')}</div>`;
}

/* ─── UI Challenge Components ───────────────────────────────────────────────── */
function LanguageHint({ onDismiss, lang }) {
  const tipText = lang?.code === 'sinhala'
    ? '💡 Singlish කතා කරන්නත් පුලුවන්! English අකුරෙන් Sinhala ලියන්න (e.g. "mama birthday cake ekak ganna ona") 🎂'
    : lang?.code === 'tamil'
    ? '💡 Tanglish பேசலாம்! English எழுத்துகளில் Tamil டைப் பண்ணலாம் (e.g. "enakku birthday cake venum") 🎂'
    : '💡 Tip: Just type "speak in Sinhala" or "speak in Tamil" to switch languages instantly! 🇱🇰';
  return (
    <div className="hint-enter" style={{ background: '#FFF5ED', borderLeft: '4px solid #DA532C', borderRadius: 8, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 auto 12px', width: '100%', maxWidth: 768, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <span style={{ color: '#333', fontSize: 13, fontWeight: 500 }}>{tipText}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}><X size={16} /></button>
    </div>
  );
}

function DeliveryDatePicker({ onDateSelected }) {
  const [selected, setSelected] = useState(null);
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return (
    <div className="message-enter delivery-picker" style={{ background: 'rgba(30, 41, 59, 0.7)', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.1)', maxWidth: 400 }}>
      <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>Select Delivery Date</div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
        {dates.map((d, i) => {
          const isToday = i === 0;
          const isTomorrow = i === 1;
          const isSel = selected === i;
          return (
            <button key={i} disabled={isToday} onClick={() => setSelected(i)}
              style={{
                flexShrink: 0, width: 48, height: 64, borderRadius: 24,
                background: isSel ? '#DA532C' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isSel ? '#DA532C' : 'rgba(255,255,255,0.1)'}`,
                color: isToday ? 'rgba(255,255,255,0.3)' : '#fff',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: isToday ? 'not-allowed' : 'pointer', position: 'relative',
                transition: 'all 0.2s'
              }}>
              <span style={{ fontSize: 10, fontWeight: 600 }}>{d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</span>
              <span style={{ fontSize: 20, fontWeight: 700, margin: '2px 0' }}>{d.getDate()}</span>
              <span style={{ fontSize: 10 }}>{d.toLocaleDateString('en-US', { month: 'short' })}</span>
              {isTomorrow && <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: '#DA532C', border: '2px solid #1e293b' }} title="Fastest ⚡" />}
            </button>
          )
        })}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 8 }}>
        📦 Estimated delivery: <strong style={{ color: selected !== null ? '#DA532C' : 'inherit' }}>{selected !== null ? 'before 6 PM' : 'Select a date'}</strong>
      </div>
      {selected !== null && (
        <button onClick={() => {
          const dStr = dates[selected].toLocaleDateString('en-CA');
          onDateSelected(dStr);
        }} style={{ width: '100%', marginTop: 12, padding: 10, borderRadius: 10, background: '#DA532C', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
          Confirm Delivery
        </button>
      )}
    </div>
  );
}

function GiftMessagePanel({ isOpen, onSkip, onAdd }) {
  const [msg, setMsg] = useState("");
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#0f1923', width: '100%', maxWidth: 500, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTop: '1px solid rgba(218,83,44,0.3)', animation: 'slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
        <div style={{ position: 'absolute', top: -40, right: 20 }}>
          <KopiMascot state="checkout" size={80} />
        </div>
        <h3 style={{ color: '#fff', fontSize: 18, marginTop: 0, marginBottom: 16 }}>Add a personal touch 💌</h3>
        <div style={{ position: 'relative' }}>
          <textarea value={msg} onChange={e => setMsg(e.target.value.substring(0, 150))} placeholder="Write your gift message here... (e.g. Happy Birthday Ammi! 🎂)" style={{ width: '100%', height: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, resize: 'none' }} />
          <div style={{ position: 'absolute', bottom: 8, right: 12, color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{msg.length}/150</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <button onClick={() => setMsg("සුභ උපන් දිනයක් වේවා! Wishing you a wonderful birthday filled with joy! 🎂")} style={{ flex: 1, padding: 8, borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 11, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>🎂 Birthday</button>
          <button onClick={() => setMsg("ඔබට ගොඩක් ආදරෙයි 💐 Sent with all my love.")} style={{ flex: 1, padding: 8, borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 11, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>💐 Love</button>
          <button onClick={() => setMsg("Congratulations! සුභ පතමි! 🎉 Here's to many more special moments!")} style={{ flex: 1, padding: 8, borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 11, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>🎉 Celebration</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
          <button onClick={onSkip} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer' }}>Skip</button>
          <button onClick={() => onAdd(msg)} style={{ padding: '10px 20px', borderRadius: 10, background: '#DA532C', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Add Message →</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Products section (paginated 3 at a time, back/forward nav) ─────────── */
const ProductsSection = React.memo(function ProductsSection({ productIds, currency = 'LKR', onSend, onAddToCart }) {
  const [page, setPage] = useState(0);
  const [products, setProducts] = useState([]);
  const [fetching, setFetching] = useState(false);

  const preloadImages = (prods) => {
    prods.forEach(p => { if (p.image_url) { const i = new Image(); i.src = p.image_url; } });
  };

  const fetchPage = useCallback(async (pageNum) => {
    const batch = productIds.slice(pageNum * 3, pageNum * 3 + 3);
    if (!batch.length) return;
    setFetching(true);
    try {
      const { data } = await axios.post(PRODUCTS_URL, { ids: batch, currency }, { timeout: 8000 });
      const prods = data.products || [];
      preloadImages(prods);
      setProducts(prods);
      setPage(pageNum);
    } catch {}
    finally { setFetching(false); }
  }, [productIds, currency]);

  useEffect(() => {
    if (!productIds?.length) return;
    let alive = true;
    setFetching(true);
    axios.post(PRODUCTS_URL, { ids: productIds.slice(0, 3), currency }, { timeout: 8000 })
      .then(({ data }) => {
        if (alive) {
          const prods = data.products || [];
          preloadImages(prods);
          setProducts(prods);
          setPage(0);
        }
      })
      .catch(() => {})
      .finally(() => { if (alive) setFetching(false); });
    return () => { alive = false; };
  }, [productIds, currency]);

  const totalPages = Math.ceil(productIds.length / 3);
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

  if (!productIds?.length) return null;

  return (
    <div style={{ marginTop: 8 }}>
      {fetching ? (
        <div style={{ display: 'flex', gap: 8, paddingLeft: 42 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 120, height: 155, borderRadius: 12, flexShrink: 0,
              background: 'rgba(255,255,255,0.05)',
              animation: `skeletonPulse 1.4s ease-in-out ${i * 0.15}s infinite`,
            }} />
          ))}
        </div>
      ) : (
        <>
          <div className="product-scroll">
            {products.map((p, idx) => <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} index={idx} />)}
          </div>
          {(hasPrev || hasNext) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 42, marginTop: 7 }}>
              {hasPrev && (
                <button
                  onClick={() => fetchPage(page - 1)}
                  className="next-products-btn"
                  style={{
                    padding: '5px 11px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.5)', fontSize: 11,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  ← Back
                </button>
              )}
              {totalPages > 1 && (
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>
                  {page + 1} / {totalPages}
                </span>
              )}
              {hasNext && (
                <button
                  onClick={() => fetchPage(page + 1)}
                  className="next-products-btn"
                  style={{
                    padding: '5px 11px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.5)', fontSize: 11,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  Next Page →
                </button>
              )}
              {onSend && (
                <button
                  onClick={() => onSend("I'm not interested in these. Please show me different options.")}
                  className="next-products-btn"
                  style={{
                    padding: '5px 11px', borderRadius: 20,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#fca5a5', fontSize: 11,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  Not interested
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
});

/* ─── Product card ────────────────────────────────────────────────────────── */
const ProductCard = React.memo(function ProductCard({ product, onAddToCart, index = 0 }) {
  const [hovered, setHovered] = useState(false);
  const category = product.category || '🛒 Item';

  return (
    <div className="product-card-wrap" style={{ width: 180, animation: `fadeUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`, animationDelay: `${index * 60}ms`, opacity: 0 }}>
      {hovered && (
        <div className="product-preview">
          <img src={product.image_url} alt={product.name}
            style={{ width: 260, height: 260, objectFit: 'cover', display: 'block' }} />
          <div style={{ padding: '14px', background: 'rgba(30, 41, 59, 0.98)', maxWidth: 260, backdropFilter: 'blur(10px)' }}>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 4, lineHeight: '1.3' }}>{product.name}</div>
            <div style={{ color: '#DA532C', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{product.price}</div>
            
            {product.stock && (
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 2 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Stock:</span> {product.stock}
              </div>
            )}
            {product.vendor && (
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 2 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Vendor:</span> {product.vendor}
              </div>
            )}
            {product.description && (
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 8, fontStyle: 'italic', lineHeight: '1.4' }}>
                "{product.description}"
              </div>
            )}
          </div>
        </div>
      )}
      <a
        href={product.product_url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', flexDirection: 'column',
          background: hovered ? 'rgba(30, 41, 59, 0.98)' : 'rgba(22, 30, 46, 0.92)',
          border: hovered ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, overflow: 'hidden',
          textDecoration: 'none', width: '100%',
          backdropFilter: 'blur(16px)',
          transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          boxShadow: hovered ? '0 16px 32px rgba(0,0,0,0.6)' : '0 4px 16px rgba(0,0,0,0.4)',
          transform: hovered ? 'translateY(-4px)' : 'none',
          position: 'relative'
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: 160, overflow: 'hidden' }}>
          <img src={product.image_url} alt={product.name} loading="eager"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease', transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
            onError={e => {
              e.target.style.display = 'none';
              const placeholder = e.target.parentNode.querySelector('.img-placeholder');
              if (placeholder) placeholder.style.display = 'flex';
            }} />
          <div className="img-placeholder" style={{
            display: 'none', position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)',
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 4,
          }}>
            <span style={{ fontSize: 32 }}>🛍️</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>No image</span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(22,30,46,0.95) 0%, rgba(22,30,46,0) 100%)' }}></div>
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
            {category}
          </div>
          {product.stock && (
            <div style={{
              position: 'absolute', bottom: 8, left: 8,
              background: product.stock.toLowerCase().includes('out') ? 'rgba(239,68,68,0.85)' : 'rgba(16,185,129,0.85)',
              backdropFilter: 'blur(4px)',
              padding: '2px 7px', borderRadius: 10,
              fontSize: 9, fontWeight: 700,
              color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {product.stock.toLowerCase().includes('out') ? 'Out of Stock' : 'In Stock'}
            </div>
          )}
        </div>

        <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1, position: 'relative', zIndex: 2 }}>
          <div style={{
            color: 'rgba(255,255,255,0.92)', fontSize: 13, fontWeight: 600,
            lineHeight: '1.3',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            height: 34
          }}>
            {product.name}
          </div>
          {product.vendor && (
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: -4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {product.vendor}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ color: '#f0a070', fontSize: 14, fontWeight: 700 }}>
              {product.price}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
            <div style={{ flex: 1, padding: '6px 0', textAlign: 'center', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600 }}>Details</div>
            <button
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                if (onAddToCart) onAddToCart(product);
              }}
              style={{ flex: 1, padding: '6px 0', textAlign: 'center', borderRadius: 8, background: 'rgba(218,83,44,0.85)', color: '#fff', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </a>
    </div>
  );
});

/* ─── Currency picker dropdown ────────────────────────────────────────────── */
function CurrencyPicker({ currency, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: `1px solid ${open ? 'rgba(218,83,44,0.5)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 20, padding: '5px 11px',
          color: 'rgba(255,255,255,0.7)', fontSize: 13,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
          transition: 'all 0.2s',
        }}
      >
        <span style={{ fontSize: 16 }}>{current.flag}</span>
        <span className="lang-badge-text currency-label">{current.code}</span>
        <ChevronDown size={11} style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: '#0f1923', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 100, minWidth: 180,
        }}>
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => { onChange(c.code); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 14px',
                background: c.code === currency ? 'rgba(218,83,44,0.12)' : 'transparent',
                border: 'none', cursor: 'pointer',
                color: c.code === currency ? '#DA532C' : 'rgba(255,255,255,0.75)',
                fontSize: 13, textAlign: 'left', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (c.code !== currency) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (c.code !== currency) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{c.flag}</span>
              <span style={{ fontWeight: 600, letterSpacing: '0.02em' }}>{c.code}</span>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Language selection screen ───────────────────────────────────────────── */
function LanguageSelect({ onSelect }) {
  return (
    <div style={{
      height: '100%', width: '100%', background: BG,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', padding: '24px 20px',
    }}>
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 480, width: '100%' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <div className="kopi-avatar">
            <KopiMascot state="idle" size={100} />
          </div>
        </div>

        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Korpi</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 32 }}>
          Kapruka Shopping Assistant
        </p>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: 500, marginBottom: 18 }}>
          Choose your language to begin
        </p>

        <div className="lang-cards-row">
          {LANGUAGES.map(l => (
            <button key={l.code} className="lang-card" onClick={() => onSelect(l)}>
              <span style={{ fontSize: 34 }}>{l.emoji}</span>
              <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{l.native}</span>
              {l.native !== l.label && (
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{l.label}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Acorn Rating ─────────────────────────────────────────────────────────── */
function AcornRating({ lang }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const label = {
    sinhala: { ask: 'ඔබේ අත්දැකීම කෙසේද? 🌰', thanks: 'ස්තූතියි! ඔබේ ප්‍රතිචාරය අගය කරනවා 🐿️' },
    tamil:   { ask: 'உங்கள் அனுபவம் எப்படி? 🌰', thanks: 'நன்றி! உங்கள் கருத்தை மதிக்கிறோம் 🐿️' },
    english: { ask: 'How was your experience? 🌰', thanks: 'Thank you! Your feedback means a lot 🐿️' },
  }[lang?.code] || { ask: 'How was your experience? 🌰', thanks: 'Thank you! Your feedback means a lot 🐿️' };

  if (submitted) return (
    <div style={{ marginLeft: 42, marginTop: 12, color: '#DA532C', fontSize: 13, fontWeight: 600 }}>
      {label.thanks}
    </div>
  );

  return (
    <div style={{ marginLeft: 42, marginTop: 14 }}>
      <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 6 }}>{label.ask}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1,2,3,4,5].map(n => (
          <button
            key={n}
            onClick={() => { setRating(n); setSubmitted(true); }}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 2,
              fontSize: 22, lineHeight: 1,
              filter: (hover || rating) >= n ? 'none' : 'grayscale(1) opacity(0.35)',
              transform: hover === n ? 'scale(1.25)' : 'scale(1)',
              transition: 'transform 0.15s, filter 0.15s',
            }}
          >🌰</button>
        ))}
      </div>
    </div>
  );
}

/* ─── Message bubble ──────────────────────────────────────────────────────── */
const Message = React.memo(function Message({ msg, currency, onSend, onAddToCart, isActive, mascotState, lang }) {
  const isUser = msg.role === 'user';
  const [hovered, setHovered] = useState(false);
  const timestamp = msg.timestamp ? new Date(msg.timestamp) : new Date();
  
  // Determine past state for static bubbles — rich content-aware logic
  let pastState = 'idle';
  const t = msg.text || '';
  if (msg.id === 'welcome') pastState = 'greet';
  else if (msg.product_ids?.length > 0) pastState = 'found';
  else if (/order submitted|KPR-\d+|reference.*KPR/i.test(t)) pastState = 'success';
  else if (/congratulations|wonderful|great news|perfect choice|love it|amazing/i.test(t)) pastState = 'success';
  else if (/not available|out of stock|don't have|cannot find|not found|doesn't seem to carry|kapruka does not have/i.test(t)) pastState = 'error';
  else if (/acorn radar|went offline|rustling|something went wrong/i.test(t)) pastState = 'error';
  else if (/so sorry|condolence|sympathy|difficult time|my heart|loss|passed away|grieving/i.test(t)) pastState = 'idle';
  else if (/dispatched|on the way|delivery|shipped|arriving|truck|will reach|city/i.test(t)) pastState = 'delivery';
  else if (/cart|checkout|payment|place.*order|ready to order|confirm.*order/i.test(t)) pastState = 'checkout';
  else if (/here.*found|check.*out|take a look|options for you|picked.*for you|spotted/i.test(t)) pastState = 'found';
  
  // Determine if this message is asking for a delivery date
  const needsDeliveryDate = !isUser && isActive && msg.text?.match(/(delivery date|date of delivery|කවදාද|தேதி)/i);

  return (
    <div className="message-enter" style={{ marginBottom: 4 }}>
      <div style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        gap: 12, alignItems: 'flex-start',
      }}>
        {!isUser && (
          <div className={`kopi-avatar message-avatar ${!isActive ? 'static' : ''}`} style={{ transition: 'opacity 0.2s', marginTop: 12, flexShrink: 0, width: 38, height: 38, borderRadius: '50%', background: 'rgba(218,83,44,0.10)', border: '1px solid rgba(218,83,44,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <KopiMascot state={isActive ? mascotState : pastState} size={34} facing="right" />
          </div>
        )}
        <div 
          style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', maxWidth: '85%' }}
          onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        >
          {!isUser && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4, marginLeft: 2, fontWeight: 500 }}>Korpi</span>}
          {isUser && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4, marginRight: 2, fontWeight: 500 }}>You</span>}
          <div
            className={`msg-bubble ${isUser ? 'msg-bubble-user' : 'msg-bubble-bot'}`}
            style={{
              padding: '14px 18px',
              color: 'rgba(255,255,255,0.95)',
            }}
            dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
          />
          <div style={{ fontSize: 10, color: '#999', marginTop: 4, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s', height: 12 }}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
      {!isUser && msg.product_ids?.length > 0 && (
        <>
          <ProductsSection productIds={msg.product_ids} currency={currency} onSend={onSend} onAddToCart={onAddToCart} />
          <BudgetChips onSend={onSend} currency={currency} />
          <div style={{ marginLeft: 42, marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => onSend('Show me more options like these but different')}
              style={{
                padding: '3px 10px', borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.45)', fontSize: 11,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(218,83,44,0.12)'; e.currentTarget.style.borderColor = 'rgba(218,83,44,0.3)'; e.currentTarget.style.color = '#DA532C'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
            >
              🔄 More like these
            </button>
            <button
              onClick={() => onSend('What makes these products special? Tell me more.')}
              style={{
                padding: '3px 10px', borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.45)', fontSize: 11,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(218,83,44,0.12)'; e.currentTarget.style.borderColor = 'rgba(218,83,44,0.3)'; e.currentTarget.style.color = '#DA532C'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
            >
              ✨ Tell me more
            </button>
          </div>
        </>
      )}
      {!isUser && (() => {
        const ref = msg.text?.match(/\*\*(KPR-\d+)\*\*/) || msg.text?.match(/(KPR-\d+)/);
        return ref ? (
          <>
            <div style={{ marginLeft: 42, marginTop: 8 }}>
              <button
                onClick={() => onSend(`Track my order ${ref[1]}`)}
                style={{
                  padding: '5px 14px', borderRadius: 16,
                  background: 'rgba(218,83,44,0.12)',
                  border: '1px solid rgba(218,83,44,0.35)',
                  color: '#DA532C', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(218,83,44,0.22)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(218,83,44,0.12)'}
              >
                📦 Track {ref[1]}
              </button>
            </div>
            <AcornRating lang={lang} />
          </>
        ) : null;
      })()}
      {needsDeliveryDate && (
        <DeliveryDatePicker onDateSelected={(dateStr) => onSend(`I need delivery on ${dateStr}.`, 'delivery')} />
      )}
    </div>
  );
});

/* ─── Typing indicator ────────────────────────────────────────────────────── */
function TypingIndicator({ status, statusIdx = 0 }) {
  const tipState = statusIdx === 3 ? 'delivery'
    : (statusIdx === 1 || statusIdx === 2) ? 'found'
    : 'searching';
  return (
    <div className="message-enter" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
      <div className="kopi-avatar message-avatar" style={{ marginTop: 12, flexShrink: 0, width: 38, height: 38, borderRadius: '50%', background: 'rgba(218,83,44,0.10)', border: '1px solid rgba(218,83,44,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <KopiMascot state={tipState} size={34} facing="right" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4, marginLeft: 2, fontWeight: 500 }}>Korpi</span>
        <div className="msg-bubble msg-bubble-bot" style={{
          padding: '14px 18px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', height: 12, padding: '4px 0' }}>
            {[0, 1, 2].map(i => (
              <span key={i} className="typing-dot" style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#DA532C', display: 'block',
                animation: `waveBounce 0.6s infinite alternate ${i * 0.15}s`,
              }} />
            ))}
          </div>
          {status && (
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 500 }}>{status}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Budget Chips ────────────────────────────────────────────────────────── */
function BudgetChips({ onSend, currency }) {
  if (currency !== 'LKR') return null;
  const budgets = ['1,000', '2,500', '5,000', '10,000'];
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 42, marginTop: 6 }}>
      {budgets.map(b => (
        <button
          key={b}
          onClick={() => onSend(`Show me only options under LKR ${b}`)}
          style={{
            padding: '3px 10px', borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.45)', fontSize: 11,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(218,83,44,0.12)'; e.currentTarget.style.borderColor = 'rgba(218,83,44,0.3)'; e.currentTarget.style.color = '#DA532C'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
        >
          Under LKR {b}
        </button>
      ))}
    </div>
  );
}

/* ─── Checkout Confirm Modal ──────────────────────────────────────────────── */
function CheckoutConfirmModal({ cart, isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#0f1923', borderRadius: 20, padding: 24, width: '90%', maxWidth: 400, border: '1px solid rgba(218,83,44,0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        <h3 style={{ color: '#fff', fontSize: 18, marginTop: 0, marginBottom: 16 }}>Confirm Checkout</h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 20 }}>Are you ready to checkout with the following items?</p>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {cart.map((item, idx) => (
            <img key={item.id || item.product_id || idx} src={item.image_url} alt={item.name} title={item.name} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: '#1e293b' }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: 12, borderRadius: 10, background: 'linear-gradient(135deg, #DA532C, #b83d1c)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Yes, Proceed</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Cart Drawer ─────────────────────────────────────────────────────────── */
function CartDrawer({ cart, isOpen, onClose, onCheckout, onRemoveItem, onUpdateQuantity }) {
  const calculateTotal = () => {
    let total = 0;
    cart.forEach(item => {
      const priceStr = item.price.replace(/[^\d.-]/g, '');
      total += parseFloat(priceStr) * item.quantity;
    });
    return total.toLocaleString(undefined, { minimumFractionDigits: 2 });
  };

  return (
    <>
      {isOpen && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 }} onClick={onClose} />}
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {cart.length > 0 && <KopiMascot state="cart-full" size={48} />}
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>Your Cart</h2>
            {cart.length > 0 && (
              <span style={{ background: '#DA532C', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '1px 7px' }}>
                {cart.reduce((t, i) => t + i.quantity, 0)}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {cart.length === 0 ? (
            <div style={{ padding: '28px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <KopiMascot state="cart-empty" size={110} />
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600 }}>Nothing here yet!</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, lineHeight: 1.5, maxWidth: 200 }}>
                Ask me to find something and I'll add it here 🐿️
              </div>
            </div>
          ) : (
            cart.map((item, idx) => {
              const itemId = item.id || item.product_id;
              return (
                <div key={itemId || idx} className="cart-item">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    style={{ background: '#1e293b' }}
                    onError={e => {
                      e.target.style.display = 'none';
                      e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                    }}
                  />
                  <div style={{
                    display: 'none', width: 64, height: 64, flexShrink: 0,
                    background: 'linear-gradient(135deg, #1e293b, #2d3748)',
                    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                  }}>🛍️</div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', padding: '4px 6px' }}>
                        <button onClick={() => onUpdateQuantity(itemId, -1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}>
                          <Minus size={14} />
                        </button>
                        <span style={{ color: '#fff', fontSize: 13, minWidth: '16px', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                        <button onClick={() => onUpdateQuantity(itemId, 1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}>
                          <Plus size={14} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="cart-item-price">{item.price}</span>
                        <button onClick={() => onRemoveItem(itemId)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }} title="Remove item">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {cart.length > 0 && (
          <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 25, 35, 0.95)' }}>
            <div className="cart-subtotal" style={{ borderTop: 'none', padding: '0 0 16px 0' }}>
              <span>Subtotal</span>
              <span style={{ color: '#DA532C', fontSize: 18, fontWeight: 700 }}>
                {cart[0]?.price?.replace(/[\d.,]+/g, '')} {calculateTotal()}
              </span>
            </div>
            <button 
              onClick={onCheckout}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #DA532C, #b83d1c)',
                color: '#fff', border: 'none', fontWeight: 600, fontSize: 16,
                cursor: 'pointer', boxShadow: '0 6px 20px rgba(218,83,44,0.3)',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
              }}>
              <ShoppingBag size={18} />
              Checkout via Chat
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Error Boundary ──────────────────────────────────────────────────────── */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'white', background: '#050d1a', height: '100vh', overflow: 'auto' }}>
          <h2>Something went wrong.</h2>
          <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <pre style={{ color: 'yellow', whiteSpace: 'pre-wrap' }}>{this.state.info?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── Main app ────────────────────────────────────────────────────────────── */
function MainApp() {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('kapruka_lang');
    return saved ? JSON.parse(saved) : null;
  });
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('kapruka_currency') || 'LKR';
  });
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('kapruka_messages');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) return parsed;
    }
    // If lang is already set but messages are empty, seed the welcome message
    const savedLang = localStorage.getItem('kapruka_lang');
    if (savedLang) {
      try {
        const l = JSON.parse(savedLang);
        return [{ id: 'welcome', role: 'bot', text: l.welcome, timestamp: new Date() }];
      } catch {}
    }
    return [];
  });
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('kapruka_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [loadingStatusIdx, setLoadingStatusIdx] = useState(0);
  const [showScroll, setShowScroll] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Tasks state
  const [showGiftMessagePanel, setShowGiftMessagePanel] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [showLanguageHint, setShowLanguageHint] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const [btnPulse, setBtnPulse] = useState(false);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [mascotAction, setMascotAction] = useState(null);
  const [cartToast, setCartToast] = useState(null);

  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const textareaRef = useRef(null);
  // Sync state to localStorage
  useEffect(() => {
    if (lang) localStorage.setItem('kapruka_lang', JSON.stringify(lang));
    else localStorage.removeItem('kapruka_lang');
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('kapruka_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('kapruka_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('kapruka_cart', JSON.stringify(cart));
  }, [cart]);

  const handleLanguageSelect = useCallback((selected) => {
    setLang(selected);
    setMessages(prev => {
      if (prev.length === 0 || (prev.length === 1 && prev[0].id === 'welcome')) {
        return [{ id: 'welcome', role: 'bot', text: selected.welcome, timestamp: new Date() }];
      } else {
        return [...prev, { id: Date.now(), role: 'bot', text: selected.welcome, timestamp: new Date() }];
      }
    });
  }, []);

  const handleAddToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, image_url: product.image_url }];
    });
    if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 400);
    setIsCartOpen(true);
    setMascotAction('success');
    setTimeout(() => setMascotAction(null), 3000);
    setCartToast(product.name);
    setTimeout(() => setCartToast(null), 2500);
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);


  useEffect(() => { scrollToBottom(); }, [messages, loading, scrollToBottom]);

  const STATUS_MESSAGES = {
    english: [
      'Sniffing out the best picks 🐿️',
      'Climbing the wish-granting tree 🌳',
      'Fetching fresh results...',
      'Checking delivery options...',
      'Gathering my acorns 🌰',
      'Almost there, hold tight...',
    ],
    sinhala: [
      'හොඳම දේ හොයාගෙන එනවා 🐿️',
      'ආශා ගස නගිනවා 🌳',
      'නැවුම් ප්‍රතිඵල ගෙනෙනවා...',
      'බෙදාහැරීම් පරීක්ෂා කරනවා...',
      'මගේ කජු එකතු කරනවා 🌰',
      'ටිකක් ඉවසන්න...',
    ],
    tamil: [
      'சிறந்ததை தேடுகிறேன் 🐿️',
      'ஆசை மரத்தில் ஏறுகிறேன் 🌳',
      'புதிய முடிவுகள் கொண்டுவருகிறேன்...',
      'டெலிவரி விருப்பங்களை சரிபார்க்கிறேன்...',
      'என் கொட்டைகளை சேகரிக்கிறேன் 🌰',
      'கொஞ்சம் காத்திருங்கள்...',
    ],
  };

  useEffect(() => {
    if (!loading) return;
    const msgs = STATUS_MESSAGES[lang?.code] || STATUS_MESSAGES.english;
    let idx = 0;
    setLoadingStatus(msgs[0]);
    setLoadingStatusIdx(0);
    const interval = setInterval(() => {
      idx = (idx + 1) % msgs.length;
      setLoadingStatus(msgs[idx]);
      setLoadingStatusIdx(idx);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading, lang]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => setShowScroll(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const send = useCallback(async (text, forceAction = null) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    if (!text) {
      setBtnPulse(true);
      setTimeout(() => setBtnPulse(false), 200);
    }

    if (messages.length === 1 && !localStorage.getItem('kopi_hint_dismissed') && (lang?.code === 'english' || lang?.code === 'sinhala' || lang?.code === 'tamil')) {
      setShowLanguageHint(true);
    }

    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: trimmed, timestamp: new Date() }]);
    setLoading(true);
    if (forceAction) setMascotAction(forceAction);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, text: m.text }));

      const { data } = await axios.post(API_URL, {
        message: trimmed,
        history,
        language: lang?.code || '',
        currency,
        cart,
      });

      if (data.cart !== undefined && data.cart !== null) {
        setCart(data.cart);
        if (data.cart.length > cart.length) {
          setIsCartOpen(true); // Auto-open cart when items are added
        }
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot',
        text: data.message || 'Sorry, I could not process that.',
        product_ids: data.product_ids || [],
        timestamp: new Date(),
      }]);

      if (/order submitted|reference.*KPR-/i.test(data.message || '')) {
        fireConfetti();
      }

      if (navigator.vibrate) navigator.vibrate(40);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorQuips = [
        "Oops, my acorn radar went offline for a second! 🐿️ Give it another try.",
        "Hmm, I dropped my acorns somewhere in the tree. Try that again?",
        "The wish-granting tree is rustling a bit right now, try once more!",
      ];
      const quip = errorQuips[Math.floor(Math.random() * errorQuips.length)];
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot',
        text: detail || quip,
        timestamp: new Date(),
      }]);
      setMascotAction('error');
      setTimeout(() => setMascotAction(null), 4000);
    } finally {
      setLoading(false);
      setLoadingStatus('');
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [input, loading, messages, lang, cart, currency]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (!lang) return <LanguageSelect onSelect={handleLanguageSelect} />;

  // greet on welcome screen only (single welcome message, nothing sent yet)
  let mascotState = (messages.length === 1 && messages[0]?.id === 'welcome') ? 'greet' : 'idle';
  if (mascotAction) {
    mascotState = mascotAction;
  } else if (isCartOpen) {
    mascotState = 'checkout';
  } else if (loading) {
    // index 3 = "Checking delivery options" across all languages
    if (loadingStatusIdx === 3) mascotState = 'delivery';
    // index 1,2 = tree/fetching across all languages
    else if (loadingStatusIdx === 1 || loadingStatusIdx === 2) mascotState = 'found';
    else mascotState = 'searching';
  } else if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'bot') {
      const lt = lastMsg.text || '';
      if (lastMsg.product_ids?.length > 0) mascotState = 'found';
      else if (/order submitted|KPR-\d+/i.test(lt)) mascotState = 'success';
      else if (/congratulations|wonderful|great news|perfect choice/i.test(lt)) mascotState = 'success';
      else if (/dispatched|on the way|delivery|shipped|arriving|truck/i.test(lt)) mascotState = 'delivery';
      else if (/cart|checkout|payment|confirm.*order/i.test(lt)) mascotState = 'checkout';
      else if (/not available|out of stock|cannot find|acorn radar|went offline/i.test(lt)) mascotState = 'error';
      else if (/so sorry|condolence|difficult time|passed away/i.test(lt)) mascotState = 'idle';
      else if (/here.*found|take a look|options for you|picked.*for you/i.test(lt)) mascotState = 'found';
    }
  }

  return (
    <div style={{ height: '100%', width: '100%', background: BG, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Header */}
      <header style={{
        position: 'relative', zIndex: 10,
        padding: '8px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ width: 44, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <KopiMascot state={mascotState} size={44} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Korpi</span>
            <div className="status-dot" />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {loading ? loadingStatus || { sinhala: 'හිතනවා...', tamil: 'யோசிக்கிறேன்...', english: 'Thinking...' }[lang?.code] || 'Thinking...' : 'Kapruka Shopping Assistant'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <CurrencyPicker currency={currency} onChange={setCurrency} />
          
          <button
            onClick={() => setIsCartOpen(true)}
            className={`btn-glass ${cartBounce ? 'bounce-cart' : ''}`}
            style={{
              borderRadius: 20, padding: '5px 11px',
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', position: 'relative'
            }}
          >
            <ShoppingBag size={14} color={cart.length > 0 ? "#DA532C" : "rgba(255,255,255,0.7)"} />
            <span style={{ color: cart.length > 0 ? '#DA532C' : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600 }}>{cart.length}</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            title="Reset Chat"
            className="btn-glass"
            style={{
              borderRadius: 20, padding: '5px 11px',
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={14} color="rgba(255,255,255,0.7)" />
          </button>

          <button
            onClick={() => { 
              setLang(null); 
              localStorage.removeItem('kapruka_lang');
            }}
            title="Change language"
            className="btn-glass"
            style={{
              borderRadius: 20, padding: '5px 11px',
              display: 'flex', alignItems: 'center', gap: 5,
              cursor: 'pointer',
            }}
          >
            <span>{lang.emoji}</span>
            <span className="lang-badge-text">{lang.native}</span>
          </button>
        </div>
      </header>

      <GiftMessagePanel 
        isOpen={showGiftMessagePanel} 
        onSkip={() => { setShowGiftMessagePanel(false); setShowCheckoutConfirm(true); }}
        onAdd={(msg) => { 
          setGiftMessage(msg);
          setShowGiftMessagePanel(false); 
          setShowCheckoutConfirm(true); 
        }}
      />

      <CheckoutConfirmModal 
        cart={cart} 
        isOpen={showCheckoutConfirm} 
        onCancel={() => setShowCheckoutConfirm(false)}
        onConfirm={() => {
          setShowCheckoutConfirm(false);
          setIsCartOpen(false);
          send(`I'm ready to checkout my cart.${giftMessage ? ` Also include this gift message: "${giftMessage}"` : ''}`, 'checkout');
          setGiftMessage("");
        }}
      />

      <CartDrawer 
        cart={cart} 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onRemoveItem={(productId) => {
          const newCart = cart.filter(c => (c.id || c.product_id) !== productId);
          setCart(newCart);
          localStorage.setItem('kapruka_cart', JSON.stringify(newCart));
        }}
        onUpdateQuantity={(productId, delta) => {
          const newCart = cart.map(c => {
            if ((c.id || c.product_id) === productId) {
              const newQty = Math.max(1, c.quantity + delta);
              return { ...c, quantity: newQty };
            }
            return c;
          });
          setCart(newCart);
          localStorage.setItem('kapruka_cart', JSON.stringify(newCart));
        }}
        onCheckout={() => setShowGiftMessagePanel(true)}
      />

      {/* Messages */}
      <div ref={listRef} className="msg-list">
        <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column' }}>
          {messages.map((msg, index) => (
            <Message
              key={msg.id} msg={msg} currency={currency} onSend={send} onAddToCart={handleAddToCart}
              isActive={index === messages.length - 1 && !loading}
              mascotState={mascotState}
              lang={lang}
            />
          ))}
          
          {/* Suggestion chips */}
          {messages.length === 1 && (
            <>
              <div className="chips-row" style={{ padding: '8px 16px 4px' }}>
                {lang.suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="chip"
                    onClick={() => {
                      setInput(s.text);
                      setTimeout(() => textareaRef.current?.focus(), 50);
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="chips-row" style={{ padding: '4px 16px 24px' }}>
                {OCCASIONS.map((o, i) => (
                  <button
                    key={i}
                    className="chip"
                    style={{ background: 'rgba(218,83,44,0.12)', borderColor: 'rgba(218,83,44,0.3)' }}
                    onClick={() => send(o.prompt[lang?.code] || o.prompt.english)}
                  >
                    {o.emoji} {o.labels[lang?.code] || o.labels.english}
                  </button>
                ))}
              </div>
              <div style={{ padding: '0 16px 28px' }}>
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                  {{ english: 'Browse by category', sinhala: 'කාණ්ඩය අනුව බලන්න', tamil: 'வகை வாரியாக பார்க்கவும்' }[lang?.code] || 'Browse by category'}
                </div>
                <div className="cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { emoji: '🎂', labels: { english: 'Cakes', sinhala: 'කේක්', tamil: 'கேக்' }, q: { english: 'Show me cakes', sinhala: 'කේක් පෙන්නන්න', tamil: 'கேக்குகள் காட்டுங்கள்' } },
                    { emoji: '💐', labels: { english: 'Flowers', sinhala: 'මල්', tamil: 'பூக்கள்' }, q: { english: 'Show me flowers', sinhala: 'මල් පෙන්නන්න', tamil: 'பூக்கள் காட்டுங்கள்' } },
                    { emoji: '🍫', labels: { english: 'Chocolates', sinhala: 'චොකලට්', tamil: 'சாக்லேட்' }, q: { english: 'Show me chocolates', sinhala: 'චොකලට් පෙන්නන්න', tamil: 'சாக்லேட்கள் காட்டுங்கள்' } },
                    { emoji: '🧸', labels: { english: 'Soft Toys', sinhala: 'ලිපිකාරීය', tamil: 'மென் பொம்மைகள்' }, q: { english: 'Show me soft toys', sinhala: 'මෘදු බඩු පෙන්නන්න', tamil: 'மென் பொம்மைகள் காட்டுங்கள்' } },
                    { emoji: '👗', labels: { english: 'Clothing', sinhala: 'ඇඳුම්', tamil: 'ஆடைகள்' }, q: { english: 'Show me clothing', sinhala: 'ඇඳුම් පෙන්නන්න', tamil: 'ஆடைகள் காட்டுங்கள்' } },
                    { emoji: '💄', labels: { english: 'Cosmetics', sinhala: 'රූපලාවණ්‍ය', tamil: 'அழகுசாதனங்கள்' }, q: { english: 'Show me cosmetics', sinhala: 'රූපලාවණ්‍ය ද්‍රව්‍ය පෙන්නන්න', tamil: 'அழகுசாதனங்கள் காட்டுங்கள்' } },
                    { emoji: '📱', labels: { english: 'Electronics', sinhala: 'ඉලෙක්ට්‍රොනික්', tamil: 'மின்னணுவியல்' }, q: { english: 'Show me electronics', sinhala: 'ඉලෙක්ට්‍රොනික් බඩු පෙන්නන්න', tamil: 'மின்னணு பொருட்கள் காட்டுங்கள்' } },
                    { emoji: '🏠', labels: { english: 'Home', sinhala: 'නිවස', tamil: 'வீட்டுப் பொருட்கள்' }, q: { english: 'Show me home and lifestyle products', sinhala: 'ගෘහ භාණ්ඩ පෙන්නන්න', tamil: 'வீட்டுப் பொருட்கள் காட்டுங்கள்' } },
                  ].map((c, i) => (
                    <button key={i} onClick={() => send(c.q[lang?.code] || c.q.english)} style={{
                      padding: '10px 4px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 500,
                      cursor: 'pointer', transition: 'all 0.15s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(218,83,44,0.1)'; e.currentTarget.style.borderColor = 'rgba(218,83,44,0.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    >
                      <span style={{ fontSize: 20 }}>{c.emoji}</span>
                      <span>{c.labels[lang?.code] || c.labels.english}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {loading && <TypingIndicator status={loadingStatus} statusIdx={loadingStatusIdx} />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Scroll-to-bottom */}
      {showScroll && (
        <button
          className="scroll-btn"
          onClick={scrollToBottom}
          style={{
            position: 'absolute', bottom: 90, right: 16,
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



      {/* Floating Input Area (Figure-Ground principle) */}
      <div className="input-wrapper" style={{ position: 'relative', flexDirection: 'column', alignItems: 'center' }}>
        {showLanguageHint && <LanguageHint lang={lang} onDismiss={() => { setShowLanguageHint(false); localStorage.setItem('kopi_hint_dismissed', '1'); }} />}
        <div className="input-bar">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about products, delivery, orders…"
            rows={1}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              resize: 'none', color: 'rgba(255,255,255,0.95)',
              fontSize: 15, lineHeight: '1.5', maxHeight: 120,
              overflowY: 'auto', paddingTop: 8, paddingBottom: 8,
            }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            className={`send-btn ${btnPulse ? 'pulse' : ''}`}
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #DA532C, #b83d1c)'
                : 'rgba(255,255,255,0.08)',
              border: 'none',
              cursor: input.trim() && !loading ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 2
            }}
          >
            {loading
              ? <Loader2 size={20} color="rgba(255,255,255,0.7)" className="spinner" />
              : <Send size={18} color={input.trim() ? '#fff' : 'rgba(255,255,255,0.4)'} />
            }
          </button>
        </div>
      </div>

      {/* Cart add toast */}
      {cartToast && (
        <div style={{
          position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, background: 'rgba(16, 30, 50, 0.95)',
          border: '1px solid rgba(218,83,44,0.4)',
          borderRadius: 24, padding: '8px 18px',
          display: 'flex', alignItems: 'center', gap: 8,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          animation: 'slideInUp 0.25s cubic-bezier(0.2,0.8,0.2,1)',
          whiteSpace: 'nowrap', maxWidth: '80vw', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          <span style={{ fontSize: 16 }}>🛒</span>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Added: <strong>{cartToast.length > 30 ? cartToast.slice(0, 30) + '…' : cartToast}</strong>
          </span>
          <span style={{ color: '#DA532C', fontSize: 13, fontWeight: 700 }}>✓</span>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100,
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: 24, width: '100%', maxWidth: 320,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)', textAlign: 'center',
            animation: 'slideInUp 0.3s ease-out'
          }}>
            <RotateCcw size={32} color="#DA532C" style={{ marginBottom: 16 }} />
            <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Reset Chat?</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 24 }}>
              This will clear your current conversation and empty your shopping cart. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="btn-glass"
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setMessages([{ id: 'welcome', role: 'bot', text: lang.welcome, timestamp: new Date() }]);
                  setCart([]);
                  localStorage.removeItem('kapruka_messages');
                  localStorage.removeItem('kapruka_cart');
                  setShowResetConfirm(false);
                }}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: 'none', color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
