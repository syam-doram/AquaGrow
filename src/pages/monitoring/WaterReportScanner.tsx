import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Scan, Zap, FileText, CheckCircle2, Loader2, Upload } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Header } from '../../components/Header';
import type { Translations } from '../../translations';

interface Props {
  t: Translations;
}

export const WaterReportScanner = ({ t }: Props) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'processing' | 'success'>('idle');
  const [scannedData, setScannedData] = useState<any>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraError(false);
    } catch (err) {
      console.error("Camera access denied or unavailable", err);
      setCameraError(true);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  const handleScan = () => {
    const _image = captureFrame(); // We could process this image in real app
    setStatus('processing');
    
    // Simulate AI processing delays
    setTimeout(() => {
      setStatus('success');
      setScannedData({
        ph: 7.8,
        do: 5.6,
        ammonia: 0.05,
        salinity: 15,
        temperature: 28.5
      });
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col font-sans">
      <Header 
        title="Scan Report" 
        showBack={true} 
        onBack={() => navigate(-1)} 
        onMenuClick={() => {}} 
      />

      {/* Main Camera View */}
      <div className="flex-1 relative overflow-hidden bg-zinc-950 flex flex-col items-center justify-center pt-20 pb-safe">
        
        {/* Hardware Camera / Fallback */}
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-zinc-900">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 mb-4">
              <Camera size={28} />
            </div>
            <h3 className="text-lg font-black tracking-tight mb-2">Camera Unavailable</h3>
            <p className="text-xs text-white/50 leading-relaxed mb-6">
              Please allow camera permissions or upload a lab report photo from your gallery.
            </p>
            <button 
              onClick={() => { setStatus('processing'); setTimeout(() => setStatus('success'), 2000); }}
              className="flex items-center gap-2 bg-emerald-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              <Upload size={14} /> Upload Lab Report
            </button>
          </div>
        ) : (
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted 
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        
        {/* Hidden internal canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Dynamic Overlay */}
        <AnimatePresence>
          {status === 'idle' && !cameraError && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-80">
                {/* Viewfinder Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-500 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-500 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-500 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-500 rounded-br-xl" />
                
                {/* Scanner Laser (animated) */}
                <motion.div 
                  animate={{ y: [0, 318, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="w-full h-0.5 bg-emerald-500 shadow-[0_0_15px_3px_rgba(16,185,129,0.5)] opacity-50"
                />

                <p className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 whitespace-nowrap bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
                  Align Lab Report
                </p>
              </div>
            </motion.div>
          )}

          {status === 'processing' && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20"
            >
              <div className="relative w-24 h-24 mb-6">
                <motion.div 
                  animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full"
                />
                <Scan size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500" />
              </div>
              <h3 className="text-sm font-black tracking-widest uppercase text-emerald-400 mb-2">AquaGrow AI Pipeline</h3>
              <p className="text-xs text-white/50">Extracting parameters via OCR...</p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-30"
            >
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/30">
                <CheckCircle2 size={32} />
              </div>
              
              <h3 className="text-2xl font-black tracking-tighter mb-1">Scan Complete</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-8">Parameters Extracted</p>

              <div className="w-full bg-white/5 rounded-3xl border border-white/10 p-5 mb-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/50 p-3 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">pH Level</p>
                    <p className="text-xl font-black text-blue-400">7.8</p>
                  </div>
                  <div className="bg-black/50 p-3 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Dissolved O2</p>
                    <p className="text-xl font-black text-emerald-400">5.6 <span className="text-[10px] text-white/20">mg/L</span></p>
                  </div>
                  <div className="bg-black/50 p-3 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Salinity</p>
                    <p className="text-xl font-black text-purple-400">15 <span className="text-[10px] text-white/20">ppt</span></p>
                  </div>
                  <div className="bg-black/50 p-3 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Ammonia</p>
                    <p className="text-xl font-black text-amber-400">0.05 <span className="text-[10px] text-white/20">ppm</span></p>
                  </div>
                </div>
              </div>

              <div className="w-full flex gap-3">
                <button 
                  onClick={() => setStatus('idle')}
                  className="flex-1 py-4 rounded-2xl bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.1em]"
                >
                  Rescan
                </button>
                <button 
                  onClick={() => navigate(-1)}
                  className="flex-[2] py-4 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.1em] shadow-lg shadow-emerald-900/40"
                >
                  Import to Log
                </button>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
        
        {/* Camera Controls (Bottom Bar) */}
        {status === 'idle' && (
          <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end justify-center bg-gradient-to-t from-black via-black/80 to-transparent">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={handleScan}
              className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] border-4 border-black ring-4 ring-emerald-500/30"
            >
              <FileText size={28} className="text-black" />
            </motion.button>
          </div>
        )}

      </div>
    </div>
  );
};
