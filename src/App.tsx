import React, { useState, useEffect, useRef, useCallback } from 'react';
import { INITIAL_TEAMS_DATA, INITIAL_LEAGUE_STANDINGS, createFreshStandings, recalculateStandingsFromFixtures } from './data/teamsData';
import { SUPER_LIG_TEAMS } from './data/superLigTeamsData';
import { generateLeagueSchedule } from './data/leagueSchedule';
import { Team, MatchState, Formation, TacticalMindset, LeagueStanding, LeagueFixture, PendingSubstitution } from './types';
import { initializeMatchState, updateSimulation } from './engine/simulationEngine';
import { 
  TournamentMatchState, 
  createInitialTournamentMatches, 
  advanceTournamentMatches 
} from './data/tournamentState';
import { MatchCanvas } from './components/MatchCanvas';
import { ScoreBoard } from './components/ScoreBoard';
import { MatchStatsPanel } from './components/MatchStatsPanel';
import { TacticsBoard } from './components/TacticsBoard';
import { LeagueView } from './components/LeagueView';
import { TournamentView } from './components/TournamentView';
import { TeamCustomizer } from './components/TeamCustomizer';
import { FriendlyMatchModal } from './components/FriendlyMatchModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { TeamSelectModal } from './components/TeamSelectModal';
import { TeamFlag } from './components/TeamFlag';
import { soundManager } from './utils/audioEffects';
import { 
  Trophy, 
  Swords, 
  Settings, 
  Globe, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Sparkles,
  ChevronRight,
  Shield,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  // 0. Game Mode state ('isimfutbol' | 'superlig')
  const [gameMode, setGameMode] = useState<'isimfutbol' | 'superlig'>(() => {
    try {
      const savedMode = localStorage.getItem('isim_game_mode');
      if (savedMode === 'superlig' || savedMode === 'isimfutbol') return savedMode;
    } catch (e) {}
    return 'isimfutbol';
  });

  // 1. Teams data state (persistent in localStorage if available)
  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const savedMode = localStorage.getItem('isim_game_mode');
      if (savedMode === 'superlig') return SUPER_LIG_TEAMS;
      const saved = localStorage.getItem('isim_teams_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TEAMS_DATA;
  });

  // Save teams to localStorage when modified
  const handleUpdateTeam = (updatedTeam: Team) => {
    setTeams(prev => {
      const next = prev.map(t => (t.id === updatedTeam.id ? updatedTeam : t));
      try {
        localStorage.setItem('isim_teams_data', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    // Also update teams in active match if involved
    setMatchState(prev => {
      if (!prev) return prev;
      let newHome = prev.homeTeam;
      let newAway = prev.awayTeam;
      if (prev.homeTeam.id === updatedTeam.id) newHome = updatedTeam;
      if (prev.awayTeam.id === updatedTeam.id) newAway = updatedTeam;
      return {
        ...prev,
        homeTeam: newHome,
        awayTeam: newAway,
      };
    });
  };

  const handleResetTeams = () => {
    const defaultData = gameMode === 'superlig' ? SUPER_LIG_TEAMS : INITIAL_TEAMS_DATA;
    setTeams(defaultData);
    try {
      localStorage.removeItem('isim_teams_data');
    } catch (e) {
      console.error(e);
    }
  };

  // Switch Game Mode Handler (İsimfutbol <-> Türkiye Süper Lig)
  const handleSwitchGameMode = (newMode: 'isimfutbol' | 'superlig') => {
    setGameMode(newMode);
    try {
      localStorage.setItem('isim_game_mode', newMode);
    } catch (e) {}

    const selectedTeams = newMode === 'superlig' ? SUPER_LIG_TEAMS : INITIAL_TEAMS_DATA;
    setTeams(selectedTeams);

    const defaultTeamId = newMode === 'superlig' ? 'galatasaray' : 'volkanspor';
    setUserTeamId(defaultTeamId);
    try {
      localStorage.setItem('isim_user_team_id', defaultTeamId);
      localStorage.setItem('isim_teams_data', JSON.stringify(selectedTeams));
    } catch (e) {}

    // Regenerate league schedule and standings for the new mode
    const newSchedule = generateLeagueSchedule(selectedTeams);
    const newStandings = createFreshStandings(selectedTeams);
    setLeagueFixtures(newSchedule);
    setStandings(newStandings);
    setCurrentWeek(1);
    setViewingWeek(1);

    // Reset current match state
    if (selectedTeams.length >= 2) {
      const home = selectedTeams.find(t => t.id === defaultTeamId) || selectedTeams[0];
      const away = selectedTeams.find(t => t.id !== home.id) || selectedTeams[1];
      setMatchState(initializeMatchState(home, away, 'friendly'));
    }
  };

  // 2. Navigation State
  const [currentTab, setCurrentTab] = useState<'match' | 'league' | 'tournament' | 'customizer'>('match');
  const [isMuted, setIsMuted] = useState(false);

  // Managed Team (User's chosen club)
  const [userTeamId, setUserTeamId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('isim_user_team_id');
      if (saved) return saved;
    } catch (e) {}
    return 'volkanspor';
  });

  // 3. Modals
  const [friendlyModalOpen, setFriendlyModalOpen] = useState(false);
  const [multiplayerModalOpen, setMultiplayerModalOpen] = useState(false);
  const [teamSelectModalOpen, setTeamSelectModalOpen] = useState(false);

  // 4. Multiplayer & WebSocket
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'host' | 'guest' | 'spectator' | null>(null);
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [roomState, setRoomState] = useState<{
    hostConnected: boolean;
    guestConnected: boolean;
    hostTeamId: string | null;
    guestTeamId: string | null;
    spectatorCount: number;
  } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastWsSendRef = useRef<number>(0);

  // 5. League State (Standings, Schedule, Current Week, Viewing Week)
  const [leagueFixtures, setLeagueFixtures] = useState<LeagueFixture[]>(() => {
    try {
      const saved = localStorage.getItem('isim_league_fixtures');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return generateLeagueSchedule(INITIAL_TEAMS_DATA);
  });

  const [standings, setStandings] = useState<LeagueStanding[]>(() => {
    try {
      const savedFixtures = localStorage.getItem('isim_league_fixtures');
      if (savedFixtures) {
        const parsedFixtures = JSON.parse(savedFixtures);
        return recalculateStandingsFromFixtures(INITIAL_TEAMS_DATA, parsedFixtures);
      }
    } catch (e) {}
    return INITIAL_LEAGUE_STANDINGS;
  });

  const [currentWeek, setCurrentWeek] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('isim_league_week');
      if (saved) return Number(saved);
    } catch (e) {}
    return 1;
  });

  const [viewingWeek, setViewingWeek] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('isim_league_week');
      if (saved) return Number(saved);
    } catch (e) {}
    return 1;
  });

  // Save league data to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem('isim_teams_data', JSON.stringify(teams));
      localStorage.setItem('isim_league_standings', JSON.stringify(standings));
      localStorage.setItem('isim_league_fixtures', JSON.stringify(leagueFixtures));
      localStorage.setItem('isim_league_week', String(currentWeek));
    } catch (e) {}
  }, [teams, standings, leagueFixtures, currentWeek]);

  // Auto-reconnect to active room session on page refresh
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('isim_active_room');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.roomId && parsed.role) {
          handleJoinMultiplayerRoom(parsed.roomId, parsed.teamId || 'volkanspor', parsed.role);
        }
      }
    } catch (e) {}
  }, []);

  // Ref to track persisted matches and avoid ANY duplicate calculations (Strict Mode or re-renders)
  const persistedMatchKeysRef = useRef<Set<string>>(new Set());

  // Reset entire league season
  const handleResetLeagueSeason = () => {
    persistedMatchKeysRef.current.clear();

    // Reset player individual statistics across all teams
    const resetTeams = teams.map(team => ({
      ...team,
      players: team.players.map(p => ({
        ...p,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
      })),
    }));

    const freshStandings = createFreshStandings(resetTeams);
    const freshFixtures = generateLeagueSchedule(resetTeams);

    setTeams(resetTeams);
    setStandings(freshStandings);
    setLeagueFixtures(freshFixtures);
    setCurrentWeek(1);
    setViewingWeek(1);

    try {
      localStorage.setItem('isim_teams_data', JSON.stringify(resetTeams));
      localStorage.setItem('isim_league_standings', JSON.stringify(freshStandings));
      localStorage.setItem('isim_league_fixtures', JSON.stringify(freshFixtures));
      localStorage.setItem('isim_current_week', '1');
    } catch (e) {
      console.error('Error resetting league season data:', e);
    }
  };

  // 6. Tournament State
  const [tournamentMatches, setTournamentMatches] = useState<TournamentMatchState[]>(() => {
    try {
      const saved = localStorage.getItem('isim_tournament_matches');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return createInitialTournamentMatches(INITIAL_TEAMS_DATA);
  });

  const [tournamentChampion, setTournamentChampion] = useState<Team | null>(() => {
    try {
      const saved = localStorage.getItem('isim_tournament_champion');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  useEffect(() => {
    try {
      localStorage.setItem('isim_tournament_matches', JSON.stringify(tournamentMatches));
      if (tournamentChampion) {
        localStorage.setItem('isim_tournament_champion', JSON.stringify(tournamentChampion));
      } else {
        localStorage.removeItem('isim_tournament_champion');
      }
    } catch (e) {}
  }, [tournamentMatches, tournamentChampion]);

  const handleResetTournament = () => {
    setTournamentMatches(createInitialTournamentMatches(teams));
    setTournamentChampion(null);
  };

  // Active match tracking reference for fixture/tournament linkage
  const activeFixtureIdRef = useRef<string | null>(null);

  // 7. Active Match State
  const [matchState, setMatchState] = useState<MatchState>(() => {
    const home = teams.find(t => t.id === userTeamId) || teams[0];
    const away = teams.find(t => t.id !== home.id) || teams[1];
    return initializeMatchState(home, away, 'friendly');
  });

  // Global user audio unlock
  useEffect(() => {
    const handleFirstInteraction = () => {
      soundManager.unlock();
    };
    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Sound toggle
  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundManager.setMuted(nextMute);
  };

  // Start new match
  const startNewMatch = useCallback((
    homeTeamId: string, 
    awayTeamId: string, 
    mode: MatchState['mode'] = 'friendly',
    tournamentMatchId?: string,
    fixtureId?: string,
    leagueWeek?: number
  ) => {
    const home = teams.find(t => t.id === homeTeamId) || teams[0];
    const away = teams.find(t => t.id === awayTeamId) || teams[1];
    activeFixtureIdRef.current = fixtureId || null;

    const newState = initializeMatchState(home, away, mode, userTeamId, tournamentMatchId, leagueWeek, fixtureId);
    setMatchState(newState);
    setCurrentTab('match');
    soundManager.playWhistle('short');

    // If in multiplayer room as host, broadcast match state
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && userRole === 'host') {
      wsRef.current.send(JSON.stringify({
        type: 'match_update',
        matchState: newState,
      }));
    }
  }, [teams, userRole, userTeamId]);

  // Simulate non-user/remaining matches in current week and update standings
  const simulateRemainingMatchesInWeek = useCallback((weekToSimulate: number) => {
    setLeagueFixtures(prevFixtures => {
      const matchResultsToApply: Array<{ homeTeamId: string; awayTeamId: string; homeScore: number; awayScore: number }> = [];

      const updatedFixtures = prevFixtures.map(fixture => {
        if (fixture.week === weekToSimulate && !fixture.played) {
          const homeT = teams.find(t => t.id === fixture.homeTeamId) || teams[0];
          const awayT = teams.find(t => t.id === fixture.awayTeamId) || teams[1];
          const ratingDiff = (homeT.rating - awayT.rating) * 0.08;

          const homeScore = Math.max(0, Math.floor(Math.random() * 3 + Math.max(0, ratingDiff) + (Math.random() > 0.6 ? 1 : 0)));
          const awayScore = Math.max(0, Math.floor(Math.random() * 3 + Math.max(0, -ratingDiff) + (Math.random() > 0.7 ? 1 : 0)));

          matchResultsToApply.push({
            homeTeamId: fixture.homeTeamId,
            awayTeamId: fixture.awayTeamId,
            homeScore,
            awayScore,
          });

          return {
            ...fixture,
            homeScore,
            awayScore,
            played: true,
          };
        }
        return fixture;
      });

      if (matchResultsToApply.length > 0) {
        // 1. Assign goals to individual players for Top Scorers table (Gol Krallığı)
        setTeams(prevTeams => {
          const goalsMap: Record<string, number> = {};

          matchResultsToApply.forEach(res => {
            const hTeam = prevTeams.find(t => t.id === res.homeTeamId);
            const aTeam = prevTeams.find(t => t.id === res.awayTeamId);

            if (hTeam && res.homeScore > 0) {
              const outfield = hTeam.players.filter(p => p.position !== 'GK');
              for (let g = 0; g < res.homeScore; g++) {
                const roll = Math.random();
                let pool = outfield.filter(p => p.position === 'FW');
                if (pool.length === 0 || roll > 0.55) pool = outfield.filter(p => p.position === 'MF');
                if (pool.length === 0 || roll > 0.90) pool = outfield.filter(p => p.position === 'DF');
                if (pool.length === 0) pool = outfield;

                const scorer = pool[Math.floor(Math.random() * pool.length)];
                if (scorer) {
                  goalsMap[scorer.id] = (goalsMap[scorer.id] || 0) + 1;
                }
              }
            }

            if (aTeam && res.awayScore > 0) {
              const outfield = aTeam.players.filter(p => p.position !== 'GK');
              for (let g = 0; g < res.awayScore; g++) {
                const roll = Math.random();
                let pool = outfield.filter(p => p.position === 'FW');
                if (pool.length === 0 || roll > 0.55) pool = outfield.filter(p => p.position === 'MF');
                if (pool.length === 0 || roll > 0.90) pool = outfield.filter(p => p.position === 'DF');
                if (pool.length === 0) pool = outfield;

                const scorer = pool[Math.floor(Math.random() * pool.length)];
                if (scorer) {
                  goalsMap[scorer.id] = (goalsMap[scorer.id] || 0) + 1;
                }
              }
            }
          });

          if (Object.keys(goalsMap).length === 0) return prevTeams;

          return prevTeams.map(team => ({
            ...team,
            players: team.players.map(p => {
              if (goalsMap[p.id]) {
                return { ...p, goals: p.goals + goalsMap[p.id] };
              }
              return p;
            })
          }));
        });

        // 2. Deterministically recalculate standings from all played fixtures
        setStandings(recalculateStandingsFromFixtures(teams, updatedFixtures));
      }

      return updatedFixtures;
    });
  }, [teams]);

  // Handle match completion persistence (League or Tournament) and return to corresponding screen
  const handleMatchFinishedPersistence = useCallback((finishedState: MatchState) => {
    // 1. If League Match:
    if (finishedState.mode === 'league') {
      const matchWeek = finishedState.leagueWeek || currentWeek;
      const currentFixtureId = finishedState.fixtureId || activeFixtureIdRef.current;

      // Update goal scorers in setTeams for the played live match
      const goalEvents = finishedState.events.filter(ev => ev.type === 'goal');
      if (goalEvents.length > 0) {
        setTeams(prevTeams => {
          const liveGoalsMap: Record<string, number> = {};

          goalEvents.forEach(ev => {
            const team = prevTeams.find(t => t.id === ev.teamId);
            if (team) {
              const player = (ev.playerName && team.players.find(p => p.name === ev.playerName)) ||
                team.players.find(p => p.position === 'FW') ||
                team.players[0];
              if (player) {
                liveGoalsMap[player.id] = (liveGoalsMap[player.id] || 0) + 1;
              }
            }
          });

          if (Object.keys(liveGoalsMap).length === 0) return prevTeams;

          return prevTeams.map(t => ({
            ...t,
            players: t.players.map(p => {
              if (liveGoalsMap[p.id]) {
                return { ...p, goals: p.goals + liveGoalsMap[p.id] };
              }
              return p;
            })
          }));
        });
      }

      // Mark played live match AND simulate remaining unplayed matches of this week in a single atomic update
      const simResults: Array<{ homeTeamId: string; awayTeamId: string; homeScore: number; awayScore: number }> = [];

      setLeagueFixtures(prevFixtures => {
        const nextFixtures = prevFixtures.map(f => {
          const isTargetLiveMatch = currentFixtureId 
            ? f.id === currentFixtureId 
            : (f.week === matchWeek && f.homeTeamId === finishedState.homeTeam.id && f.awayTeamId === finishedState.awayTeam.id);

          if (isTargetLiveMatch) {
            return {
              ...f,
              homeScore: finishedState.homeScore,
              awayScore: finishedState.awayScore,
              played: true,
            };
          }

          // Simulate all other unplayed matches in the exact same week
          if (f.week === matchWeek && !f.played) {
            const homeT = teams.find(t => t.id === f.homeTeamId) || teams[0];
            const awayT = teams.find(t => t.id === f.awayTeamId) || teams[1];
            const ratingDiff = (homeT.rating - awayT.rating) * 0.08;

            const homeScore = Math.max(0, Math.floor(Math.random() * 3 + Math.max(0, ratingDiff) + (Math.random() > 0.6 ? 1 : 0)));
            const awayScore = Math.max(0, Math.floor(Math.random() * 3 + Math.max(0, -ratingDiff) + (Math.random() > 0.7 ? 1 : 0)));

            simResults.push({
              homeTeamId: f.homeTeamId,
              awayTeamId: f.awayTeamId,
              homeScore,
              awayScore,
            });

            return {
              ...f,
              homeScore,
              awayScore,
              played: true,
            };
          }

          return f;
        });

        // Recalculate standings once cleanly from nextFixtures
        setStandings(recalculateStandingsFromFixtures(teams, nextFixtures));

        return nextFixtures;
      });

      // Update player goals for simulated matches if any
      if (simResults.length > 0) {
        setTeams(prevTeams => {
          const goalsMap: Record<string, number> = {};

          simResults.forEach(res => {
            const hTeam = prevTeams.find(t => t.id === res.homeTeamId);
            const aTeam = prevTeams.find(t => t.id === res.awayTeamId);

            if (hTeam && res.homeScore > 0) {
              const outfield = hTeam.players.filter(p => p.position !== 'GK');
              for (let g = 0; g < res.homeScore; g++) {
                const roll = Math.random();
                let pool = outfield.filter(p => p.position === 'FW');
                if (pool.length === 0 || roll > 0.55) pool = outfield.filter(p => p.position === 'MF');
                if (pool.length === 0 || roll > 0.90) pool = outfield.filter(p => p.position === 'DF');
                if (pool.length === 0) pool = outfield;

                const scorer = pool[Math.floor(Math.random() * pool.length)];
                if (scorer) {
                  goalsMap[scorer.id] = (goalsMap[scorer.id] || 0) + 1;
                }
              }
            }

            if (aTeam && res.awayScore > 0) {
              const outfield = aTeam.players.filter(p => p.position !== 'GK');
              for (let g = 0; g < res.awayScore; g++) {
                const roll = Math.random();
                let pool = outfield.filter(p => p.position === 'FW');
                if (pool.length === 0 || roll > 0.55) pool = outfield.filter(p => p.position === 'MF');
                if (pool.length === 0 || roll > 0.90) pool = outfield.filter(p => p.position === 'DF');
                if (pool.length === 0) pool = outfield;

                const scorer = pool[Math.floor(Math.random() * pool.length)];
                if (scorer) {
                  goalsMap[scorer.id] = (goalsMap[scorer.id] || 0) + 1;
                }
              }
            }
          });

          if (Object.keys(goalsMap).length === 0) return prevTeams;

          return prevTeams.map(team => ({
            ...team,
            players: team.players.map(p => {
              if (goalsMap[p.id]) {
                return { ...p, goals: p.goals + goalsMap[p.id] };
              }
              return p;
            })
          }));
        });
      }

      // Auto-navigate back to League Fixtures tab after 2.5 seconds
      setTimeout(() => {
        setViewingWeek(matchWeek);
        setCurrentTab('league');
      }, 2500);
    }

    // 2. If Tournament Match:
    if (finishedState.mode === 'tournament') {
      const matchIdToUpdate = finishedState.tournamentMatchId;
      setTournamentMatches(prev => {
        const updatedMatches = prev.map(m => {
          const isTarget = matchIdToUpdate ? m.id === matchIdToUpdate : (
            (m.homeTeam.id === finishedState.homeTeam.id && m.awayTeam.id === finishedState.awayTeam.id) ||
            (m.homeTeam.id === finishedState.awayTeam.id && m.awayTeam.id === finishedState.homeTeam.id)
          );
          if (!isTarget || m.winnerTeamId) return m;

          let hScore = finishedState.homeScore;
          let aScore = finishedState.awayScore;
          if (hScore === aScore) {
            if (Math.random() > 0.5) hScore += 1;
            else aScore += 1;
          }

          const winner = hScore > aScore ? m.homeTeam : m.awayTeam;
          return {
            ...m,
            homeScore: hScore,
            awayScore: aScore,
            winnerTeamId: winner.id,
          };
        });

        const { nextMatches, newChampion } = advanceTournamentMatches(updatedMatches);
        if (newChampion) {
          setTournamentChampion(newChampion);
        }
        return nextMatches;
      });

      // Auto-navigate back to Tournament mode after 2.5 seconds
      setTimeout(() => {
        setCurrentTab('tournament');
      }, 2500);
    }
  }, [currentWeek, simulateRemainingMatchesInWeek]);

  // Quick simulate tournament match
  const handleSimulateTournamentMatch = (matchId: string) => {
    setTournamentMatches(prev => {
      const next = prev.map(m => {
        if (m.id !== matchId || m.winnerTeamId) return m;

        const ratingDiff = (m.homeTeam.rating - m.awayTeam.rating) * 0.1;
        let hScore = Math.floor(Math.random() * 3 + Math.max(0, ratingDiff));
        let aScore = Math.floor(Math.random() * 3 + Math.max(0, -ratingDiff));
        if (hScore === aScore) {
          if (Math.random() > 0.5) hScore += 1;
          else aScore += 1;
        }

        const winner = hScore > aScore ? m.homeTeam : m.awayTeam;
        return {
          ...m,
          homeScore: hScore,
          awayScore: aScore,
          winnerTeamId: winner.id,
        };
      });

      const { nextMatches, newChampion } = advanceTournamentMatches(next);
      if (newChampion) {
        setTournamentChampion(newChampion);
      }
      return nextMatches;
    });
  };

  // Advance to next league week
  const handleAdvanceToNextWeek = () => {
    if (currentWeek < 34) {
      const nextW = currentWeek + 1;
      setCurrentWeek(nextW);
      setViewingWeek(nextW);
      soundManager.playWhistle('short');
    }
  };

  // Handle Team Selection from Modal
  const handleSelectUserTeam = (newTeamId: string, action?: 'play_match' | 'start_league') => {
    setUserTeamId(newTeamId);
    try {
      localStorage.setItem('isim_user_team_id', newTeamId);
    } catch (e) {}

    if (action === 'start_league') {
      handleResetLeagueSeason();
      setCurrentTab('league');
    } else if (action === 'play_match') {
      const opp = teams.find(t => t.id !== newTeamId) || teams[1];
      startNewMatch(newTeamId, opp.id, 'friendly');
    }
  };

  // Manager tactics updates
  const handleFormationChange = (isHome: boolean, formation: Formation) => {
    setMatchState(prev => {
      const targetTeam = isHome ? prev.homeTeam : prev.awayTeam;
      const updatedTeam = { ...targetTeam, formation };
      return {
        ...prev,
        [isHome ? 'homeTeam' : 'awayTeam']: updatedTeam,
      };
    });

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeRoomId) {
      wsRef.current.send(JSON.stringify({
        type: 'tactic_change',
        teamId: isHome ? matchState.homeTeam.id : matchState.awayTeam.id,
        formation,
      }));
    }
  };

  const handleTacticChange = (isHome: boolean, tactic: TacticalMindset) => {
    setMatchState(prev => {
      const targetTeam = isHome ? prev.homeTeam : prev.awayTeam;
      const updatedTeam = { ...targetTeam, tactic };
      return {
        ...prev,
        [isHome ? 'homeTeam' : 'awayTeam']: updatedTeam,
      };
    });

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeRoomId) {
      wsRef.current.send(JSON.stringify({
        type: 'tactic_change',
        teamId: isHome ? matchState.homeTeam.id : matchState.awayTeam.id,
        tactic,
      }));
    }
  };

  // Substitutions
  const handleSubstitute = (isHome: boolean, starterId: string, benchId: string) => {
    setMatchState(prev => {
      // Guard: Cannot substitute a red-carded player
      const simOut = prev.players.find(p => p.id === starterId);
      if (simOut?.isRedCarded) return prev;

      const targetTeam = isHome ? prev.homeTeam : prev.awayTeam;
      const outPlayer = targetTeam.players.find(p => p.id === starterId);
      const inPlayer = targetTeam.players.find(p => p.id === benchId);

      if (!outPlayer || !inPlayer || outPlayer.redCards > 0) return prev;

      const updatedPlayers = targetTeam.players.map(p => {
        if (p.id === starterId) return { ...p, isStarter: false };
        if (p.id === benchId) return { ...p, isStarter: true };
        return p;
      });

      const updatedTeam: Team = {
        ...targetTeam,
        players: updatedPlayers,
      };

      const updatedSimPlayers = prev.players.map(p => {
        if (p.id === starterId && p.isHome === isHome) {
          return {
            ...p,
            id: inPlayer.id,
            name: inPlayer.name,
            number: inPlayer.number,
            position: inPlayer.position,
            rating: inPlayer.rating,
            pace: inPlayer.pace,
            shooting: inPlayer.shooting,
            passing: inPlayer.passing,
            defending: inPlayer.defending,
            stamina: inPlayer.stamina,
            staminaLeft: 100,
            yellowCards: 0,
            redCards: 0,
          };
        }
        return p;
      });

      const subBanner = outPlayer && inPlayer ? {
        outPlayer: {
          name: outPlayer.name,
          number: outPlayer.number,
          position: outPlayer.position,
        },
        inPlayer: {
          name: inPlayer.name,
          number: inPlayer.number,
          position: inPlayer.position,
        },
        teamName: targetTeam.name,
        isHome,
        teamColor: targetTeam.primaryColor,
        timer: 4.5,
      } : null;

      return {
        ...prev,
        players: updatedSimPlayers,
        [isHome ? 'homeTeam' : 'awayTeam']: updatedTeam,
        substitutionBanner: subBanner,
      };
    });
  };

  // Speed and Pause controls
  const handleSpeedChange = (newSpeed: 1 | 2 | 4 | 8) => {
    setMatchState(prev => ({ ...prev, speed: newSpeed }));
  };

  const handleTogglePause = () => {
    setMatchState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  // Restart active match
  const handleRestartMatch = () => {
    startNewMatch(matchState.homeTeam.id, matchState.awayTeam.id, matchState.mode, matchState.tournamentMatchId, activeFixtureIdRef.current || undefined);
  };

  // Leave active multiplayer room
  const handleLeaveRoom = useCallback(() => {
    try {
      sessionStorage.removeItem('isim_active_room');
    } catch (e) {}
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }
    setActiveRoomId(null);
    setUserRole(null);
    setRoomState(null);
    setSpectatorCount(0);
  }, []);

  // Host starts online match with guest or opponent
  const handleStartOnlineMatch = useCallback((homeTeamId: string, awayTeamId: string) => {
    soundManager.unlock();
    const home = teams.find(t => t.id === homeTeamId) || teams[0];
    const away = teams.find(t => t.id === awayTeamId) || teams.find(t => t.id !== home.id) || teams[1];
    const newState = initializeMatchState(home, away, 'friendly');
    setMatchState(newState);
    setCurrentTab('match');
    soundManager.playWhistle('short');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'start_match',
        matchState: newState,
        homeTeamId,
        awayTeamId,
      }));
    }
  }, [teams]);

  // Multiplayer join
  const handleJoinMultiplayerRoom = (roomId: string, teamId: string, role: 'host' | 'guest' | 'spectator') => {
    handleLeaveRoom();

    try {
      sessionStorage.setItem('isim_active_room', JSON.stringify({ roomId, teamId, role }));
    } catch (e) {}

    setActiveRoomId(roomId);
    setUserRole(role);
    setUserTeamId(teamId);
    soundManager.unlock();

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'join',
          roomId,
          teamId,
          role,
        }));

        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          soundManager.unlock();
          const msg = JSON.parse(event.data);

          if (msg.type === 'joined') {
            if (msg.roomState) {
              setRoomState(msg.roomState);
              setSpectatorCount(msg.roomState.spectatorCount || 0);
            }
            if (msg.latestMatchState && (role === 'guest' || role === 'spectator')) {
              setMatchState(msg.latestMatchState);
              setCurrentTab('match');
            }
          } else if (msg.type === 'room_state') {
            setRoomState(msg);
            setSpectatorCount(msg.spectatorCount || 0);
          } else if (msg.type === 'start_match') {
            setMatchState(msg.matchState);
            setCurrentTab('match');
            soundManager.unlock();
            soundManager.playWhistle('short');
          } else if (msg.type === 'match_update') {
            if (role === 'guest' || role === 'spectator') {
              if (msg.matchState.homeScore > prevScoreRef.current.h || msg.matchState.awayScore > prevScoreRef.current.a) {
                prevScoreRef.current = { h: msg.matchState.homeScore, a: msg.matchState.awayScore };
                soundManager.unlock();
                soundManager.playGoalRoar();
              }
              setMatchState(msg.matchState);
            }
          } else if (msg.type === 'manager_action') {
            const { actionType, teamId: tId, payload } = msg;
            if (actionType === 'tactic_change') {
              setMatchState(p => {
                const isH = p.homeTeam.id === tId;
                const target = isH ? p.homeTeam : p.awayTeam;
                const updated = { ...target, tactic: payload.tactic };
                return {
                  ...p,
                  [isH ? 'homeTeam' : 'awayTeam']: updated,
                };
              });
            } else if (actionType === 'formation_change') {
              setMatchState(p => {
                const isH = p.homeTeam.id === tId;
                const target = isH ? p.homeTeam : p.awayTeam;
                const updated = { ...target, formation: payload.formation };
                return {
                  ...p,
                  [isH ? 'homeTeam' : 'awayTeam']: updated,
                };
              });
            } else if (actionType === 'substitute') {
              handleSubstitute(payload.isHome, payload.starterId, payload.benchId);
            }
          } else if (msg.type === 'tactic_change') {
            const { teamId: tId, formation, tactic } = msg;
            setMatchState(p => {
              const isH = p.homeTeam.id === tId;
              const target = isH ? p.homeTeam : p.awayTeam;
              const updated = {
                ...target,
                ...(formation ? { formation } : {}),
                ...(tactic ? { tactic } : {}),
              };
              return {
                ...p,
                [isH ? 'homeTeam' : 'awayTeam']: updated,
              };
            });
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onerror = (err) => {
        console.warn('WS error:', err);
      };
    } catch (err) {
      console.warn('WebSocket unavailable:', err);
    }
  };

  // Main simulation loop using requestAnimationFrame
  const lastTimeRef = useRef<number>(performance.now());
  const prevScoreRef = useRef<{ h: number; a: number }>({ h: 0, a: 0 });

  useEffect(() => {
    let animationFrameId: number;

    const loop = (time: number) => {
      const dt = Math.min(0.08, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      // Only host or single-player local mode runs physics engine!
      if (userRole === 'host' || userRole === null) {
        setMatchState(prev => {
          const next = updateSimulation(prev, dt);

          // Check if goal was scored for sound
          if (next.homeScore > prevScoreRef.current.h || next.awayScore > prevScoreRef.current.a) {
            prevScoreRef.current = { h: next.homeScore, a: next.awayScore };
            soundManager.playGoalRoar();
          }

          // Broadcast match state if host (~30 fps throttle)
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && userRole === 'host') {
            const now = performance.now();
            if (now - lastWsSendRef.current >= 33) {
              lastWsSendRef.current = now;
              wsRef.current.send(JSON.stringify({
                type: 'match_update',
                matchState: next,
              }));
            }
          }

          return next;
        });
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [userRole]);

  // Dedicated Effect: Persist finished match results (League or Tournament) strictly ONCE per match
  useEffect(() => {
    if (matchState.status === 'finished' && !matchState.isPersisted && (matchState.mode === 'league' || matchState.mode === 'tournament')) {
      const targetFixtureId = matchState.fixtureId || activeFixtureIdRef.current;
      const matchKey = targetFixtureId 
        ? targetFixtureId 
        : `${matchState.mode}_w${matchState.leagueWeek || currentWeek}_${matchState.homeTeam.id}_${matchState.awayTeam.id}`;

      if (!persistedMatchKeysRef.current.has(matchKey)) {
        persistedMatchKeysRef.current.add(matchKey);
        setMatchState(prev => ({ ...prev, isPersisted: true }));
        handleMatchFinishedPersistence(matchState);
      }
    }
  }, [matchState.status, matchState.isPersisted, matchState, currentWeek, handleMatchFinishedPersistence]);

  const userTeam = teams.find(t => t.id === userTeamId) || teams[0];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-['Outfit'] selection:bg-amber-500 selection:text-slate-950">
      {/* 1. TOP STADIUM NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md px-4 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & League Title */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 font-black font-['Chakra_Petch'] text-xl shadow-lg ring-2 ${
              gameMode === 'superlig' 
                ? 'bg-gradient-to-tr from-red-600 to-rose-400 text-white ring-red-500/50' 
                : 'bg-gradient-to-tr from-amber-500 to-yellow-300 ring-amber-400/40'
            }`}>
              {gameMode === 'superlig' ? '🇹🇷' : 'i-S'}
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black tracking-wider text-white font-['Chakra_Petch'] flex items-center gap-2">
                <span>{gameMode === 'superlig' ? 'TÜRKİYE SÜPER LİG' : 'i-SiM 1. FUTBOL LİGİ'}</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  gameMode === 'superlig'
                    ? 'bg-red-500/20 text-red-300 border-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {gameMode === 'superlig' ? 'SÜPER LİG MODU' : '2D MENAJERLİK'}
                </span>
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>18 Takım</span>
                <span>•</span>
                <span className="text-amber-400 font-bold font-['Chakra_Petch']">34 Hafta Sezonu</span>
                {userTeam && (
                  <>
                    <span>•</span>
                    <button
                      onClick={() => setTeamSelectModalOpen(true)}
                      className="text-amber-300 hover:text-white font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <TeamFlag team={userTeam} size="sm" showPole={false} />
                      <span>{userTeam.name}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Mode Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
            {/* Match Mode */}
            <button
              onClick={() => setCurrentTab('match')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                currentTab === 'match'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>Canlı Saha</span>
            </button>

            {/* League Mode */}
            <button
              onClick={() => setCurrentTab('league')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                currentTab === 'league'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Lig Modu</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-400/20 text-amber-300 font-bold">
                H.{currentWeek}
              </span>
            </button>

            {/* Tournament Mode */}
            <button
              onClick={() => setCurrentTab('tournament')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                currentTab === 'tournament'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Turnuva Kupası</span>
            </button>

            {/* Club & Squad Customizer */}
            <button
              onClick={() => setCurrentTab('customizer')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                currentTab === 'customizer'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Kulüp & Kadro</span>
            </button>
          </div>

          {/* Action Modals & Audio */}
          <div className="flex items-center gap-2">
            {/* Friendly match modal trigger */}
            <button
              onClick={() => setFriendlyModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold text-xs transition-colors hidden sm:flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Özel Maç</span>
            </button>

            {/* Multiplayer */}
            <button
              onClick={() => setMultiplayerModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Online Oda</span>
            </button>

            {/* Mute audio */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
        {/* TAB: MATCH (CANLI MAÇ VE SAHA) */}
        {currentTab === 'match' && (
          <div className="space-y-2.5 animate-fade-in">
            {/* Quick Action bar above match */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 border border-slate-800 px-3 py-2 rounded-xl shadow">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium">
                  {matchState.mode === 'league' ? `Lig Maçı (Hafta ${currentWeek}):` : matchState.mode === 'tournament' ? 'Turnuva Eleme Maçı:' : 'Özel Hazırlık Maçı:'}
                </span>
                <span className="font-bold text-white font-['Chakra_Petch']">{matchState.homeTeam.name}</span>
                <span className="text-amber-400 font-bold font-mono">VS</span>
                <span className="font-bold text-white font-['Chakra_Petch']">{matchState.awayTeam.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {matchState.mode === 'league' ? (
                  <button
                    onClick={() => {
                      setViewingWeek(currentWeek);
                      setCurrentTab('league');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 border border-amber-500/30"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Fikstüre Geri Dön</span>
                  </button>
                ) : matchState.mode === 'tournament' ? (
                  <button
                    onClick={() => setCurrentTab('tournament')}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 border border-amber-500/30"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Turnuva Tablosuna Dön</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setTeamSelectModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
                  >
                    Takımı Değiştir
                  </button>
                )}

                <button
                  onClick={handleRestartMatch}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  <span>Baştan Başlat</span>
                </button>
              </div>
            </div>

            {/* Online Room Status Bar & Host Disconnect Recovery */}
            {activeRoomId && (
              <div className={`px-4 py-2 rounded-xl text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow border ${
                roomState?.hostConnected === false
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
                  : roomState?.guestConnected === false
                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>ONLİNE ODA #{activeRoomId}</span>
                  <span className="text-slate-400">| Rol: {userRole === 'host' ? 'Ev Sahibi (1. Oyuncu)' : userRole === 'guest' ? 'Deplasman (2. Oyuncu)' : 'Seyirci'}</span>
                </div>

                {roomState?.hostConnected === false && (userRole === 'guest' || userRole === 'spectator') && (
                  <div className="flex items-center gap-2">
                    <span>⚠️ Ev Sahibi Yeniden Bağlanıyor...</span>
                    <button
                      onClick={() => {
                        setUserRole('host');
                        try {
                          sessionStorage.setItem('isim_active_room', JSON.stringify({ roomId: activeRoomId, teamId: userTeamId, role: 'host' }));
                        } catch (e) {}
                      }}
                      className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-black hover:bg-amber-400 text-[11px] uppercase shadow hover:scale-105 transition-all"
                    >
                      Maçı Ev Sahibi Olarak Devam Ettir
                    </button>
                  </div>
                )}

                {roomState?.guestConnected === false && userRole === 'host' && (
                  <div className="text-amber-400 text-[11px]">
                    ⏳ Deplasman oyuncusunun yeniden bağlanması bekleniyor...
                  </div>
                )}
              </div>
            )}

            {/* Match Finished Notification Banner */}
            {matchState.status === 'finished' && (
              <div className="bg-gradient-to-r from-emerald-600/30 via-teal-500/20 to-emerald-600/30 border border-emerald-500/40 p-3.5 rounded-xl flex items-center justify-between gap-3 animate-fade-in shadow-xl">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-black text-white font-['Chakra_Petch']">
                      KARŞILAŞMA SONA ERDİ! ({matchState.homeScore} - {matchState.awayScore})
                    </h4>
                    <p className="text-xs text-emerald-300/80">
                      {matchState.mode === 'league' 
                        ? 'Maç sonucu fikstüre ve lig puan durumuna başarıyla işlendi. Fikstür ekranına aktarılıyorsunuz...'
                        : matchState.mode === 'tournament'
                        ? 'Turnuva skoru kupa ağacına işlendi. Turnuva tablosuna aktarılıyorsunuz...'
                        : 'Özel hazırlık maçı tamamlandı.'}
                    </p>
                  </div>
                </div>
                {matchState.mode === 'league' && (
                  <button
                    onClick={() => {
                      setViewingWeek(currentWeek);
                      setCurrentTab('league');
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs hover:scale-105 transition-all shrink-0"
                  >
                    Fikstüre Git
                  </button>
                )}
                {matchState.mode === 'tournament' && (
                  <button
                    onClick={() => setCurrentTab('tournament')}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs hover:scale-105 transition-all shrink-0"
                  >
                    Turnuvaya Git
                  </button>
                )}
              </div>
            )}

            {/* Scoreboard */}
            <ScoreBoard state={matchState} />

            {/* 2D Pitch Canvas (Saha - skorboardun hemen altında) */}
            <MatchCanvas state={matchState} />

            {/* Match Stats, Live Commentary & Percentages (Sahanın alt kısmında) */}
            <MatchStatsPanel state={matchState} />

            {/* Tactics Controls (Home Team & Away Team Managers) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
              {/* Home Team Tactics */}
              <TacticsBoard
                team={matchState.homeTeam}
                isHome={true}
                simPlayers={matchState.players}
                onFormationChange={f => handleFormationChange(true, f)}
                onTacticChange={t => handleTacticChange(true, t)}
                onSubstitute={(sId, bId) => handleSubstitute(true, sId, bId)}
                speed={matchState.speed}
                isPaused={matchState.isPaused}
                onSpeedChange={handleSpeedChange}
                onTogglePause={handleTogglePause}
              />

              {/* Away Team Tactics */}
              <TacticsBoard
                team={matchState.awayTeam}
                isHome={false}
                simPlayers={matchState.players}
                onFormationChange={f => handleFormationChange(false, f)}
                onTacticChange={t => handleTacticChange(false, t)}
                onSubstitute={(sId, bId) => handleSubstitute(false, sId, bId)}
                speed={matchState.speed}
                isPaused={matchState.isPaused}
                onSpeedChange={handleSpeedChange}
                onTogglePause={handleTogglePause}
              />
            </div>
          </div>
        )}

        {/* TAB: LEAGUE (LİG MODU) */}
        {currentTab === 'league' && (
          <div className="animate-fade-in">
            <LeagueView
              teams={teams}
              standings={standings}
              fixtures={leagueFixtures}
              currentWeek={currentWeek}
              viewingWeek={viewingWeek}
              onSetViewingWeek={setViewingWeek}
              onPlayLeagueMatch={(fId, hId, aId) => startNewMatch(hId, aId, 'league', undefined, fId, viewingWeek)}
              onSimulateRemainingWeekMatches={() => simulateRemainingMatchesInWeek(currentWeek)}
              onAdvanceToNextWeek={handleAdvanceToNextWeek}
              onResetLeagueSeason={handleResetLeagueSeason}
              userTeamId={userTeamId}
              onOpenTeamSelect={() => setTeamSelectModalOpen(true)}
            />
          </div>
        )}

        {/* TAB: TOURNAMENT (TURNUVA KUPASI) */}
        {currentTab === 'tournament' && (
          <div className="animate-fade-in">
            <TournamentView
              teams={teams}
              tournamentMatches={tournamentMatches}
              champion={tournamentChampion}
              onPlayMatch={(hId, aId, tMatchId) => startNewMatch(hId, aId, 'tournament', tMatchId)}
              onSimulateMatch={handleSimulateTournamentMatch}
              onResetTournament={handleResetTournament}
            />
          </div>
        )}

        {/* TAB: CUSTOMIZER (KULÜP & KADRO JSON DÜZENLEYİCİ) */}
        {currentTab === 'customizer' && (
          <div className="animate-fade-in">
            <TeamCustomizer
              teams={teams}
              onUpdateTeam={handleUpdateTeam}
              onResetTeams={handleResetTeams}
              gameMode={gameMode}
              onSwitchGameMode={handleSwitchGameMode}
            />
          </div>
        )}
      </main>

      {/* 3. MODALS */}
      <TeamSelectModal
        teams={teams}
        isOpen={teamSelectModalOpen}
        onClose={() => setTeamSelectModalOpen(false)}
        selectedTeamId={userTeamId}
        onSelectTeam={handleSelectUserTeam}
      />

      <FriendlyMatchModal
        teams={teams}
        isOpen={friendlyModalOpen}
        onClose={() => setFriendlyModalOpen(false)}
        onStartMatch={(hId, aId) => startNewMatch(hId, aId, 'friendly')}
      />

      <MultiplayerModal
        teams={teams}
        isOpen={multiplayerModalOpen}
        onClose={() => setMultiplayerModalOpen(false)}
        onJoinRoom={handleJoinMultiplayerRoom}
        onStartOnlineMatch={handleStartOnlineMatch}
        onLeaveRoom={handleLeaveRoom}
        activeRoomId={activeRoomId}
        userRole={userRole}
        spectatorCount={spectatorCount}
        guestConnected={roomState?.guestConnected}
        hostConnected={roomState?.hostConnected}
        hostTeamId={roomState?.hostTeamId}
        guestTeamId={roomState?.guestTeamId}
      />
    </div>
  );
}
