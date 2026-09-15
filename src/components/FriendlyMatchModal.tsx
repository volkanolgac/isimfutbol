import React, { useState } from 'react';
import { Team } from '../types';
import { TeamFlag } from './TeamFlag';
import { Play, Swords } from 'lucide-react';

interface FriendlyMatchModalProps {
  teams: Team[];
  isOpen: boolean;
  onClose: () => void;
  onStartMatch: (homeTeamId: string, awayTeamId: string) => void;
}

export const FriendlyMatchModal: React.FC<FriendlyMatchModalProps> = ({
  teams,
  isOpen,
  onClose,
  onStartMatch,
}) => {
  const [homeId, setHomeId] = useState(teams[0]?.id || 'volkanspor');
  const [awayId, setAwayId] = useState(teams[1]?.id || 'fatihsultan');

  if (!isOpen) return null;

  const homeTeam = teams.find(t => t.id === homeId) || teams[0];
  const awayTeam = teams.find(t => t.id === awayId) || teams[1];

  const handleStart = () => {
    onStartMatch(homeId, awayId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-['Chakra_Petch'] tracking-wide">
                HAZIRLIK MAÇI AYARLARI
              </h3>
              <p className="text-xs text-slate-400">18 Takım arasından eşleşmeyi belirleyin ve sahaya çıkın</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold">
            ✕
          </button>
        </div>

        {/* Teams Matchup Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Home */}
          <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/30 space-y-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
              Ev Sahibi Takım
            </span>
            <select
              value={homeId}
              onChange={e => setHomeId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold outline-none"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id} disabled={t.id === awayId}>
                  {t.name} ({t.rating} OVR)
                </option>
              ))}
            </select>
            <div className="flex flex-col items-center pt-2">
              <TeamFlag team={homeTeam} size="md" />
              <span className="text-sm font-bold text-white mt-2 font-['Chakra_Petch']">
                {homeTeam.name}
              </span>
              <span className="text-xs text-slate-400">Diziliş: {homeTeam.formation}</span>
            </div>
          </div>

          {/* Away */}
          <div className="bg-slate-950 p-4 rounded-xl border border-rose-500/30 space-y-3">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
              Deplasman Takımı
            </span>
            <select
              value={awayId}
              onChange={e => setAwayId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold outline-none"
            >
              {teams.map(t => (
                <option key={t.id} value={t.id} disabled={t.id === homeId}>
                  {t.name} ({t.rating} OVR)
                </option>
              ))}
            </select>
            <div className="flex flex-col items-center pt-2">
              <TeamFlag team={awayTeam} size="md" />
              <span className="text-sm font-bold text-white mt-2 font-['Chakra_Petch']">
                {awayTeam.name}
              </span>
              <span className="text-xs text-slate-400">Diziliş: {awayTeam.formation}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
          >
            Vazgeç
          </button>
          <button
            onClick={handleStart}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Maçı Başlat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
