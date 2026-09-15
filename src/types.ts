export type Position = 'GK' | 'DF' | 'MF' | 'FW';

export type TacticalMindset = 'bus' | 'balanced' | 'attack' | 'allOut';

export type Formation = '2-2-1' | '2-1-2' | '1-3-1' | '3-1-1' | '1-2-2' | '2-3-0';

export interface Player {
  id: string;
  number: number;
  name: string;
  position: Position;
  rating: number; // 50 - 99
  overall?: number;
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  stamina: number;
  isStarter: boolean;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

export interface KitColors {
  jerseyMain: string;
  jerseySecondary: string;
  pattern: 'plain' | 'vertical_stripes' | 'horizontal_stripes' | 'halved' | 'diagonal_sash' | 'sleeves_contrast';
  shorts: string;
  socks: string;
  numberColor: string;
  nameColor: string;
  collarColor: string;
}

export interface Team {
  id: string;
  code: string;
  name: string;
  shortName: string;
  rating: number;
  letter: string;
  slogan: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  homeKit: KitColors;
  awayKit: KitColors;
  gkKit: KitColors;
  flagPattern: 'stripes_vertical' | 'stripes_horizontal' | 'diagonal_split' | 'diagonal_sash' | 'solid_bordered' | 'halved';
  players: Player[];
  formation: Formation;
  tactic: TacticalMindset;
}

export interface MatchStats {
  possession: [number, number]; // [home%, away%]
  possessionTime?: [number, number]; // accumulated possession time in seconds [homeSec, awaySec]
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  passes: [number, number];
  saves: [number, number];
}

export interface MatchEvent {
  id: string;
  minute: number;
  second: number;
  type: 'goal' | 'shot' | 'save' | 'post' | 'foul' | 'corner' | 'yellow_card' | 'red_card' | 'sub' | 'kickoff' | 'halftime' | 'fulltime' | 'pass';
  teamId: string;
  playerId?: string;
  playerName?: string;
  detail: string;
}

export interface SimBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number; // height for 3D elevation feeling
  vz: number;
  holderPlayerId: string | null;
  lastTeamId: string | null;
  isInGoal: boolean;
}

export type RestartReason = 'kickoff' | 'throw_in' | 'corner' | 'goal_kick' | 'free_kick' | 'penalty' | 'offside' | 'foul';

export interface PendingSubstitution {
  id?: string;
  isHome: boolean;
  starterId: string;
  benchId: string;
}

export interface SubstitutionBanner {
  outPlayer: {
    name: string;
    number: number;
    position: Position;
  };
  inPlayer: {
    name: string;
    number: number;
    position: Position;
  };
  teamName: string;
  isHome: boolean;
  teamColor: string;
  timer: number;
}

export interface RefereeDecisionBanner {
  type: 'foul' | 'yellow_card' | 'second_yellow' | 'red_card' | 'penalty' | 'offside' | 'corner' | 'throw_in' | 'goal_kick';
  title: string;
  detail: string;
  teamName?: string;
  playerName?: string;
  isHome?: boolean;
  timer: number;
}

export interface SimReferee {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
}

export interface SimPlayerNode {
  id: string;
  teamId: string;
  playerData: Player;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  role: Position;
  number: number;
  name: string;
  stamina: number;
  hasBall: boolean;
  actionCooldown: number;
  headingAngle: number;
  yellowCards: number;
  isRedCarded: boolean;
}

export interface MatchState {
  id: string;
  mode: 'friendly' | 'tournament' | 'league' | 'online';
  leagueWeek?: number;
  fixtureId?: string;
  isPersisted?: boolean;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  minute: number;
  second: number;
  speed: 1 | 2 | 4 | 8;
  isPaused: boolean;
  status: 'pre_match' | 'first_half' | 'halftime' | 'second_half' | 'finished';
  halfTimeTimer?: number;
  sidesSwapped?: boolean;
  ball: SimBall;
  players: SimPlayerNode[];
  referee?: SimReferee;
  events: MatchEvent[];
  stats: MatchStats;
  restartTimer?: number;
  restartTeamId?: string | null;
  restartReason?: RestartReason;
  restartSpot?: { x: number; y: number } | null;
  userTeamId?: string;
  tournamentMatchId?: string;
  lastGoalBanner?: {
    playerName: string;
    teamName: string;
    minute: number;
    teamColor: string;
    isHome: boolean;
  } | null;
  substitutionBanner?: SubstitutionBanner | null;
  refereeDecisionBanner?: RefereeDecisionBanner | null;
  offsideLine?: {
    x: number;
    attackerX: number;
    attackerY: number;
    defenderX: number;
    defenderY: number;
    attackerName: string;
    defenderName: string;
    teamColor: string;
    timer: number;
  } | null;
  pendingSubs?: PendingSubstitution[];
}

export interface LeagueStanding {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: Array<'W' | 'D' | 'L'>;
}

export interface LeagueFixture {
  id: string;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  played: boolean;
}

export interface TournamentMatch {
  id: string;
  round: 'round_18' | 'quarter' | 'semi' | 'final';
  roundName: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore?: number;
  awayScore?: number;
  penaltyHome?: number;
  penaltyAway?: number;
  winnerId?: string;
  isCompleted: boolean;
  nextMatchId?: string;
}

export interface OnlineRoomData {
  roomId: string;
  roomName: string;
  hostPlayerName: string;
  homeTeamId: string;
  awayTeamId: string;
  awayPlayerName?: string;
  spectatorsCount: number;
  isStarted: boolean;
  state?: Partial<MatchState>;
}
