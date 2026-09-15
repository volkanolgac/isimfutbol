import React, { useState } from 'react';
import { Team } from '../types';
import { TeamFlag } from './TeamFlag';
import { Shield, Trophy, Swords, CheckCircle2, Star, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/audioEffects';

interface TeamSelectModalProps {
  teams: Team[];
  isOpen: boolean;
  onClose: () => void;
  selectedTeamId: string;
  onSelectTeam: (teamId: string, action?: 'play_match' | 'start_league') => void;
}

export const TeamSelectModal: React.FC<TeamSelectModalProps> = ({
  teams,
  isOpen,
  onClose,
  selectedTeamId,
  onSelectTeam,
}) => {
  const [hoveredId, setHoveredId] = useState<string>(selectedTeamId);
  const [selectedId, setSelectedId] = useState<string>(selectedTeamId);

  if (!isOpen) return null;

  const currentTeam = teams.find(t => t.id === selectedId) || teams[0];

  const handleConfirm = (action?: 'play_match' | 'start_league') => {
    soundManager.unlock();
    soundManager.playWhistle('short');
    onSelectTeam(selectedId, action);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-6 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-['Chakra_Petch'] tracking-wide flex items-center gap-2">
                <span>YÖNETECEĞİN TAKIMI SEÇ</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
                  18 KULÜP
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Teknik direktörlüğünü yapacağın kulübü seç, formasyonu belirle ve şampiyonluk yarışına başla!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-base transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Selected Team Spotlight */}
        {currentTeam && (
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-4">
              <TeamFlag team={currentTeam} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white font-['Chakra_Petch']">
                    {currentTeam.name}
                  </h3>
                  <span className="text-xs font-mono font-bold bg-slate-800 text-amber-400 px-2 py-0.5 rounded">
                    {currentTeam.code}
                  </span>
                </div>
                <p className="text-xs text-slate-400 italic mt-0.5 font-['Outfit']">
                  "{currentTeam.slogan}"
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-slate-300 flex items-center gap-1 font-bold">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    Güç: <span className="text-amber-400">{currentTeam.rating} OVR</span>
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">
                    Diziliş: <span className="text-blue-400 font-bold">{currentTeam.formation}</span>
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">
                    Kadro: <span className="text-emerald-400 font-bold">11 Oyuncu (6 Sahada + 5 Yedek)</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleConfirm('start_league')}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4 fill-slate-950" />
                <span>Bu Takımla Lige Başla</span>
              </button>
              <button
                onClick={() => handleConfirm('play_match')}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Swords className="w-4 h-4" />
                <span>Maça Çık</span>
              </button>
            </div>
          </div>
        )}

        {/* 18 Teams Grid */}
        <div className="overflow-y-auto pr-1 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teams.map(team => {
              const isSelected = selectedId === team.id;
              return (
                <div
                  key={team.id}
                  onClick={() => setSelectedId(team.id)}
                  onMouseEnter={() => setHoveredId(team.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 relative overflow-hidden ${
                    isSelected
                      ? 'bg-blue-950/40 border-amber-400 shadow-lg ring-2 ring-amber-400/50'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <TeamFlag team={team} size="md" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white font-['Chakra_Petch'] truncate">
                        {team.name}
                      </h4>
                      <span className="text-[11px] font-mono font-bold text-amber-400 shrink-0 ml-1">
                        {team.rating} OVR
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {team.slogan}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {team.formation}
                      </span>
                      <div className="flex items-center gap-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/40"
                          style={{ backgroundColor: team.primaryColor }}
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/40"
                          style={{ backgroundColor: team.secondaryColor }}
                        />
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="shrink-0 text-amber-400">
                      <CheckCircle2 className="w-5 h-5 fill-amber-400 text-slate-950" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400 shrink-0">
          <span>
            Seçili Takım: <strong className="text-white">{currentTeam.name}</strong> ({currentTeam.rating} OVR)
          </span>
          <button
            onClick={() => handleConfirm()}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all text-xs"
          >
            Seçimi Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};
