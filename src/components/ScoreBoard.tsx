import React from 'react';
import { MatchState } from '../types';
import { TeamFlag } from './TeamFlag';

interface ScoreBoardProps {
  state: MatchState;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ state }) => {
  const { homeTeam, awayTeam, homeScore, awayScore, minute, second } = state;

  const formattedTime = `${String(minute).padStart(2, '0')}:${String(Math.floor(second)).padStart(2, '0')}`;

  const statusLabel =
    state.status === 'first_half'
      ? '1. YARI'
      : state.status === 'second_half'
      ? '2. YARI'
      : state.status === 'halftime'
      ? 'DEVRE ARASI'
      : 'MAÇ SONU';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 md:p-2.5 shadow-xl backdrop-blur-md max-w-5xl mx-auto">
      {/* Top Banner: Teams, Digital Clock & Score */}
      <div className="flex items-center justify-between gap-2 md:gap-4">
        {/* Home Team */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="text-right">
            <div className="text-xs md:text-base font-black text-white font-['Chakra_Petch'] tracking-wide flex items-center justify-end gap-1">
              <span>{homeTeam.name}</span>
              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                {state.sidesSwapped ? '▶ SAĞ' : '◀ SOL'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-semibold hidden sm:flex items-center justify-end gap-1">
              <span>Güç: <strong className="text-amber-400">{homeTeam.rating}</strong></span>
              <span className="text-slate-600">•</span>
              <span>{homeTeam.formation}</span>
            </div>
          </div>
          <TeamFlag team={homeTeam} size="sm" />
        </div>

        {/* Center Score & Match Clock */}
        <div className="flex flex-col items-center justify-center px-3 py-1 md:px-5 md:py-1 bg-slate-950/90 border border-slate-800 rounded-xl min-w-[110px] md:min-w-[140px] shadow-inner">
          <div className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{formattedTime}'</span>
            <span className="text-[9px] text-slate-400 uppercase font-semibold">
              {statusLabel}
            </span>
          </div>

          <div className="text-2xl md:text-3xl font-black text-white font-['Chakra_Petch'] tracking-wider flex items-center gap-2">
            <span className="text-white drop-shadow-md">{homeScore}</span>
            <span className="text-slate-600 text-xl md:text-2xl font-light">-</span>
            <span className="text-white drop-shadow-md">{awayScore}</span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex items-center gap-2 flex-1 justify-start">
          <TeamFlag team={awayTeam} size="sm" />
          <div className="text-left">
            <div className="text-xs md:text-base font-black text-white font-['Chakra_Petch'] tracking-wide flex items-center justify-start gap-1">
              <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                {state.sidesSwapped ? '◀ SOL' : '▶ SAĞ'}
              </span>
              <span>{awayTeam.name}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-semibold hidden sm:flex items-center justify-start gap-1">
              <span>Güç: <strong className="text-amber-400">{awayTeam.rating}</strong></span>
              <span className="text-slate-600">•</span>
              <span>{awayTeam.formation}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
