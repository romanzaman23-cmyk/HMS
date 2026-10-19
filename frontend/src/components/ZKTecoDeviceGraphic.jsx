import React from 'react';

export default function ZKTecoDeviceGraphic({ isConnected = true, isScanning = false, className = "w-20 h-28" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 140 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Device Outer Chassis - Dark Metallic Grey / Matte Black */}
        <rect x="10" y="10" width="120" height="200" rx="16" fill="#1b1e23" stroke="#2d333b" strokeWidth="3" />
        <rect x="14" y="14" width="112" height="192" rx="14" fill="#121518" />

        {/* Top Camera / Optical Sensor Bezel */}
        <circle cx="70" cy="24" r="3.5" fill="#2d333b" />
        <circle cx="70" cy="24" r="1.5" fill="#0ea5e9" />

        {/* Color TFT Screen (ZKTeco GUI) */}
        <rect x="22" y="34" width="96" height="60" rx="6" fill="#080c14" stroke="#1f2937" strokeWidth="1.5" />
        {/* Screen Content */}
        <rect x="25" y="37" width="90" height="54" rx="4" fill="#0a192f" />
        <text x="70" y="52" fill="#93c5fd" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
          ZKTECO F18
        </text>
        <text x="70" y="66" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
          08:12:00
        </text>
        <circle cx="34" cy="80" r="3" fill={isConnected ? '#10b981' : '#ef4444'} />
        <text x="42" y="83" fill="#cbd5e1" fontSize="7" fontFamily="sans-serif">
          {isConnected ? 'ONLINE 4370' : 'OFFLINE'}
        </text>
        <text x="106" y="83" fill="#38bdf8" fontSize="7" textAnchor="end" fontFamily="sans-serif">
          PORTAL
        </text>

        {/* Keypad Grid (3x4 buttons) */}
        <g fill="#24292e" stroke="#374151" strokeWidth="0.8">
          {/* Row 1 */}
          <rect x="28" y="102" width="22" height="12" rx="2.5" />
          <rect x="59" y="102" width="22" height="12" rx="2.5" />
          <rect x="90" y="102" width="22" height="12" rx="2.5" />
          {/* Row 2 */}
          <rect x="28" y="118" width="22" height="12" rx="2.5" />
          <rect x="59" y="118" width="22" height="12" rx="2.5" />
          <rect x="90" y="118" width="22" height="12" rx="2.5" />
          {/* Row 3 */}
          <rect x="28" y="134" width="22" height="12" rx="2.5" />
          <rect x="59" y="134" width="22" height="12" rx="2.5" />
          <rect x="90" y="134" width="22" height="12" rx="2.5" />
          {/* Row 4 (ESC, 0, OK) */}
          <rect x="28" y="150" width="22" height="12" rx="2.5" fill="#1e293b" />
          <rect x="59" y="150" width="22" height="12" rx="2.5" />
          <rect x="90" y="150" width="22" height="12" rx="2.5" fill="#047857" />
        </g>
        {/* Keypad labels */}
        <text x="39" y="111" fill="#94a3b8" fontSize="7" textAnchor="middle">1</text>
        <text x="70" y="111" fill="#94a3b8" fontSize="7" textAnchor="middle">2</text>
        <text x="101" y="111" fill="#94a3b8" fontSize="7" textAnchor="middle">3</text>
        <text x="39" y="127" fill="#94a3b8" fontSize="7" textAnchor="middle">4</text>
        <text x="70" y="127" fill="#94a3b8" fontSize="7" textAnchor="middle">5</text>
        <text x="101" y="127" fill="#94a3b8" fontSize="7" textAnchor="middle">6</text>
        <text x="39" y="143" fill="#94a3b8" fontSize="7" textAnchor="middle">7</text>
        <text x="70" y="143" fill="#94a3b8" fontSize="7" textAnchor="middle">8</text>
        <text x="101" y="143" fill="#94a3b8" fontSize="7" textAnchor="middle">9</text>
        <text x="39" y="159" fill="#e2e8f0" fontSize="6" fontWeight="bold" textAnchor="middle">ESC</text>
        <text x="70" y="159" fill="#94a3b8" fontSize="7" textAnchor="middle">0</text>
        <text x="101" y="159" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">OK</text>

        {/* Fingerprint Optical Sensor Well */}
        <rect x="42" y="169" width="56" height="32" rx="16" fill="#05070a" stroke="#334155" strokeWidth="1.5" />
        {/* Optical Glass Glow */}
        <rect
          x="46"
          y="173"
          width="48"
          height="24"
          rx="12"
          fill={isScanning ? '#22c55e' : (isConnected ? '#10b981' : '#475569')}
          fillOpacity={isScanning ? '0.85' : (isConnected ? '0.45' : '0.2')}
          stroke={isConnected ? '#34d399' : '#64748b'}
          strokeWidth="1"
        />
        {/* Fingerprint Ridge Hologram lines */}
        <path
          d="M62 185 C62 180, 78 180, 78 185 M66 189 C66 183, 74 183, 74 189 M58 190 C58 178, 82 178, 82 190"
          stroke={isConnected ? '#a7f3d0' : '#94a3b8'}
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
      {/* Scan wave effect if active */}
      {isScanning && (
        <span className="absolute bottom-2 w-10 h-10 rounded-full bg-emerald-400 opacity-75 animate-ping pointer-events-none"></span>
      )}
    </div>
  );
}
