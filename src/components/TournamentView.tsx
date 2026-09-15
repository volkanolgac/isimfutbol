import React from 'react';
import { Team } from '../types';
import { TournamentMatchState } from '../data/tournamentState';
import { TeamFlag } from './TeamFlag';
import { Trophy, Play, Award, RotateCcw } from 'lucide-react';
import { soundManager } from '../utils/audioEffects';

interface TournamentViewProps {
  teams: Team[];
  tournamentMatches: TournamentMatchState[];
  champion: Team | null;
  onPlayMatch: (homeTeamId: string, awayTeamId: string, tournamentMatchId: string) => void;
  onSimulateMatch: (matchId: string) => void;
  onResetTournament?: () => void;
}

export const TournamentView: React.FC<TournamentViewProps> = ({
  teams,
  tournamentMatches,
  champion,
  onPlayMatch,
  onSimulateMatch,
  onResetTournament,
}) => {
  const renderRound = (roundName: TournamentMatchState['round'], title: string) => {
    const list = tournamentMatches.filter(m => m.round === roundName);
    if (list.length === 0) return null;

    return (
      <div className="space-y-3">
        <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider font-['Chakra_Petch'] border-b border-slate-800 pb-1">
          {title} ({list.length} Maç)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map(m => (
            <div
              key={m.id}
              className={`p-3.5 rounded-xl border transition-all ${
                m.winnerTeamId
                  ? 'bg-slate-950/40 border-slate-800'
                  : 'bg-slate-950 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                {/* Home */}
                <div className={`flex items-center gap-2 flex-1 justify-end ${m.winnerTeamId === m.homeTeam.id ? 'font-black text-amber-400' : 'text-slate-200'}`}>
                  <span className="text-xs truncate">{m.homeTeam.name}</span>
                  <TeamFlag team={m.homeTeam} size="sm" showPole={false} />
                </div>

                {/* Score or VS */}
                <div className={`px-3 py-1 rounded-lg text-xs font-mono font-bold min-w-[55px] text-center border ${
                  m.homeScore !== undefined 
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300' 
                    : 'bg-slate-900 border-slate-800 text-white'
                }`}>
                  {m.homeScore !== undefined ? `${m.homeScore} - ${m.awayScore}` : 'VS'}
                </div>

                {/* Away */}
                <div className={`flex items-center gap-2 flex-1 justify-start ${m.winnerTeamId === m.awayTeam.id ? 'font-black text-amber-400' : 'text-slate-200'}`}>
                  <TeamFlag team={m.awayTeam} size="sm" showPole={false} />
                  <span className="text-xs truncate">{m.awayTeam.name}</span>
                </div>
              </div>

              {!m.winnerTeamId ? (
                <div className="flex justify-center gap-2 mt-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => onPlayMatch(m.homeTeam.id, m.awayTeam.id, m.id)}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1 shadow transition-transform hover:scale-105"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Sahada Oyna</span>
                  </button>
                  <button
                    onClick={() => onSimulateMatch(m.id)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors"
                  >
                    Hızlı Simüle Et
                  </button>
                </div>
              ) : (
                <div className="flex justify-center items-center gap-1.5 mt-2 pt-2 border-t border-slate-800/80 text-[11px] text-amber-400 font-bold">
                  <span>Kazanan: {m.winnerTeamId === m.homeTeam.id ? m.homeTeam.name : m.awayTeam.name} (Turu Geçti)</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white font-['Chakra_Petch'] tracking-wide flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-400" />
            <span>i-SiM ŞAMPİYONLAR KUPASI (TURNUVA MODU)</span>
          </h2>
          <p className="text-xs text-slate-400">Eleme Usulü Kupa Heyecanı • 16 Takım • Canlı Maçlar Tabloya İşlenir</p>
        </div>

        {onResetTournament && (
          <button
            onClick={() => {
              if (window.confirm('Turnuva sıfırlanıp baştan başlatılsın mı?')) {
                onResetTournament();
                soundManager.playWhistle('short');
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs border border-slate-800 transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Turnuvayı Yeniden Başlat</span>
          </button>
        )}
      </div>

      {/* Champion Banner if finished */}
      {champion && (
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-400 p-6 rounded-2xl text-center space-y-3 shadow-2xl animate-fade-in">
          <div className="inline-flex p-3 rounded-full bg-amber-500 text-slate-950 shadow-lg">
            <Award className="w-10 h-10" />
          </div>
          <h3 className="text-3xl font-black text-white font-['Chakra_Petch'] uppercase tracking-wider">
            ŞAMPİYON: {champion.name}!
          </h3>
          <p className="text-sm text-amber-300 font-semibold max-w-md mx-auto">
            Bütün rakiplerini geride bırakarak i-SiM Şampiyonlar Kupası'nı müzesine götürmeyi başardı!
          </p>
          <div className="flex justify-center pt-2">
            <TeamFlag team={champion} size="lg" />
          </div>
        </div>
      )}

      {/* Knockout Bracket Rounds */}
      <div className="space-y-6">
        {renderRound('final', 'Büyük Final')}
        {renderRound('semi', 'Yarı Final')}
        {renderRound('quarter', 'Çeyrek Final')}
        {renderRound('roundOf16', 'Son 16 Turu')}
      </div>
    </div>
  );
};
