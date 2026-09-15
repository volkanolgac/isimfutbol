import React from 'react';
import { Team } from '../types';

interface TeamFlagProps {
  team: Team;
  size?: 'sm' | 'md' | 'lg';
  showPole?: boolean;
}

export const TeamFlag: React.FC<TeamFlagProps> = ({ team, size = 'md', showPole = true }) => {
  const dimensions = {
    sm: { w: 48, h: 32, poleW: 3, crownSize: 8, letterSize: 12 },
    md: { w: 84, h: 56, poleW: 4, crownSize: 12, letterSize: 20 },
    lg: { w: 140, h: 90, poleW: 6, crownSize: 18, letterSize: 32 },
  }[size];

  const { w, h, poleW, letterSize } = dimensions;

  // Background pattern rendering
  const renderPattern = () => {
    switch (team.flagPattern) {
      case 'stripes_vertical':
        return (
          <>
            <rect x="0" y="0" width={w} height={h} fill={team.primaryColor} />
            <rect x={w * 0.28} y="0" width={w * 0.14} height={h} fill={team.secondaryColor} />
            <rect x={w * 0.58} y="0" width={w * 0.14} height={h} fill={team.secondaryColor} />
          </>
        );
      case 'stripes_horizontal':
        return (
          <>
            <rect x="0" y="0" width={w} height={h} fill={team.primaryColor} />
            <rect x="0" y={h * 0.22} width={w} height={h * 0.18} fill={team.secondaryColor} />
            <rect x="0" y={h * 0.60} width={w} height={h * 0.18} fill={team.secondaryColor} />
          </>
        );
      case 'diagonal_split':
        return (
          <>
            <rect x="0" y="0" width={w} height={h} fill={team.primaryColor} />
            <polygon points={`0,${h} ${w},0 ${w},${h}`} fill={team.secondaryColor} />
          </>
        );
      case 'diagonal_sash':
        return (
          <>
            <rect x="0" y="0" width={w} height={h} fill={team.primaryColor} />
            <polygon points={`0,${h * 0.4} ${w * 0.6},0 ${w},0 0,${h}`} fill={team.secondaryColor} />
          </>
        );
      case 'solid_bordered':
        return (
          <>
            <rect x="0" y="0" width={w} height={h} fill={team.primaryColor} />
            <rect x={w * 0.08} y={h * 0.1} width={w * 0.84} height={h * 0.8} fill="none" stroke={team.secondaryColor} strokeWidth={w * 0.05} />
          </>
        );
      case 'halved':
      default:
        return (
          <>
            <rect x="0" y="0" width={w} height={h * 0.5} fill={team.primaryColor} />
            <rect x="0" y={h * 0.5} width={w} height={h * 0.5} fill={team.secondaryColor} />
          </>
        );
    }
  };

  return (
    <div className="inline-flex items-center select-none" title={team.name}>
      <svg width={w + (showPole ? poleW + 2 : 0)} height={h + 6} className="overflow-visible drop-shadow-md">
        <defs>
          <linearGradient id={`poleGrad-${team.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="50%" stopColor="#fffbeb" />
            <stop offset="100%" stopColor="#996515" />
          </linearGradient>
          <linearGradient id={`fabricWave-${team.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="35%" stopColor="#000000" stopOpacity="0.2" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
          </linearGradient>
          <filter id={`shieldShadow-${team.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Flag pole */}
        {showPole && (
          <g>
            <circle cx={poleW / 2} cy={2} r={poleW * 0.75} fill="url(#poleGrad-volkanspor)" />
            <rect x={0} y={2} width={poleW} height={h + 4} rx={1} fill={`url(#poleGrad-${team.id})`} />
          </g>
        )}

        {/* Flag Cloth with clip */}
        <g transform={`translate(${showPole ? poleW : 0}, 2)`}>
          <clipPath id={`flagClip-${team.id}-${size}`}>
            <rect x="0" y="0" width={w} height={h} rx={2} />
          </clipPath>
          
          <g clipPath={`url(#flagClip-${team.id}-${size})`}>
            {renderPattern()}

            {/* Fabric wave overlay for realism */}
            <rect x="0" y="0" width={w} height={h} fill={`url(#fabricWave-${team.id})`} />

            {/* Team Crest & Shield in Center */}
            <g transform={`translate(${w / 2}, ${h / 2})`}>
              {/* Shield base */}
              <path
                d={`M -${w * 0.22} -${h * 0.3} L ${w * 0.22} -${h * 0.3} L ${w * 0.2} ${h * 0.05} Q 0 ${h * 0.38} -${w * 0.2} ${h * 0.05} Z`}
                fill={team.primaryColor}
                stroke={team.secondaryColor}
                strokeWidth={w > 60 ? 2 : 1}
                filter={`url(#shieldShadow-${team.id})`}
              />
              
              {/* Crown / Stars on top */}
              <path
                d={`M -${w * 0.12} -${h * 0.3} L -${w * 0.14} -${h * 0.42} L -${w * 0.06} -${h * 0.35} L 0 -${h * 0.46} L ${w * 0.06} -${h * 0.35} L ${w * 0.14} -${h * 0.42} L ${w * 0.12} -${h * 0.3} Z`}
                fill="#facc15"
              />

              {/* Team Letter */}
              <text
                x="0"
                y={letterSize * 0.35}
                textAnchor="middle"
                fill={team.secondaryColor}
                fontSize={letterSize}
                fontWeight="900"
                fontFamily="'Outfit', sans-serif"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}
              >
                {team.letter}
              </text>
            </g>
          </g>
          {/* Subtle flag border */}
          <rect x="0" y="0" width={w} height={h} rx={2} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" />
        </g>
      </svg>
    </div>
  );
};
