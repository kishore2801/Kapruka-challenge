import sys
import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add session ID initialization and cleanup
session_logic = """
const getSessionId = () => {
  let sid = sessionStorage.getItem('kopi_session_id');
  if (!sid) {
    sid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    sessionStorage.setItem('kopi_session_id', sid);
  }
  return sid;
};
const SESSION_ID = getSessionId();

const App = () => {
"""

code = code.replace("const App = () => {\n", session_logic)

cleanup_effect = """
  useEffect(() => {
    const cleanup = () => {
      const url = API_URL.replace('/api/chat', '/api/session/cleanup');
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, JSON.stringify({ session_id: SESSION_ID }));
      }
    };
    window.addEventListener('pagehide', cleanup);
    window.addEventListener('beforeunload', cleanup);
    return () => {
      window.removeEventListener('pagehide', cleanup);
      window.removeEventListener('beforeunload', cleanup);
    };
  }, []);

  const [input, setInput] = useState('');
"""

code = code.replace("  const [input, setInput] = useState('');", cleanup_effect)

# 2. Update axios payload to send session_id
code = code.replace(
    "        message: trimmed,\n        history,\n        language: lang?.code || '',\n        currency,\n        cart,",
    "        message: trimmed,\n        session_id: SESSION_ID,\n        history,\n        language: lang?.code || '',\n        currency,\n        cart,"
)

# 3. Update Message creation to include carousel
code = code.replace(
    "        product_ids: data.product_ids || [],\n        timestamp: new Date(),",
    "        product_ids: data.product_ids || [],\n        carousel: data.carousel || null,\n        timestamp: new Date(),"
)

# 4. Update Message component signature
code = code.replace(
    "<ProductsSection productIds={msg.product_ids} currency={currency} onSend={onSend} onAddToCart={onAddToCart} lang={lang} maxPrice={budgetFilter} />",
    "<ProductsSection productIds={msg.product_ids} carousel={msg.carousel} currency={currency} onSend={onSend} onAddToCart={onAddToCart} lang={lang} maxPrice={budgetFilter} />"
)

# 5. Update ProductsSection signature
code = code.replace(
    "const ProductsSection = React.memo(function ProductsSection({ productIds, currency = 'LKR', onSend, onAddToCart, lang, maxPrice }) {",
    "const ProductsSection = React.memo(function ProductsSection({ productIds, carousel, currency = 'LKR', onSend, onAddToCart, lang, maxPrice }) {"
)

# 6. Update Pagination logic
pagination_old = """
  const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageSlice = displayed.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
"""
pagination_new = """
  const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageSlice = displayed.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  
  const hasBackendNext = carousel?.has_next;
  const showPagination = totalPages > 1 || hasBackendNext;
  const isNextDisabled = safePage === totalPages - 1 && !hasBackendNext;
  
  const handleNext = () => {
    if (safePage < totalPages - 1) {
      setPage(p => p + 1);
    } else if (hasBackendNext && onSend) {
      onSend("show more");
    }
  };
"""
code = code.replace(pagination_old.strip(), pagination_new.strip())

# 7. Update Next button UI in ProductsSection
next_ui_old = """
                      <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={safePage === totalPages - 1}
                        style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: safePage === totalPages - 1 ? 'rgba(255,255,255,0.04)' : 'rgba(218,83,44,0.12)',
                          border: `1px solid ${safePage === totalPages - 1 ? 'rgba(255,255,255,0.08)' : 'rgba(218,83,44,0.3)'}`,
                          color: safePage === totalPages - 1 ? 'rgba(255,255,255,0.2)' : '#DA532C',
                          cursor: safePage === totalPages - 1 ? 'default' : 'pointer', transition: 'all 0.15s',
                        }}
                      >Next →</button>
"""
next_ui_new = """
                      <button
                        onClick={handleNext}
                        disabled={isNextDisabled}
                        style={{
                          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: isNextDisabled ? 'rgba(255,255,255,0.04)' : 'rgba(218,83,44,0.12)',
                          border: `1px solid ${isNextDisabled ? 'rgba(255,255,255,0.08)' : 'rgba(218,83,44,0.3)'}`,
                          color: isNextDisabled ? 'rgba(255,255,255,0.2)' : '#DA532C',
                          cursor: isNextDisabled ? 'default' : 'pointer', transition: 'all 0.15s',
                        }}
                      >Next →</button>
"""
code = code.replace(next_ui_old.strip(), next_ui_new.strip())

# 8. Update conditional for pagination row
code = code.replace(
    "{(totalPages > 1 || onSend) && (",
    "{(showPagination || onSend) && ("
)
code = code.replace(
    "{totalPages > 1 && (",
    "{showPagination && ("
)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(code)

print("App.jsx rewritten successfully.")
