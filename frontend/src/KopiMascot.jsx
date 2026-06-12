import React from 'react';

export default function KopiMascot({ state = 'idle', size = 200, facing = 'forward' }) {
  if (state === 'demo') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', padding: '20px', background: '#050d1a' }}>
        {['idle', 'searching', 'found', 'delivery', 'success', 'error', 'checkout'].map(s => (
          <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <KopiMascot state={s} size={150} />
            <div style={{ marginTop: 10, fontWeight: 'bold', color: '#FFF5ED', background: '#2C3E50', padding: '4px 12px', borderRadius: 20 }}>
              {s === 'checkout' ? 'checkout 🛍️' : s}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const isBouncing = state === 'searching' || state === 'checkout' || state === 'cart-full';
  const isShrugging = state === 'error';
  
  const KopiWrapper = ({ children }) => {
    let cls = '';
    if (isBouncing) cls = 'bounce';
    if (isShrugging) cls = 'shrug';
    
    // For delivery, Kopi sits on the truck
    if (state === 'delivery') {
      return (
        <g className="truck-bounce">
          <g transform="matrix(0.7 0 0 0.7 30 10)">{children}</g>
        </g>
      );
    }
    return <g className={cls}>{children}</g>;
  };

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
      <style>
        {`
          .tail-sway { transform-origin: 55px 150px; animation: swayTail 3s ease-in-out infinite; }
          @keyframes swayTail { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-15deg); } }
          
          .tail-spin { transform-origin: 55px 150px; animation: spinTail 0.5s linear infinite; }
          @keyframes spinTail { 0% { transform: rotate(0deg); } 100% { transform: rotate(-360deg); } }

          .bounce { animation: searchBounce 0.4s ease-in-out infinite alternate; }
          @keyframes searchBounce { from { transform: translateY(0); } to { transform: translateY(-12px); } }

          .shrug { animation: shrugBounce 2.5s ease-in-out infinite; }
          @keyframes shrugBounce { 0%, 100% { transform: translateY(0); } 15%, 85% { transform: translateY(-8px); } }

          .float-q { animation: fadeQ 2.5s ease-in-out infinite; }
          @keyframes fadeQ { 0%, 100% { opacity: 0; transform: translateY(0); } 15%, 85% { opacity: 1; transform: translateY(-15px); } }

          .sparkle-eye { transform-origin: center; animation: pulseStar 1s ease-in-out infinite; }
          @keyframes pulseStar { 0%, 100% { transform: scale(1) rotate(0deg); fill: #FFD700; } 50% { transform: scale(1.3) rotate(25deg); fill: #FFF; } }

          .pop-sparkle { transform-origin: center; animation: popSparkle 1.5s ease-in-out infinite; }
          @keyframes popSparkle { 0%, 100% { transform: scale(0); opacity: 0; } 50% { transform: scale(1); opacity: 1; } }

          .wind-line { animation: windLine 0.8s linear infinite; }
          @keyframes windLine { 0% { transform: translateX(200px); opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translateX(-100px); opacity: 0; } }

          .confetti { animation: confettiFall 2s linear infinite; }
          @keyframes confettiFall { 0% { transform: translateY(-40px) rotate(0deg); opacity: 1; } 100% { transform: translateY(220px) rotate(360deg); opacity: 0; } }
          
          .floating-heart { animation: floatHeart 2s ease-in infinite; opacity: 0; }
          @keyframes floatHeart { 0% { transform: translateY(20px) scale(0.5); opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translateY(-40px) scale(1.2); opacity: 0; } }
          
          .truck-bounce { animation: truckBounce 0.2s ease-in-out infinite alternate; }
          @keyframes truckBounce { from { transform: translateY(0); } to { transform: translateY(-3px); } }

          .wheel-spin { transform-origin: center; animation: spinWheel 0.4s linear infinite; }
          @keyframes spinWheel { 100% { transform: rotate(360deg); } }

          .wave-arm { transform-origin: 60px 105px; animation: waveAction 1.5s ease-in-out infinite; }
          @keyframes waveAction { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-30deg); } 50% { transform: rotate(10deg); } 75% { transform: rotate(-30deg); } }
        `}
      </style>

      {/* Warm Circle Backdrop — hidden at small sizes */}
      {size > 48 && <circle cx="100" cy="100" r="95" fill="rgba(218, 83, 44, 0.08)" stroke="rgba(218, 83, 44, 0.25)" strokeWidth="2" />}

      {/* BACKGROUND ELEMENTS (Wind, Confetti) */}
      {state === 'delivery' && (
        <g>
          <line x1="0" y1="150" x2="50" y2="150" stroke="#2C3E50" strokeWidth="4" className="wind-line" style={{ animationDelay: '0s' }} strokeLinecap="round" />
          <line x1="0" y1="170" x2="80" y2="170" stroke="#2C3E50" strokeWidth="4" className="wind-line" style={{ animationDelay: '0.3s' }} strokeLinecap="round" />
          <line x1="0" y1="190" x2="40" y2="190" stroke="#2C3E50" strokeWidth="4" className="wind-line" style={{ animationDelay: '0.6s' }} strokeLinecap="round" />
        </g>
      )}
      
      {state === 'success' && (
        <g>
          {[...Array(12)].map((_, i) => (
            <rect key={i} x={10 + i*15} y={-20} width={8} height={12} fill={['#DA532C', '#FFD700', '#2C3E50'][i%3]} className="confetti" style={{ animationDelay: `${(i%4) * 0.4}s` }} />
          ))}
        </g>
      )}

      {state === 'checkout' && (
        <g>
          <path d="M20,60 A10,10 0 0,1 40,60 A10,10 0 0,1 60,60 Q60,80 40,100 Q20,80 20,60 Z" fill="#FF6B6B" transform="scale(0.3) translate(50, 150)" className="floating-heart" style={{ animationDelay: '0s' }} />
          <path d="M20,60 A10,10 0 0,1 40,60 A10,10 0 0,1 60,60 Q60,80 40,100 Q20,80 20,60 Z" fill="#FF6B6B" transform="scale(0.4) translate(380, 100)" className="floating-heart" style={{ animationDelay: '0.7s' }} />
          <path d="M20,60 A10,10 0 0,1 40,60 A10,10 0 0,1 60,60 Q60,80 40,100 Q20,80 20,60 Z" fill="#FFD700" transform="scale(0.2) translate(100, 300)" className="floating-heart" style={{ animationDelay: '1.2s' }} />
        </g>
      )}

      {/* ERROR QUESTION MARK */}
      {state === 'error' && (
        <text x="135" y="50" fontSize="50" fill="#2C3E50" fontWeight="900" className="float-q" style={{ fontFamily: 'sans-serif' }}>?</text>
      )}

      {/* TRUCK BACK */}
      {state === 'delivery' && (
        <g className="truck-bounce">
          <rect x="20" y="130" width="110" height="50" fill="#DA532C" stroke="#1a1a1a" strokeWidth="2" rx="6" />
          <rect x="130" y="145" width="40" height="35" fill="#DA532C" stroke="#1a1a1a" strokeWidth="2" rx="8" />
          <rect x="145" y="150" width="15" height="15" fill="#FFF5ED" stroke="#1a1a1a" strokeWidth="2" rx="2" />
        </g>
      )}

      <KopiWrapper>
        {/* Tail */}
        <path d="M70,160 C 10,175 10,85 55,70 C 85,55 92.5,100 77.5,122.5 C 70,137.5 77.5,152.5 70,160 Z" 
              fill="#8B4513" stroke="#1a1a1a" strokeWidth="2" 
              className="tail-sway" />

        {/* Body */}
        <ellipse cx="100" cy="130" rx="45" ry="50" fill="#8B4513" stroke="#1a1a1a" strokeWidth="2" />
        <ellipse cx="100" cy="135" rx="35" ry="40" fill="#FFF5ED" stroke="#1a1a1a" strokeWidth="2" />

        {/* Feet */}
        {state !== 'delivery' && (
          <g>
            <ellipse cx="75" cy="175" rx="14" ry="8" fill="#8B4513" stroke="#1a1a1a" strokeWidth="2" />
            <ellipse cx="125" cy="175" rx="14" ry="8" fill="#8B4513" stroke="#1a1a1a" strokeWidth="2" />
          </g>
        )}
        
        {/* Left Arm (Behind box/bag if applicable) */}
        {state === 'success' || state === 'idle' || state === 'greet' ? (
          <path d="M60,105 Q35,70 45,50" fill="none" stroke="#8B4513" strokeWidth="10" strokeLinecap="round" className={state === 'greet' ? 'wave-arm' : ''} />
        ) : state === 'found' || state === 'checkout' ? (
          <path d="M60,115 Q75,125 85,120" fill="none" stroke="#8B4513" strokeWidth="10" strokeLinecap="round" />
        ) : state === 'cart-empty' || state === 'cart-full' ? (
          <path d="M60,115 Q50,135 55,150" fill="none" stroke="#8B4513" strokeWidth="10" strokeLinecap="round" />
        ) : (
          <path d="M60,120 Q40,140 55,155" fill="none" stroke="#8B4513" strokeWidth="10" strokeLinecap="round" />
        )}

        {/* Head Base */}
        <path d="M65,60 Q50,25 75,25 Q85,40 90,55 Z" fill="#8B4513" stroke="#1a1a1a" strokeWidth="2" />
        <path d="M68,55 Q58,35 72,35 Q80,42 85,50 Z" fill="#FFB6C1" />
        <path d="M135,60 Q150,25 125,25 Q115,40 110,55 Z" fill="#8B4513" stroke="#1a1a1a" strokeWidth="2" />
        <path d="M132,55 Q142,35 128,35 Q120,42 115,50 Z" fill="#FFB6C1" />
        <ellipse cx="100" cy="80" rx="42" ry="36" fill="#8B4513" stroke="#1a1a1a" strokeWidth="2" />

        {/* Face */}
        <ellipse cx="70" cy="88" rx="8" ry="4" fill="#FFB6C1" opacity="0.8" />
        <ellipse cx="130" cy="88" rx="8" ry="4" fill="#FFB6C1" opacity="0.8" />

        {/* Eyes */}
        {state === 'checkout' ? (
          <g>
            <polygon points="82,68 85,74 91,77 85,80 82,86 79,80 73,77 79,74" fill="#FFD700" className="sparkle-eye" style={{ transformOrigin: '82px 77px' }} />
            <polygon points="118,68 121,74 127,77 121,80 118,86 115,80 109,77 115,74" fill="#FFD700" className="sparkle-eye" style={{ transformOrigin: '118px 77px' }} />
          </g>
        ) : state === 'success' ? (
          <g>
            <path d="M72,76 Q82,66 92,76" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
            <path d="M108,76 Q118,66 128,76" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
          </g>
        ) : state === 'error' ? (
          <g>
            <circle cx="82" cy="78" r="6" fill="#1a1a1a" />
            <circle cx="118" cy="78" r="6" fill="#1a1a1a" />
            <circle cx="80" cy="76" r="2" fill="#FFF" />
            <circle cx="116" cy="76" r="2" fill="#FFF" />
            <path d="M72,66 Q82,66 92,66" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
            <path d="M108,62 Q118,52 128,58" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <circle cx="82" cy="76" r="6" fill="#1a1a1a" />
            <circle cx="118" cy="76" r="6" fill="#1a1a1a" />
            <circle cx="80" cy="74" r="2" fill="#FFF" />
            <circle cx="116" cy="74" r="2" fill="#FFF" />
          </g>
        )}

        {/* Nose and Mouth */}
        <circle cx="100" cy="82" r="3.5" fill="#1a1a1a" />
        {state === 'found' || state === 'success' || state === 'checkout' || state === 'cart-full' ? (
          <path d="M92,86 Q100,102 108,86 Z" fill="#FFB6C1" stroke="#1a1a1a" strokeWidth="2" strokeLinejoin="round" />
        ) : state === 'error' ? (
          <path d="M95,88 Q100,85 105,88" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d="M95,86 Q100,92 105,86" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* Buck Teeth */}
        <g>
          <rect x="96" y="85" width="8" height="5" fill="#FFF" stroke="#1a1a1a" strokeWidth="1.5" rx="1" />
          <line x1="100" y1="85" x2="100" y2="90" stroke="#1a1a1a" strokeWidth="1" />
        </g>

        {/* Right Arm */}
        {state === 'success' ? (
          <path d="M140,105 Q165,70 155,50" fill="none" stroke="#8B4513" strokeWidth="10" strokeLinecap="round" />
        ) : state === 'searching' ? (
          <path d="M140,105 Q165,80 145,65" fill="none" stroke="#8B4513" strokeWidth="10" strokeLinecap="round" />
        ) : state === 'found' || state === 'checkout' ? (
          <path d="M140,115 Q125,125 115,120" fill="none" stroke="#8B4513" strokeWidth="10" strokeLinecap="round" />
        ) : state === 'cart-empty' || state === 'cart-full' ? (
          <path d="M140,115 Q150,135 145,150" fill="none" stroke="#8B4513" strokeWidth="10" strokeLinecap="round" />
        ) : state === 'idle' ? (
          <path d="M140,115 Q155,125 140,140" fill="none" stroke="#8B4513" strokeWidth="10" strokeLinecap="round" />
        ) : (
          <path d="M140,120 Q160,140 145,155" fill="none" stroke="#8B4513" strokeWidth="10" strokeLinecap="round" />
        )}

        {/* PROPS */}
        {state === 'idle' && (
          <g transform="translate(125, 128)">
            <path d="M15,5 C20,5 20,15 15,15" fill="none" stroke="#1a1a1a" strokeWidth="2" />
            <rect x="0" y="0" width="16" height="20" rx="3" fill="#FFF5ED" stroke="#1a1a1a" strokeWidth="2" />
            <rect x="0" y="8" width="16" height="5" fill="#DA532C" />
            <path d="M3,-5 Q8,-10 13,-5" fill="none" stroke="#FFF" strokeWidth="1" />
          </g>
        )}

        {state === 'searching' && (
          <>
            <g transform="translate(0, -5)">
              <ellipse cx="100" cy="45" rx="38" ry="10" fill="#2C3E50" stroke="#1a1a1a" strokeWidth="2" />
              <path d="M75,45 Q100,18 125,45 Z" fill="#2C3E50" stroke="#1a1a1a" strokeWidth="2" />
              <rect x="78" y="38" width="44" height="6" fill="#DA532C" />
            </g>
            <g transform="translate(123, 81)">
              <line x1="0" y1="0" x2="15" y2="25" stroke="#8B4513" strokeWidth="5" strokeLinecap="round" />
              <circle cx="-5" cy="-5" r="18" fill="rgba(255, 255, 255, 0.5)" stroke="#1a1a1a" strokeWidth="3" />
            </g>
          </>
        )}

        {state === 'found' && (
          <>
            <g transform="translate(75, 105)">
              <rect x="0" y="0" width="50" height="40" fill="#DA532C" stroke="#1a1a1a" strokeWidth="2" rx="3" />
              <rect x="20" y="0" width="10" height="40" fill="#FFD700" stroke="#1a1a1a" strokeWidth="1" />
              <rect x="0" y="15" width="50" height="10" fill="#FFD700" stroke="#1a1a1a" strokeWidth="1" />
              <path d="M25,0 Q15,-15 25,-5 Q35,-15 25,0" fill="#FFD700" stroke="#1a1a1a" strokeWidth="2" />
            </g>
            <g className="pop-sparkle" style={{ animationDelay: '0s' }}> <polygon points="60,90 63,100 73,103 63,106 60,116 57,106 47,103 57,100" fill="#FFD700" /> </g>
            <g className="pop-sparkle" style={{ animationDelay: '0.5s' }}> <polygon points="140,90 143,100 153,103 143,106 140,116 137,106 127,103 137,100" fill="#FFD700" /> </g>
          </>
        )}

        {state === 'checkout' && (
          <g transform="translate(60, 105)">
            <path d="M25,0 Q40,-30 55,0" fill="none" stroke="#FFF" strokeWidth="4" />
            <path d="M5,-10 L30,-15 L40,0 Z" fill="#2C3E50" stroke="#1a1a1a" strokeWidth="2" />
            <rect x="50" y="-20" width="20" height="20" fill="#FFD700" stroke="#1a1a1a" strokeWidth="2" transform="rotate(20 50 -20)" />
            <path d="M0,0 L80,0 L70,80 L10,80 Z" fill="#DA532C" stroke="#1a1a1a" strokeWidth="2" />
            <text x="40" y="55" fontSize="30" fill="#FFF" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif">K</text>
          </g>
        )}

        {/* Shopping cart prop — empty or full */}
        {(state === 'cart-empty' || state === 'cart-full') && (
          <g transform="translate(48, 108)">
            {/* Cart handle bar */}
            <line x1="0" y1="5" x2="10" y2="5" stroke={state === 'cart-full' ? '#DA532C' : 'rgba(255,255,255,0.5)'} strokeWidth="4" strokeLinecap="round" />
            {/* Cart basket */}
            <path d="M8,5 L16,0 L94,0 L86,50 L22,50 Z"
              fill={state === 'cart-full' ? 'rgba(218,83,44,0.25)' : 'rgba(255,255,255,0.07)'}
              stroke={state === 'cart-full' ? '#DA532C' : 'rgba(255,255,255,0.45)'}
              strokeWidth="3" strokeLinejoin="round" />
            {/* Items inside full cart */}
            {state === 'cart-full' && (
              <g>
                <rect x="22" y="-22" width="14" height="26" rx="3" fill="#DA532C" stroke="#1a1a1a" strokeWidth="1.5" />
                <rect x="42" y="-28" width="14" height="32" rx="3" fill="#FFD700" stroke="#1a1a1a" strokeWidth="1.5" />
                <rect x="62" y="-18" width="14" height="22" rx="3" fill="#f0a070" stroke="#1a1a1a" strokeWidth="1.5" />
              </g>
            )}
            {/* Wheels */}
            <circle cx="30" cy="58" r="9"
              fill="none"
              stroke={state === 'cart-full' ? '#DA532C' : 'rgba(255,255,255,0.45)'}
              strokeWidth="3" />
            <circle cx="78" cy="58" r="9"
              fill="none"
              stroke={state === 'cart-full' ? '#DA532C' : 'rgba(255,255,255,0.45)'}
              strokeWidth="3" />
          </g>
        )}
      </KopiWrapper>

      {/* TRUCK FRONT WHEELS (Render over Kopi) */}
      {state === 'delivery' && (
        <g className="truck-bounce">
          <g transform="translate(45, 180)" className="wheel-spin">
            <circle cx="0" cy="0" r="14" fill="#1a1a1a" />
            <circle cx="0" cy="0" r="6" fill="#FFF5ED" />
            <line x1="-14" y1="0" x2="14" y2="0" stroke="#FFF5ED" strokeWidth="2" />
            <line x1="0" y1="-14" x2="0" y2="14" stroke="#FFF5ED" strokeWidth="2" />
          </g>
          <g transform="translate(150, 180)" className="wheel-spin">
            <circle cx="0" cy="0" r="14" fill="#1a1a1a" />
            <circle cx="0" cy="0" r="6" fill="#FFF5ED" />
            <line x1="-14" y1="0" x2="14" y2="0" stroke="#FFF5ED" strokeWidth="2" />
            <line x1="0" y1="-14" x2="0" y2="14" stroke="#FFF5ED" strokeWidth="2" />
          </g>
        </g>
      )}

    </svg>
  );
}
