import React, { useState } from 'react';

interface KawLogoProps {
  className?: string;
  showText?: boolean;
}

/**
 * Official Emblem for Kerala Association of Washington (KAW).
 */
export const KawLogo: React.FC<KawLogoProps> = ({ className = "w-10 h-10", showText = false }) => {
  const [imgError, setImgError] = useState(false);
  const logoUrl = "https://kaow.org/wp-content/uploads/2026/04/kaw-logo.png";

  return (
    <div className={`inline-flex items-center gap-3 shrink-0 ${className.includes('w-') ? '' : 'w-auto'}`}>
      <div className={`relative shrink-0 rounded-full bg-white p-0.5 shadow-md border border-primary/20 flex items-center justify-center overflow-hidden ${className}`}>
        {!imgError ? (
          <img 
            src={logoUrl} 
            alt="Kerala Association of Washington Logo" 
            className="w-full h-full object-contain rounded-full"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="94" fill="#ffffff" stroke="#012d1d" strokeWidth="2.5" />
            <text x="100" y="112" textAnchor="middle" fontSize="36" fontWeight="900" fill="#012d1d" fontFamily="sans-serif">KAW</text>
          </svg>
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-headline-md text-primary font-black tracking-tight leading-none text-lg md:text-xl">
            KAW
          </span>
          <span className="text-[11px] font-bold text-on-surface-variant tracking-wider uppercase leading-tight mt-0.5">
            Kerala Association of WA
          </span>
        </div>
      )}
    </div>
  );
};
