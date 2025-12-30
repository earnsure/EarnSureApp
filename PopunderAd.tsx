
import React, { useEffect } from 'react';

const PopunderAd: React.FC = () => {
  useEffect(() => {
    const scriptId = 'adsterra-popunder-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.src = 'https://passivealexis.com/aa/a1/ab/aaa1ab76707cb5213c17b15c567cb72c.js';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      const script = document.getElementById(scriptId);
      if (script) script.remove();
    };
  }, []);

  return null;
};

export default PopunderAd;
