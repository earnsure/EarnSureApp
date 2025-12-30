
import React, { useEffect } from 'react';

const NativeAd: React.FC = () => {
  useEffect(() => {
    const scriptId = 'adsterra-native-banner-script';
    
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = 'https://passivealexis.com/66a48f371cdbd6981be294f67a0f3cb6/invoke.js';
      document.body.appendChild(script);
    }

    return () => {
      const script = document.getElementById(scriptId);
      if (script) script.remove();
      const container = document.getElementById('container-66a48f371cdbd6981be294f67a0f3cb6');
      if (container) container.innerHTML = '';
    };
  }, []);

  return (
    <div className="w-full px-4 py-6 bg-slate-900/40 border-t border-white/5 flex flex-col items-center">
      <div className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4">Recommended for You</div>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        <div id="container-66a48f371cdbd6981be294f67a0f3cb6"></div>
      </div>
      <div className="mt-4 text-[7px] font-bold text-slate-800 uppercase tracking-widest italic">Global Ad Network Node</div>
    </div>
  );
};

export default NativeAd;
