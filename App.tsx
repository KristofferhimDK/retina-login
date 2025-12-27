
import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, User, Cpu, Radio, AlertCircle, CheckCircle2, Target, Scan, Camera, Activity, Eye, ShieldAlert, ChevronRight, UserPlus, RefreshCcw } from 'lucide-react';
import { getSecurityAnalysis } from './services/geminiService';
import { AISecurityReport, LoginState, EnrollmentData } from './types';

const ParticleBackground: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
    <div className="absolute inset-0 bg-[#020617]" />
    <div className="grid-overlay absolute inset-0 bg-[linear-gradient(to_right,#0ea5e908_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e908_1px,transparent_1px)] bg-[size:32px_32px]" />
    <div className="absolute top-0 left-0 w-full h-full opacity-30">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
    </div>
  </div>
);

const App: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginState, setLoginState] = useState<LoginState>(LoginState.IDLE);
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [enrollStep, setEnrollStep] = useState<'FRONT' | 'LEFT' | 'RIGHT'>('FRONT');
  const [subState, setSubState] = useState('IDLE');
  const [report, setReport] = useState<AISecurityReport | null>(null);
  const [progress, setProgress] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (loginState === LoginState.ENROLLING || loginState === LoginState.SCANNING || loginState === LoginState.VERIFYING) {
      navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
        .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
        .catch(err => console.error("Camera error:", err));
    } else {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
    }
  }, [loginState]);

  const captureFrame = (): string | undefined => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = 1280; canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.9);
      }
    }
    return undefined;
  };

  const handleEnroll = () => {
    const frame = captureFrame();
    if (!frame) return;

    if (enrollStep === 'FRONT') {
      setEnrollment(prev => ({ ...(prev as any), frontal: frame }));
      setEnrollStep('LEFT');
    } else if (enrollStep === 'LEFT') {
      setEnrollment(prev => ({ ...(prev as any), left: frame }));
      setEnrollStep('RIGHT');
    } else {
      setEnrollment(prev => ({ ...(prev as any), right: frame }));
      setLoginState(LoginState.IDLE);
      setEnrollStep('FRONT');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !enrollment) return;

    setLoginState(LoginState.SCANNING);
    setProgress(0);
    setSubState('MAPPING_FACE');
    
    // Simulate mapping stages
    setTimeout(() => {
      setProgress(30);
      setSubState('COLLECTING_POINTS');
      
      setTimeout(() => {
        setSubState('CAPTURING_BIOMETRICS');
        setProgress(60);
        const scanFrame = captureFrame();
        
        setTimeout(async () => {
          setSubState('AI_COMPARISON');
          setProgress(80);
          setLoginState(LoginState.VERIFYING);
          
          if (scanFrame) {
            const analysis = await getSecurityAnalysis(username, scanFrame, enrollment);
            setReport(analysis);
            setProgress(100);
            if (analysis.status === 'AUTHORIZED') setLoginState(LoginState.SUCCESS);
            else {
              setLoginState(LoginState.ERROR);
              setSubState('IDENTITY_DENIED');
            }
          }
        }, 1000);
      }, 1500);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden font-['Orbitron'] bg-[#020617] text-white">
      <ParticleBackground />
      <canvas ref={canvasRef} className="hidden" />

      <div className={`relative z-10 w-full max-w-lg transition-all duration-1000 ${loginState === LoginState.SUCCESS ? 'scale-110 opacity-0' : 'scale-100'}`}>
        <div className="bg-[#0a1120]/90 backdrop-blur-3xl border border-white/10 rounded-2xl p-8 shadow-2xl overflow-hidden">
          
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 mb-4 shadow-lg shadow-cyan-500/5">
              <Shield className="w-10 h-10 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-black tracking-[0.2em] mb-1">AURA SECURE</h1>
            <p className="text-[9px] font-mono text-cyan-500/50 uppercase tracking-widest">Advanced Neural Facial Recognition Interface</p>
          </div>

          {loginState === LoginState.IDLE || loginState === LoginState.ERROR ? (
            <div className="space-y-6">
              {!enrollment ? (
                <div className="p-6 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-center animate-fadeIn">
                  <UserPlus className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                  <h2 className="text-sm font-bold tracking-widest mb-2">BIOMETRIC ENROLLMENT REQUIRED</h2>
                  <p className="text-[10px] text-cyan-400/60 font-mono mb-6">Initialize your biological profile to access the terminal.</p>
                  <button 
                    onClick={() => setLoginState(LoginState.ENROLLING)}
                    className="w-full py-3 bg-cyan-500 text-slate-900 font-bold rounded-lg hover:bg-cyan-400 transition-all tracking-widest text-xs"
                  >
                    BEGIN ENROLLMENT
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-mono text-emerald-400 uppercase">Profile Enrolled</span>
                    </div>
                    <button type="button" onClick={() => setEnrollment(null)} className="text-[8px] font-mono text-white/30 hover:text-white uppercase underline">Re-Enroll</button>
                  </div>

                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/40" />
                    <input
                      type="text" value={username} onChange={e => setUsername(e.target.value)}
                      placeholder="OPERATIVE_ID"
                      className="w-full bg-black/50 border border-white/5 rounded-xl py-4 px-12 text-xs font-mono tracking-widest focus:border-cyan-500/40 outline-none"
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/40" />
                    <input
                      type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="NEURAL_PASS"
                      className="w-full bg-black/50 border border-white/5 rounded-xl py-4 px-12 text-xs font-mono tracking-widest focus:border-cyan-500/40 outline-none"
                    />
                  </div>

                  {loginState === LoginState.ERROR && report && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center animate-shake">
                      <ShieldAlert className="w-6 h-6 text-red-500 mx-auto mb-2" />
                      <p className="text-[10px] font-mono text-red-400 leading-relaxed italic">{report.message}</p>
                    </div>
                  )}

                  <button type="submit" className="w-full py-4 bg-cyan-500 text-slate-900 font-black rounded-xl hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 tracking-[0.3em] uppercase text-xs">
                    IDENTIFY & LOGIN
                  </button>
                </form>
              )}
            </div>
          ) : loginState === LoginState.ENROLLING ? (
            <div className="space-y-6">
              <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden border border-cyan-500/30 group">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-cyan-400/30 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
                  <div className="absolute w-32 h-32 border border-cyan-400 rounded-3xl" />
                </div>
                <div className="absolute top-4 left-4 text-[9px] font-mono text-cyan-400 uppercase tracking-widest bg-black/60 px-2 py-1 rounded">
                  {enrollStep} PROFILE
                </div>
              </div>

              <div className="text-center space-y-4">
                <h3 className="text-sm font-bold tracking-widest">
                  {enrollStep === 'FRONT' ? "LOOK STRAIGHT INTO CAMERA" : enrollStep === 'LEFT' ? "TURN SLIGHTLY LEFT" : "TURN SLIGHTLY RIGHT"}
                </h3>
                <div className="flex justify-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${enrollStep === 'FRONT' ? 'bg-cyan-400 animate-pulse' : 'bg-white/10'}`} />
                  <div className={`w-3 h-3 rounded-full ${enrollStep === 'LEFT' ? 'bg-cyan-400 animate-pulse' : 'bg-white/10'}`} />
                  <div className={`w-3 h-3 rounded-full ${enrollStep === 'RIGHT' ? 'bg-cyan-400 animate-pulse' : 'bg-white/10'}`} />
                </div>
                <button onClick={handleEnroll} className="w-full py-3 border border-cyan-400 text-cyan-400 font-bold rounded-lg hover:bg-cyan-400/10 transition-all tracking-[0.2em] text-[10px] uppercase">
                  CAPTURE BIOMETRIC
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden border border-cyan-500/40">
                <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover transition-all duration-1000 ${subState === 'AI_COMPARISON' ? 'grayscale-0' : 'grayscale brightness-75'}`} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_50%,rgba(0,0,0,0.8)_100%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-1 bg-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-[scan_3s_infinite_linear]" />
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-black/80 border border-cyan-500/20 rounded-full text-[9px] font-mono text-cyan-400 animate-pulse">
                  {subState}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                  <span>BIO-MESH COMPARISON</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-center text-[10px] font-mono text-white/40 tracking-tighter italic animate-pulse">
                  Comparing current scan with enrolled profile {username.toUpperCase()}...
                </p>

                {report && (
                  <div className={`p-4 rounded-xl border backdrop-blur-md animate-fadeIn ${report.status === 'AUTHORIZED' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] text-white/40 font-mono">NEURAL_REPORT</span>
                      <span className={`text-[10px] font-bold ${report.status === 'AUTHORIZED' ? 'text-emerald-400' : 'text-red-400'}`}>{report.status}</span>
                    </div>
                    <p className="text-[11px] font-mono text-white/80 leading-relaxed tracking-tight italic">"{report.message}"</p>
                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-[10px] font-mono font-bold">
                      <span className="text-cyan-400">MATCH: {report.biometricMatch}%</span>
                      <span className="text-white/40 uppercase">AURA-v9</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {loginState === LoginState.SUCCESS && (
        <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center animate-fadeIn p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.1)_0%,_transparent_70%)]" />
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-emerald-500 rounded-full blur-[100px] opacity-30 animate-pulse" />
            <div className="relative z-10 p-10 rounded-full border border-emerald-500/30 bg-emerald-500/5 animate-scaleUp">
              <CheckCircle2 className="w-32 h-32 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-4xl font-black tracking-[0.5em] animate-slideUp">ACCESS GRANTED</h2>
          <p className="text-emerald-400 font-mono mt-8 opacity-70 uppercase tracking-[0.2em] text-sm italic">Terminal 0xFD Open for Operative {username.toUpperCase()}</p>
          <button onClick={() => { setLoginState(LoginState.IDLE); setReport(null); }} className="mt-16 text-[10px] font-black tracking-[0.3em] uppercase border border-emerald-400/20 px-10 py-4 rounded-xl hover:bg-emerald-400/10 transition-all">Sign Out</button>
        </div>
      )}

      <style>{`
        @keyframes scan { 0% { transform: translateY(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(256px); opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        .animate-scaleUp { animation: scaleUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-shake { animation: shake 0.2s ease-in-out; }
      `}</style>
    </div>
  );
};

export default App;
