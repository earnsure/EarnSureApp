
import React, { useEffect, useRef } from 'react';

const BannerAd: React.FC = () => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptId = 'adsterra-banner-160-300';
    
    if (adRef.current && !document.getElementById(scriptId)) {
      (window as any).atOptions = {
        'key': '876b000b94a4c2b3137e62dc0ccf8db9',
        'format': 'iframe',
        'height': 300,
        'width': 160,
        'params': {}
      };

      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.src = 'https://passivealexis.com/876b000b94a4c2b3137e62dc0ccf8db9/invoke.js';
      script.async = true;

      adRef.current.appendChild(script);
    }

    return () => {
      const script = document.getElementById(scriptId);
      if (script) script.remove();
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center py-8 bg-slate-950/20 border-t border-white/5 mt-auto overflow-hidden">
      <div className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em] mb-4">Advertisement</div>
      <div className="w-full flex justify-center px-4">
        <div 
          ref={adRef} 
          className="w-[160px] h-[300px] bg-slate-900/40 rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 flex items-center justify-center -z-10">
             <div className="w-10 h-10 border-2 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
      <div className="mt-3 text-[7px] font-bold text-slate-800 uppercase tracking-widest italic">Secure Ad Server v2.7</div>
    </div>
  );
};

export default BannerAd;
