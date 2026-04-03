import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  TrendingUp, 
  Activity, 
  Sparkles, 
  Waves, 
  Lock,
  Target,
  Maximize2,
  Scan,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';
import { Header } from '../components/Header';
import { Translations } from '../translations';
import { User } from '../types';
import { analyzeLiveStream } from '../services/geminiService';

export const LiveMonitor = ({ user, t }: { user: User, t: Translations }) => {
  const navigate = useNavigate();
  const { isPro } = useData();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [metrics, setMetrics] = useState({
    activity: 85,
    health: 92,
    count: 1240
  });

  useEffect(() => {
    if (!isPro) return;
    
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera not supported on this device");
        }
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (isMounted) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();

    const captureAndAnalyze = async () => {
      if (!isMounted) return;
      
      if (!videoRef.current || videoRef.current.readyState < 2) {
        timeoutId = setTimeout(captureAndAnalyze, 1000);
        return;
      }

      const canvas = canvasRef.current || document.createElement('canvas');
      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;
      
      if (width === 0 || height === 0) {
        timeoutId = setTimeout(captureAndAnalyze, 1000);
        return;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        timeoutId = setTimeout(captureAndAnalyze, 1000);
        return;
      }

      ctx.drawImage(videoRef.current, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg', 0.5);

      setIsAnalyzing(true);
      try {
        const result = await analyzeLiveStream(base64Image);
        if (isMounted && result) {
          setMetrics(result);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error("Analysis error:", err);
      } finally {
        if (isMounted) {
          setIsAnalyzing(false);
          timeoutId = setTimeout(captureAndAnalyze, 5000);
        }
      }
    };

    captureAndAnalyze();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      clearTimeout(timeoutId);
    };
  }, [isPro]);

  if (!isPro) {
    return (
      <div className="min-h-screen bg-[#FFFDF5]">
      <Header title={t.liveMonitor} showBack onBack={() => navigate(-1)} />
        
        <div className="p-6">
          <div className="mt-6 relative overflow-hidden rounded-[2.5rem] bg-[#0D3025] p-8 text-center shadow-2xl border border-white/5">
             <div className="absolute inset-0 bg-gradient-to-br from-[#C78200]/10 to-transparent" />
             <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-500/5 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/10 shadow-inner">
                   <TrendingUp size={28} className="text-[#C78200] animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tighter mb-3 uppercase">Smart <span className="text-[#C78200]">Visibility</span></h3>
                <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mb-10 leading-relaxed px-4">“Like X-ray vision for your pond — powered by AI insights.” Real-time behavior intelligence to track feeding response and stress.</p>
                
                <button 
                  onClick={() => navigate('/subscription')}
                  className="w-full bg-[#C78200] text-white font-black py-5 rounded-2xl shadow-xl shadow-amber-500/20 uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all"
                >
                  Unlock AI Insights
                </button>
             </div>
          </div>
          
          <div className="mt-12 grid grid-cols-2 gap-6">
             {[
               { icon: Activity, label: 'Behavior Scan', desc: 'Movement intelligence' },
               { icon: Sparkles, label: 'Activity Score', desc: 'Stress detection' },
               { icon: Waves, label: 'Feeding Response', desc: 'Decision support' },
               { icon: Lock, label: 'Risk Indication', desc: 'Early warning' }
             ].map((f, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm">
                   <f.icon size={18} className="text-[#C78200] mb-3" />
                   <p className="text-[#4A2C2A] text-[10px] font-black uppercase tracking-tight mb-1">{f.label}</p>
                   <p className="text-[#4A2C2A]/40 text-[8px] font-bold uppercase tracking-widest">{f.desc}</p>
                </div>
             ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover opacity-60"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* AI Overlays - Digital HUD */}
        <div className="absolute inset-0 pointer-events-none p-6">
          {/* Diagnostic Corners */}
          <div className="absolute top-10 left-10 w-24 h-24 border-t-2 border-l-2 border-[#C78200]/40 rounded-tl-[2rem]" />
          <div className="absolute top-10 right-10 w-24 h-24 border-t-2 border-r-2 border-[#C78200]/40 rounded-tr-[2rem]" />
          <div className="absolute bottom-10 left-10 w-24 h-24 border-b-2 border-l-2 border-[#C78200]/40 rounded-bl-[2rem]" />
          <div className="absolute bottom-10 right-10 w-24 h-24 border-b-2 border-r-2 border-[#C78200]/40 rounded-br-[2rem]" />
          
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/5 shadow-[0_0_10px_white/20]" />
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/5 shadow-[0_0_10px_white/20]" />

          {isAnalyzing && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6"
            >
              <div className="w-24 h-24 relative">
                 <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-[#C78200]/10 border-t-[#C78200] rounded-full shadow-[0_0_20px_#C78200/40]"
                 />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Scan size={32} className="text-[#C78200] animate-pulse" />
                 </div>
              </div>
              <div className="bg-black/60 backdrop-blur-xl px-6 py-2 rounded-2xl border border-white/10">
                 <p className="text-[#C78200] text-[9px] font-black uppercase tracking-[0.4em]">Analyzing Bio-Vibrations...</p>
              </div>
            </motion.div>
          )}

          {/* Dynamic Floating Data Points */}
          <motion.div 
            animate={{ 
               x: [0, 20, 0], 
               y: [0, -20, 0] 
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-1/3 left-1/4"
          >
             <div className="w-4 h-4 border-2 border-emerald-400 rounded-full flex items-center justify-center relative">
                <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                <div className="absolute left-6 whitespace-nowrap">
                   <p className="text-emerald-400 text-[7px] font-black uppercase tracking-widest">Normal Pathogen Count</p>
                   <p className="text-white text-[8px] font-bold">SAMPLE_092: OK</p>
                </div>
             </div>
          </motion.div>

          <motion.div 
            animate={{ 
               x: [0, -15, 0], 
               y: [0, 30, 0] 
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute bottom-1/4 right-1/3"
          >
             <div className="w-4 h-4 border-2 border-amber-400 rounded-full flex items-center justify-center relative">
                <div className="w-1 h-1 bg-amber-400 rounded-full animate-ping" />
                <div className="absolute right-6 whitespace-nowrap text-right">
                   <p className="text-amber-400 text-[7px] font-black uppercase tracking-widest">Turbidity Check</p>
                   <p className="text-white text-[8px] font-bold">14.2 NTU</p>
                </div>
             </div>
          </motion.div>
        </div>

        <div className="absolute top-10 left-8 right-8 flex justify-between items-start">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col items-end gap-2">
            <div className="bg-[#C78200]/90 backdrop-blur-md px-4 py-2 rounded-xl border border-[#C78200]/20 flex items-center gap-2 text-white">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black tracking-widest uppercase">SMART VISIBILITY AI</span>
            </div>
            {lastUpdated && (
              <p className="text-white/40 text-[8px] font-black uppercase tracking-widest">
                Real-Time Insights: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="absolute bottom-10 left-8 right-8 grid grid-cols-3 gap-4">
          <div className="bg-[#4A2C2A]/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10">
            <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">Behavior</p>
            <p className="text-white text-xl font-black">ACTIVE</p>
          </div>
          <div className="bg-[#4A2C2A]/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10">
            <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">Response</p>
            <p className="text-white text-xl font-black">FAST</p>
          </div>
          <div className="bg-[#4A2C2A]/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10">
            <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">Risk</p>
            <p className="text-white text-xl font-black">LOW</p>
          </div>
        </div>
      </div>
    </div>
  );
};
