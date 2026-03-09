import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_SETTINGS = {
  minutesPerQuestion: 2,
  minutesPerWrong: 1,
  difficulty: "medium",
  parentPin: "1234",
  parentPhone: "",
  childName: "your child",
};

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

function generateQuestion(difficulty) {
  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  if (difficulty === "easy") {
    const ops = ["+", "-"];
    const op = ops[rnd(0, 1)];
    let a = rnd(1, 10), b = rnd(1, 10);
    if (op === "-" && a < b) [a, b] = [b, a];
    return { display: `${a} ${op} ${b} = ?`, answer: op === "+" ? a + b : a - b };
  }
  if (difficulty === "medium") {
    const ops = ["+", "-", "×"];
    const op = ops[rnd(0, 2)];
    let a = rnd(1, 20), b = rnd(1, 12);
    if (op === "-" && a < b) [a, b] = [b, a];
    const ans = op === "+" ? a + b : op === "-" ? a - b : a * b;
    return { display: `${a} ${op} ${b} = ?`, answer: ans };
  }
  if (difficulty === "hard") {
    const ops = ["+", "-", "×", "÷"];
    const op = ops[rnd(0, 3)];
    let a = rnd(2, 15), b = rnd(2, 12);
    if (op === "-" && a < b) [a, b] = [b, a];
    if (op === "÷") { const ans = a; a = a * b; return { display: `${a} ÷ ${b} = ?`, answer: ans }; }
    const ans = op === "+" ? a + b : op === "-" ? a - b : a * b;
    return { display: `${a} ${op} ${b} = ?`, answer: ans };
  }
  if (difficulty === "fractions") {
    const type = rnd(0, 2);
    const denoms = [2, 3, 4, 5, 6, 8, 10];
    if (type === 0) {
      const d = denoms[rnd(0, denoms.length - 1)];
      const a = rnd(1, d - 1), b = rnd(1, d - 1);
      const op = rnd(0, 1) === 0 ? "+" : "-";
      let num = op === "+" ? a + b : a - b;
      if (num <= 0) return generateQuestion("fractions");
      const g = gcd(Math.abs(num), d);
      const rn = num / g, rd = d / g;
      const answerDisplay = rd === 1 ? `${rn}` : `${rn}/${rd}`;
      return { display: `${a}/${d} ${op} ${b}/${d} = ?`, answer: answerDisplay, isText: true, hint: `Enter as a fraction like 3/4, or a whole number` };
    } else if (type === 1) {
      const d = denoms[rnd(0, denoms.length - 1)];
      const a = rnd(1, d - 1), n = rnd(2, 6);
      const num = a * n;
      const g = gcd(num, d);
      const rn = num / g, rd = d / g;
      const answerDisplay = rd === 1 ? `${rn}` : `${rn}/${rd}`;
      return { display: `${a}/${d} × ${n} = ?`, answer: answerDisplay, isText: true, hint: `Enter as a fraction like 3/4, or a whole number` };
    } else {
      const d1 = denoms[rnd(0, denoms.length - 1)];
      const d2 = denoms[rnd(0, denoms.length - 1)];
      const a = rnd(1, d1 - 1), b = rnd(1, d2 - 1);
      if (a / d1 === b / d2) return generateQuestion("fractions");
      const bigger = a / d1 > b / d2 ? `${a}/${d1}` : `${b}/${d2}`;
      return { display: `Which is bigger?\n${a}/${d1}  or  ${b}/${d2}`, answer: bigger, isText: true, hint: `Type the bigger fraction exactly, e.g. 3/4` };
    }
  }
  if (difficulty === "orderofops") {
    const type = rnd(0, 3);
    if (type === 0) { const a = rnd(1,10), b = rnd(1,10), c = rnd(2,9); return { display: `(${a} + ${b}) × ${c} = ?`, answer: (a+b)*c }; }
    else if (type === 1) { const a=rnd(1,9),b=rnd(1,9),c=rnd(1,9),d=rnd(1,9); return { display: `${a} × ${b} + ${c} × ${d} = ?`, answer: a*b+c*d }; }
    else if (type === 2) { const a=rnd(1,20),b=rnd(1,10),c=rnd(2,9); return { display: `${a} + ${b} × ${c} = ?`, answer: a+b*c }; }
    else { let a=rnd(3,15),b=rnd(1,a-1); const c=rnd(1,8),d=rnd(1,8); return { display: `(${a} - ${b}) × (${c} + ${d}) = ?`, answer: (a-b)*(c+d) }; }
  }
  if (difficulty === "percent") {
    const type = rnd(0, 2);
    const nicePercents = [10, 20, 25, 50, 75, 5, 15, 30, 40];
    const pct = nicePercents[rnd(0, nicePercents.length - 1)];
    if (type === 0) {
      const bases = [20,40,50,60,80,100,120,150,200,250,300,400,500];
      const base = bases[rnd(0, bases.length-1)];
      const ans = (pct/100)*base;
      if (!Number.isInteger(ans)) return generateQuestion("percent");
      return { display: `What is ${pct}% of ${base}?`, answer: ans };
    } else if (type === 1) {
      const base = rnd(2,20)*10;
      const ans = nicePercents[rnd(0, nicePercents.length-1)];
      const part = (ans/100)*base;
      if (!Number.isInteger(part)) return generateQuestion("percent");
      return { display: `${part} is what % of ${base}?`, answer: ans };
    } else {
      const base = rnd(2,20)*10;
      const pct2 = nicePercents[rnd(0, nicePercents.length-1)];
      const isIncrease = rnd(0,1)===0;
      const change = (pct2/100)*base;
      if (!Number.isInteger(change)) return generateQuestion("percent");
      const ans = isIncrease ? base+change : base-change;
      return { display: `${base} ${isIncrease?"increased":"decreased"} by ${pct2}% = ?`, answer: ans };
    }
  }
  return generateQuestion("easy");
}

function Particles({ trigger }) {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    if (!trigger) return;
    const p = Array.from({ length: 16 }, (_, i) => ({
      id: Date.now() + i,
      x: 50 + (Math.random() - 0.5) * 60,
      y: 50 + (Math.random() - 0.5) * 60,
      color: ["#FFD700","#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7"][Math.floor(Math.random()*6)],
      size: Math.random() * 8 + 4,
      angle: Math.random() * 360,
    }));
    setParticles(p);
    const t = setTimeout(() => setParticles([]), 700);
    return () => clearTimeout(t);
  }, [trigger]);
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
      {particles.map(p => (
        <div key={p.id} style={{ position:"absolute", left:`${p.x}%`, top:`${p.y}%`, width:p.size, height:p.size, borderRadius:"50%", background:p.color, transform:`rotate(${p.angle}deg)`, animation:"burst 0.7s ease-out forwards" }} />
      ))}
    </div>
  );
}

function TimerRing({ totalSecs, remainingSecs }) {
  const r = 54, circ = 2 * Math.PI * r;
  const pct = totalSecs > 0 ? remainingSecs / totalSecs : 0;
  const color = pct > 0.5 ? "#4ECDC4" : pct > 0.25 ? "#FFD700" : "#FF6B6B";
  return (
    <svg width="130" height="130" style={{ transform:"rotate(-90deg)" }}>
      <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
      <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} style={{ transition:"stroke-dashoffset 1s linear, stroke 0.5s" }} />
    </svg>
  );
}

export default function MathForMinutes() {
  const [settings, setSettings] = useState(() => {
  try {
    const saved = localStorage.getItem("mfm-settings");
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
});
  const [screen, setScreen] = useState("home");
  const [question, setQuestion] = useState(null);
  const [input, setInput] = useState("");
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [earnedMins, setEarnedMins] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [burstKey, setBurstKey] = useState(0);
  const [timerSecs, setTimerSecs] = useState(0);
  const [totalSecs, setTotalSecs] = useState(0);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [tempSettings, setTempSettings] = useState(DEFAULT_SETTINGS);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);
  const intervalRef = useRef(null);

  const newQuestion = useCallback(() => {
    setQuestion(generateQuestion(settings.difficulty));
    setInput(""); setFeedback(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [settings.difficulty]);

  useEffect(() => { if (screen === "quiz") newQuestion(); }, [screen]);

  useEffect(() => {
    if (screen !== "timer") return;
    intervalRef.current = setInterval(() => {
      setTimerSecs(s => {
        if (s <= 1) { clearInterval(intervalRef.current); setScreen("home"); setEarnedMins(0); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [screen]);

  function submitAnswer() {
    if (!question || feedback) return;
    if (question.isText) {
      const val = input.trim().replace(/\s+/g, "");
      const correct = String(question.answer).trim().replace(/\s+/g, "");
      if (val === correct) handleCorrect(); else handleWrong();
    } else {
      const val = parseInt(input, 10);
      if (isNaN(val)) return;
      if (val === question.answer) handleCorrect(); else handleWrong();
    }
  }

  function handleCorrect() {
    const newStreak = streak + 1;
    setFeedback("correct"); setBurstKey(k => k+1);
    setStreak(newStreak); setBestStreak(b => Math.max(b, newStreak));
    setQuestionsAnswered(q => q+1);
    setEarnedMins(m => m + settings.minutesPerQuestion);
    setTimeout(newQuestion, 900);
  }

  function handleWrong() {
    setFeedback("wrong"); setShake(true); setWrongAnswers(w => w + 1);
    setEarnedMins(m => Math.max(0, m - settings.minutesPerWrong));
    setTimeout(() => { setShake(false); setInput(""); setFeedback(null); inputRef.current?.focus(); }, 700);
  }

  function startTimer() {
    const secs = earnedMins * 60;
    setTimerSecs(secs); setTotalSecs(secs); setScreen("timer");
  }

  function openSettings() {
    setTempSettings(settings); setPinInput(""); setPinError(false); setScreen("pin");
  }

  function saveSettings() {
  setSettings(tempSettings);
  localStorage.setItem("mfm-settings", JSON.stringify(tempSettings));
  setScreen("home");
}

  const mins = Math.floor(timerSecs / 60);
  const secs = timerSecs % 60;
  const diffColor = { easy:"#96CEB4", medium:"#FFD700", hard:"#FF6B6B", fractions:"#C39BD3", orderofops:"#F0A500", percent:"#FF6B9D" };
  const diffLabel = { easy:"Easy", medium:"Medium", hard:"Hard", fractions:"Fractions", orderofops:"Order of Ops", percent:"Percentages" };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)", fontFamily:"'Segoe UI',sans-serif", padding:"20px" }}>
      <style>{`
        @keyframes burst{0%{transform:scale(0) rotate(0deg);opacity:1}100%{transform:scale(3) rotate(180deg) translate(30px,-30px);opacity:0}}
        @keyframes pop{0%{transform:scale(0.8)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
        .card{background:rgba(255,255,255,0.07);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.12);border-radius:28px;padding:40px;max-width:420px;width:100%;position:relative;animation:fadeIn 0.4s ease}
        .btn{border:none;cursor:pointer;border-radius:16px;font-family:sans-serif;font-size:18px;padding:14px 28px;transition:all 0.15s;font-weight:700}
        .btn:hover{transform:translateY(-2px);filter:brightness(1.1)}
        .btn:active{transform:translateY(0) scale(0.97)}
        .btn-primary{background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:white;box-shadow:0 4px 20px rgba(78,205,196,0.4)}
        .btn-success{background:linear-gradient(135deg,#96CEB4,#4ECDC4);color:#1a1a2e;box-shadow:0 4px 20px rgba(150,206,180,0.4)}
        .btn-ghost{background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.8)}
        .math-input{background:rgba(255,255,255,0.1);border:2px solid rgba(255,255,255,0.2);border-radius:16px;color:white;font-size:32px;text-align:center;padding:14px;width:100%;box-sizing:border-box;outline:none;transition:border 0.2s;font-weight:700}
        .math-input:focus{border-color:#4ECDC4;box-shadow:0 0 0 3px rgba(78,205,196,0.2)}
        .pin-btn{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;border-radius:14px;font-size:22px;padding:16px;cursor:pointer;transition:all 0.15s;font-weight:700}
        .pin-btn:hover{background:rgba(255,255,255,0.2)}
        label{color:rgba(255,255,255,0.6);font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:8px}
        select,input[type=number],input[type=text],input[type=password]{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:12px;color:white;font-size:16px;padding:12px 16px;width:100%;box-sizing:border-box;outline:none}
        select:focus,input:focus{border-color:#4ECDC4}
        select option{background:#302b63}
        h1,h2{font-weight:800}
      `}</style>

      {screen === "home" && (
        <div className="card" style={{ textAlign:"center" }}>
          <div style={{ fontSize:56, marginBottom:8 }}>🧮</div>
          <h1 style={{ fontSize:36, color:"white", margin:"0 0 6px" }}>Math For Minutes</h1>
          <p style={{ color:"rgba(255,255,255,0.5)", margin:"0 0 32px", fontSize:15 }}>Solve problems → Earn internet time!</p>
          <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:18, padding:"20px", marginBottom:28 }}>
            <div style={{ fontSize:48, color:"#4ECDC4", fontWeight:800 }}>{earnedMins}</div>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:14 }}>minutes earned</div>
            <div style={{ color:"rgba(255,255,255,0.3)", fontSize:13, marginTop:6 }}>
              +{settings.minutesPerQuestion} min correct · <span style={{color:"#FF6B6B"}}>-{settings.minutesPerWrong} min wrong</span> · <span style={{ color:diffColor[settings.difficulty], fontWeight:700 }}>{diffLabel[settings.difficulty]}</span>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <button className="btn btn-primary" onClick={() => setScreen("quiz")}>✏️ Do Math Problems</button>
            {earnedMins > 0 && <button className="btn btn-success" onClick={startTimer} style={{ animation:"pulse 2s infinite" }}>🌐 Start {earnedMins} Min Internet Session</button>}
            <button className="btn btn-ghost" onClick={openSettings} style={{ fontSize:14, padding:"10px 20px" }}>🔒 Parent Settings</button>
          </div>
        </div>
      )}

      {screen === "quiz" && question && (
        <div className="card" style={{ textAlign:"center" }}>
          <Particles trigger={burstKey} />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
            <button className="btn btn-ghost" onClick={() => setScreen("home")} style={{ fontSize:13, padding:"8px 16px" }}>← Home</button>
            <div style={{ textAlign:"right" }}>
              <div style={{ color:"#4ECDC4", fontSize:22, fontWeight:800 }}>+{earnedMins} min</div>
              {streak > 1 && <div style={{ color:"#FFD700", fontSize:12 }}>🔥 {streak} streak!</div>}
            </div>
          </div>
          <div style={{ fontSize:question?.display?.includes("\n")?34:48, color:"white", marginBottom:28, lineHeight:1.3, whiteSpace:"pre-line", fontWeight:800, animation:feedback==="correct"?"pop 0.4s ease":feedback==="wrong"?"shake 0.4s ease":"none" }}>
            {question?.display}
          </div>
          {question?.hint && <div style={{ color:"rgba(255,255,255,0.35)", fontSize:12, marginBottom:10 }}>💡 {question.hint}</div>}
          <input ref={inputRef} type={question?.isText?"text":"number"} className="math-input" value={input}
            onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && submitAnswer()} placeholder="?"
            style={{ marginBottom:20, animation:shake?"shake 0.4s ease":"none", borderColor:feedback==="correct"?"#4ECDC4":feedback==="wrong"?"#FF6B6B":undefined }} />
          {feedback==="correct" && <div style={{ color:"#4ECDC4", fontSize:22, marginBottom:12, fontWeight:800 }}>✅ Correct! +{settings.minutesPerQuestion} min</div>}
          {feedback==="wrong" && <div style={{ color:"#FF6B6B", fontSize:22, marginBottom:12, fontWeight:800 }}>❌ -{settings.minutesPerWrong} min — Try again!</div>}
          {!feedback && <button className="btn btn-primary" onClick={submitAnswer} style={{ width:"100%", fontSize:20 }}>Check Answer ✓</button>}
          <div style={{ marginTop:20, display:"flex", justifyContent:"center", gap:8 }}>
            {Array.from({ length:Math.min(streak,10) }).map((_,i) => <span key={i} style={{ fontSize:16 }}>⭐</span>)}
          </div>
          {earnedMins > 0 && <button className="btn btn-success" onClick={() => setScreen("summary")} style={{ width:"100%", marginTop:20, fontSize:15 }}>🏁 I'm Done! Send results to parent</button>}
        </div>
      )}

      {screen === "summary" && (
        <div className="card" style={{ textAlign:"center" }}>
          <div style={{ fontSize:52, marginBottom:8 }}>🎉</div>
          <h2 style={{ color:"white", fontSize:30, margin:"0 0 6px" }}>Great work, {settings.childName}!</h2>
          <p style={{ color:"rgba(255,255,255,0.45)", margin:"0 0 28px", fontSize:14 }}>Here's what you earned this session</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:28 }}>
            {[{icon:"✅",label:"Correct",value:questionsAnswered},{icon:"❌",label:"Wrong",value:wrongAnswers},{icon:"⏱️",label:"Minutes",value:earnedMins},{icon:"🔥",label:"Best streak",value:bestStreak}].map(({icon,label,value}) => (
              <div key={label} style={{ background:"rgba(255,255,255,0.07)", borderRadius:16, padding:"16px 8px" }}>
                <div style={{ fontSize:24 }}>{icon}</div>
                <div style={{ color:"white", fontSize:26, fontWeight:800 }}>{value}</div>
                <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11 }}>{label}</div>
              </div>
            ))}
          </div>
          {settings.parentPhone ? (
            <>
              <div style={{ background:"rgba(78,205,196,0.1)", border:"1px solid rgba(78,205,196,0.3)", borderRadius:16, padding:"14px 16px", marginBottom:20 }}>
                <div style={{ color:"#4ECDC4", fontSize:14, fontWeight:700 }}>📱 Opens WhatsApp pre-filled for:</div>
                <div style={{ color:"white", fontSize:20, marginTop:4, fontWeight:800 }}>{settings.parentPhone}</div>
              </div>
              <button className="btn btn-primary" style={{ width:"100%", fontSize:17, marginBottom:10 }}
              onClick={() => { const msg = `🧮 Math For Minutes Report\n👦 ${settings.childName} just finished!\n\n✅ Correct: ${questionsAnswered}\n❌ Wrong: ${wrongAnswers}\n⏱️ Minutes earned: ${earnedMins}\n🔥 Best streak: ${bestStreak}\n📚 Level: ${diffLabel[settings.difficulty]}\n\nPlease unlock ${earnedMins} minute${earnedMins!==1?"s":""} of internet time 🙏`; window.open(`https://wa.me/${settings.parentPhone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank'); }}>
                📨 Send Results via WhatsApp
              </button>
            </>
          ) : (
            <div style={{ background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.3)", borderRadius:16, padding:16, marginBottom:20, color:"#FF6B6B", fontSize:14 }}>
              ⚠️ No parent phone number set. Ask a parent to add it in Settings.
            </div>
          )}
          <button className="btn btn-ghost" onClick={() => setScreen("home")} style={{ width:"100%", fontSize:14 }}>← Back to Home</button>
        </div>
      )}

      {screen === "timer" && (
        <div className="card" style={{ textAlign:"center" }}>
          <h2 style={{ color:"white", fontSize:28, margin:"0 0 8px" }}>🌐 Internet Time!</h2>
          <p style={{ color:"rgba(255,255,255,0.4)", margin:"0 0 28px" }}>Time remaining on your session</p>
          <div style={{ position:"relative", display:"inline-block", marginBottom:28 }}>
            <TimerRing totalSecs={totalSecs} remainingSecs={timerSecs} />
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <div style={{ fontSize:36, color:"white", lineHeight:1, fontWeight:800 }}>{String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}</div>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12 }}>remaining</div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => { setScreen("quiz"); clearInterval(intervalRef.current); }} style={{ width:"100%", marginBottom:10 }}>✏️ Earn More Minutes</button>
          <button className="btn btn-ghost" onClick={() => { clearInterval(intervalRef.current); setScreen("home"); setEarnedMins(0); }} style={{ width:"100%", fontSize:14 }}>End Session</button>
        </div>
      )}

      {screen === "pin" && (
        <div className="card" style={{ textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔐</div>
          <h2 style={{ color:"white", fontSize:28, margin:"0 0 8px" }}>Parent Access</h2>
          <p style={{ color:"rgba(255,255,255,0.4)", margin:"0 0 24px", fontSize:14 }}>Enter your PIN to access settings</p>
          <div style={{ display:"flex", justifyContent:"center", gap:10, marginBottom:24 }}>
            {[0,1,2,3].map(i => <div key={i} style={{ width:16, height:16, borderRadius:"50%", background:pinInput.length>i?"#4ECDC4":"rgba(255,255,255,0.2)", transition:"background 0.2s" }} />)}
          </div>
          {pinError && <div style={{ color:"#FF6B6B", fontSize:14, marginBottom:12 }}>Wrong PIN, try again</div>}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, maxWidth:240, margin:"0 auto 20px" }}>
            {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i) => (
              <button key={i} className="pin-btn" disabled={d===""} style={{ visibility:d===""?"hidden":"visible" }}
                onClick={() => { if(d==="⌫") setPinInput(p=>p.slice(0,-1)); else if(pinInput.length<4){const np=pinInput+d;setPinInput(np);if(np.length===4)setTimeout(()=>{if(np===settings.parentPin){setScreen("settings");setPinError(false);}else{setPinError(true);setPinInput("");}},200);} }}>
                {d}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost" onClick={() => setScreen("home")} style={{ width:"100%", fontSize:14 }}>Cancel</button>
        </div>
      )}

      {screen === "settings" && (
        <div className="card">
          <h2 style={{ color:"white", fontSize:28, margin:"0 0 24px" }}>⚙️ Parent Settings</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:20, marginBottom:28 }}>
            <div><label>Child's name</label><input type="text" placeholder="e.g. Liam" value={tempSettings.childName} onChange={e=>setTempSettings(s=>({...s,childName:e.target.value}))} /></div>
            <div>
              <label>Your phone number (for SMS reports)</label>
              <input type="text" placeholder="e.g. +972 50 123 4567" value={tempSettings.parentPhone} onChange={e=>setTempSettings(s=>({...s,parentPhone:e.target.value}))} />
              <div style={{ color:"rgba(255,255,255,0.3)", fontSize:12, marginTop:6 }}>Include country code</div>
            </div>
            <div><label>Minutes earned per correct answer</label><input type="number" min="1" max="30" value={tempSettings.minutesPerQuestion} onChange={e=>setTempSettings(s=>({...s,minutesPerQuestion:Math.max(1,parseInt(e.target.value)||1)}))} /></div>
            <div><label>Minutes subtracted per wrong answer</label><input type="number" min="0" max="30" value={tempSettings.minutesPerWrong} onChange={e=>setTempSettings(s=>({...s,minutesPerWrong:Math.max(0,parseInt(e.target.value)||0)}))} /></div>
            <div>
              <label>Difficulty Level</label>
              <select value={tempSettings.difficulty} onChange={e=>setTempSettings(s=>({...s,difficulty:e.target.value}))}>
                <option value="easy">⭐ Easy — Add & subtract (1–10)</option>
                <option value="medium">⭐⭐ Medium — Add, subtract, multiply</option>
                <option value="hard">⭐⭐⭐ Hard — All 4 operations</option>
                <option value="fractions">⭐⭐⭐⭐ Fractions</option>
                <option value="orderofops">⭐⭐⭐⭐⭐ Order of Operations (PEMDAS)</option>
                <option value="percent">⭐⭐⭐⭐⭐⭐ Percentages</option>
              </select>
            </div>
            <div><label>Change Parent PIN</label><input type="password" maxLength={4} placeholder="New 4-digit PIN" value={tempSettings.parentPin} onChange={e=>setTempSettings(s=>({...s,parentPin:e.target.value.replace(/\D/g,"").slice(0,4)}))} /></div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn btn-success" onClick={saveSettings} style={{ flex:1 }}>Save Settings</button>
            <button className="btn btn-ghost" onClick={() => setScreen("home")} style={{ flex:1 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
