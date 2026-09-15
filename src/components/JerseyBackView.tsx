import React from 'react';
import { Player, Team } from '../types';
import { toTurkishUpper } from '../utils/textUtils';

interface JerseyBackViewProps {
  player: Player;
  team: Team;
  isAway?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const JerseyBackView: React.FC<JerseyBackViewProps> = ({
  player,
  team,
  isAway = false,
  size = 'md',
  showLabel = true,
}) => {
  const isGk = player.position === 'GK';
  const kit = isGk ? team.gkKit : (isAway ? team.awayKit : team.homeKit);

  const dimensions = {
    sm: { w: 70, h: 84, nameSize: 7, numSize: 24, posSize: 8 },
    md: { w: 100, h: 120, nameSize: 9.5, numSize: 34, posSize: 10 },
    lg: { w: 150, h: 180, nameSize: 13, numSize: 52, posSize: 12 },
  }[size];

  const { w, h, nameSize, numSize } = dimensions;
  const upperName = toTurkishUpper(player.name);

  // Position label translation
  const posLabel = {
    GK: 'KALECİ',
    DF: 'DEFANS',
    MF: 'ORTA SAHA',
    FW: 'FORVET',
  }[player.position];

  return (
    <div className="flex flex-col items-center group transition-transform hover:scale-105 select-none">
      <svg
        width={w}
        height={h}
        viewBox="0 0 100 120"
        className="drop-shadow-lg filter overflow-visible"
      >
        <defs>
          {/* Subtle fabric lighting gradient */}
          <linearGradient id={`jerseyShade-${player.id}-${kit.jerseyMain}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
          </linearGradient>

          {/* Cloth fold vertical highlight */}
          <linearGradient id="foldsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.25" />
            <stop offset="15%" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#000" stopOpacity="0.05" />
            <stop offset="85%" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Sleeves (Left & Right) */}
        <path
          d="M 28 16 L 6 36 L 14 48 L 26 34 Z"
          fill={kit.jerseyMain}
          stroke={kit.jerseySecondary}
          strokeWidth="1.2"
        />
        <path
          d="M 72 16 L 94 36 L 86 48 L 74 34 Z"
          fill={kit.jerseyMain}
          stroke={kit.jerseySecondary}
          strokeWidth="1.2"
        />

        {/* Sleeve Cuffs */}
        <polygon points="6,36 14,48 16,45 8,34" fill={kit.jerseySecondary} />
        <polygon points="94,36 86,48 84,45 92,34" fill={kit.jerseySecondary} />

        {/* Sleeve League Patch ("i-SiM 1") */}
        <circle cx="12" cy="40" r="3.2" fill="#d4af37" />
        <circle cx="88" cy="40" r="3.2" fill="#d4af37" />

        {/* Main Body */}
        <path
          d="M 28 16 
             Q 50 24 72 16 
             L 77 106 
             Q 50 109 23 106 
             Z"
          fill={kit.jerseyMain}
          stroke={kit.jerseySecondary}
          strokeWidth="1.5"
        />

        {/* Vertical stripes if pattern is stripes */}
        {kit.pattern === 'vertical_stripes' && (
          <g opacity="0.85">
            <rect x="36" y="20" width="8" height="86" fill={kit.jerseySecondary} />
            <rect x="56" y="20" width="8" height="86" fill={kit.jerseySecondary} />
          </g>
        )}

        {/* Horizontal stripes pattern */}
        {kit.pattern === 'horizontal_stripes' && (
          <g opacity="0.85">
            <rect x="25" y="44" width="50" height="7" fill={kit.jerseySecondary} />
            <rect x="24" y="66" width="52" height="7" fill={kit.jerseySecondary} />
            <rect x="23" y="88" width="54" height="7" fill={kit.jerseySecondary} />
          </g>
        )}

        {/* Diagonal sash pattern */}
        {kit.pattern === 'diagonal_sash' && (
          <polygon points="28,24 42,20 75,98 62,106" fill={kit.jerseySecondary} opacity="0.85" />
        )}

        {/* Realistic Fabric Shadow overlay */}
        <path
          d="M 28 16 Q 50 24 72 16 L 77 106 Q 50 109 23 106 Z"
          fill="url(#foldsGrad)"
        />
        <path
          d="M 28 16 Q 50 24 72 16 L 77 106 Q 50 109 23 106 Z"
          fill={`url(#jerseyShade-${player.id}-${kit.jerseyMain})`}
        />

        {/* Collar back trim */}
        <path
          d="M 36 17 Q 50 23 64 17"
          fill="none"
          stroke={kit.collarColor || kit.jerseySecondary}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Side ventilation trim lines */}
        <path d="M 26 36 L 25 104" stroke={kit.jerseySecondary} strokeWidth="1.2" opacity="0.6" />
        <path d="M 74 36 L 75 104" stroke={kit.jerseySecondary} strokeWidth="1.2" opacity="0.6" />

        {/* Player Name in Authentic Turkish Uppercase */}
        <text
          x="50"
          y="35"
          textAnchor="middle"
          fill={kit.nameColor || kit.jerseySecondary}
          fontSize={nameSize}
          fontWeight="800"
          letterSpacing="0.8px"
          fontFamily="'Outfit', sans-serif"
          style={{
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.85))',
          }}
        >
          {upperName}
        </text>

        {/* Big Squad Number */}
        <text
          x="50"
          y="78"
          textAnchor="middle"
          fill={kit.numberColor || kit.jerseySecondary}
          fontSize={numSize}
          fontWeight="900"
          fontFamily="'Chakra Petch', sans-serif"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))',
          }}
        >
          {player.number}
        </text>

        {/* Little league emblem below number */}
        <circle cx="50" cy="94" r="3.2" fill={kit.jerseySecondary} opacity="0.4" />
      </svg>

      {/* Label under jersey */}
      {showLabel && (
        <div className="mt-1 text-center">
          <div className="text-xs font-bold text-slate-100 tracking-tight flex items-center justify-center gap-1">
            <span className="text-amber-400">#{player.number}</span>
            <span className="truncate max-w-[90px]">{player.name}</span>
          </div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {posLabel}
          </div>
        </div>
      )}
    </div>
  );
};
