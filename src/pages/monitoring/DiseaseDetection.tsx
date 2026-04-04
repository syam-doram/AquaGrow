import React, { useState, useRef } from 'react';
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

export const DiseaseDetection = ({ user, t }: { user: User, t: Translations }) => {
  const { isPro, addMedicineLog, ponds } = useData();
  const navigate = useNavigate();
  const [step, setStep] = useState<'upload' | 'scanning' | 'result'>('upload');
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

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

  const runAnalysis = async (imgData?: string) => {
    const dataToAnalyze = imgData || image;
    if (!dataToAnalyze) return;

    if (!isPro) {
      alert("AI Agent feature requires a Pro Subscription. Please upgrade.");
      return;
    }

    setStep('scanning');
    try {
      const result = await analyzeShrimpHealth(dataToAnalyze, user.language || 'English');
      setAnalysis(result);
      setStep('result');
    } catch (error: any) {
      console.error("Analysis failed:", error);
      setAnalysis({
        disease: t.analysisError || 'Analysis Error',
        confidence: 0,
        severity: 'N/A',
        action: error.message || 'Please try again with a clearer photo.'
      });
      setStep('result');
    }
  };

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
      <div className="min-h-screen bg-[#FFFDF5]">
        <Header title={t.aiDisease} showBack />
        <div className="p-6 pt-24">
          <div className="mt-8 relative overflow-hidden rounded-[3rem] bg-[#4A2C2A] p-10 text-center shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#C78200]/20 to-transparent" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/10">
                <Sparkles size={32} className="text-[#C78200]" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tighter mb-4">Smart <span className="text-[#C78200]">Diagnostic AI</span></h2>
              <p className="text-white/40 text-xs font-bold leading-relaxed mb-10 px-6 uppercase tracking-widest leading-relaxed">“Like X-ray vision for your pond — powered by AI insights.” Deep AI scanning for early detection and decision support.</p>
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
                <p className="text-[#4A2C2A]/60 text-[10px] font-black uppercase tracking-widest leading-normal">Deep AI Scanning for EHP, WFD & Vibriosis</p>
             </div>
             <div className="flex gap-4 items-center">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-500">
                  <CheckCircle2 size={18} />
                </div>
                <p className="text-[#4A2C2A]/60 text-[10px] font-black uppercase tracking-widest leading-normal">Bio-Security Protocols for Your Region</p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF5] flex flex-col">
      <Header title={t.aiDisease} showBack />
      
      <main className="flex-1 mt-20 p-6">
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[3rem] border-2 border-dashed border-[#C78200]/20 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 text-[#C78200]">
                <Camera size={32} />
              </div>
              <h2 className="text-xl font-black text-[#4A2C2A] tracking-tight mb-2">{t.scanShrimp || 'Scan Shrimp'}</h2>
              <p className="text-[#4A2C2A]/40 text-xs font-bold uppercase tracking-widest leading-relaxed px-4">
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
                  <button className="w-full bg-white border border-[#C78200]/20 text-[#C78200] font-black py-5 rounded-3xl uppercase tracking-[0.2em] text-[10px]">
                    {t.uploadPhoto || 'Upload from Gallery'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-6 rounded-[2rem] border border-[#C78200]/10">
              <div className="flex gap-4">
                <AlertTriangle className="text-[#C78200] shrink-0" size={20} />
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-[#C78200] uppercase tracking-widest">{t.photoInstructions || 'Photo Instructions'}</h4>
                  <p className="text-[9px] font-bold text-[#4A2C2A]/40 leading-relaxed uppercase tracking-widest">Clear Lighting • No Glare • Centered Subject</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'scanning' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-32 h-32 relative mb-8">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-[#C78200]/10 border-t-[#C78200] rounded-full"
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
            <h2 className="text-2xl font-black text-[#012B1D] tracking-tighter mb-2">{t.deepAIAnalysis || 'Analyzing Pathogens...'}</h2>
            <p className="text-[#012B1D]/40 text-[10px] font-black uppercase tracking-[0.4em]">{t.scanningHealthMarkers || 'Checking bio-markers'}</p>
          </div>
        )}

        {step === 'result' && analysis && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6">
            {/* Specimen Photo Preview */}
            {image && (
              <div className="relative overflow-hidden rounded-[2.5rem] bg-black/5 aspect-video shadow-sm border border-black/5 group">
                 <img src={image} alt="Specimen" className="w-full h-full object-cover" />
                 
                 {/* Scanning HUD Overlay */}
                 <div className="absolute inset-0 pointer-events-none">
                    <motion.div 
                       initial={{ top: '0%' }}
                       animate={{ top: ['0%', '100%', '0%'] }}
                       transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                       className="absolute left-0 right-0 h-0.5 bg-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-10"
                    />
                    <div className="absolute inset-0 border-[20px] border-black/10 mix-blend-overlay" />
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-white/60" />
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-white/60" />
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-white/60" />
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-white/60" />
                 </div>

                 <div className="absolute top-6 left-6">
                    <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
                       <p className="text-[8px] font-black text-white uppercase tracking-widest">Specimen ID: AQUA-{Math.floor(Date.now()/100000)}</p>
                    </div>
                 </div>
              </div>
            )}

            <div className={cn(
               "p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden",
               analysis.severity === 'Critical' ? 'bg-red-500 shadow-red-500/20' : 
               analysis.severity === 'Warning' ? 'bg-[#C78200] shadow-amber-500/20' : 
               'bg-emerald-500 shadow-emerald-500/20'
            )}>
              <div className="absolute top-4 right-8 z-20">
                 {analysis.verifiedSchema && (
                   <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 flex items-center gap-2">
                      <ShieldCheck size={14} className="text-white" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Verified SOP</span>
                   </div>
                 )}
              </div>
              <div className="absolute top-0 right-0 p-8 opacity-20">
                <Sparkles size={120} />
              </div>
              <div className="relative z-10 pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">{t.analysisResult || 'Analysis Result'}</p>
                <h2 className="text-3xl font-black tracking-tighter mb-6">{analysis.disease}</h2>
                <div className="flex gap-6">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{t.confidence || 'AI Confidence'}</p>
                    <p className="text-xl font-black">{analysis.confidence}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{t.severity || 'Status'}</p>
                    <p className="text-xl font-black">{analysis.severity}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <h3 className="text-[10px] font-black text-[#4A2C2A]/30 uppercase tracking-[0.3em] ml-2">Visual Markers & Logic</h3>
              <div className="bg-white p-6 rounded-[2.5rem] border border-black/5">
                <p className="text-[#4A2C2A]/60 text-[10px] font-bold leading-relaxed mb-4">{analysis.markerAnalysis || analysis.reasoning}</p>
                {analysis.markerAnalysis && (
                  <div className="pt-4 border-t border-black/5">
                     <p className="text-[#4A2C2A]/40 text-[8px] font-black uppercase tracking-widest mb-1">Diagnostic Context</p>
                     <p className="text-[#4A2C2A]/80 text-[10px] font-bold italic">{analysis.reasoning}</p>
                  </div>
                )}
              </div>

              <h3 className="text-[10px] font-black text-[#4A2C2A]/30 uppercase tracking-[0.3em] ml-2">{t.correctiveActions || 'Treatment SOP'}</h3>
              <div className="bg-white p-6 rounded-[2.5rem] border border-black/5">
                <p className="text-[#4A2C2A] text-xs font-black leading-relaxed mb-6">"{analysis.action}"</p>
                
                {/* Apply Button */}
                <button 
                  onClick={async () => {
                    const targetPond = ponds[0];
                    if (targetPond) {
                       setIsLogging(true);
                       try {
                         await addMedicineLog({
                           pondId: targetPond.id,
                           date: new Date().toISOString().split('T')[0],
                           name: `${analysis.disease || 'Health'} Recovery`,
                           dosage: 'Clinical Treatment',
                           isSynced: true
                         });
                         setIsLogged(true);
                       } catch (err) {
                         console.error('Failed to log treatment:', err);
                       } finally {
                         setIsLogging(false);
                       }
                    }
                  }}
                  className={cn(
                    "w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
                    isLogged ? "bg-emerald-500 text-white" : "bg-[#C78200] text-white shadow-lg shadow-amber-500/20"
                  )}
                >
                  {isLogging ? "Saving to Log..." : isLogged ? "Applied to Pond History" : "Apply Corrective Actions"}
                </button>
              </div>

              <AnimatePresence>
                {isLogged && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] p-6"
                  >
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                           <CheckCircle2 size={16} />
                        </div>
                        <h4 className="text-emerald-900 font-black text-xs tracking-tight">Instructions After Logging</h4>
                     </div>
                     <ul className="space-y-3">
                        {[
                          "Restrict water exchange immediately to prevent spread.",
                          "Increase aeration in the affected pond (Full Night).",
                          "Disinfect all nets and feed trays used today.",
                          "Monitor nearby ponds for similar symptoms."
                        ].map((inst, i) => (
                          <li key={i} className="flex gap-3">
                             <span className="text-emerald-300 font-black">✔</span>
                             <p className="text-emerald-800 text-[10px] font-bold tracking-tight">{inst}</p>
                          </li>
                        ))}
                     </ul>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <button 
                onClick={() => { setStep('upload'); setIsLogged(false); }}
                className="w-full bg-[#4A2C2A]/5 text-[#4A2C2A] font-black py-5 rounded-[2rem] uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all mt-6"
              >
                {t.scanAgain || 'New Analysis'}
              </button>
            </div>
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
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="flex-1 object-cover"
            />
            <div className="absolute bottom-12 left-0 right-0 px-12 flex justify-between items-center">
              <button 
                onClick={stopCamera}
                className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white"
              >
                <X size={24} />
              </button>
              <button 
                onClick={capturePhoto}
                className="w-20 h-20 bg-white rounded-full p-2"
              >
                <div className="w-full h-full border-4 border-black/5 rounded-full" />
              </button>
              <div className="w-14 h-14 invisible" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
