import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";

// ── Math engine ────────────────────────────────────────────────
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

function generateQuestion(difficulty) {
  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  if (difficulty === "easy") {
    const ops = ["+", "-"], op = ops[rnd(0,1)];
    let a = rnd(1,10), b = rnd(1,10);
    if (op==="-"&&a<b)[a,b]=[b,a];
    return { display:`${a} ${op} ${b} = ?`, answer: op==="+"?a+b:a-b };
  }
  if (difficulty === "medium") {
    const ops=["+","-","×"],op=ops[rnd(0,2)];
    let a=rnd(1,20),b=rnd(1,12);
    if(op==="-"&&a<b)[a,b]=[b,a];
    return { display:`${a} ${op} ${b} = ?`, answer:op==="+"?a+b:op==="-"?a-b:a*b };
  }
  if (difficulty === "hard") {
    const ops=["+","-","×","÷"],op=ops[rnd(0,3)];
    let a=rnd(2,15),b=rnd(2,12);
    if(op==="-"&&a<b)[a,b]=[b,a];
    if(op==="÷"){const ans=a;a=a*b;return{display:`${a} ÷ ${b} = ?`,answer:ans};}
    return { display:`${a} ${op} ${b} = ?`, answer:op==="+"?a+b:op==="-"?a-b:a*b };
  }
  if (difficulty === "fractions") {
    const type=rnd(0,2), denoms=[2,3,4,5,6,8,10];
    if(type===0){
      const d=denoms[rnd(0,denoms.length-1)],a=rnd(1,d-1),b=rnd(1,d-1);
      const op=rnd(0,1)===0?"+":"-";
      let num=op==="+"?a+b:a-b;
      if(num<=0)return generateQuestion("fractions");
      const g=gcd(Math.abs(num),d),rn=num/g,rd=d/g;
      return{display:`${a}/${d} ${op} ${b}/${d} = ?`,answer:rd===1?`${rn}`:`${rn}/${rd}`,isText:true,hint:`Enter as a fraction like 3/4`};
    } else if(type===1){
      const d=denoms[rnd(0,denoms.length-1)],a=rnd(1,d-1),n=rnd(2,6);
      const g=gcd(a*n,d),rn=(a*n)/g,rd=d/g;
      return{display:`${a}/${d} × ${n} = ?`,answer:rd===1?`${rn}`:`${rn}/${rd}`,isText:true,hint:`Enter as a fraction like 3/4`};
    } else {
      const d1=denoms[rnd(0,denoms.length-1)],d2=denoms[rnd(0,denoms.length-1)];
      const a=rnd(1,d1-1),b=rnd(1,d2-1);
      if(a/d1===b/d2)return generateQuestion("fractions");
      return{display:`Which is bigger?\n${a}/${d1}  or  ${b}/${d2}`,answer:a/d1>b/d2?`${a}/${d1}`:`${b}/${d2}`,isText:true,hint:`Type the bigger fraction exactly`};
    }
  }
  if (difficulty === "orderofops") {
    const type=rnd(0,3);
    if(type===0){const a=rnd(1,10),b=rnd(1,10),c=rnd(2,9);return{display:`(${a} + ${b}) × ${c} = ?`,answer:(a+b)*c};}
    else if(type===1){const a=rnd(1,9),b=rnd(1,9),c=rnd(1,9),d=rnd(1,9);return{display:`${a} × ${b} + ${c} × ${d} = ?`,answer:a*b+c*d};}
    else if(type===2){const a=rnd(1,20),b=rnd(1,10),c=rnd(2,9);return{display:`${a} + ${b} × ${c} = ?`,answer:a+b*c};}
    else{let a=rnd(3,15),b=rnd(1,a-1);const c=rnd(1,8),d=rnd(1,8);return{display:`(${a} - ${b}) × (${c} + ${d}) = ?`,answer:(a-b)*(c+d)};}
  }
  if (difficulty === "percent") {
    const type=rnd(0,2),nicePercents=[10,20,25,50,75,5,15,30,40];
    const pct=nicePercents[rnd(0,nicePercents.length-1)];
    if(type===0){
      const bases=[20,40,50,60,80,100,120,150,200,250,300,400,500];
      const base=bases[rnd(0,bases.length-1)],ans=(pct/100)*base;
      if(!Number.isInteger(ans))return generateQuestion("percent");
      return{display:`What is ${pct}% of ${base}?`,answer:ans};
    } else if(type===1){
      const base=rnd(2,20)*10,ans=nicePercents[rnd(0,nicePercents.length-1)],part=(ans/100)*base;
      if(!Number.isInteger(part))return generateQuestion("percent");
      return{display:`${part} is what % of ${base}?`,answer:ans};
    } else {
      const base=rnd(2,20)*10,pct2=nicePercents[rnd(0,nicePercents.length-1)],isIncrease=rnd(0,1)===0;
      const change=(pct2/100)*base;
      if(!Number.isInteger(change))return generateQuestion("percent");
      return{display:`${base} ${isIncrease?"increased":"decreased"} by ${pct2}% = ?`,answer:isIncrease?base+change:base-change};
    }
  }
  return generateQuestion("easy");
}

// ── UI helpers ─────────────────────────────────────────────────
function Particles({ trigger }) {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    if (!trigger) return;
    const p = Array.from({length:16},(_,i)=>({id:Date.now()+i,x:50+(Math.random()-.5)*60,y:50+(Math.random()-.5)*60,color:["#FFD700","#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7"][Math.floor(Math.random()*6)],size:Math.random()*8+4,angle:Math.random()*360}));
    setParticles(p);
    const t = setTimeout(()=>setParticles([]),700);
    return ()=>clearTimeout(t);
  }, [trigger]);
  return (
    <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
      {particles.map(p=><div key={p.id} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,width:p.size,height:p.size,borderRadius:"50%",background:p.color,transform:`rotate(${p.angle}deg)`,animation:"burst 0.7s ease-out forwards"}}/>)}
    </div>
  );
}

function TimerRing({ totalSecs, remainingSecs }) {
  const r=54,circ=2*Math.PI*r,pct=totalSecs>0?remainingSecs/totalSecs:0;
  const color=pct>.5?"#4ECDC4":pct>.25?"#FFD700":"#FF6B6B";
  return (
    <svg width="130" height="130" style={{transform:"rotate(-90deg)"}}>
      <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10"/>
      <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} style={{transition:"stroke-dashoffset 1s linear, stroke 0.5s"}}/>
    </svg>
  );
}

const diffColor = {easy:"#96CEB4",medium:"#FFD700",hard:"#FF6B6B",fractions:"#C39BD3",orderofops:"#F0A500",percent:"#FF6B9D"};
const diffLabel = {easy:"Easy",medium:"Medium",hard:"Hard",fractions:"Fractions",orderofops:"Order of Ops",percent:"Percentages"};
const AVATARS = ["🦁","🐯","🐻","🦊","🐸","🐧","🦄","🐲","🤖","👾"];

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined,{month:"short",day:"numeric"}) + " " + d.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"});
}

const CSS = `
  @keyframes burst{0%{transform:scale(0) rotate(0deg);opacity:1}100%{transform:scale(3) rotate(180deg) translate(30px,-30px);opacity:0}}
  @keyframes pop{0%{transform:scale(0.8)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
  @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .card{background:rgba(255,255,255,0.07);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.12);border-radius:28px;padding:40px;max-width:440px;width:100%;position:relative;animation:fadeIn 0.4s ease}
  .btn{border:none;cursor:pointer;border-radius:16px;font-family:sans-serif;font-size:18px;padding:14px 28px;transition:all 0.15s;font-weight:700}
  .btn:hover{transform:translateY(-2px);filter:brightness(1.1)}
  .btn:active{transform:translateY(0) scale(0.97)}
  .btn-primary{background:linear-gradient(135deg,#4ECDC4,#45B7D1);color:white;box-shadow:0 4px 20px rgba(78,205,196,0.4)}
  .btn-success{background:linear-gradient(135deg,#96CEB4,#4ECDC4);color:#1a1a2e;box-shadow:0 4px 20px rgba(150,206,180,0.4)}
  .btn-ghost{background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.8)}
  .btn-danger{background:rgba(255,107,107,0.2);color:#FF6B6B;border:1px solid rgba(255,107,107,0.3)}
  .btn-google{background:white;color:#333;display:flex;align-items:center;justify-content:center;gap:10px;font-size:16px}
  .math-input{background:rgba(255,255,255,0.1);border:2px solid rgba(255,255,255,0.2);border-radius:16px;color:white;font-size:32px;text-align:center;padding:14px;width:100%;box-sizing:border-box;outline:none;transition:border 0.2s;font-weight:700}
  .math-input:focus{border-color:#4ECDC4;box-shadow:0 0 0 3px rgba(78,205,196,0.2)}
  .pin-btn{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;border-radius:14px;font-size:22px;padding:16px;cursor:pointer;transition:all 0.15s;font-weight:700}
  .pin-btn:hover{background:rgba(255,255,255,0.2)}
  label{color:rgba(255,255,255,0.6);font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:8px}
  select,input[type=number],input[type=text],input[type=password]{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:12px;color:white;font-size:16px;padding:12px 16px;width:100%;box-sizing:border-box;outline:none}
  select:focus,input:focus{border-color:#4ECDC4}
  select option{background:#302b63}
  h1,h2{font-weight:800}
  .profile-card{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:20px;cursor:pointer;transition:all 0.2s;text-align:center}
  .profile-card:hover{background:rgba(255,255,255,0.12);transform:translateY(-3px)}
  .result-row{background:rgba(255,255,255,0.05);border-radius:14px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;gap:12px}
  .spinner{width:40px;height:40px;border:4px solid rgba(255,255,255,0.1);border-top-color:#4ECDC4;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto}
`;

// ── Main app ───────────────────────────────────────────────────
export default function MathForMinutes() {
  // Auth & family state
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState("landing"); // landing | parent | child
  const [familyCodeInput, setFamilyCodeInput] = useState("");
  const [familyCodeError, setFamilyCodeError] = useState("");
  const [childFamily, setChildFamily] = useState(null); // family loaded via code on child device
  const [childProfiles, setChildProfiles] = useState([]);

  // Quiz state
  const [activeProfile, setActiveProfile] = useState(null);
  const [screen, setScreen] = useState("select");
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
  const [shake, setShake] = useState(false);

  // Parent settings state
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [parentPin, setParentPin] = useState(() => localStorage.getItem("mfm-pin") || "1234");
  const [filterProfile, setFilterProfile] = useState("all");
  const [editingProfile, setEditingProfile] = useState(null);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileAvatar, setNewProfileAvatar] = useState("🦁");
  const [newProfileDiff, setNewProfileDiff] = useState("medium");
  const [newProfileMPQ, setNewProfileMPQ] = useState(2);
  const [newProfileMPW, setNewProfileMPW] = useState(1);

  const inputRef = useRef(null);
  const intervalRef = useRef(null);

  // ── Auth listener ──────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadFamily(session.user);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadFamily(session.user);
      else { setFamily(null); setProfiles([]); setSessions([]); setLoading(false); }
    });
    // Check if child device has a saved family code
    const savedCode = localStorage.getItem("mfm-child-code");
    if (savedCode) loadChildFamily(savedCode);
    return () => subscription.unsubscribe();
  }, []);

  async function loadFamily(u) {
    setLoading(true);
    let { data: fam } = await supabase.from("families").select("*").eq("owner_id", u.id).single();
    if (!fam) {
      const { data: newFam } = await supabase.from("families").insert({ owner_id: u.id }).select().single();
      fam = newFam;
    }
    setFamily(fam);
    const { data: profs } = await supabase.from("profiles").select("*").eq("family_id", fam.id).order("created_at");
    setProfiles(profs || []);
    const { data: sess } = await supabase.from("sessions").select("*").eq("family_id", fam.id).order("created_at", { ascending: false }).limit(50);
    setSessions(sess || []);
    setLoading(false);
  }

  async function loadChildFamily(code) {
    const { data: fam } = await supabase.from("families").select("*").eq("family_code", code.toUpperCase()).single();
    if (fam) {
      setChildFamily(fam);
      const { data: profs } = await supabase.from("profiles").select("*").eq("family_id", fam.id).order("created_at");
      setChildProfiles(profs || []);
      localStorage.setItem("mfm-child-code", code.toUpperCase());
    }
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.href } });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setAuthMode("landing");
  }

  // ── Profile CRUD ───────────────────────────────────────────
  async function addProfile() {
    if (!newProfileName.trim()) return;
    const { data } = await supabase.from("profiles").insert({
      family_id: family.id, name: newProfileName.trim(),
      avatar: newProfileAvatar, difficulty: newProfileDiff,
      minutes_per_question: newProfileMPQ, minutes_per_wrong: newProfileMPW,
    }).select().single();
    if (data) { setProfiles(p=>[...p,data]); setNewProfileName(""); }
  }

  async function saveProfile(id) {
    const { data } = await supabase.from("profiles").update({
      name: editingProfile.name, avatar: editingProfile.avatar,
      difficulty: editingProfile.difficulty,
      minutes_per_question: editingProfile.minutes_per_question,
      minutes_per_wrong: editingProfile.minutes_per_wrong,
    }).eq("id", id).select().single();
    if (data) { setProfiles(p=>p.map(x=>x.id===id?data:x)); setEditingProfile(null); }
  }

  async function deleteProfile(id) {
    await supabase.from("profiles").delete().eq("id", id);
    setProfiles(p=>p.filter(x=>x.id!==id));
  }

  async function saveParentPhone(phone) {
    await supabase.from("families").update({ parent_phone: phone }).eq("id", family.id);
    setFamily(f=>({...f, parent_phone: phone}));
  }

  // ── Quiz logic ─────────────────────────────────────────────
  const profile = activeProfile
    ? (user ? profiles : childProfiles).find(p=>p.id===activeProfile)
    : null;

  const newQuestion = useCallback(() => {
    if (!profile) return;
    setQuestion(generateQuestion(profile.difficulty));
    setInput(""); setFeedback(null);
    setTimeout(()=>inputRef.current?.focus(),50);
  }, [profile]);

  useEffect(()=>{ if(screen==="quiz") newQuestion(); },[screen]);

  useEffect(()=>{
    if(screen!=="timer")return;
    intervalRef.current=setInterval(()=>{
      setTimerSecs(s=>{
        if(s<=1){clearInterval(intervalRef.current);setScreen("home");setEarnedMins(0);return 0;}
        return s-1;
      });
    },1000);
    return()=>clearInterval(intervalRef.current);
  },[screen]);

  function selectProfile(id) {
    setActiveProfile(id);
    setEarnedMins(0); setStreak(0); setBestStreak(0);
    setQuestionsAnswered(0); setWrongAnswers(0);
    setScreen("home");
  }

  function submitAnswer() {
    if(!question||feedback)return;
    if(question.isText){
      const val=input.trim().replace(/\s+/g,""),correct=String(question.answer).trim().replace(/\s+/g,"");
      if(val===correct)handleCorrect();else handleWrong();
    } else {
      const val=parseInt(input,10);
      if(isNaN(val))return;
      if(val===question.answer)handleCorrect();else handleWrong();
    }
  }

  function handleCorrect() {
    const ns=streak+1;
    setFeedback("correct");setBurstKey(k=>k+1);
    setStreak(ns);setBestStreak(b=>Math.max(b,ns));
    setQuestionsAnswered(q=>q+1);
    setEarnedMins(m=>m+profile.minutes_per_question);
    setTimeout(newQuestion,900);
  }

  function handleWrong() {
    setFeedback("wrong");setShake(true);setWrongAnswers(w=>w+1);
    setEarnedMins(m=>Math.max(0,m-profile.minutes_per_wrong));
    setTimeout(()=>{setShake(false);setInput("");setFeedback(null);inputRef.current?.focus();},700);
  }

  function startTimer() {
    setTimerSecs(earnedMins*60);setTotalSecs(earnedMins*60);setScreen("timer");
  }

  async function goToSummary() {
    const famId = user ? family.id : childFamily.id;
    const result = {
      family_id: famId,
      profile_id: profile.id,
      profile_name: profile.name,
      profile_avatar: profile.avatar,
      difficulty: profile.difficulty,
      correct: questionsAnswered,
      wrong: wrongAnswers,
      minutes: earnedMins,
      best_streak: bestStreak,
    };
    await supabase.from("sessions").insert(result);
    setScreen("summary");
  }

  function sendWhatsApp() {
    const phone = user ? family.parent_phone : childFamily.parent_phone;
    const e = code => String.fromCodePoint(code);
    const msg = `${e(0x1F9EE)} Math For Minutes Report\n${e(0x1F466)} ${profile.name} just finished!\n\n${e(0x2705)} Correct: ${questionsAnswered}\n${e(0x274C)} Wrong: ${wrongAnswers}\n${e(0x23F1)} Minutes earned: ${earnedMins}\n${e(0x1F525)} Best streak: ${bestStreak}\n${e(0x1F4DA)} Level: ${diffLabel[profile.difficulty]}\n\nPlease unlock ${earnedMins} minute${earnedMins!==1?"s":""} of internet time ${e(0x1F64F)}`;
    const encoded = encodeURIComponent(msg);
    window.location.href = `intent://send?phone=${phone.replace(/\D/g,'')}&text=${encoded}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
  }

  const mins=Math.floor(timerSecs/60), secs=timerSecs%60;
  const activeProfiles = user ? profiles : childProfiles;
  const familyData = user ? family : childFamily;
  const filteredSessions = filterProfile==="all" ? sessions : sessions.filter(r=>r.profile_id===filterProfile);

  // ── Render ─────────────────────────────────────────────────
  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)"}}>
      <style>{CSS}</style>
      <div className="spinner"/>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)",fontFamily:"'Segoe UI',sans-serif",padding:"20px"}}>
      <style>{CSS}</style>

      {/* ── LANDING ── */}
      {!user && !childFamily && authMode==="landing" && (
        <div className="card" style={{textAlign:"center"}}>
          <div style={{fontSize:56,marginBottom:8}}>🧮</div>
          <h1 style={{fontSize:34,color:"white",margin:"0 0 8px"}}>Math For Minutes</h1>
          <p style={{color:"rgba(255,255,255,0.5)",margin:"0 0 36px",fontSize:15}}>Solve math problems → Earn internet time!</p>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <button className="btn btn-primary" onClick={()=>setAuthMode("parent")} style={{fontSize:17}}>👨‍👩‍👧 I'm a Parent</button>
            <button className="btn btn-ghost" onClick={()=>setAuthMode("child")} style={{fontSize:17}}>🧒 I'm a Child</button>
          </div>
        </div>
      )}

      {/* ── PARENT LOGIN ── */}
      {!user && !childFamily && authMode==="parent" && (
        <div className="card" style={{textAlign:"center"}}>
          <div style={{fontSize:44,marginBottom:12}}>👨‍👩‍👧</div>
          <h2 style={{color:"white",fontSize:26,margin:"0 0 8px"}}>Parent Sign In</h2>
          <p style={{color:"rgba(255,255,255,0.4)",margin:"0 0 28px",fontSize:14}}>Sign in to manage your family and view results</p>
          <button className="btn btn-google" onClick={signInWithGoogle} style={{width:"100%",marginBottom:16}}>
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Continue with Google
          </button>
          <button className="btn btn-ghost" onClick={()=>setAuthMode("landing")} style={{width:"100%",fontSize:14}}>← Back</button>
        </div>
      )}

      {/* ── CHILD LOGIN (family code) ── */}
      {!user && !childFamily && authMode==="child" && (
        <div className="card" style={{textAlign:"center"}}>
          <div style={{fontSize:44,marginBottom:12}}>🧒</div>
          <h2 style={{color:"white",fontSize:26,margin:"0 0 8px"}}>Enter Family Code</h2>
          <p style={{color:"rgba(255,255,255,0.4)",margin:"0 0 24px",fontSize:14}}>Ask your parent for the 6-letter code</p>
          <input type="text" placeholder="e.g. AB12CD" maxLength={6}
            value={familyCodeInput} onChange={e=>setFamilyCodeInput(e.target.value.toUpperCase())}
            style={{textAlign:"center",fontSize:28,letterSpacing:8,marginBottom:12,textTransform:"uppercase"}}/>
          {familyCodeError&&<div style={{color:"#FF6B6B",fontSize:13,marginBottom:10}}>{familyCodeError}</div>}
          <button className="btn btn-primary" style={{width:"100%",marginBottom:10}} onClick={async()=>{
            setFamilyCodeError("");
            const { data: fam } = await supabase.from("families").select("*").eq("family_code",familyCodeInput).single();
            if(!fam){setFamilyCodeError("Code not found — check with your parent");return;}
            await loadChildFamily(familyCodeInput);
          }}>Let's Go! →</button>
          <button className="btn btn-ghost" onClick={()=>setAuthMode("landing")} style={{width:"100%",fontSize:14}}>← Back</button>
        </div>
      )}

      {/* ── PROFILE SELECT (child or parent playing) ── */}
      {(user||childFamily) && screen==="select" && (
        <div className="card" style={{textAlign:"center"}}>
          <div style={{fontSize:52,marginBottom:8}}>🧮</div>
          <h1 style={{fontSize:32,color:"white",margin:"0 0 6px"}}>Math For Minutes</h1>
          <p style={{color:"rgba(255,255,255,0.5)",margin:"0 0 28px",fontSize:15}}>Who's playing today?</p>
          {activeProfiles.length===0 && (
            <div style={{color:"rgba(255,255,255,0.3)",marginBottom:20,fontSize:14}}>No profiles yet — add children in Parent Settings</div>
          )}
          <div style={{display:"grid",gridTemplateColumns:activeProfiles.length>1?"1fr 1fr":"1fr",gap:14,marginBottom:24}}>
            {activeProfiles.map(p=>(
              <div key={p.id} className="profile-card" onClick={()=>selectProfile(p.id)}>
                <div style={{fontSize:44,marginBottom:8}}>{p.avatar}</div>
                <div style={{color:"white",fontSize:18,fontWeight:800}}>{p.name}</div>
                <div style={{color:diffColor[p.difficulty],fontSize:12,marginTop:4,fontWeight:700}}>{diffLabel[p.difficulty]}</div>
              </div>
            ))}
          </div>
          {user && <button className="btn btn-ghost" onClick={()=>setScreen("pin")} style={{fontSize:14,padding:"10px 20px",width:"100%",marginBottom:8}}>⚙️ Parent Dashboard</button>}
          {user && <button className="btn btn-ghost" onClick={signOut} style={{fontSize:12,padding:"8px",width:"100%",opacity:0.5}}>Sign out</button>}
          {childFamily && (
            <button className="btn btn-ghost" onClick={()=>{
              localStorage.removeItem("mfm-child-code");
              setChildFamily(null);setChildProfiles([]);setAuthMode("landing");
            }} style={{fontSize:12,padding:"8px",width:"100%",opacity:0.5}}>Change family code</button>
          )}
        </div>
      )}

      {/* ── HOME ── */}
      {(user||childFamily) && screen==="home" && profile && (
        <div className="card" style={{textAlign:"center"}}>
          <button onClick={()=>setScreen("select")} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13,position:"absolute",top:20,left:20}}>← Switch</button>
          <div style={{fontSize:52,marginBottom:4}}>{profile.avatar}</div>
          <h1 style={{fontSize:32,color:"white",margin:"0 0 4px"}}>{profile.name}</h1>
          <div style={{color:diffColor[profile.difficulty],fontSize:13,fontWeight:700,marginBottom:24}}>{diffLabel[profile.difficulty]}</div>
          <div style={{background:"rgba(255,255,255,0.06)",borderRadius:18,padding:"20px",marginBottom:28}}>
            <div style={{fontSize:48,color:"#4ECDC4",fontWeight:800}}>{earnedMins}</div>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:14}}>minutes earned</div>
            <div style={{color:"rgba(255,255,255,0.3)",fontSize:13,marginTop:6}}>
              +{profile.minutes_per_question} min correct · <span style={{color:"#FF6B6B"}}>-{profile.minutes_per_wrong} min wrong</span>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <button className="btn btn-primary" onClick={()=>setScreen("quiz")}>✏️ Do Math Problems</button>
            {earnedMins>0&&<button className="btn btn-success" onClick={startTimer} style={{animation:"pulse 2s infinite"}}>🌐 Start {earnedMins} Min Internet Session</button>}
          </div>
        </div>
      )}

      {/* ── QUIZ ── */}
      {(user||childFamily) && screen==="quiz" && question && profile && (
        <div className="card" style={{textAlign:"center"}}>
          <Particles trigger={burstKey}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
            <button className="btn btn-ghost" onClick={()=>setScreen("home")} style={{fontSize:13,padding:"8px 16px"}}>← Home</button>
            <div style={{textAlign:"right"}}>
              <div style={{color:"#4ECDC4",fontSize:22,fontWeight:800}}>{earnedMins} min</div>
              {streak>1&&<div style={{color:"#FFD700",fontSize:12}}>🔥 {streak} streak!</div>}
            </div>
          </div>
          <div style={{fontSize:question?.display?.includes("\n")?34:48,color:"white",marginBottom:28,lineHeight:1.3,whiteSpace:"pre-line",fontWeight:800,animation:feedback==="correct"?"pop 0.4s ease":feedback==="wrong"?"shake 0.4s ease":"none"}}>
            {question?.display}
          </div>
          {question?.hint&&<div style={{color:"rgba(255,255,255,0.35)",fontSize:12,marginBottom:10}}>💡 {question.hint}</div>}
          <input ref={inputRef} type={question?.isText?"text":"number"} className="math-input" value={input}
            onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submitAnswer()} placeholder="?"
            style={{marginBottom:20,animation:shake?"shake 0.4s ease":"none",borderColor:feedback==="correct"?"#4ECDC4":feedback==="wrong"?"#FF6B6B":undefined}}/>
          {feedback==="correct"&&<div style={{color:"#4ECDC4",fontSize:22,marginBottom:12,fontWeight:800}}>✅ Correct! +{profile.minutes_per_question} min</div>}
          {feedback==="wrong"&&<div style={{color:"#FF6B6B",fontSize:22,marginBottom:12,fontWeight:800}}>❌ -{profile.minutes_per_wrong} min — Try again!</div>}
          {!feedback&&<button className="btn btn-primary" onClick={submitAnswer} style={{width:"100%",fontSize:20}}>Check Answer ✓</button>}
          <div style={{marginTop:20,display:"flex",justifyContent:"center",gap:8}}>
            {Array.from({length:Math.min(streak,10)}).map((_,i)=><span key={i} style={{fontSize:16}}>⭐</span>)}
          </div>
          {earnedMins>0&&<button className="btn btn-success" onClick={goToSummary} style={{width:"100%",marginTop:20,fontSize:15}}>🏁 I'm Done!</button>}
        </div>
      )}

      {/* ── SUMMARY ── */}
      {(user||childFamily) && screen==="summary" && profile && (
        <div className="card" style={{textAlign:"center"}}>
          <div style={{fontSize:52,marginBottom:8}}>🎉</div>
          <h2 style={{color:"white",fontSize:30,margin:"0 0 6px"}}>Great work, {profile.name}!</h2>
          <p style={{color:"rgba(255,255,255,0.45)",margin:"0 0 28px",fontSize:14}}>Here's what you earned this session</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:28}}>
            {[{icon:"✅",label:"Correct",value:questionsAnswered},{icon:"❌",label:"Wrong",value:wrongAnswers},{icon:"⏱️",label:"Minutes",value:earnedMins},{icon:"🔥",label:"Best streak",value:bestStreak}].map(({icon,label,value})=>(
              <div key={label} style={{background:"rgba(255,255,255,0.07)",borderRadius:16,padding:"16px 8px"}}>
                <div style={{fontSize:24}}>{icon}</div>
                <div style={{color:"white",fontSize:26,fontWeight:800}}>{value}</div>
                <div style={{color:"rgba(255,255,255,0.4)",fontSize:11}}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{background:"rgba(78,205,196,0.08)",border:"1px solid rgba(78,205,196,0.2)",borderRadius:14,padding:"12px 16px",marginBottom:16,color:"rgba(255,255,255,0.5)",fontSize:13}}>
            ✅ Results sent to parent dashboard
          </div>
          {familyData?.parent_phone&&(
            <button className="btn btn-primary" style={{width:"100%",fontSize:17,marginBottom:10}} onClick={sendWhatsApp}>
              📨 Send Results via WhatsApp
            </button>
          )}
          <button className="btn btn-ghost" onClick={()=>setScreen("home")} style={{width:"100%",fontSize:14}}>← Back to Home</button>
        </div>
      )}

      {/* ── TIMER ── */}
      {(user||childFamily) && screen==="timer" && (
        <div className="card" style={{textAlign:"center"}}>
          <h2 style={{color:"white",fontSize:28,margin:"0 0 8px"}}>🌐 Internet Time!</h2>
          <p style={{color:"rgba(255,255,255,0.4)",margin:"0 0 28px"}}>Time remaining on your session</p>
          <div style={{position:"relative",display:"inline-block",marginBottom:28}}>
            <TimerRing totalSecs={totalSecs} remainingSecs={timerSecs}/>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <div style={{fontSize:36,color:"white",lineHeight:1,fontWeight:800}}>{String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}</div>
              <div style={{color:"rgba(255,255,255,0.4)",fontSize:12}}>remaining</div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={()=>{setScreen("quiz");clearInterval(intervalRef.current);}} style={{width:"100%",marginBottom:10}}>✏️ Earn More Minutes</button>
          <button className="btn btn-ghost" onClick={()=>{clearInterval(intervalRef.current);setScreen("home");setEarnedMins(0);}} style={{width:"100%",fontSize:14}}>End Session</button>
        </div>
      )}

      {/* ── PIN (parent dashboard gate) ── */}
      {user && screen==="pin" && (
        <div className="card" style={{textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:12}}>🔐</div>
          <h2 style={{color:"white",fontSize:28,margin:"0 0 8px"}}>Parent Dashboard</h2>
          <p style={{color:"rgba(255,255,255,0.4)",margin:"0 0 24px",fontSize:14}}>Enter your PIN</p>
          <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:24}}>
            {[0,1,2,3].map(i=><div key={i} style={{width:16,height:16,borderRadius:"50%",background:pinInput.length>i?"#4ECDC4":"rgba(255,255,255,0.2)",transition:"background 0.2s"}}/>)}
          </div>
          {pinError&&<div style={{color:"#FF6B6B",fontSize:14,marginBottom:12}}>Wrong PIN, try again</div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:240,margin:"0 auto 20px"}}>
            {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
              <button key={i} className="pin-btn" disabled={d===""} style={{visibility:d===""?"hidden":"visible"}}
                onClick={()=>{if(d==="⌫")setPinInput(p=>p.slice(0,-1));else if(pinInput.length<4){const np=pinInput+d;setPinInput(np);if(np.length===4)setTimeout(()=>{if(np===parentPin){setScreen("dashboard");setPinError(false);setPinInput("");}else{setPinError(true);setPinInput("");}},200);}}}>
                {d}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost" onClick={()=>setScreen("select")} style={{width:"100%",fontSize:14}}>Cancel</button>
        </div>
      )}

      {/* ── PARENT DASHBOARD ── */}
      {user && screen==="dashboard" && (
        <div className="card" style={{maxHeight:"90vh",overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <h2 style={{color:"white",fontSize:24,margin:0}}>⚙️ Parent Dashboard</h2>
            <button className="btn btn-ghost" onClick={()=>setScreen("select")} style={{fontSize:13,padding:"8px 14px"}}>← Back</button>
          </div>

          {/* Family code */}
          <div style={{background:"rgba(78,205,196,0.08)",border:"1px solid rgba(78,205,196,0.2)",borderRadius:16,padding:16,marginBottom:20,textAlign:"center"}}>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:12,marginBottom:6}}>FAMILY CODE — share with your children</div>
            <div style={{color:"#4ECDC4",fontSize:36,fontWeight:800,letterSpacing:8}}>{family?.family_code}</div>
          </div>

          {/* Results */}
          <div style={{marginBottom:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{color:"white",fontWeight:800,fontSize:15}}>📊 Session Results</div>
              <select value={filterProfile} onChange={e=>setFilterProfile(e.target.value)} style={{width:"auto",padding:"6px 10px",fontSize:13}}>
                <option value="all">All children</option>
                {profiles.map(p=><option key={p.id} value={p.id}>{p.avatar} {p.name}</option>)}
              </select>
            </div>
            {filteredSessions.length===0 ? (
              <div style={{color:"rgba(255,255,255,0.3)",fontSize:13,textAlign:"center",padding:"12px 0"}}>No sessions yet</div>
            ) : filteredSessions.slice(0,10).map((r,i)=>(
              <div key={i} className="result-row">
                <div style={{fontSize:28}}>{r.profile_avatar||"🦁"}</div>
                <div style={{flex:1}}>
                  <div style={{color:"white",fontWeight:700,fontSize:14}}>{r.profile_name} · <span style={{color:diffColor[r.difficulty],fontSize:12}}>{diffLabel[r.difficulty]}</span></div>
                  <div style={{color:"rgba(255,255,255,0.4)",fontSize:12}}>{formatDate(r.created_at)}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{color:"#4ECDC4",fontWeight:800,fontSize:15}}>{r.minutes} min</div>
                  <div style={{color:"rgba(255,255,255,0.4)",fontSize:12}}>✅{r.correct} ❌{r.wrong} 🔥{r.best_streak}</div>
                </div>
              </div>
            ))}
          </div>

          {/* WhatsApp number */}
          <div style={{marginBottom:20}}>
            <label>WhatsApp number</label>
            <div style={{display:"flex",gap:8}}>
              <input type="text" placeholder="+972501234567" defaultValue={family?.parent_phone||""} id="phone-input"/>
              <button className="btn btn-primary" style={{padding:"12px 16px",fontSize:14}} onClick={()=>saveParentPhone(document.getElementById("phone-input").value)}>Save</button>
            </div>
          </div>

          {/* PIN */}
          <div style={{marginBottom:24}}>
            <label>Change PIN</label>
            <input type="password" maxLength={4} placeholder="New 4-digit PIN" id="pin-input"
              onChange={e=>{const v=e.target.value.replace(/\D/g,"").slice(0,4);e.target.value=v;if(v.length===4){setParentPin(v);localStorage.setItem("mfm-pin",v);}}}/>
          </div>

          {/* Child profiles */}
          <div style={{borderTop:"1px solid rgba(255,255,255,0.1)",paddingTop:20}}>
            <label style={{marginBottom:16}}>Child Profiles</label>
            {profiles.map(p=>(
              <div key={p.id} style={{background:"rgba(255,255,255,0.05)",borderRadius:16,padding:16,marginBottom:12}}>
                {editingProfile?.id===p.id ? (
                  <>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                      <div><label>Name</label><input type="text" value={editingProfile.name} onChange={e=>setEditingProfile(x=>({...x,name:e.target.value}))}/></div>
                      <div><label>Avatar</label>
                        <select value={editingProfile.avatar} onChange={e=>setEditingProfile(x=>({...x,avatar:e.target.value}))}>
                          {AVATARS.map(a=><option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      <div><label>Difficulty</label>
                        <select value={editingProfile.difficulty} onChange={e=>setEditingProfile(x=>({...x,difficulty:e.target.value}))}>
                          <option value="easy">⭐ Easy</option>
                          <option value="medium">⭐⭐ Medium</option>
                          <option value="hard">⭐⭐⭐ Hard</option>
                          <option value="fractions">⭐⭐⭐⭐ Fractions</option>
                          <option value="orderofops">⭐⭐⭐⭐⭐ Order of Ops</option>
                          <option value="percent">⭐⭐⭐⭐⭐⭐ Percentages</option>
                        </select>
                      </div>
                      <div><label>Mins/correct</label><input type="number" min="1" max="30" value={editingProfile.minutes_per_question} onChange={e=>setEditingProfile(x=>({...x,minutes_per_question:Math.max(1,parseInt(e.target.value)||1)}))}/></div>
                      <div><label>Mins/wrong</label><input type="number" min="0" max="30" value={editingProfile.minutes_per_wrong} onChange={e=>setEditingProfile(x=>({...x,minutes_per_wrong:Math.max(0,parseInt(e.target.value)||0)}))}/></div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button className="btn btn-success" onClick={()=>saveProfile(p.id)} style={{flex:1,fontSize:14,padding:"10px"}}>Save</button>
                      <button className="btn btn-ghost" onClick={()=>setEditingProfile(null)} style={{flex:1,fontSize:14,padding:"10px"}}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{fontSize:32}}>{p.avatar}</div>
                    <div style={{flex:1}}>
                      <div style={{color:"white",fontWeight:800}}>{p.name}</div>
                      <div style={{color:diffColor[p.difficulty],fontSize:12}}>{diffLabel[p.difficulty]} · +{p.minutes_per_question}/-{p.minutes_per_wrong} min</div>
                    </div>
                    <button className="btn btn-ghost" onClick={()=>setEditingProfile({...p})} style={{fontSize:13,padding:"8px 12px"}}>Edit</button>
                    <button className="btn btn-danger" onClick={()=>deleteProfile(p.id)} style={{fontSize:13,padding:"8px 12px"}}>✕</button>
                  </div>
                )}
              </div>
            ))}

            {/* Add new profile */}
            <div style={{background:"rgba(255,255,255,0.03)",borderRadius:16,padding:16,border:"1px dashed rgba(255,255,255,0.15)"}}>
              <div style={{color:"rgba(255,255,255,0.5)",fontSize:13,marginBottom:12,fontWeight:700}}>+ Add Child</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div><label>Name</label><input type="text" placeholder="Child's name" value={newProfileName} onChange={e=>setNewProfileName(e.target.value)}/></div>
                <div><label>Avatar</label>
                  <select value={newProfileAvatar} onChange={e=>setNewProfileAvatar(e.target.value)}>
                    {AVATARS.map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div><label>Difficulty</label>
                  <select value={newProfileDiff} onChange={e=>setNewProfileDiff(e.target.value)}>
                    <option value="easy">⭐ Easy</option>
                    <option value="medium">⭐⭐ Medium</option>
                    <option value="hard">⭐⭐⭐ Hard</option>
                    <option value="fractions">⭐⭐⭐⭐ Fractions</option>
                    <option value="orderofops">⭐⭐⭐⭐⭐ Order of Ops</option>
                    <option value="percent">⭐⭐⭐⭐⭐⭐ Percentages</option>
                  </select>
                </div>
                <div><label>Mins/correct</label><input type="number" min="1" max="30" value={newProfileMPQ} onChange={e=>setNewProfileMPQ(Math.max(1,parseInt(e.target.value)||1))}/></div>
                <div><label>Mins/wrong</label><input type="number" min="0" max="30" value={newProfileMPW} onChange={e=>setNewProfileMPW(Math.max(0,parseInt(e.target.value)||0))}/></div>
              </div>
              <button className="btn btn-primary" onClick={addProfile} style={{width:"100%",fontSize:15}}>Add Child</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
