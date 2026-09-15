import React, { useState } from 'react';
import { Team, LeagueStanding, LeagueFixture } from '../types';
import { TeamFlag } from './TeamFlag';
import { Trophy, Calendar, Award, Play, RotateCcw, ChevronLeft, ChevronRight, CheckCircle2, ArrowRight, AlertTriangle, X } from 'lucide-react';
import { soundManager } from '../utils/audioEffects';

interface LeagueViewProps {
  teams: Team[];
  standings: LeagueStanding[];
  fixtures: LeagueFixture[];
  currentWeek: number;
  viewingWeek: number;
  onSetViewingWeek: (week: number) => void;
  onPlayLeagueMatch: (fixtureId: string, homeTeamId: string, awayTeamId: string) => void;
  onSimulateRemainingWeekMatches: () => void;
  onAdvanceToNextWeek: () => void;
  onResetLeagueSeason: () => void;
  userTeamId?: string;
  onOpenTeamSelect?: () => void;
}

export const LeagueView: React.FC<LeagueViewProps> = ({
  teams,
  standings,
  fixtures,
  currentWeek,
  viewingWeek,
  onSetViewingWeek,
  onPlayLeagueMatch,
  onSimulateRemainingWeekMatches,
  onAdvanceToNextWeek,
  onResetLeagueSeason,
  userTeamId,
  onOpenTeamSelect,
}) => {
  const [activeTab, setActiveTab] = useState<'fixtures' | 'standings' | 'topScorers'>('fixtures');
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // Sorted standings by points, goalDifference, goalsFor
  const sortedStandings = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  // Calculate top scorers from teams
  const allPlayers = teams.flatMap(t =>
    t.players.map(p => ({
      ...p,
      teamName: t.name,
      teamColor: t.primaryColor,
      teamCode: t.code,
    }))
  );
  const topScorers = [...allPlayers].sort((a, b) => b.goals - a.goals).slice(0, 10);

  const userTeam = teams.find(t => t.id === userTeamId) || teams[0];

  // Matches for current viewing week
  const weekMatches = fixtures.filter(f => f.week === viewingWeek);
  const allWeekMatchesPlayed = weekMatches.length > 0 && weekMatches.every(m => m.played);
  const currentWeekMatches = fixtures.filter(f => f.week === currentWeek);
  const currentWeekAllPlayed = currentWeekMatches.length > 0 && currentWeekMatches.every(m => m.played);

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6 max-w-6xl mx-auto">
      {/* Title & Subnav */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-['Chakra_Petch'] tracking-wide">
                i-SiM 1. FUTBOL LİGİ
              </h2>
              <p className="text-xs text-slate-400">
                18 Takım • 34 Hafta Sezonu • Aktif Hafta: <span className="text-amber-400 font-bold">Hafta {currentWeek}</span> / 34
              </p>
            </div>
          </div>

          {userTeam && (
            <div className="mt-2.5 flex items-center gap-2 text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 inline-flex">
              <span className="text-slate-400">Yönettiğin Kulüp:</span>
              <TeamFlag team={userTeam} size="sm" showPole={false} />
              <span className="font-bold text-white font-['Chakra_Petch']">{userTeam.name}</span>
              {onOpenTeamSelect && (
                <button
                  onClick={onOpenTeamSelect}
                  className="text-amber-400 hover:underline text-[11px] ml-1 font-semibold"
                >
                  (Takımı Değiştir)
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Navigation Tabs */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex">
            <button
              onClick={() => setActiveTab('fixtures')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'fixtures' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Fikstür & Haftalık Maçlar</span>
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'standings' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Puan Durumu
            </button>
            <button
              onClick={() => setActiveTab('topScorers')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'topScorers' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Gol Krallığı</span>
            </button>
          </div>

          {/* Reset Season Button */}
          <button
            onClick={() => {
              setShowResetConfirmModal(true);
              soundManager.playKick();
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 font-bold text-xs border border-amber-500/30 transition-all flex items-center gap-1.5 shadow-sm"
            title="Ligi sıfırlayıp yeni sezona başla"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Yeni Sezon</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Fikstür & Hafta Maçları */}
      {activeTab === 'fixtures' && (
        <div className="space-y-4">
          {/* Week Navigation Header & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            {/* Week Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSetViewingWeek(Math.max(1, viewingWeek - 1))}
                disabled={viewingWeek <= 1}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Önceki Hafta"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center px-3">
                <span className="font-black text-base text-amber-400 block font-['Chakra_Petch'] tracking-wide">
                  {viewingWeek}. HAFTA FİKSTÜRÜ
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">
                  {viewingWeek === currentWeek ? '⭐ GÜNCEL HAFTA' : viewingWeek < currentWeek ? '✓ Tamamlandı' : 'Gelecek Hafta'}
                </span>
              </div>

              <button
                onClick={() => onSetViewingWeek(Math.min(34, viewingWeek + 1))}
                disabled={viewingWeek >= 34}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Sonraki Hafta"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Week Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* If viewing active week & some matches unplayed */}
              {viewingWeek === currentWeek && !currentWeekAllPlayed && (
                <button
                  onClick={onSimulateRemainingWeekMatches}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 shadow"
                >
                  <Play className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kalan Maçları Simüle Et</span>
                </button>
              )}

              {/* If active week matches are all completed: Advance to next week button */}
              {viewingWeek === currentWeek && currentWeekAllPlayed && currentWeek < 34 && (
                <button
                  onClick={onAdvanceToNextWeek}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs shadow-lg hover:scale-105 transition-all flex items-center gap-2 animate-pulse"
                >
                  <span>Sonraki Haftaya Geç ({currentWeek + 1}. Hafta)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {/* If season ended */}
              {currentWeek >= 34 && currentWeekAllPlayed && (
                <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" />
                  <span>34 Hafta Tamamlandı • Şampiyon Belli Oldu!</span>
                </div>
              )}
            </div>
          </div>

          {/* Matches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {weekMatches.map(match => {
              const homeT = teams.find(t => t.id === match.homeTeamId) || teams[0];
              const awayT = teams.find(t => t.id === match.awayTeamId) || teams[1];
              const isUserMatch = homeT.id === userTeamId || awayT.id === userTeamId;

              return (
                <div
                  key={match.id}
                  className={`border p-3.5 rounded-2xl flex flex-col justify-between gap-3 transition-all ${
                    isUserMatch
                      ? 'bg-blue-950/40 border-amber-400 ring-1 ring-amber-400/50 shadow-lg'
                      : match.played
                      ? 'bg-slate-950/40 border-slate-800/80 opacity-90'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Teams and Score line */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Home Team */}
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <div className="text-right">
                        <span className={`text-xs font-bold block truncate ${match.played && match.homeScore! > match.awayScore! ? 'text-amber-400 font-black' : 'text-white'}`}>
                          {homeT.name}
                        </span>
                        {homeT.id === userTeamId && (
                          <span className="text-[9px] text-amber-400 font-bold">★ SEN</span>
                        )}
                      </div>
                      <TeamFlag team={homeT} size="sm" showPole={false} />
                    </div>

                    {/* Score / VS Badge */}
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black shrink-0 min-w-[55px] text-center border ${
                      match.played
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-amber-400'
                    }`}>
                      {match.played ? `${match.homeScore} - ${match.awayScore}` : 'VS'}
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center gap-2 flex-1 justify-start">
                      <TeamFlag team={awayT} size="sm" showPole={false} />
                      <div className="text-left">
                        <span className={`text-xs font-bold block truncate ${match.played && match.awayScore! > match.homeScore! ? 'text-amber-400 font-black' : 'text-white'}`}>
                          {awayT.name}
                        </span>
                        {awayT.id === userTeamId && (
                          <span className="text-[9px] text-amber-400 font-bold">★ SEN</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action / Status Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                    {match.played ? (
                      <div className="w-full flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Oynandı ({match.homeScore} - {match.awayScore})</span>
                      </div>
                    ) : (
                      <div className="w-full flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {isUserMatch ? 'Senin Maçın' : 'Lig Maçı'}
                        </span>
                        <button
                          onClick={() => onPlayLeagueMatch(match.id, homeT.id, awayT.id)}
                          className={`px-3 py-1 rounded-xl font-black text-xs transition-all flex items-center gap-1 ${
                            isUserMatch
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow hover:scale-105'
                              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950'
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{isUserMatch ? 'Canlı Oyna' : 'Sahada Oyna'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Puan Durumu Tablosu */}
      {activeTab === 'standings' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/60">
                <th className="py-3 px-3 text-center w-12">Sıra</th>
                <th className="py-3 px-4">Kulüp</th>
                <th className="py-3 px-2 text-center">O</th>
                <th className="py-3 px-2 text-center">G</th>
                <th className="py-3 px-2 text-center">B</th>
                <th className="py-3 px-2 text-center">M</th>
                <th className="py-3 px-2 text-center hidden md:table-cell">AG</th>
                <th className="py-3 px-2 text-center hidden md:table-cell">YG</th>
                <th className="py-3 px-2 text-center">AV</th>
                <th className="py-3 px-3 text-center font-black text-amber-400">Puan</th>
                <th className="py-3 px-4 text-center hidden lg:table-cell">Son 5 Maç</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {sortedStandings.map((teamRow, idx) => {
                const team = teams.find(t => t.id === teamRow.teamId);
                const rank = idx + 1;
                const isLeader = rank === 1;
                const isRelegation = rank >= 16;
                const isUserTeam = teamRow.teamId === userTeamId;

                return (
                  <tr
                    key={teamRow.teamId}
                    className={`hover:bg-slate-800/50 transition-colors ${
                      isUserTeam
                        ? 'bg-blue-950/40 border-l-4 border-amber-400'
                        : isLeader
                        ? 'bg-amber-500/5'
                        : isRelegation
                        ? 'bg-rose-500/5'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                          isUserTeam
                            ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                            : isLeader
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : rank <= 4
                            ? 'bg-blue-600/30 text-blue-400'
                            : isRelegation
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {rank}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {team && <TeamFlag team={team} size="sm" showPole={false} />}
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-white font-['Chakra_Petch']">
                            <span>{teamRow.teamName}</span>
                            {isUserTeam && (
                              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded font-sans uppercase">
                                Senin Takımın
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Güç: <span className="text-amber-400 font-bold">{team?.rating}</span> • Diziliş: {team?.formation}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center text-slate-300">{teamRow.played}</td>
                    <td className="py-3 px-2 text-center text-emerald-400">{teamRow.won}</td>
                    <td className="py-3 px-2 text-center text-slate-400">{teamRow.drawn}</td>
                    <td className="py-3 px-2 text-center text-rose-400">{teamRow.lost}</td>
                    <td className="py-3 px-2 text-center text-slate-400 hidden md:table-cell">{teamRow.goalsFor}</td>
                    <td className="py-3 px-2 text-center text-slate-400 hidden md:table-cell">{teamRow.goalsAgainst}</td>
                    <td className="py-3 px-2 text-center font-bold text-slate-200">
                      {teamRow.goalDifference > 0 ? `+${teamRow.goalDifference}` : teamRow.goalDifference}
                    </td>
                    <td className="py-3 px-3 text-center font-black text-amber-400 text-base font-['Chakra_Petch']">
                      {teamRow.points}
                    </td>
                    <td className="py-3 px-4 text-center hidden lg:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        {teamRow.form.length === 0 ? (
                          <span className="text-xs text-slate-500 italic">-</span>
                        ) : (
                          teamRow.form.map((res, i) => (
                            <span
                              key={i}
                              className={`w-5 h-5 rounded text-[10px] font-black flex items-center justify-center ${
                                res === 'W'
                                  ? 'bg-emerald-500 text-slate-950'
                                  : res === 'D'
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-rose-500 text-white'
                              }`}
                            >
                              {res === 'W' ? 'G' : res === 'D' ? 'B' : 'M'}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Gol Krallığı */}
      {activeTab === 'topScorers' && (
        <div className="space-y-3">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
            <span className="font-bold text-sm text-amber-400">Gol Krallığı Sıralaması</span>
            <span className="text-xs text-slate-400">En Çok Gol Atan Futbolcular</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topScorers.map((p, idx) => (
              <div
                key={p.id}
                className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="font-black text-sm text-slate-400 w-5 text-center">#{idx + 1}</span>
                  <div>
                    <div className="font-bold text-white text-sm">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.teamName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-amber-400 font-['Chakra_Petch']">
                    {p.goals} <span className="text-xs text-slate-400 font-normal">Gol</span>
                  </div>
                  <div className="text-[10px] text-slate-500">#{p.number} • {p.position}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Modal for New Season */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 relative">
            <button
              onClick={() => setShowResetConfirmModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-['Chakra_Petch']">
                  Yeni Sezon Başlatılsın mı?
                </h3>
                <p className="text-xs text-amber-400/90 font-medium">Lütfen onaylayın</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Mevcut lig sezonundaki tüm puan durumu, oynanan maç sonuçları, gol krallığı ve 34 haftalık fikstür sıfırlanacaktır.
              <br /><br />
              Tüm takımlar için rastgele yeni bir 34 haftalık fikstür kuralandırılacaktır. Devam etmek istediğinize emin misiniz?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all"
              >
                Hayır, İptal
              </button>
              <button
                onClick={() => {
                  setShowResetConfirmModal(false);
                  onResetLeagueSeason();
                  soundManager.playWhistle('short');
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Evet, Yeni Sezonu Başlat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
