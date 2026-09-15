import { Team } from '../types';

export interface TournamentMatchState {
  id: string;
  round: 'roundOf16' | 'quarter' | 'semi' | 'final';
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  winnerTeamId?: string;
}

export function createInitialTournamentMatches(teams: Team[]): TournamentMatchState[] {
  const top16 = teams.slice(0, 16);
  const initialMatches: TournamentMatchState[] = [];
  for (let i = 0; i < 8; i++) {
    initialMatches.push({
      id: `r16-${i}`,
      round: 'roundOf16',
      homeTeam: top16[i],
      awayTeam: top16[15 - i],
    });
  }
  return initialMatches;
}

export function advanceTournamentMatches(matches: TournamentMatchState[]): {
  nextMatches: TournamentMatchState[];
  newChampion: Team | null;
} {
  const next = [...matches];
  const r16Matches = next.filter(m => m.round === 'roundOf16');
  const quarterMatches = next.filter(m => m.round === 'quarter');
  const semiMatches = next.filter(m => m.round === 'semi');
  const finalMatch = next.find(m => m.round === 'final');

  // If R16 all finished and no quarters yet
  if (r16Matches.length === 8 && r16Matches.every(m => m.winnerTeamId) && quarterMatches.length === 0) {
    const winners = r16Matches.map(m => (m.winnerTeamId === m.homeTeam.id ? m.homeTeam : m.awayTeam));
    for (let i = 0; i < 4; i++) {
      next.push({
        id: `q-${i}`,
        round: 'quarter',
        homeTeam: winners[i * 2],
        awayTeam: winners[i * 2 + 1],
      });
    }
  }
  // If Quarters finished and no semis yet
  else if (quarterMatches.length === 4 && quarterMatches.every(m => m.winnerTeamId) && semiMatches.length === 0) {
    const winners = quarterMatches.map(m => (m.winnerTeamId === m.homeTeam.id ? m.homeTeam : m.awayTeam));
    next.push(
      { id: 's-0', round: 'semi', homeTeam: winners[0], awayTeam: winners[1] },
      { id: 's-1', round: 'semi', homeTeam: winners[2], awayTeam: winners[3] }
    );
  }
  // If Semis finished and no final yet
  else if (semiMatches.length === 2 && semiMatches.every(m => m.winnerTeamId) && !finalMatch) {
    const winners = semiMatches.map(m => (m.winnerTeamId === m.homeTeam.id ? m.homeTeam : m.awayTeam));
    next.push({
      id: 'final-0',
      round: 'final',
      homeTeam: winners[0],
      awayTeam: winners[1],
    });
  }

  let newChampion: Team | null = null;
  const currentFinal = next.find(m => m.round === 'final');
  if (currentFinal && currentFinal.winnerTeamId) {
    newChampion = currentFinal.winnerTeamId === currentFinal.homeTeam.id ? currentFinal.homeTeam : currentFinal.awayTeam;
  }

  return { nextMatches: next, newChampion };
}
