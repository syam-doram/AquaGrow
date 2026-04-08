import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Camera, 
  X, 
  AlertTriangle, 
  Sparkles, 
  Waves,
  ChevronLeft,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../../context/DataContext';
import { Header } from '../../components/Header';
import { cn } from '../../utils/cn';
import type { Translations } from '../../translations';
import { User } from '../../types';
import { analyzeShrimpHealth } from '../../services/geminiService';
import { DISEASE_SOPS, DiseaseSOP } from '../../data/diseaseSOPs';

export const DiseaseDetection = ({ user, t }: { user: User, t: Translations }) => {
  const { isPro, addMedicineLog, ponds, apiFetch } = useData();
  const navigate = useNavigate();
  const [step, setStep] = React.useState<'intro' | 'upload' | 'scanning' | 'result' | 'manual'>('intro');
  const [image, setImage] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState<any>(null);
  const [manualDiagnosedSOP, setManualDiagnosedSOP] = React.useState<DiseaseSOP | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = React.useState<string[]>([]);
  const [loadingMessage, setLoadingMessage] = React.useState('Initializing Analysis...');
  const [isLogging, setIsLogging] = React.useState(false);
  const [isLogged, setIsLogged] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = React.useState(false);
  const [stream, setStream] = React.useState<MediaStream | null>(null);

  const startCamera = async () => {
    if (!isPro) {
      alert("AI Agent feature requires a Pro Subscription. Please upgrade in Settings.");
      return;
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImage(dataUrl);
        stopCamera();
        runAnalysis(dataUrl);
      }
    }
  };

  React.useEffect(() => {
    if (step === 'scanning') {
      const messages = [
        'Uploading Specimen...',
        'Processing Pixels...',
        'Analyzing Health Markers...',
        'Identifying Pathogens...',
        'Running Diagnostic Engine...',
        'Generating Action Plan...'
      ];
      let i = 0;
      const interval = setInterval(() => {
        setLoadingMessage(messages[i % messages.length]);
        i++;
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [step]);

  const runAnalysis = async (imgData?: string) => {
    const dataToAnalyze = imgData || image;
    if (!dataToAnalyze) return;

    if (!isPro) {
      alert("AI Agent feature requires a Pro Subscription. Please upgrade.");
      return;
    }

    setStep('scanning');
    setLoadingMessage('Initializing Analysis...');
    try {
      const result = await analyzeShrimpHealth(dataToAnalyze, user.language || 'English');
      setAnalysis(result);
      
      // Auto-map AI results to detailed SOP if possible
      const lowerDisease = result.disease.toLowerCase();
      if (lowerDisease.includes('feces') || lowerDisease.includes('gut') || lowerDisease.includes('wfd') || lowerDisease.includes('wgd')) {
        setManualDiagnosedSOP(DISEASE_SOPS.white_gut);
      } else if (lowerDisease.includes('wssv') || lowerDisease.includes('white spot')) {
        setManualDiagnosedSOP(DISEASE_SOPS.wssv);
      }
      
      setStep('result');
    } catch (error: any) {
      console.error("Analysis failed:", error);
      setAnalysis({
        disease: t.analysisError || 'Analysis Error',
        confidence: 0,
        severity: 'N/A',
        reasoning: 'System was unable to process visual markers clearly.',
        action: error.message || 'Please try again with a clearer photo.'
      });
      setStep('result');
    }
  };

  const handleManualDiagnosis = () => {
    // Basic Rule: If WGD symptoms selected, show White Gut SOP
    const wgdKeywords = ['white gut', 'pale gut', 'white string', 'fecal strings', 'empty gut'];
    const hasWGD = selectedSymptoms.some(s => wgdKeywords.some(k => s.toLowerCase().includes(k)));
    
    if (hasWGD) {
      setManualDiagnosedSOP(DISEASE_SOPS.white_gut);
    } else if (selectedSymptoms.some(s => s.toLowerCase().includes('white spot'))) {
      setManualDiagnosedSOP(DISEASE_SOPS.wssv);
    } else {
      // Default to general protocol or a simplified recommendation
      setManualDiagnosedSOP(DISEASE_SOPS.white_gut); // Fallback for demo
    }
    setStep('result');
  };

  const renderDetailedSOP = (sop: DiseaseSOP) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Immediate Action */}
      <div className="bg-red-50 border border-red-100 rounded-[2rem] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white scale-90"><AlertTriangle size={14} /></div>
          <h4 className="text-red-900 font-black text-xs uppercase tracking-widest">Immediate Actions (Day 1)</h4>
        </div>
        <ul className="space-y-2">
          {sop.immediateActions.map((action, i) => (
            <li key={i} className="flex gap-2 text-[11px] font-bold text-red-800">
              <span className="text-red-400">🚨</span> {action}
            </li>
          ))}
        </ul>
      </div>

      {/* 2. Medicine Protocol */}
      <div className="bg-card border border-card-border rounded-[2rem] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white scale-90"><Plus size={14} /></div>
          <h4 className="text-ink font-black text-xs uppercase tracking-widest">Medicine Protocol</h4>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-[#0D523C] text-[9px] font-black uppercase tracking-widest mb-2 px-2 py-0.5 bg-emerald-50 rounded-full inline-block">Water Treatment</p>
            <ul className="space-y-1.5 ml-1">
              {sop.protocol.water.map((m, i) => <li key={i} className="text-[10px] font-bold text-ink/60 flex gap-2"><span>•</span> {m}</li>)}
            </ul>
          </div>
          <div className="pt-2">
            <p className="text-blue-600 text-[9px] font-black uppercase tracking-widest mb-2 px-2 py-0.5 bg-blue-50 rounded-full inline-block">Feed Medication (5 Days)</p>
            <ul className="space-y-1.5 ml-1">
              {sop.protocol.feed.map((m, i) => <li key={i} className="text-[10px] font-bold text-ink/60 flex gap-2"><span>•</span> {m}</li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Feed Management Plan */}
      <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#C78200] rounded-full flex items-center justify-center text-white scale-90"><Waves size={14} /></div>
            <h4 className="text-amber-900 font-black text-xs uppercase tracking-widest">Feed Recovery Plan</h4>
          </div>
          <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">5-Day Ramp-up</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
           {sop.feedManagement.map((f, i) => (
             <div key={i} className="bg-card/60 rounded-xl p-2 text-center border border-amber-200/50">
                <p className="text-[7px] font-black text-amber-800 uppercase mb-1">Day {f.day}</p>
                <p className="text-[10px] font-black text-amber-900">{f.quantity}</p>
             </div>
           ))}
        </div>
      </div>

      {/* 4. Water Quality & Recovery */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50/50 border border-blue-100 rounded-[2rem] p-5">
           <h4 className="text-blue-900 font-black text-[9px] uppercase tracking-widest mb-3">Water Quality</h4>
           {sop.waterQuality.map((wq, i) => (
             <div key={i} className="flex justify-between items-baseline mb-1">
               <span className="text-[8px] font-bold text-blue-800/60 uppercase">{wq.parameter}</span>
               <span className="text-[10px] font-black text-blue-900">{wq.value}</span>
             </div>
           ))}
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-[2rem] p-5">
           <h4 className="text-emerald-900 font-black text-[9px] uppercase tracking-widest mb-3">Recovery Signs</h4>
           <ul className="space-y-1">
             {sop.recoverySigns.slice(0, 3).map((s, i) => <li key={i} className="text-[9px] font-bold text-emerald-800 flex gap-1"><span>✔</span> {s}</li>)}
           </ul>
        </div>
      </div>

       {/* 5. Avoid These Mistakes */}
       <div className="bg-card/50 border border-slate-200 rounded-[2rem] p-6">
        <h4 className="text-slate-900 font-black text-[9px] uppercase tracking-widest mb-4 flex items-center gap-2">
          <X size={12} className="text-red-500" /> Avoid These Mistakes
        </h4>
        <div className="flex flex-wrap gap-2">
          {sop.mistakes.map((m, i) => (
            <span key={i} className="px-3 py-1.5 bg-red-500/10 text-red-600 rounded-xl text-[9px] font-black border border-red-500/20">
               🚫 {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPro) {
      alert("AI Agent feature requires a Pro Subscription.");
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImage(dataUrl);
        runAnalysis(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isPro) {
    return (
      <div className="min-h-screen bg-paper">
        <Header title={t.aiDisease} showBack />
        <div className="p-6 pt-24">
          <div className="mt-8 relative overflow-hidden rounded-[3rem] bg-card p-10 text-center shadow-2xl border border-primary/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 border border-primary/10">
                <Sparkles size={32} className="text-primary" />
              </div>
              <h2 className="text-2xl font-black text-ink tracking-tighter mb-4">Smart <span className="text-primary">Diagnostic AI</span></h2>
              <p className="text-ink/40 text-xs font-bold leading-relaxed mb-10 px-6 uppercase tracking-widest leading-relaxed">“Like X-ray vision for your pond — powered by AI insights.” Deep AI scanning for early detection and decision support.</p>
              <button 
                onClick={() => navigate('/subscription')}
                className="w-full bg-[#C78200] text-white font-black py-5 rounded-[1.8rem] shadow-xl shadow-[#C78200]/20 uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all"
              >
                Unlock AI Diagnostics
              </button>
            </div>
          </div>
          
          <div className="mt-8 px-4 space-y-6">
             <div className="flex gap-4 items-center">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-500">
                  <CheckCircle2 size={18} />
                </div>
                <p className="text-ink/60 text-[10px] font-black uppercase tracking-widest leading-normal">Deep AI Scanning for EHP, WFD & Vibriosis</p>
             </div>
             <div className="flex gap-4 items-center">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-500">
                  <CheckCircle2 size={18} />
                </div>
                <p className="text-ink/60 text-[10px] font-black uppercase tracking-widest leading-normal">Bio-Security Protocols for Your Region</p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Header title={t.aiDisease} showBack />
      
      <main className="flex-1 mt-20 p-6">
        {step === 'intro' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-12">
            <div className="text-center space-y-2 mb-10 pt-4">
              <h2 className="text-2xl font-black text-ink tracking-tighter uppercase italic">Preparation <span className="text-[#C78200]">Checklist</span></h2>
              <div className="h-1 w-12 bg-[#C78200] mx-auto rounded-full" />
            </div>

            <div className="space-y-4">
              {[
                { title: 'Clean Background', desc: 'Place shrimp on a clean, solid white or blue tray.', icon: <Waves size={18} /> },
                { title: 'Natural Lighting', desc: 'Avoid harsh flashes or dark shadows on the shell.', icon: <Sparkles size={18} /> },
                { title: 'Gut Line Focus', desc: 'Ensure the back of the shrimp is centered and clear.', icon: <ShieldCheck size={18} /> },
                { title: 'Dry Surface', desc: 'Wipe excess water to prevent glare from the surface.', icon: <CheckCircle2 size={18} /> }
              ].map((item, idx) => (
                <div key={idx} className="bg-card p-6 rounded-[2.5rem] border border-card-border shadow-sm flex items-start gap-4 active:scale-[0.98] transition-all">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-[#C78200] shrink-0 border border-amber-100/50">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-ink uppercase tracking-wider mb-1 mt-0.5">{item.title}</h4>
                    <p className="text-[9px] font-bold text-ink/40 uppercase tracking-widest leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setStep('upload')}
              className="w-full bg-[#0D523C] text-white font-black py-6 rounded-[1.8rem] shadow-2xl shadow-emerald-500/10 uppercase tracking-[0.3em] text-[11px] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Start Diagnostic AI <Plus size={20} />
            </button>
            <button 
              onClick={() => setStep('manual')}
              className="w-full text-ink/40 font-black py-2 uppercase tracking-[0.3em] text-[8px] active:scale-95 transition-all"
            >
              Skip to Manual Diagnosis
            </button>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-6">
            <div className="bg-card p-8 rounded-[3rem] border-2 border-dashed border-[#4A2C2A]/10 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 text-[#C78200]">
                <Camera size={32} />
              </div>
              <h2 className="text-xl font-black text-ink tracking-tight mb-2">{t.scanShrimp || 'Scan Shrimp'}</h2>
              <p className="text-ink/40 text-xs font-bold uppercase tracking-widest leading-relaxed px-4">
                {t.uploadPhotoDesc || 'Upload a clear photo for high-accuracy disease detection'}
              </p>
              
              <div className="w-full mt-10 space-y-4">
                <button 
                  onClick={startCamera}
                  className="w-full bg-[#C78200] text-white font-black py-5 rounded-3xl shadow-xl shadow-[#C78200]/20 uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all"
                >
                  {t.openCamera || 'Open Camera'}
                </button>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <button className="w-full bg-card border border-card-border text-ink/60 font-black py-5 rounded-3xl uppercase tracking-[0.2em] text-[10px]">
                    {t.uploadPhoto || 'Upload from Gallery'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#4A2C2A] p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer" onClick={() => setStep('manual')}>
               <div className="absolute inset-0 bg-gradient-to-br from-[#C78200]/20 to-transparent" />
               <div className="relative z-10 flex items-center justify-between">
                  <div className="space-y-1">
                     <h3 className="text-lg font-black tracking-tighter">Manual Diagnostic</h3>
                     <p className="text-white/40 text-[9px] font-black uppercase tracking-widest leading-relaxed">No photo? Select symptoms manually</p>
                  </div>
                  <div className="w-12 h-12 bg-card/10 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-[#C78200] transition-colors">
                     <AlertTriangle size={20} className="text-white/60 group-hover:text-white" />
                  </div>
               </div>
            </div>

            <div className="bg-amber-50 p-6 rounded-[2rem] border border-[#C78200]/10">
              <div className="flex gap-4">
                <AlertTriangle className="text-[#C78200] shrink-0" size={20} />
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-[#C78200] uppercase tracking-widest">{t.photoInstructions || 'Photo Instructions'}</h4>
                  <p className="text-[9px] font-bold text-ink/40 leading-relaxed uppercase tracking-widest">Clear Lighting • No Glare • Centered Subject</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'manual' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div className="flex items-center justify-between mb-2">
                 <button onClick={() => setStep('upload')} className="flex items-center gap-2 text-ink/40 text-[10px] font-black uppercase tracking-widest">
                    <ChevronLeft size={16} /> Back
                 </button>
                 <span className="text-[#C78200] text-[10px] font-black uppercase tracking-[0.3em]">Symptom Checker</span>
              </div>

              <div className="space-y-6">
                 <h2 className="text-2xl font-black text-ink tracking-tighter">What symptoms do you <span className="text-[#C78200]">observe?</span></h2>
                 
                 <div className="grid grid-cols-1 gap-3">
                    {[
                      'White or Pale Gut visible',
                      'White Fecal Strings in water',
                      'Uneaten feed in trays',
                      'Sudden reduction in feed',
                      'White spots on carapace',
                      'Sluggish movement / Gathering at edges',
                      'Reddish body coloration',
                      'Opaque or White muscles'
                    ].map((symp) => (
                      <button 
                        key={symp}
                        onClick={() => setSelectedSymptoms(prev => prev.includes(symp) ? prev.filter(s => s !== symp) : [...prev, symp])}
                        className={cn(
                          "p-5 rounded-2xl border text-left flex items-center justify-between transition-all duration-300",
                          selectedSymptoms.includes(symp) 
                            ? "bg-[#C78200] border-[#C78200] text-white shadow-lg" 
                            : "bg-card border-card-border text-ink/60"
                        )}
                      >
                         <span className="text-[12px] font-black tracking-tight">{symp}</span>
                         <div className={cn(
                           "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                           selectedSymptoms.includes(symp) ? "bg-card border-white text-[#C78200]" : "border-card-border text-transparent"
                         )}>
                            <CheckCircle2 size={14} />
                         </div>
                      </button>
                    ))}
                 </div>

                 <button 
                    disabled={selectedSymptoms.length === 0}
                    onClick={handleManualDiagnosis}
                    className={cn(
                       "w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-xl transition-all flex items-center justify-center gap-3",
                       selectedSymptoms.length > 0 
                         ? "bg-[#0D523C] text-white shadow-emerald-500/10 active:scale-95" 
                         : "bg-card border-card-border text-ink/20 cursor-not-allowed"
                    )}
                 >
                    Analyze Symptoms <Sparkles size={18} />
                 </button>
              </div>
           </div>
        )}

        {step === 'scanning' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-32 h-32 relative mb-8">
              <div 
                className="absolute inset-0 border-4 border-[#C78200]/10 border-t-[#C78200] rounded-full animate-spin-slow"
              />
              <motion.div
                initial={{ opacity: 0.5, scale: 0.8 }}
                animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-[#C78200]/5 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={40} className="text-[#C78200]" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-ink tracking-tighter mb-2">{loadingMessage}</h2>
            <p className="text-ink/40 text-[10px] font-black uppercase tracking-[0.4em]">{t.scanningHealthMarkers || 'Checking bio-markers'}</p>
          </div>
        )}

        {step === 'result' && analysis && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6 pb-20">
            {/* Header & Photo (if available) */}
            <div className="flex items-center justify-between mb-2">
                 <button onClick={() => { setStep('upload'); setManualDiagnosedSOP(null); setSelectedSymptoms([]); }} className="flex items-center gap-2 text-ink/40 text-[10px] font-black uppercase tracking-widest">
                    <ChevronLeft size={16} /> New Analysis
                 </button>
                 <span className="text-[#C78200] text-[10px] font-black uppercase tracking-[0.3em]">Diagnostic Complete</span>
            </div>

            {image && (
              <div className="relative overflow-hidden rounded-[2.5rem] bg-black/5 aspect-video shadow-sm border border-card-border group">
                 <img src={image} alt="Specimen" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 pointer-events-none">
                    <motion.div animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 4, repeat: Infinity }} className="absolute left-0 right-0 h-0.5 bg-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-10" />
                 </div>
              </div>
            )}

            <div className={cn(
               "p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden",
               analysis.severity === 'Critical' || analysis.severity === 'High' ? 'bg-red-500 shadow-red-500/20' : 
               analysis.severity === 'Warning' || analysis.severity === 'Medium' ? 'bg-[#C78200] shadow-amber-500/20' : 
               'bg-emerald-500 shadow-emerald-500/20'
            )}>
              <div className="absolute top-4 right-8 z-20">
                   <div className="bg-card/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 flex items-center gap-2">
                      <ShieldCheck size={14} className="text-white" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Diagnostic Verdict</span>
                   </div>
              </div>
              <div className="relative z-10 pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Suggested Condition</p>
                <h2 className="text-3xl font-black tracking-tighter mb-4">{manualDiagnosedSOP ? manualDiagnosedSOP.name : analysis.disease}</h2>
                
                {analysis.reasoning && (
                  <p className="text-[10px] font-bold text-white/80 italic mb-6 border-l-2 border-white/20 pl-3 leading-relaxed">
                    “{analysis.reasoning}”
                  </p>
                )}

                <div className="flex gap-6">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Severity</p>
                    <p className="text-xl font-black">{analysis.severity}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Protocol Type</p>
                    <p className="text-xl font-black">SOP-Aligned</p>
                  </div>
                </div>
              </div>
            </div>

            {manualDiagnosedSOP ? renderDetailedSOP(manualDiagnosedSOP) : (
                <div className="bg-card p-8 rounded-[2.5rem] border border-card-border shadow-sm">
                    <h4 className="text-[10px] font-black text-ink/30 uppercase tracking-[0.3em] mb-4">Recommended Actions</h4>
                    <p className="text-ink text-xs font-black leading-relaxed mb-6">{analysis.action}</p>
                    <button className="w-full py-4 bg-[#C78200] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Apply Treatment Log</button>
                </div>
            )}
            
            <p className="text-center text-ink/20 text-[8px] font-black uppercase tracking-[0.3em] px-10 leading-relaxed">
              *AI and manual suggestions are based on standard aquaculture protocols. Always consult a local expert for severe cases.
            </p>
          </div>
        )}
      </main>

      <AnimatePresence>
        {isCameraActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col"
          >
            <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
            <div className="absolute bottom-12 left-0 right-0 px-12 flex justify-between items-center">
              <button onClick={stopCamera} className="w-14 h-14 bg-card/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white"><X size={24} /></button>
              <button onClick={capturePhoto} className="w-20 h-20 bg-card rounded-full p-2"><div className="w-full h-full border-4 border-card-border rounded-full" /></button>
              <div className="w-14 h-14 invisible" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
