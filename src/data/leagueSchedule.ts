import { Team, LeagueFixture } from '../types';

/**
 * Generates a full 34-week double round-robin fixture schedule for 18 teams using the polygon (circle) algorithm.
 * Each week has 9 matches (total 34 weeks * 9 matches = 306 matches).
 */
export function generateLeagueSchedule(teams: Team[]): LeagueFixture[] {
  // Shuffle copy of teams so every new season gets a fresh, re-arranged 34-week fixture schedule
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
  const teamIds = shuffledTeams.map(t => t.id);
  const n = teamIds.length; // 18
  if (n < 2) return [];

  const fixtures: LeagueFixture[] = [];
  const totalWeeks = (n - 1) * 2; // 34 weeks
  const halfWeeks = n - 1; // 17 weeks

  // Circle algorithm for round-robin
  const list = [...teamIds];

  for (let week = 1; week <= halfWeeks; week++) {
    for (let i = 0; i < n / 2; i++) {
      const homeIdx = i;
      const awayIdx = n - 1 - i;
      
      const homeTeamId = (week % 2 === 1 && i === 0) ? list[awayIdx] : list[homeIdx];
      const awayTeamId = (week % 2 === 1 && i === 0) ? list[homeIdx] : list[awayIdx];

      fixtures.push({
        id: `w${week}-m${i}`,
        week,
        homeTeamId,
        awayTeamId,
        played: false,
      });
    }

    // Rotate array elements keeping index 0 fixed
    const fixed = list[0];
    const rest = list.slice(1);
    const last = rest.pop()!;
    rest.unshift(last);
    list.splice(0, list.length, fixed, ...rest);
  }

  // Second half of the season (Weeks 18-34) with reversed home/away sides
  for (let week = 1; week <= halfWeeks; week++) {
    const returnWeek = week + halfWeeks;
    const firstHalfMatches = fixtures.filter(f => f.week === week);

    for (const f of firstHalfMatches) {
      fixtures.push({
        id: `w${returnWeek}-${f.id}`,
        week: returnWeek,
        homeTeamId: f.awayTeamId,
        awayTeamId: f.homeTeamId,
        played: false,
      });
    }
  }

  return fixtures;
}
