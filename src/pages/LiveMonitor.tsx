import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  TrendingUp, 
  Activity, 
  Sparkles, 
  Waves, 
  Lock 
} from 'lucide-react';
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
          <div className="mt-8 relative overflow-hidden rounded-[3rem] bg-[#0D3025] p-12 text-center shadow-2xl">
             <div className="absolute inset-0 bg-gradient-to-br from-[#C78200]/10 to-transparent" />
             <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-emerald-500/5 rounded-3xl flex items-center justify-center mb-10 border border-emerald-500/10">
                   <TrendingUp size={36} className="text-[#C78200] animate-pulse" />
                </div>
                <h3 className="text-3xl font-black text-white tracking-tighter mb-4">Smart <span className="text-[#C78200]">Visibility</span></h3>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-12 leading-relaxed px-4">“Like X-ray vision for your pond — powered by AI insights.” Real-time behavior intelligence to track feeding response and stress.</p>
                
                <button 
                  onClick={() => navigate('/subscription')}
                  className="w-full bg-[#C78200] text-white font-black py-6 rounded-3xl shadow-xl shadow-amber-500/20 uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all"
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
        
        {/* AI Overlays */}
        <div className="absolute inset-0 pointer-events-none">
          {isAnalyzing && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-[#C78200] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#C78200] text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">AI ANALYZING FEED TRAY...</p>
            </div>
          )}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-[#C78200]/40 rounded-full animate-pulse flex items-center justify-center">
            <div className="text-[8px] text-[#C78200] font-black uppercase tracking-widest">Scanning Tray...</div>
          </div>
          <div className="absolute bottom-1/3 right-1/4 w-24 h-24 border border-white/40 rounded-lg animate-bounce flex items-center justify-center">
            <div className="text-[8px] text-white font-black uppercase tracking-widest">{metrics.health > 80 ? 'Sample Healthy' : 'Monitor Sample'}</div>
          </div>
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
