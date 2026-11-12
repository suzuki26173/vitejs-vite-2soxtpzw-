import React, { useState, useEffect, useRef, useCallback } from 'react';

// 5分作業 + 1分休憩 × 3セット = 18分
const SCHEDULE = [
  { type: 'work', set: 1, duration: 300, label: 'WORK 1 (5m)' },
  { type: 'break', set: 1, duration: 60, label: '1m' },
  { type: 'work', set: 2, duration: 300, label: 'WORK 2 (5m)' },
  { type: 'break', set: 2, duration: 60, label: '1m' },
  { type: 'work', set: 3, duration: 300, label: 'WORK 3 (5m)' },
  { type: 'break', set: 3, duration: 60, label: '1m' },
];

const TOTAL_SEC = SCHEDULE.reduce((acc, s) => acc + s.duration, 0);

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function App() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [sound, setSound] = useState(true);
  const prevPhase = useRef(0);

  const isDone = elapsed >= TOTAL_SEC;

  let accumulated = 0;
  let currentIdx = 0;
  let remainingInPhase = 0;

  for (let i = 0; i < SCHEDULE.length; i++) {
    if (elapsed < accumulated + SCHEDULE[i].duration) {
      currentIdx = i;
      remainingInPhase = accumulated + SCHEDULE[i].duration - elapsed;
      break;
    }
    accumulated += SCHEDULE[i].duration;
    if (i === SCHEDULE.length - 1) {
      currentIdx = i;
      remainingInPhase = 0;
    }
  }

  const currentSeg = SCHEDULE[currentIdx];
  const isBreak = currentSeg.type === 'break' && !isDone;

  const playChime = useCallback(() => {
    if (!sound) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  }, [sound]);

  useEffect(() => {
    if (!running || isDone) return;
    const t = setInterval(() => {
      setElapsed((p) => {
        const next = p + 1;
        if (next >= TOTAL_SEC) {
          setRunning(false);
          return TOTAL_SEC;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, isDone]);

  useEffect(() => {
    if (prevPhase.current !== currentIdx && elapsed > 0 && !isDone) {
      playChime();
    }
    prevPhase.current = currentIdx;
  }, [currentIdx, elapsed, isDone, playChime]);

  const percent = Math.min(100, (elapsed / TOTAL_SEC) * 100);

  return (
    <div className={`root-container ${isBreak ? 'break-mode' : ''} ${isDone ? 'done-mode' : ''} ${!running ? 'paused' : ''}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@500;700;800&family=Outfit:wght@600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        html, body, #root { width: 100%; height: 100%; height: 100dvh; overflow: hidden; background: #141629; font-family: 'M PLUS Rounded 1c', sans-serif; color: #fffdf9; user-select: none; }

        .root-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }

        .bg-scene {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
        }

        /* Animations */
        @keyframes headBob { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(2.5px) rotate(1deg); } }
        @keyframes penWrite { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(-3px, 1px) rotate(-2deg); } }
        @keyframes steamUp { 0% { transform: translateY(0) scale(0.9); opacity: 0; } 35% { opacity: 0.75; } 100% { transform: translateY(-28px) scale(1.2); opacity: 0; } }
        @keyframes towerPulse { 0%, 100% { opacity: 0.85; } 50% { opacity: 1; } }

        .girl-head { transform-origin: 780px 360px; animation: headBob 3s ease-in-out infinite; }
        .girl-arm { transform-origin: 820px 430px; animation: penWrite 2.2s ease-in-out infinite; }
        .paused .girl-arm, .break-mode .girl-arm, .done-mode .girl-arm { animation-play-state: paused; }
        .steam-1 { animation: steamUp 3.8s ease-out infinite; }
        .steam-2 { animation: steamUp 3.8s ease-out 1.9s infinite; }
        .tower-glow { animation: towerPulse 4s ease-in-out infinite; }

        .vignette {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(10, 10, 18, 0.72) 0%, rgba(10, 10, 18, 0.08) 38%, rgba(10, 10, 18, 0.28) 100%);
          pointer-events: none;
          z-index: 1;
        }

        /* Top Header */
        .header-bar {
          position: relative;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: max(16px, env(safe-area-inset-top)) 20px 12px 20px;
        }
        .badge {
          background: rgba(18, 16, 28, 0.65);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          font-size: 0.8rem;
          font-weight: 700;
        }
        .btn-group { display: flex; align-items: center; gap: 8px; }
        .action-btn {
          background: rgba(18, 16, 28, 0.65);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: #fffdf9;
          height: 38px;
          padding: 0 14px;
          border-radius: 20px;
          font-family: inherit;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          transition: transform 0.12s;
        }
        .action-btn:active { transform: scale(0.95); }
        .action-btn.primary {
          background: #f6ad55;
          color: #1a1410;
          border-color: #ffe4b5;
        }

        /* Bottom-Left Compact Timer Card */
        .timer-hud {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 0 20px calc(38px + env(safe-area-inset-bottom)) 20px;
          pointer-events: none;
        }
        .hud-card {
          pointer-events: auto;
          width: fit-content;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 20px 14px;
          border-radius: 18px;
          background: rgba(16, 15, 26, 0.68);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 248, 235, 0.2);
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
        }
        .status-row { display: flex; align-items: center; gap: 8px; }
        .dot { width: 9px; height: 9px; border-radius: 50%; background: #f6ad55; box-shadow: 0 0 10px #f6ad55; }
        .break-mode .dot { background: #68d391; box-shadow: 0 0 10px #68d391; }
        .done-mode .dot { background: #63b3ed; box-shadow: 0 0 10px #63b3ed; }
        .phase-label { font-size: 0.82rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #fde68a; }
        .break-mode .phase-label { color: #a7f3d0; }
        .done-mode .phase-label { color: #bae6fd; }

        .countdown-row { display: flex; align-items: baseline; gap: 12px; }
        .countdown-time { font-family: 'Outfit', sans-serif; font-size: clamp(2.5rem, 6.5vw, 3.8rem); font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
        .total-elapsed { font-family: 'Outfit', sans-serif; font-size: 0.92rem; font-weight: 600; color: rgba(255, 253, 249, 0.78); font-variant-numeric: tabular-nums; }

        /* Bottom 18-Min Timeline Bar */
        .timeline-bar { position: fixed; left: 0; right: 0; bottom: 0; height: calc(26px + env(safe-area-inset-bottom)); padding-bottom: env(safe-area-inset-bottom); background: #0f0e17; border-top: 1px solid rgba(255, 255, 255, 0.25); z-index: 20; overflow: hidden; }
        .timeline-fill { position: absolute; top: 0; left: 0; height: 26px; background: linear-gradient(90deg, #dd6b20, #f6ad55); box-shadow: 0 0 14px rgba(246, 173, 85, 0.85); transition: width 0.3s linear; }
        .break-mode .timeline-fill { background: linear-gradient(90deg, #2f855a, #48bb78); }
        .done-mode .timeline-fill { background: linear-gradient(90deg, #3182ce, #63b3ed); }
        .progress-segments { position: relative; width: 100%; height: 26px; display: flex; pointer-events: none; z-index: 2; }
        .segment-slot { height: 100%; display: flex; align-items: center; justify-content: center; border-right: 1px solid rgba(255, 255, 255, 0.32); font-family: 'Outfit', sans-serif; font-size: 0.72rem; font-weight: 700; color: #fffdf9; text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9); }
        .segment-slot:last-child { border-right: none; }
        .segment-slot.is-break-slot { background: rgba(104, 211, 145, 0.16); font-size: 0.65rem; }

        @media (max-width: 600px) {
          .header-bar { padding: max(12px, env(safe-area-inset-top)) 14px 10px 14px; }
          .session-pill, .badge { font-size: 0.72rem; padding: 5px 10px; }
          .action-btn { height: 34px; padding: 0 11px; font-size: 0.76rem; }
          .timer-hud { padding: 0 14px calc(32px + env(safe-area-inset-bottom)) 14px; }
        }
      `}</style>

      {/* 東京タワー夜景 × Lo-Fi Girl イラスト背景 */}
      <svg className="bg-scene" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#121836" />
            <stop offset="55%" stopColor="#243163" />
            <stop offset="100%" stopColor="#3c4c8a" />
          </linearGradient>
          <radialGradient id="deskLampLight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffdfa0" stopOpacity="0.92" />
            <stop offset="50%" stopColor="#f6ad55" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f6ad55" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="woodDesk" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6b442a" />
            <stop offset="100%" stopColor="#3b2213" />
          </linearGradient>
          <clipPath id="windowFrame">
            <rect x="140" y="30" width="840" height="450" rx="8" />
          </clipPath>
        </defs>

        {/* 部屋の壁 */}
        <rect width="1280" height="720" fill="#272233" />

        {/* 窓の向こうの東京タワーと夜景 */}
        <g clipPath="url(#windowFrame)">
          <rect x="140" y="30" width="840" height="450" fill="url(#nightSky)" />

          {/* 星空 */}
          <circle cx="230" cy="95" r="1.8" fill="#fff" opacity="0.8" />
          <circle cx="320" cy="70" r="1.5" fill="#fff" opacity="0.6" />
          <circle cx="580" cy="85" r="2" fill="#fff" opacity="0.85" />
          <circle cx="710" cy="110" r="1.5" fill="#fff" opacity="0.7" />
          <circle cx="880" cy="75" r="1.8" fill="#fff" opacity="0.8" />

          {/* 遠景のビル群 */}
          <rect x="160" y="250" width="75" height="230" fill="#182042" />
          <rect x="245" y="210" width="85" height="270" fill="#1d274f" />
          <rect x="340" y="275" width="70" height="205" fill="#161d3b" />
          <rect x="520" y="240" width="90" height="240" fill="#1a2347" />
          <rect x="625" y="280" width="80" height="200" fill="#151c38" />
          <rect x="860" y="225" width="95" height="255" fill="#1b244a" />

          {/* ビルの窓明かり */}
          <g fill="#ffe28a" opacity="0.75">
            <rect x="260" y="230" width="10" height="12" />
            <rect x="280" y="230" width="10" height="12" />
            <rect x="260" y="255" width="10" height="12" />
            <rect x="300" y="255" width="10" height="12" />
            <rect x="540" y="260" width="12" height="14" />
            <rect x="565" y="260" width="12" height="14" />
            <rect x="540" y="285" width="12" height="14" />
            <rect x="880" y="245" width="12" height="14" />
            <rect x="905" y="245" width="12" height="14" />
            <rect x="880" y="275" width="12" height="14" />
          </g>

          {/* ライトアップされた東京タワー */}
          <g className="tower-glow">
            {/* タワーの暖かい光のオーラ */}
            <ellipse cx="455" cy="270" rx="55" ry="165" fill="#ff7b39" opacity="0.18" />
            {/* アンテナ先端 */}
            <line x1="455" y1="75" x2="455" y2="135" stroke="#ff944d" strokeWidth="4" />
            {/* 上部鉄骨 */}
            <polygon points="455,135 442,235 468,235" fill="none" stroke="#ff8533" strokeWidth="5" />
            {/* 特別展望台 */}
            <rect x="438" y="228" width="34" height="12" rx="2" fill="#ffa347" />
            {/* 中部鉄骨 */}
            <polygon points="442,240 424,335 486,335 468,240" fill="none" stroke="#ff8533" strokeWidth="6" />
            {/* 大展望台 */}
            <rect x="418" y="330" width="74" height="18" rx="3" fill="#ffad5c" />
            {/* 下部脚部 */}
            <path d="M424 348 Q405 425 385 480" fill="none" stroke="#ff8533" strokeWidth="8" />
            <path d="M486 348 Q505 425 525 480" fill="none" stroke="#ff8533" strokeWidth="8" />
            <path d="M412 410 L498 410" stroke="#ff944d" strokeWidth="4" />
          </g>
        </g>

        {/* 窓枠 */}
        <rect x="140" y="30" width="840" height="450" rx="8" fill="none" stroke="#1e1a29" strokeWidth="16" />
        <line x1="560" y1="30" x2="560" y2="480" stroke="#1e1a29" strokeWidth="12" />

        {/* 右側の本棚とKEEP GOINGポスター */}
        <rect x="1015" y="75" width="115" height="145" rx="4" fill="#3a435e" />
        <text x="1072" y="138" textAnchor="middle" fill="#e2e8f0" fontSize="22" fontWeight="800" fontFamily="Outfit, sans-serif">KEEP</text>
        <text x="1072" y="166" textAnchor="middle" fill="#e2e8f0" fontSize="22" fontWeight="800" fontFamily="Outfit, sans-serif">GOING</text>

        {/* 左側の観葉植物 */}
        <path d="M165 445 L215 445 L205 500 L175 500 Z" fill="#b86b4b" />
        <ellipse cx="165" cy="415" rx="26" ry="16" transform="rotate(-25 165 415)" fill="#4f8259" />
        <ellipse cx="215" cy="410" rx="26" ry="16" transform="rotate(25 215 410)" fill="#3d6b47" />
        <ellipse cx="190" cy="390" rx="24" ry="18" fill="#639a67" />

        {/* 机 */}
        <rect x="0" y="500" width="1280" height="220" fill="url(#woodDesk)" />
        <line x1="0" y1="500" x2="1280" y2="500" stroke="#8f5c3a" strokeWidth="6" />

        {/* 温かいデスクランプ（中央左） */}
        <circle cx="535" cy="390" r="210" fill="url(#deskLampLight)" />
        <rect x="445" y="492" width="76" height="12" rx="6" fill="#2d3748" />
        <path d="M482 492 L468 350 L535 305" fill="none" stroke="#4a5568" strokeWidth="9" strokeLinecap="round" />
        <path d="M505 315 L575 295 L590 342 L498 350 Z" fill="#d97736" />
        <ellipse cx="542" cy="346" rx="42" ry="8" fill="#fff3b0" />

        {/* クッションの上で眠る三毛猫 */}
        <ellipse cx="305" cy="492" rx="68" ry="16" fill="#c07a45" />
        <ellipse cx="305" cy="472" rx="48" ry="26" fill="#f7f3eb" />
        <path d="M275 452 Q305 442 330 462 Q310 475 275 452 Z" fill="#d97a38" />
        <circle cx="268" cy="472" r="20" fill="#f7f3eb" />
        <polygon points="254,458 258,440 268,452" fill="#2d2622" />
        <polygon points="272,452 282,440 284,458" fill="#d97a38" />
        <path d="M258 474 Q264 478 270 474" fill="none" stroke="#2d2622" strokeWidth="2.5" strokeLinecap="round" />

        {/* ノートパソコン */}
        <polygon points="410,498 445,405 535,405 505,498" fill="#cbd5e1" />
        <rect x="410" y="495" width="125" height="8" rx="3" fill="#94a3b8" />

        {/* 肉球マグカップと湯気 */}
        <rect x="572" y="454" width="40" height="46" rx="6" fill="#f7f3eb" />
        <path d="M612 464 C626 464, 626 488, 612 488" fill="none" stroke="#f7f3eb" strokeWidth="5" />
        <circle cx="592" cy="479" r="5" fill="#9c7a65" />
        <circle cx="585" cy="471" r="2.2" fill="#9c7a65" />
        <circle cx="592" cy="469" r="2.2" fill="#9c7a65" />
        <circle cx="599" cy="471" r="2.2" fill="#9c7a65" />
        <path className="steam-1" d="M586 445 Q579 430 589 415" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        <path className="steam-2" d="M598 443 Q605 428 595 413" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

        {/* 開いたノート */}
        <polygon points="635,512 750,504 865,512 850,545 750,536 650,545" fill="#fcfaf2" />
        <line x1="750" y1="504" x2="750" y2="536" stroke="#cbd5e1" strokeWidth="2" />

        {/* 赤いパーカー＆ヘッドホンで勉強する少女 */}
        <g>
          {/* 椅子 */}
          <rect x="855" y="385" width="110" height="115" rx="18" fill="#7c5338" />
          {/* 赤いパーカーの胴体 */}
          <path d="M715 505 C725 405, 770 370, 845 370 C915 370, 955 415, 968 505 Z" fill="#c84b43" />
          {/* フード部分 */}
          <path d="M845 368 Q905 372 935 425 Q885 435 845 395 Z" fill="#a83831" />

          {/* 頭とヘッドホン */}
          <g className="girl-head">
            <rect x="782" y="335" width="26" height="38" rx="10" fill="#f3cbb4" />
            {/* お団子ヘア */}
            <circle cx="865" cy="215" r="34" fill="#3b261d" />
            {/* 後ろ髪 */}
            <path d="M735 295 C730 225, 775 188, 835 198 C885 206, 905 255, 890 325 Z" fill="#3b261d" />
            {/* 横顔 */}
            <path d="M742 282 C742 240, 778 222, 818 232 C848 240, 858 276, 850 315 C842 345, 816 356, 786 352 C756 348, 742 320, 742 282 Z" fill="#fad8c3" />
            {/* 前髪 */}
            <path d="M735 284 C740 226, 795 206, 840 228 C820 255, 795 275, 765 284 Z" fill="#3b261d" />
            {/* 目元 */}
            <path d="M754 296 Q765 301 776 296" fill="none" stroke="#3b261d" strokeWidth="3" strokeLinecap="round" />
            {/* ヘッドホン */}
            <path d="M806 202 C824 202, 838 232, 835 270" fill="none" stroke="#4a5568" strokeWidth="10" strokeLinecap="round" />
            <rect x="810" y="264" width="42" height="54" rx="19" fill="#2d3748" stroke="#cbd5e1" strokeWidth="2.5" />
          </g>

          {/* ペンを持つ腕 */}
          <g className="girl-arm">
            <path d="M835 415 C825 462, 795 492, 755 512" fill="none" stroke="#c84b43" strokeWidth="34" strokeLinecap="round" />
            <circle cx="748" cy="514" r="13" fill="#fad8c3" />
            <line x1="756" y1="520" x2="725" y2="492" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
          </g>
        </g>
      </svg>

      <div className="vignette" />

      {/* 上部コントロール */}
      <header className="header-bar">
        <div className="badge">5m WORK + 1m BREAK × 3</div>
        <div className="btn-group">
          <button type="button" className="action-btn" onClick={() => setSound(!sound)}>
            {sound ? '🔔 ON' : '🔕 OFF'}
          </button>
          <button
            type="button"
            className="action-btn primary"
            onClick={() => {
              if (isDone) {
                setElapsed(0);
                setRunning(true);
              } else {
                setRunning(!running);
              }
            }}
          >
            {isDone ? '↻ RESTART' : running ? '⏸ PAUSE' : '▶ START'}
          </button>
          {elapsed > 0 && (
            <button
              type="button"
              className="action-btn"
              onClick={() => {
                setRunning(false);
                setElapsed(0);
              }}
            >
              ↺
            </button>
          )}
        </div>
      </header>

      {/* 左下タイムカウントカード */}
      <main className="timer-hud">
        <div className="hud-card">
          <div className="status-row">
            <span className="dot" />
            <span className="phase-label">
              {isDone ? 'COMPLETED · 18 MIN' : currentSeg.label}
            </span>
          </div>
          <div className="countdown-row">
            <div className="countdown-time">{fmtTime(remainingInPhase)}</div>
            <div className="total-elapsed">{fmtTime(elapsed)} / 18:00</div>
          </div>
        </div>
      </main>

      {/* 画面最下部の18分タイムラインバー */}
      <div className="timeline-bar">
        <div className="timeline-fill" style={{ width: `${percent}%` }} />
        <div className="progress-segments">
          {SCHEDULE.map((seg, idx) => (
            <div
              key={idx}
              className={`segment-slot ${seg.type === 'break' ? 'is-break-slot' : ''}`}
              style={{ flex: seg.duration }}
            >
              {seg.type === 'work' ? `WORK${seg.set} (5m)` : '1m'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}