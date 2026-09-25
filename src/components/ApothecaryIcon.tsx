import React from 'react';

export const ApothecaryEmblem: React.FC<{ className?: string; size?: number }> = ({ 
  className = "w-10 h-10", 
  size = 40 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="24" cy="24" r="22" className="fill-orange-500/10 stroke-orange-500/30" strokeWidth="1.5" />
      {/* Mortar & Pestle & Botanical Leaf */}
      <path 
        d="M13 26C13 32.0751 17.9249 37 24 37C30.0751 37 35 32.0751 35 26H13Z" 
        className="fill-orange-500 stroke-orange-600" 
        strokeWidth="1.5" 
      />
      <path 
        d="M20 37H28V39H20V37Z" 
        className="fill-orange-600" 
      />
      {/* Pestle angle */}
      <path 
        d="M18 13L26 27" 
        stroke="#FFFFFF" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
      {/* Homoeopathic Healing Droplet & Herbal Leaf */}
      <path 
        d="M27 12C27 12 32 17 32 19.5C32 22.2614 29.7614 24.5 27 24.5C24.2386 24.5 22 22.2614 22 19.5C22 17 27 12 27 12Z" 
        className="fill-amber-400 stroke-orange-600" 
        strokeWidth="1"
      />
      <circle cx="27" cy="19.5" r="1.5" fill="#FFFFFF" />
    </svg>
  );
};

export const HomoeopathicWatermark: React.FC<{ className?: string }> = ({ className = "w-24 h-24" }) => {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className}>
      <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
      <path d="M50 20 L50 80 M20 50 L80 50" stroke="currentColor" strokeWidth="2" />
      <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="8" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
};
