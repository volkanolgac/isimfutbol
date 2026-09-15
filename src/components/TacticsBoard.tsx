import React, { useState } from 'react';
import { Team, Formation, TacticalMindset, Player, SimPlayerNode } from '../types';
import { JerseyBackView } from './JerseyBackView';
import { Play, Pause, FastForward, Shield, Zap, Flame, Compass } from 'lucide-react';

interface TacticsBoardProps {
  team: Team;
  isHome: boolean;
  simPlayers?: SimPlayerNode[];
  onFormationChange: (formation: Formation) => void;
  onTacticChange: (tactic: TacticalMindset) => void;
  onSubstitute: (starterPlayerId: string, benchPlayerId: string) => void;
  speed: 1 | 2 | 4 | 8;
  isPaused: boolean;
  onSpeedChange: (speed: 1 | 2 | 4 | 8) => void;
  onTogglePause: () => void;
}

export const TacticsBoard: React.FC<TacticsBoardProps> = ({
  team,
  isHome,
  simPlayers = [],
  onFormationChange,
  onTacticChange,
  onSubstitute,
  speed,
  isPaused,
  onSpeedChange,
  onTogglePause,
}) => {
  const [selectedStarter, setSelectedStarter] = useState<Player | null>(null);
  const [selectedBench, setSelectedBench] = useState<Player | null>(null);

  const starters = team.players.filter(p => p.isStarter);
  const bench = team.players.filter(p => !p.isStarter);

  const formations: Formation[] = ['2-2-1', '2-1-2', '1-3-1', '3-1-1', '1-2-2', '2-3-0'];

  const tactics: Array<{ id: TacticalMindset; label: string; icon: React.ReactNode; desc: string }> = [
    { id: 'bus', label: 'Otobüsü Çek', icon: <Shield className="w-4 h-4 text-sky-400" />, desc: 'Katı Savunma & Kontra' },
    { id: 'balanced', label: 'Dengeli', icon: <Compass className="w-4 h-4 text-emerald-400" />, desc: 'Organize Geçiş Oyunu' },
    { id: 'attack', label: 'Hücum', icon: <Zap className="w-4 h-4 text-amber-400" />, desc: 'Önde Baskı & Çift Kanat' },
    { id: 'allOut', label: 'Tüm Hatlarla Saldır', icon: <Flame className="w-4 h-4 text-rose-500" />, desc: 'Tam Saha Şok Pres' },
  ];

  const handleSwap = () => {
    if (selectedStarter && selectedBench) {
      // Guard: Cannot swap if starter is red carded
      const simNode = simPlayers.find(sp => sp.id === selectedStarter.id);
      if (simNode?.isRedCarded || selectedStarter.redCards > 0) return;

      onSubstitute(selectedStarter.id, selectedBench.id);
      setSelectedStarter(null);
      setSelectedBench(null);
    }
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-6">
      {/* Header & Speed Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide font-['Chakra_Petch'] flex items-center gap-2">
            <span>{team.name}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 font-bold">
              {isHome ? 'EV SAHİBİ' : 'DEPLASMAN'}
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-medium">{team.slogan}</p>
        </div>

        {/* Match Speed Controls */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={onTogglePause}
            className={`p-2 rounded-lg transition-colors font-bold text-xs flex items-center gap-1.5 ${
              isPaused ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
            <span>{isPaused ? 'Devam Et' : 'Duraklat'}</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {([1, 2, 4, 8] as const).map(s => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                speed === s
                  ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Formation & Tactic selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Formations */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Diziliş Seçimi (Formation)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {formations.map(form => (
              <button
                key={form}
                onClick={() => onFormationChange(form)}
                className={`py-2 px-3 rounded-xl text-xs font-bold font-['Chakra_Petch'] transition-all border ${
                  team.formation === form
                    ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {form}
              </button>
            ))}
          </div>
        </div>

        {/* Tactical Mindset */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Oyun Anlayışı (Tactical Mode)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {tactics.map(tac => (
              <button
                key={tac.id}
                onClick={() => onTacticChange(tac.id)}
                className={`p-2.5 rounded-xl text-left transition-all border flex items-center gap-2.5 ${
                  team.tactic === tac.id
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {tac.icon}
                <div>
                  <div className="text-xs font-bold leading-tight">{tac.label}</div>
                  <div className="text-[10px] text-slate-400 leading-none mt-0.5">{tac.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Substitutions (Oyuncu Değişikliği) */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Oyuncu Değişikliği (Sahada 6 Kişi • Yedekte 5 Kişi)
            </span>
            <p className="text-[11px] text-slate-400">
              Sahadan bir oyuncu ve yedekten bir oyuncu seçip onaylayın. Kırmızı kart gören oyuncular değiştirilemez.
            </p>
          </div>

          {selectedStarter && selectedBench && (
            <button
              onClick={handleSwap}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs shadow-lg hover:scale-105 transition-all animate-pulse"
            >
              ⇄ Değişikliği İste ({selectedStarter.name} ↔ {selectedBench.name})
            </button>
          )}
        </div>

        {/* Starting 6 list */}
        <div>
          <span className="text-[11px] font-semibold text-emerald-400 block mb-1.5">
            Sahadaki Oyuncular (1 Kaleci + 5 Oyuncu):
          </span>
          <div className="flex flex-wrap gap-2">
            {starters.map(player => {
              const simNode = simPlayers.find(sp => sp.id === player.id);
              const isRedCarded = Boolean((player.redCards && player.redCards > 0) || simNode?.isRedCarded);
              const yellowCount = simNode?.yellowCards ?? player.yellowCards ?? 0;
              const isSelected = selectedStarter?.id === player.id;

              if (isRedCarded) {
                return (
                  <div
                    key={player.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-900/80 bg-red-950/40 text-red-400 flex items-center gap-1.5 cursor-not-allowed opacity-90 shadow-inner"
                    title="Kırmızı kartla oyundan ihraç edildi (Değiştirilemez)"
                  >
                    <span className="font-mono font-bold text-red-500/80">#{player.number}</span>
                    <span className="line-through text-red-500 font-bold decoration-red-500 decoration-2">
                      {player.name}
                    </span>
                    <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      🟥 İHRAÇ
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={player.id}
                  onClick={() => setSelectedStarter(isSelected ? null : player)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 ring-2 ring-emerald-500'
                      : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="font-mono font-bold text-amber-400">#{player.number}</span>
                  <span>{player.name}</span>
                  {yellowCount === 1 && (
                    <span className="w-2.5 h-3 bg-amber-400 rounded-[1px] inline-block shadow-sm" title="Sarı Kart" />
                  )}
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-900 px-1 rounded">
                    {player.position}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bench list */}
        <div>
          <span className="text-[11px] font-semibold text-amber-400 block mb-1.5">
            Yedek Kulübesi (Bench):
          </span>
          <div className="flex flex-wrap gap-2">
            {bench.map(player => {
              const simNode = simPlayers.find(sp => sp.id === player.id);
              const isRedCarded = Boolean((player.redCards && player.redCards > 0) || simNode?.isRedCarded);
              const isSelected = selectedBench?.id === player.id;

              if (isRedCarded) {
                return (
                  <div
                    key={player.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-900/80 bg-red-950/40 text-red-400 flex items-center gap-1.5 cursor-not-allowed opacity-90 shadow-inner"
                    title="Cezalı / İhraç edildi (Değiştirilemez)"
                  >
                    <span className="font-mono font-bold text-red-500/80">#{player.number}</span>
                    <span className="line-through text-red-500 font-bold decoration-red-500 decoration-2">
                      {player.name}
                    </span>
                    <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      🟥 İHRAÇ
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={player.id}
                  onClick={() => setSelectedBench(isSelected ? null : player)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-amber-500/30 border-amber-400 text-amber-300 ring-2 ring-amber-500'
                      : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="font-mono font-bold text-amber-400">#{player.number}</span>
                  <span>{player.name}</span>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-900 px-1 rounded">
                    {player.position}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

