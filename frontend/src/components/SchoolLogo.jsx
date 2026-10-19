import React from 'react';

export default function SchoolLogo({
  variant = 'dark',
  className = '',
  showTagline = false,
  size = 'md',
  showSubtitle = true
}) {
  const isDark = variant === 'dark';

  const sizeStyles = {
    sm: { img: 'w-7 h-9', box: 'p-0.5' },
    md: { img: 'w-9 h-11', box: 'p-1' },
    lg: { img: 'w-12 h-15', box: 'p-1' },
    xl: { img: 'w-16 h-20', box: 'p-1.5' }
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Official Full HD School Crest / Emblem */}
      <div
        className={`relative flex items-center justify-center flex-shrink-0 bg-white rounded-xl shadow-xs border overflow-hidden ${currentSize.box} ${
          isDark ? 'border-slate-700/80 ring-1 ring-blue-500/20' : 'border-slate-200/90'
        }`}
      >
        <img
          src="/logo.png"
          alt="Highlight Model School Emblem"
          className={`${currentSize.img} object-contain transition-transform duration-200 hover:scale-105`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/logo.jpg';
          }}
        />
      </div>

      {/* Typography */}
      <div className="leading-tight">
        <h1 className={`font-black tracking-tight text-sm sm:text-base ${isDark ? 'text-white' : 'text-[#0e2238]'}`}>
          Highlight
        </h1>
        <p className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-blue-400' : 'text-[#1a73e8]'}`}>
          Model School
        </p>
        {showSubtitle && (
          <p className="text-[9px] font-semibold tracking-wider text-amber-500 uppercase mt-0.5">
            Saraghundi Thall
          </p>
        )}
        {showTagline && (
          <p className="text-[10px] text-slate-400 font-normal mt-0.5">
            Better Learning | Brighter Future
          </p>
        )}
      </div>
    </div>
  );
}
