
import React, { useEffect, useState, useRef } from 'react';

const COOLDOWN_DURATION = 60000; // 1 minute in milliseconds
const CLOSED_KEY = 'earnsure_social_bar_closed_at';

const SocialBarAd: React.FC = () => {
  const [shouldRender, setShouldRender] = useState(false);
  const isUnmounting = useRef(false);

  useEffect(() => {
    const checkCooldown = () => {
      const lastClosed = localStorage.getItem(CLOSED_KEY);
      if (!lastClosed) return true;
      
      const elapsed = Date.now() - parseInt(lastClosed);
      return elapsed >= COOLDOWN_DURATION;
    };

    if (checkCooldown()) {
      setShouldRender(true);
    } else {
      // Check again after the remaining time
      const lastClosed = parseInt(localStorage.getItem(CLOSED_KEY) || '0');
      const remaining = COOLDOWN_DURATION - (Date.now() - lastClosed);
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!shouldRender) return;

    const scriptId = 'adsterra-social-bar-script';
    let observer: MutationObserver | null = null;
    let adFound = false;

    // Inject the script
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.src = 'https://passivealexis.com/7c/7d/38/7c7d38479bc1f51cfc2b7301fab3bfca.js';
      script.async = true;
      document.body.appendChild(script);
    }

    // Observe the body to detect when the ad is closed
    // Adsterra social bars usually create divs with specific patterns or iframes
    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Detect if elements are added (to mark ad as "found")
        mutation.addedNodes.forEach((node: any) => {
          if (node.nodeType === 1 && (node.classList?.contains('adsterra-ad') || node.tagName === 'IFRAME')) {
            adFound = true;
          }
        });

        // Detect if elements are removed (closure detection)
        mutation.removedNodes.forEach((node: any) => {
          // If the ad was present and is now removed, and we aren't unmounting the whole app
          if (adFound && !isUnmounting.current) {
            // Check if it's a typical ad container (floating div/iframe)
            if (node.nodeType === 1 && (node.style?.position === 'fixed' || node.tagName === 'IFRAME')) {
              localStorage.setItem(CLOSED_KEY, Date.now().toString());
              setShouldRender(false); // Stop rendering script component
              
              // Set a timeout to allow it back after 1 minute
              setTimeout(() => {
                setShouldRender(true);
              }, COOLDOWN_DURATION);
            }
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      isUnmounting.current = true;
      if (observer) observer.disconnect();
      const script = document.getElementById(scriptId);
      if (script) script.remove();
      
      // Cleanup floating elements on unmount
      const bars = document.querySelectorAll('div[class*="social-bar"], iframe[src*="adsterra"]');
      bars.forEach(el => el.remove());
    };
  }, [shouldRender]);

  return null;
};

export default SocialBarAd;
