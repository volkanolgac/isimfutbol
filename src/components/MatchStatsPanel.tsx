import React, { useState } from 'react';
import { MatchState } from '../types';
import { ChevronDown, ChevronUp, Activity, Radio } from 'lucide-react';

interface MatchStatsPanelProps {
  state: MatchState;
}

export const MatchStatsPanel: React.FC<MatchStatsPanelProps> = ({ state }) => {
  const { homeTeam, awayTeam, stats, events } = state;
  const [showAllEvents, setShowAllEvents] = useState(false);

  const homePoss = stats.possession[0];
  const awayPoss = stats.possession[1];

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'goal':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">GOL</span>;
      case 'shot':
        return <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">ŞUT</span>;
      case 'save':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">KURTARIŞ</span>;
      case 'foul':
        return <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">FAUL</span>;
      case 'yellow_card':
        return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">SARI KART</span>;
      case 'red_card':
        return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">KIRMIZI KART</span>;
      case 'corner':
        return <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">KORNER</span>;
      case 'sub':
        return <span className="bg-teal-500/20 text-teal-400 border border-teal-500/30 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">DEĞİŞİKLİK</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">PAS</span>;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-2">
      {/* 1. CANLI ANLATIM & TOPLA OYNAMA BAR (Unified Compact Row) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
        {/* Live Commentary Feed (7 cols) */}
        <div className="md:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-2 md:p-2.5 shadow-lg backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1 font-['Chakra_Petch']">
                <Radio className="w-3 h-3" />
                Canlı Anlatım
              </span>
            </div>

            {events.length > 1 && (
              <button
                onClick={() => setShowAllEvents(!showAllEvents)}
                className="text-[10px] font-semibold text-slate-400 hover:text-white flex items-center gap-0.5 bg-slate-800/80 hover:bg-slate-800 px-2 py-0.5 rounded transition-colors"
              >
                <span>{showAllEvents ? 'Gizle' : `Geçmiş (${events.length})`}</span>
                {showAllEvents ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
              </button>
            )}
          </div>

          {/* Latest Event Banner */}
          {events.length > 0 ? (
            <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex items-center gap-2">
              {getEventBadge(events[0].type)}
              <span className="font-mono text-amber-400 font-bold text-[11px] shrink-0">{events[0].minute}'</span>
              <p className="text-[11px] md:text-xs text-slate-200 font-medium leading-tight truncate">
                {events[0].detail}
              </p>
            </div>
          ) : (
            <div className="bg-slate-950/50 px-2.5 py-1.5 rounded-lg border border-slate-800/50 text-slate-500 text-[11px] italic text-center truncate">
              Hakem düdüğü çaldı, maç başladı! Pozisyonlar burada akacak...
            </div>
          )}

          {/* Scrollable Past Events List */}
          {showAllEvents && events.length > 1 && (
            <div className="mt-2 pt-2 border-t border-slate-800 max-h-36 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {events.slice(1).map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center gap-2 text-[11px] text-slate-300 bg-slate-950/40 px-2 py-1 rounded border border-slate-800/50"
                >
                  {getEventBadge(ev.type)}
                  <span className="font-mono text-amber-400 font-semibold shrink-0">{ev.minute}'</span>
                  <span className="text-slate-300 truncate">{ev.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Possession & Dominance (5 cols) */}
        <div className="md:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-2 md:p-2.5 shadow-lg backdrop-blur-md flex flex-col justify-center gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span className="flex items-center gap-1.5 truncate max-w-[45%]">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: homeTeam.primaryColor || '#2563eb' }} />
              <span className="truncate">{homeTeam.name}</span>: <strong className="text-white font-mono">%{homePoss}</strong>
            </span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-['Chakra_Petch'] shrink-0">
              Topla Oynama
            </span>
            <span className="flex items-center gap-1.5 truncate max-w-[45%] justify-end">
              <strong className="text-white font-mono">%{awayPoss}</strong> : <span className="truncate">{awayTeam.name}</span>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: awayTeam.primaryColor || '#dc2626' }} />
            </span>
          </div>

          <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 flex">
            <div
              className="h-full rounded-l-full transition-all duration-300"
              style={{ width: `${homePoss}%`, backgroundColor: homeTeam.primaryColor || '#2563eb' }}
            />
            <div
              className="h-full rounded-r-full transition-all duration-300"
              style={{ width: `${awayPoss}%`, backgroundColor: awayTeam.primaryColor || '#dc2626' }}
            />
          </div>
        </div>
      </div>

      {/* 2. COMPACT STATS TILES (TOTAL SHOTS, TARGET, SAVES, FOULS, PASSES, CORNERS) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 shadow-lg backdrop-blur-md">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
          {/* Toplam Şut */}
          <div className="bg-slate-950/70 py-1.5 px-1 rounded-lg border border-slate-800/80">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Toplam Şut</div>
            <div className="text-xs font-black text-white font-['Chakra_Petch'] mt-0.5">
              <span>{stats.shots[0]}</span>
              <span className="text-slate-600 mx-1 font-light">/</span>
              <span>{stats.shots[1]}</span>
            </div>
          </div>

          {/* İsabetli Şut */}
          <div className="bg-slate-950/70 py-1.5 px-1 rounded-lg border border-slate-800/80">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">İsabetli Şut</div>
            <div className="text-xs font-black text-amber-400 font-['Chakra_Petch'] mt-0.5">
              <span>{stats.shotsOnTarget[0]}</span>
              <span className="text-slate-600 mx-1 font-light">/</span>
              <span>{stats.shotsOnTarget[1]}</span>
            </div>
          </div>

          {/* Kurtarışlar */}
          <div className="bg-slate-950/70 py-1.5 px-1 rounded-lg border border-slate-800/80">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Kurtarışlar</div>
            <div className="text-xs font-black text-sky-400 font-['Chakra_Petch'] mt-0.5">
              <span>{stats.saves[0]}</span>
              <span className="text-slate-600 mx-1 font-light">/</span>
              <span>{stats.saves[1]}</span>
            </div>
          </div>

          {/* Fauller */}
          <div className="bg-slate-950/70 py-1.5 px-1 rounded-lg border border-slate-800/80">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Fauller</div>
            <div className="text-xs font-black text-rose-400 font-['Chakra_Petch'] mt-0.5">
              <span>{stats.fouls[0]}</span>
              <span className="text-slate-600 mx-1 font-light">/</span>
              <span>{stats.fouls[1]}</span>
            </div>
          </div>

          {/* Başarılı Pas */}
          <div className="bg-slate-950/70 py-1.5 px-1 rounded-lg border border-slate-800/80">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Başarılı Pas</div>
            <div className="text-xs font-black text-emerald-400 font-['Chakra_Petch'] mt-0.5">
              <span>{stats.passes[0]}</span>
              <span className="text-slate-600 mx-1 font-light">/</span>
              <span>{stats.passes[1]}</span>
            </div>
          </div>

          {/* Kornerler */}
          <div className="bg-slate-950/70 py-1.5 px-1 rounded-lg border border-slate-800/80">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Kornerler</div>
            <div className="text-xs font-black text-indigo-400 font-['Chakra_Petch'] mt-0.5">
              <span>{stats.corners[0]}</span>
              <span className="text-slate-600 mx-1 font-light">/</span>
              <span>{stats.corners[1]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
