import { MatchState, SimPlayerNode, Team, TacticalMindset, SimReferee, RestartReason, PendingSubstitution } from '../types';
import { FORMATION_COORDINATES } from '../data/teamsData';
import { soundManager } from '../utils/audioEffects';

export const PITCH_WIDTH = 1050;
export const PITCH_HEIGHT = 680;
export const MARGIN = 20;

export const GOAL_Y_TOP = 295;
export const GOAL_Y_BOTTOM = 385;
export const GOAL_HEIGHT = GOAL_Y_BOTTOM - GOAL_Y_TOP;

// Penalty Area (Ceza Sahası) dimensions & boundaries
export const PENALTY_BOX_WIDTH = 155;
export const PENALTY_BOX_HEIGHT = 280;
export const PENALTY_BOX_TOP = (PITCH_HEIGHT - PENALTY_BOX_HEIGHT) * 0.5; // 200
export const PENALTY_BOX_BOTTOM = PENALTY_BOX_TOP + PENALTY_BOX_HEIGHT; // 480

// Goal Area (Altıpas) dimensions
export const GOAL_AREA_WIDTH = 55;
export const GOAL_AREA_HEIGHT = 150;
export const GOAL_AREA_TOP = (PITCH_HEIGHT - GOAL_AREA_HEIGHT) * 0.5; // 265
export const GOAL_AREA_BOTTOM = GOAL_AREA_TOP + GOAL_AREA_HEIGHT; // 415

// Goalkeeper strict movement bounding boxes
export const HOME_GK_BOUNDS = {
  minX: MARGIN + 10,
  maxX: MARGIN + PENALTY_BOX_WIDTH - 12,
  minY: PENALTY_BOX_TOP + 12,
  maxY: PENALTY_BOX_BOTTOM - 12,
};

export const AWAY_GK_BOUNDS = {
  minX: PITCH_WIDTH - MARGIN - PENALTY_BOX_WIDTH + 12,
  maxX: PITCH_WIDTH - MARGIN - 10,
  minY: PENALTY_BOX_TOP + 12,
  maxY: PENALTY_BOX_BOTTOM - 12,
};

export function isInsidePenaltyBox(x: number, y: number, isLeftBox: boolean): boolean {
  if (y < PENALTY_BOX_TOP || y > PENALTY_BOX_BOTTOM) return false;
  if (isLeftBox) {
    return x >= MARGIN && x <= MARGIN + PENALTY_BOX_WIDTH;
  } else {
    return x >= PITCH_WIDTH - MARGIN - PENALTY_BOX_WIDTH && x <= PITCH_WIDTH - MARGIN;
  }
}

export function initializeMatchState(
  homeTeam: Team,
  awayTeam: Team,
  mode: MatchState['mode'] = 'friendly',
  userTeamId?: string,
  tournamentMatchId?: string,
  leagueWeek?: number,
  fixtureId?: string
): MatchState {
  const homeStarters = homeTeam.players.filter(p => p.isStarter).slice(0, 6);
  const awayStarters = awayTeam.players.filter(p => p.isStarter).slice(0, 6);

  const homeSquad = homeStarters.length === 6 ? homeStarters : homeTeam.players.slice(0, 6);
  const awaySquad = awayStarters.length === 6 ? awayStarters : awayTeam.players.slice(0, 6);

  const homeCoords = FORMATION_COORDINATES[homeTeam.formation] || FORMATION_COORDINATES['2-2-1'] || [
    { x: 0.08, y: 0.50, role: 'GK' },
    { x: 0.25, y: 0.28, role: 'DF' },
    { x: 0.25, y: 0.72, role: 'DF' },
    { x: 0.45, y: 0.32, role: 'MF' },
    { x: 0.45, y: 0.68, role: 'MF' },
    { x: 0.68, y: 0.50, role: 'FW' },
  ];

  const awayCoords = FORMATION_COORDINATES[awayTeam.formation] || FORMATION_COORDINATES['2-2-1'] || [
    { x: 0.08, y: 0.50, role: 'GK' },
    { x: 0.25, y: 0.28, role: 'DF' },
    { x: 0.25, y: 0.72, role: 'DF' },
    { x: 0.45, y: 0.32, role: 'MF' },
    { x: 0.45, y: 0.68, role: 'MF' },
    { x: 0.68, y: 0.50, role: 'FW' },
  ];

  const players: SimPlayerNode[] = [];

  homeSquad.forEach((p, idx) => {
    const isGk = p.position === 'GK' || idx === 0;
    const base = homeCoords[idx] || { x: 0.2, y: 0.5, role: p.position };
    const px = isGk ? (MARGIN + 35) : base.x * PITCH_WIDTH;
    const py = isGk ? (PITCH_HEIGHT * 0.5) : base.y * PITCH_HEIGHT;
    players.push({
      id: `home-${p.id}`,
      teamId: homeTeam.id,
      playerData: p,
      x: px,
      y: py,
      targetX: px,
      targetY: py,
      vx: 0,
      vy: 0,
      role: p.position,
      number: p.number,
      name: p.name,
      stamina: 100,
      hasBall: false,
      actionCooldown: 0,
      headingAngle: 0,
      yellowCards: 0,
      isRedCarded: false,
    });
  });

  awaySquad.forEach((p, idx) => {
    const isGk = p.position === 'GK' || idx === 0;
    const base = awayCoords[idx] || { x: 0.2, y: 0.5, role: p.position };
    const px = isGk ? (PITCH_WIDTH - MARGIN - 35) : (1 - base.x) * PITCH_WIDTH;
    const py = isGk ? (PITCH_HEIGHT * 0.5) : (1 - base.y) * PITCH_HEIGHT;
    players.push({
      id: `away-${p.id}`,
      teamId: awayTeam.id,
      playerData: p,
      x: px,
      y: py,
      targetX: px,
      targetY: py,
      vx: 0,
      vy: 0,
      role: p.position,
      number: p.number,
      name: p.name,
      stamina: 100,
      hasBall: false,
      actionCooldown: 0,
      headingAngle: Math.PI,
      yellowCards: 0,
      isRedCarded: false,
    });
  });

  const homeStriker = players.find(p => p.teamId === homeTeam.id && p.role === 'FW') ||
    players.find(p => p.teamId === homeTeam.id && p.role === 'MF') ||
    players[5];

  if (homeStriker) {
    homeStriker.hasBall = true;
    homeStriker.x = PITCH_WIDTH * 0.485;
    homeStriker.y = PITCH_HEIGHT * 0.5;
  }

  soundManager.playWhistle('short');

  return {
    id: `match-${Date.now()}`,
    mode,
    leagueWeek,
    fixtureId,
    isPersisted: false,
    userTeamId: userTeamId || homeTeam.id,
    tournamentMatchId,
    homeTeam,
    awayTeam,
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    second: 0,
    speed: 1,
    isPaused: false,
    status: 'first_half',
    restartTimer: 0,
    restartTeamId: null,
    restartReason: 'kickoff',
    restartSpot: { x: PITCH_WIDTH * 0.5, y: PITCH_HEIGHT * 0.5 },
    ball: {
      x: PITCH_WIDTH * 0.5,
      y: PITCH_HEIGHT * 0.5,
      vx: 0,
      vy: 0,
      z: 0,
      vz: 0,
      holderPlayerId: homeStriker ? homeStriker.id : null,
      lastTeamId: homeTeam.id,
      isInGoal: false,
    },
    players,
    referee: {
      x: PITCH_WIDTH * 0.5 + 40,
      y: PITCH_HEIGHT * 0.5 - 35,
      vx: 0,
      vy: 0,
      targetX: PITCH_WIDTH * 0.5 + 40,
      targetY: PITCH_HEIGHT * 0.5 - 35,
    },
    events: [
      {
        id: `ev-kickoff-${Date.now()}`,
        minute: 1,
        second: 0,
        type: 'kickoff',
        teamId: homeTeam.id,
        detail: 'Hakem maçı başlatan düdüğü çaldı! Maç başladı.',
      }
    ],
    stats: {
      possession: [50, 50],
      shots: [0, 0],
      shotsOnTarget: [0, 0],
      corners: [0, 0],
      fouls: [0, 0],
      passes: [0, 0],
      saves: [0, 0],
    },
    lastGoalBanner: null,
    substitutionBanner: null,
    refereeDecisionBanner: null,
    offsideLine: null,
    pendingSubs: [],
  };
}

function getTacticShift(tactic: TacticalMindset, isLeftTeam: boolean): { xOffset: number; widthFactor: number } {
  const direction = isLeftTeam ? 1 : -1;
  switch (tactic) {
    case 'bus':
      return { xOffset: -70 * direction, widthFactor: 0.85 };
    case 'balanced':
      return { xOffset: 0, widthFactor: 1.0 };
    case 'attack':
      return { xOffset: 60 * direction, widthFactor: 1.1 };
    case 'allOut':
      return { xOffset: 120 * direction, widthFactor: 1.25 };
  }
}

export function resetPlayersToKickoff(
  players: SimPlayerNode[],
  homeTeam: Team,
  awayTeam: Team,
  restartTeamId: string,
  ball: MatchState['ball'],
  sidesSwapped: boolean = false
) {
  const homeCoords = FORMATION_COORDINATES[homeTeam.formation] || FORMATION_COORDINATES['2-2-1'];
  const awayCoords = FORMATION_COORDINATES[awayTeam.formation] || FORMATION_COORDINATES['2-2-1'];

  const teamPlayerCount = Math.floor(players.length / 2);

  players.forEach((player, idx) => {
    if (player.isRedCarded) return;
    const isHome = player.teamId === homeTeam.id;
    const isLeftTeam = sidesSwapped ? !isHome : isHome;

    const teamIndex = (idx < teamPlayerCount ? idx : idx - teamPlayerCount) % 6;
    const baseCoords = isHome
      ? (homeCoords[teamIndex] || { x: 0.2, y: 0.5 })
      : (awayCoords[teamIndex] || { x: 0.2, y: 0.5 });

    const isGk = player.role === 'GK' || teamIndex === 0;
    const anchorX = isGk
      ? (isLeftTeam ? MARGIN + 35 : PITCH_WIDTH - MARGIN - 35)
      : (isLeftTeam ? (baseCoords.x * PITCH_WIDTH) : ((1 - baseCoords.x) * PITCH_WIDTH));
    const anchorY = isGk
      ? (PITCH_HEIGHT * 0.5)
      : (isLeftTeam ? baseCoords.y * PITCH_HEIGHT : (1 - baseCoords.y) * PITCH_HEIGHT);

    player.x = anchorX;
    player.y = anchorY;
    player.targetX = anchorX;
    player.targetY = anchorY;
    player.vx = 0;
    player.vy = 0;
    player.hasBall = false;
    player.actionCooldown = 0;
    player.headingAngle = isLeftTeam ? 0 : Math.PI;
  });

  const kicker = players.find(p => p.teamId === restartTeamId && !p.isRedCarded && p.role === 'FW') ||
    players.find(p => p.teamId === restartTeamId && !p.isRedCarded && p.role === 'MF') ||
    players.find(p => p.teamId === restartTeamId && !p.isRedCarded);

  ball.x = PITCH_WIDTH * 0.5;
  ball.y = PITCH_HEIGHT * 0.5;
  ball.vx = 0;
  ball.vy = 0;
  ball.z = 0;
  ball.vz = 0;
  ball.isInGoal = false;
  ball.lastTeamId = restartTeamId;

  if (kicker) {
    const isKickerHome = kicker.teamId === homeTeam.id;
    const isKickerLeft = sidesSwapped ? !isKickerHome : isKickerHome;
    kicker.x = PITCH_WIDTH * 0.5 + (isKickerLeft ? -10 : 10);
    kicker.y = PITCH_HEIGHT * 0.5;
    kicker.hasBall = true;
    kicker.actionCooldown = 0.5;
    ball.holderPlayerId = kicker.id;
  }
}

/**
 * Execute pending substitutions during a stoppage
 */
export function applyPendingSubstitutions(state: MatchState): {
  players: SimPlayerNode[];
  homeTeam: Team;
  awayTeam: Team;
  pendingSubs: PendingSubstitution[];
  subBanner: MatchState['substitutionBanner'];
  subEvents: MatchState['events'];
} {
  let players = [...state.players];
  let homeTeam = { ...state.homeTeam };
  let awayTeam = { ...state.awayTeam };
  let pendingSubs = [...(state.pendingSubs || [])];
  let subBanner = state.substitutionBanner || null;
  let subEvents: MatchState['events'] = [];

  if (pendingSubs.length === 0) {
    return { players, homeTeam, awayTeam, pendingSubs, subBanner, subEvents };
  }

  const sub = pendingSubs[0];
  pendingSubs = pendingSubs.slice(1);

  const team = sub.isHome ? homeTeam : awayTeam;
  const outPlayer = team.players.find(p => p.id === sub.starterId);
  const inPlayer = team.players.find(p => p.id === sub.benchId);

  if (outPlayer && inPlayer) {
    const updatedTeamPlayers = team.players.map(p => {
      if (p.id === outPlayer.id) return { ...p, isStarter: false };
      if (p.id === inPlayer.id) return { ...p, isStarter: true };
      return p;
    });

    if (sub.isHome) {
      homeTeam = { ...homeTeam, players: updatedTeamPlayers };
    } else {
      awayTeam = { ...awayTeam, players: updatedTeamPlayers };
    }

    const simPlayerPrefix = sub.isHome ? 'home' : 'away';
    players = players.map(sp => {
      if (sp.id === `${simPlayerPrefix}-${outPlayer.id}`) {
        return {
          ...sp,
          id: `${simPlayerPrefix}-${inPlayer.id}`,
          playerData: inPlayer,
          name: inPlayer.name,
          number: inPlayer.number,
          role: inPlayer.position,
          stamina: 100,
          actionCooldown: 1.0,
        };
      }
      return sp;
    });

    subBanner = {
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
      teamName: team.name,
      isHome: sub.isHome,
      teamColor: team.primaryColor,
      timer: 4.5,
    };

    soundManager.playWhistle('short');

    subEvents.push({
      id: `ev-sub-${Date.now()}`,
      minute: Math.max(1, state.minute === 0 ? 1 : state.minute),
      second: Math.floor(state.second),
      type: 'sub',
      teamId: team.id,
      playerName: inPlayer.name,
      detail: `Oyuncu Değişikliği: ${outPlayer.name} (#${outPlayer.number}) çıktı, ${inPlayer.name} (#${inPlayer.number}) oyuna girdi.`,
    });
  }

  return { players, homeTeam, awayTeam, pendingSubs, subBanner, subEvents };
}

/**
 * Main simulation update loop per tick
 */
export function updateSimulation(state: MatchState, dt: number): MatchState {
  if (state.isPaused || state.status === 'finished') {
    return state;
  }

  const effectiveDt = Math.min(0.08, dt) * state.speed;

  let players = state.players.map(p => ({ ...p }));
  let ball = { ...state.ball };
  let referee: SimReferee = state.referee
    ? { ...state.referee }
    : { x: PITCH_WIDTH * 0.5, y: PITCH_HEIGHT * 0.5, vx: 0, vy: 0, targetX: PITCH_WIDTH * 0.5, targetY: PITCH_HEIGHT * 0.5 };
  let newEvents = [...state.events];

  const stats = {
    ...state.stats,
    possession: [...state.stats.possession] as [number, number],
    shots: [...state.stats.shots] as [number, number],
    shotsOnTarget: [...state.stats.shotsOnTarget] as [number, number],
    corners: [...state.stats.corners] as [number, number],
    fouls: [...state.stats.fouls] as [number, number],
    passes: [...state.stats.passes] as [number, number],
    saves: [...state.stats.saves] as [number, number],
  };

  let homeScore = state.homeScore;
  let awayScore = state.awayScore;
  let lastGoalBanner = state.lastGoalBanner;
  let substitutionBanner = state.substitutionBanner ? { ...state.substitutionBanner } : null;
  let refereeDecisionBanner = state.refereeDecisionBanner ? { ...state.refereeDecisionBanner } : null;
  let offsideLine = state.offsideLine ? { ...state.offsideLine } : null;
  let pendingSubs = state.pendingSubs ? [...state.pendingSubs] : [];
  let homeTeam = state.homeTeam;
  let awayTeam = state.awayTeam;

  let restartTimer = state.restartTimer || 0;
  let restartTeamId = state.restartTeamId || null;
  let restartReason: RestartReason = state.restartReason || 'kickoff';
  let restartSpot = state.restartSpot || { x: PITCH_WIDTH * 0.5, y: PITCH_HEIGHT * 0.5 };
  let halfTimeTimer = state.halfTimeTimer || 0;
  let sidesSwapped = state.sidesSwapped ?? false;

  // Decrease banner timers
  if (substitutionBanner) {
    substitutionBanner.timer -= effectiveDt;
    if (substitutionBanner.timer <= 0) substitutionBanner = null;
  }
  if (refereeDecisionBanner) {
    refereeDecisionBanner.timer -= effectiveDt;
    if (refereeDecisionBanner.timer <= 0) refereeDecisionBanner = null;
  }
  if (offsideLine) {
    offsideLine.timer -= effectiveDt;
    if (offsideLine.timer <= 0) offsideLine = null;
  }

  // Update referee position (follows play at comfortable viewing distance)
  const refDistX = ball.x + 35 - referee.x;
  const refDistY = (ball.y > PITCH_HEIGHT * 0.5 ? ball.y - 70 : ball.y + 70) - referee.y;
  referee.vx = refDistX * 1.8;
  referee.vy = refDistY * 1.8;
  referee.x += referee.vx * effectiveDt;
  referee.y += referee.vy * effectiveDt;
  referee.x = Math.max(MARGIN + 30, Math.min(PITCH_WIDTH - MARGIN - 30, referee.x));
  referee.y = Math.max(MARGIN + 30, Math.min(PITCH_HEIGHT - MARGIN - 30, referee.y));

  // HALFTIME INTERVAL PROCESSING
  if (state.status === 'halftime') {
    const nextHalfTimer = halfTimeTimer - effectiveDt;
    if (nextHalfTimer <= 0) {
      sidesSwapped = true;
      const teamToKickoff = state.awayTeam.id;
      resetPlayersToKickoff(players, state.homeTeam, state.awayTeam, teamToKickoff, ball, true);
      soundManager.playWhistle('short');

      newEvents.unshift({
        id: `ev-secondhalf-${Date.now()}`,
        minute: 45,
        second: 0,
        type: 'kickoff',
        teamId: teamToKickoff,
        detail: `İkinci yarı başladı! Takımlar kaleleri değişti. Santra ${state.awayTeam.name} tarafından yapıldı.`,
      });

      return {
        ...state,
        status: 'second_half',
        halfTimeTimer: 0,
        sidesSwapped: true,
        minute: 45,
        second: 0,
        ball,
        players,
        referee,
        events: newEvents.slice(0, 35),
      };
    }

    return {
      ...state,
      halfTimeTimer: nextHalfTimer,
      ball,
      players,
      referee,
    };
  }

  // RESTART / STOPPAGE STATE MACHINE (Goal, Kickoff, Halftime, Penalty)
  if (restartTimer > 0) {
    const nextTimer = restartTimer - effectiveDt;
    ball.vx *= 0.85;
    ball.vy *= 0.85;
    ball.x += ball.vx * effectiveDt;
    ball.y += ball.vy * effectiveDt;

    // Execute pending substitutions during stoppage
    if (pendingSubs.length > 0 && !substitutionBanner) {
      const subResult = applyPendingSubstitutions({
        ...state,
        players,
        homeTeam,
        awayTeam,
        pendingSubs,
        substitutionBanner,
      });
      players = subResult.players;
      homeTeam = subResult.homeTeam;
      awayTeam = subResult.awayTeam;
      pendingSubs = subResult.pendingSubs;
      substitutionBanner = subResult.subBanner;
      if (subResult.subEvents.length > 0) {
        newEvents.unshift(...subResult.subEvents);
      }
    }

    // PENALTY STOPPAGE: Position taker at spot, GK on goal line, all other players OUTSIDE penalty box
    if (restartReason === 'penalty') {
      const teamToTake = restartTeamId || state.homeTeam.id;
      const isHomeTaking = teamToTake === state.homeTeam.id;
      const isLeftTaking = sidesSwapped ? !isHomeTaking : isHomeTaking;

      const penSpotX = isLeftTaking ? PITCH_WIDTH - MARGIN - 90 : MARGIN + 90;
      const penSpotY = PITCH_HEIGHT * 0.5;

      ball.x = penSpotX;
      ball.y = penSpotY;
      ball.vx = 0;
      ball.vy = 0;
      ball.z = 0;
      ball.vz = 0;
      ball.isInGoal = false;
      ball.lastTeamId = teamToTake;

      const penTaker = players.find(p => p.teamId === teamToTake && !p.isRedCarded && p.role === 'FW') ||
        players.find(p => p.teamId === teamToTake && !p.isRedCarded && p.role === 'MF') ||
        players.find(p => p.teamId === teamToTake && !p.isRedCarded);

      const oppTeamId = isHomeTaking ? state.awayTeam.id : state.homeTeam.id;
      const oppGk = players.find(p => p.teamId === oppTeamId && !p.isRedCarded && p.role === 'GK');

      if (oppGk) {
        oppGk.x = isLeftTaking ? PITCH_WIDTH - MARGIN - 6 : MARGIN + 6;
        oppGk.y = PITCH_HEIGHT * 0.5;
        oppGk.vx = 0;
        oppGk.vy = 0;
        oppGk.headingAngle = isLeftTaking ? Math.PI : 0;
      }

      if (penTaker) {
        penTaker.x = penSpotX + (isLeftTaking ? -14 : 14);
        penTaker.y = penSpotY;
        penTaker.vx = 0;
        penTaker.vy = 0;
        penTaker.hasBall = true;
        penTaker.headingAngle = isLeftTaking ? 0 : Math.PI;
        ball.holderPlayerId = penTaker.id;
      }

      // Line up all other field players OUTSIDE penalty area
      const lineX = isLeftTaking ? penSpotX - 55 : penSpotX + 55;
      let lineIdx = 0;
      players.forEach(p => {
        if (p.isRedCarded) return;
        if (penTaker && p.id === penTaker.id) return;
        if (oppGk && p.id === oppGk.id) return;

        p.x = lineX + (p.teamId === teamToTake ? (isLeftTaking ? -12 : 12) : 0);
        p.y = Math.max(MARGIN + 35, Math.min(PITCH_HEIGHT - MARGIN - 35, PITCH_HEIGHT * 0.5 + (lineIdx - 4.5) * 32));
        p.vx = 0;
        p.vy = 0;
        p.hasBall = false;
        p.headingAngle = isLeftTaking ? 0 : Math.PI;
        lineIdx++;
      });
    }

    if (nextTimer <= 0) {
      const teamToTake = restartTeamId || state.homeTeam.id;
      const takingTeam = teamToTake === state.homeTeam.id ? state.homeTeam : state.awayTeam;
      const isHomeTaking = takingTeam.id === state.homeTeam.id;
      const isLeftTaking = sidesSwapped ? !isHomeTaking : isHomeTaking;

      if (restartReason === 'kickoff') {
        resetPlayersToKickoff(players, homeTeam, awayTeam, teamToTake, ball, sidesSwapped);
        soundManager.playWhistle('short');
      } else if (restartReason === 'penalty') {
        // Penalty countdown ended: shoot penalty!
        const penTaker = players.find(p => p.teamId === teamToTake && !p.isRedCarded && p.role === 'FW') ||
          players.find(p => p.teamId === teamToTake && !p.isRedCarded && p.role === 'MF') ||
          players.find(p => p.teamId === teamToTake && !p.isRedCarded);

        if (penTaker) {
          penTaker.hasBall = false;
          ball.holderPlayerId = null;
          const shotY = GOAL_Y_TOP + 12 + Math.random() * (GOAL_HEIGHT - 24);
          const oppGoalX = isLeftTaking ? PITCH_WIDTH - MARGIN : MARGIN;
          const penAngle = Math.atan2(shotY - penTaker.y, oppGoalX - penTaker.x);
          const penSpeed = 450;
          ball.vx = Math.cos(penAngle) * penSpeed;
          ball.vy = Math.sin(penAngle) * penSpeed;
          ball.vz = 18;
          soundManager.playKick();
          soundManager.playWhistle('short');
        }
      }

      return {
        ...state,
        homeTeam,
        awayTeam,
        restartTimer: 0,
        restartTeamId: null,
        restartReason: 'kickoff',
        restartSpot: null,
        lastGoalBanner: null,
        substitutionBanner,
        refereeDecisionBanner,
        offsideLine,
        pendingSubs,
        ball,
        players,
        referee,
        events: newEvents.slice(0, 35),
      };
    }

    return {
      ...state,
      homeTeam,
      awayTeam,
      restartTimer: nextTimer,
      substitutionBanner,
      refereeDecisionBanner,
      offsideLine,
      pendingSubs,
      ball,
      players,
      referee,
    };
  }

  // NORMAL MATCH PLAY: Time advancement
  let newSecond = state.second + effectiveDt * 7.5;
  let newMinute = state.minute;
  let newStatus: MatchState['status'] = state.status;

  if (newSecond >= 60) {
    newMinute += Math.floor(newSecond / 60);
    newSecond = newSecond % 60;

    if (state.minute < 45 && newMinute >= 45 && state.status === 'first_half') {
      newMinute = 45;
      newSecond = 0;
      newStatus = 'halftime';
      halfTimeTimer = 3.5;
      soundManager.playWhistle('double');
      newEvents.unshift({
        id: `ev-half-${Date.now()}`,
        minute: 45,
        second: 0,
        type: 'halftime',
        teamId: state.homeTeam.id,
        detail: `İlk yarı sona erdi! Skor: ${state.homeTeam.shortName} ${state.homeScore} - ${state.awayScore} ${state.awayTeam.shortName}. Takımlar yer değiştirecek.`,
      });
    } else if (newMinute >= 90 && state.status === 'second_half') {
      newMinute = 90;
      newSecond = 0;
      newStatus = 'finished';
      soundManager.playWhistle('triple');
      newEvents.unshift({
        id: `ev-full-${Date.now()}`,
        minute: 90,
        second: 0,
        type: 'fulltime',
        teamId: state.homeTeam.id,
        detail: `Hakem son düdüğü çaldı! Maç bitti: ${state.homeTeam.name} ${state.homeScore} - ${state.awayScore} ${state.awayTeam.name}`,
      });
    }
  }

  const ballHolder = players.find(p => p.id === ball.holderPlayerId && !p.isRedCarded);
  if (ballHolder) {
    ball.lastTeamId = ballHolder.teamId;
  }

  const activeTeamId = ballHolder ? ballHolder.teamId : (ball.lastTeamId || state.homeTeam.id);
  const isHomePossession = activeTeamId === state.homeTeam.id;

  let homePossSec = stats.possessionTime?.[0] ?? 30;
  let awayPossSec = stats.possessionTime?.[1] ?? 30;

  if (isHomePossession) {
    homePossSec += effectiveDt;
  } else {
    awayPossSec += effectiveDt;
  }
  stats.possessionTime = [homePossSec, awayPossSec];

  const totalSec = Math.max(1, homePossSec + awayPossSec);
  const homePctRaw = Math.round((homePossSec / totalSec) * 100);
  const clampedHomePct = Math.max(20, Math.min(80, homePctRaw));
  stats.possession = [clampedHomePct, 100 - clampedHomePct];

  const homeIsLeft = !sidesSwapped;
  const awayIsLeft = sidesSwapped;

  const homeShift = getTacticShift(state.homeTeam.tactic, homeIsLeft);
  const awayShift = getTacticShift(state.awayTeam.tactic, awayIsLeft);

  const homeCoords = FORMATION_COORDINATES[state.homeTeam.formation] || FORMATION_COORDINATES['2-2-1'];
  const awayCoords = FORMATION_COORDINATES[state.awayTeam.formation] || FORMATION_COORDINATES['2-2-1'];

  const teamPlayerCount = Math.floor(players.length / 2);

  // Update AI positions and behavior
  players.forEach((player, idx) => {
    if (player.isRedCarded) return;

    const isHome = player.teamId === state.homeTeam.id;
    const isLeftTeam = isHome ? homeIsLeft : awayIsLeft;
    const teamIndex = (idx < teamPlayerCount ? idx : idx - teamPlayerCount) % 6;
    const baseCoords = isHome
      ? (homeCoords[teamIndex] || { x: 0.2, y: 0.5 })
      : (awayCoords[teamIndex] || { x: 0.2, y: 0.5 });
    const shift = isHome ? homeShift : awayShift;

    if (player.actionCooldown > 0) {
      player.actionCooldown -= effectiveDt;
    }

    let anchorX = isLeftTeam
      ? (baseCoords.x * PITCH_WIDTH + shift.xOffset)
      : ((1 - baseCoords.x) * PITCH_WIDTH + shift.xOffset);
    let anchorY = isLeftTeam ? baseCoords.y * PITCH_HEIGHT : (1 - baseCoords.y) * PITCH_HEIGHT;

    anchorX = Math.max(25, Math.min(PITCH_WIDTH - 25, anchorX));
    anchorY = Math.max(25, Math.min(PITCH_HEIGHT - 25, anchorY));

    let targetX = 0;
    let targetY = 0;

    if (player.role === 'GK') {
      const gkBaseX = isLeftTeam ? (MARGIN + 38) : (PITCH_WIDTH - MARGIN - 38);
      let gkTrackY = PITCH_HEIGHT * 0.5 + (ball.y - PITCH_HEIGHT * 0.5) * 0.45;
      gkTrackY = Math.max(GOAL_Y_TOP - 10, Math.min(GOAL_Y_BOTTOM + 10, gkTrackY));
      targetX = gkBaseX;
      targetY = gkTrackY;
    } else {
      const ballInfluence = player.role === 'DF' ? 0.16 : (player.role === 'MF' ? 0.26 : 0.34);
      targetX = anchorX + (ball.x - PITCH_WIDTH * 0.5) * ballInfluence * (isLeftTeam ? 0.35 : -0.35);
      targetY = anchorY + (ball.y - anchorY) * 0.22;
    }

    // A. GOALKEEPER HAS BALL
    if (player.role === 'GK' && player.hasBall) {
      player.vx = 0;
      player.vy = 0;
      player.headingAngle = isLeftTeam ? 0 : Math.PI;

      ball.x = player.x + (isLeftTeam ? 12 : -12);
      ball.y = player.y;
      ball.vx = 0;
      ball.vy = 0;
      ball.vz = 0;

      if (player.actionCooldown <= 0) {
        const outfieldTeammates = players.filter(
          p => p.teamId === player.teamId && p.id !== player.id && p.role !== 'GK' && !p.isRedCarded
        );
        const passTarget = outfieldTeammates.find(p => p.role === 'MF') ||
          outfieldTeammates.find(p => p.role === 'DF') ||
          outfieldTeammates[0];

        if (passTarget) {
          player.hasBall = false;
          player.actionCooldown = 2.0;

          passTarget.hasBall = true;
          passTarget.actionCooldown = 0.6;
          ball.holderPlayerId = passTarget.id;
          ball.lastTeamId = player.teamId;

          ball.x = passTarget.x + (isLeftTeam ? 8 : -8);
          ball.y = passTarget.y;
          ball.vx = 0;
          ball.vy = 0;
          ball.vz = 0;

          stats.passes[isHome ? 0 : 1]++;
          soundManager.playKick();

          const currentMatchMinute = Math.max(1, newMinute === 0 ? 1 : newMinute);
          newEvents.unshift({
            id: `ev-gk-clear-${Date.now()}`,
            minute: currentMatchMinute,
            second: Math.floor(newSecond),
            type: 'pass',
            teamId: player.teamId,
            playerName: player.name,
            detail: `Kaleci ${player.name} topu kontrol etti ve pasla ${passTarget.name} üzerinden atağı başlattı.`,
          });
        }
      }
    } else if (player.hasBall) {
      // B. OUTFIELD PLAYER HAS BALL
      const oppGoalX = isLeftTeam ? PITCH_WIDTH : 0;
      const oppGoalY = PITCH_HEIGHT * 0.5;

      const distToGoal = Math.hypot(oppGoalX - player.x, oppGoalY - player.y);
      const angleToGoal = Math.atan2(oppGoalY - player.y, oppGoalX - player.x);
      player.headingAngle = angleToGoal;

      // Always drive forward towards opponent goal line when carrying ball
      const dribbleSpeed = (player.playerData.pace / 100) * 115;
      player.vx = Math.cos(angleToGoal) * dribbleSpeed;
      player.vy = Math.sin(angleToGoal) * dribbleSpeed * 0.4;

      player.x += player.vx * effectiveDt;
      player.y += player.vy * effectiveDt;

      ball.x = player.x + Math.cos(angleToGoal) * 14;
      ball.y = player.y + Math.sin(angleToGoal) * 14;
      ball.vx = player.vx;
      ball.vy = player.vy;

      // Decision making
      if (player.actionCooldown <= 0) {
        const teamStatIdx = isHome ? 0 : 1;
        const currentMatchMinute = Math.max(1, newMinute === 0 ? 1 : newMinute);

        // Check if defenders are blocking path ahead
        const oppDefenders = players.filter(p => p.teamId !== player.teamId && !p.isRedCarded);
        const defendersAhead = oppDefenders.filter(d => {
          const dx = isLeftTeam ? d.x - player.x : player.x - d.x;
          const dy = Math.abs(d.y - player.y);
          return dx > 0 && dx < 110 && dy < 75;
        });

        const isWing = player.y < 210 || player.y > PITCH_HEIGHT - 210;
        const isAttackingThird = isLeftTeam ? player.x > PITCH_WIDTH * 0.62 : player.x < PITCH_WIDTH * 0.38;
        const isOwnHalfOrMidfield = isLeftTeam ? player.x < PITCH_WIDTH * 0.62 : player.x > PITCH_WIDTH * 0.38;

        // 1. SHOOTING when within danger range (< 260px)
        if (distToGoal < 260 && (defendersAhead.length === 0 || Math.random() < 0.70)) {
          player.hasBall = false;
          ball.holderPlayerId = null;
          player.actionCooldown = 2.4;

          stats.shots[teamStatIdx]++;

          const targetYGoal = GOAL_Y_TOP + (Math.random() * (GOAL_HEIGHT + 120) - 60);
          const aimAngle = Math.atan2(targetYGoal - player.y, oppGoalX - player.x);

          const shotPower = 320 + (player.playerData.shooting / 100) * 230;
          ball.vx = Math.cos(aimAngle) * shotPower;
          ball.vy = Math.sin(aimAngle) * shotPower;
          ball.vz = 15 + Math.random() * 45;

          soundManager.playKick();

          const isTarget = targetYGoal >= GOAL_Y_TOP && targetYGoal <= GOAL_Y_BOTTOM;
          if (isTarget) {
            stats.shotsOnTarget[teamStatIdx]++;
          }

          newEvents.unshift({
            id: `ev-shot-${Date.now()}`,
            minute: currentMatchMinute,
            second: Math.floor(newSecond),
            type: 'shot',
            teamId: player.teamId,
            playerName: player.name,
            detail: `${player.name} (#${player.playerData.number}) önünü boş bulunca kaleye direkt füzeyi gönderdi!`,
          });
        }
        // 2. CROSSING (Orta Açma) - Kanattan çizgiye inip ceza sahasına kafa golü için orta keser
        else if (isWing && isAttackingThird && Math.random() < 0.65) {
          player.hasBall = false;
          ball.holderPlayerId = null;
          player.actionCooldown = 2.2;

          const crossTargetX = isLeftTeam ? PITCH_WIDTH - MARGIN - 85 + (Math.random() * 40 - 20) : MARGIN + 85 + (Math.random() * 40 - 20);
          const crossTargetY = PITCH_HEIGHT * 0.5 + (Math.random() * 160 - 80);
          const crossAngle = Math.atan2(crossTargetY - player.y, crossTargetX - player.x);
          const crossSpeed = 340 + Math.random() * 80;

          ball.vx = Math.cos(crossAngle) * crossSpeed;
          ball.vy = Math.sin(crossAngle) * crossSpeed;
          ball.vz = 65; // Yüksek kavisli orta (top havada büyüyüp süzülecek)
          stats.passes[teamStatIdx]++;
          soundManager.playKick();

          newEvents.unshift({
            id: `ev-cross-${Date.now()}`,
            minute: currentMatchMinute,
            second: Math.floor(newSecond),
            type: 'pass',
            teamId: player.teamId,
            playerName: player.name,
            detail: `${player.name} çizgiye inip ceza sahasına kavisli harika bir orta kesti!`,
          });
        }
        // 3. TEAM COMBINATION PASSING (Kendi yarı sahasında ve orta sahada paslaşarak ilerleme)
        else {
          const teammates = players.filter(p => p.teamId === player.teamId && p.id !== player.id && p.role !== 'GK' && !p.isRedCarded);
          const forwardTeammates = teammates.filter(p => isLeftTeam ? p.x > player.x + 15 : p.x < player.x - 15);
          
          // Sort forward teammates by proximity to current player (favor nearby forward teammates!)
          forwardTeammates.sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));

          const passTarget = forwardTeammates.length > 0
            ? (forwardTeammates.length > 1 && Math.random() < 0.25 ? forwardTeammates[1] : forwardTeammates[0])
            : (teammates.length > 0 ? teammates[Math.floor(Math.random() * teammates.length)] : null);

          // In own half or midfield: 82% pass probability to avoid solo runs!
          // In attacking third: 68% pass probability
          const passChance = isOwnHalfOrMidfield ? 0.82 : 0.68;

          if (passTarget && Math.random() < passChance) {
            // OFFSIDE CHECK
            const oppDefendersList = players.filter(p => p.teamId !== player.teamId && p.role !== 'GK' && !p.isRedCarded);
            const isTargetInAttackingHalf = isLeftTeam ? passTarget.x > PITCH_WIDTH * 0.5 : passTarget.x < PITCH_WIDTH * 0.5;

            let isOffside = false;
            let lastDefender: SimPlayerNode | null = null;

            if (isTargetInAttackingHalf && oppDefendersList.length > 0) {
              if (isLeftTeam) {
                oppDefendersList.sort((a, b) => b.x - a.x);
                lastDefender = oppDefendersList[0];
                if (passTarget.x > lastDefender.x + 22 && passTarget.x > player.x + 15) {
                  isOffside = Math.random() < 0.03;
                }
              } else {
                oppDefendersList.sort((a, b) => a.x - b.x);
                lastDefender = oppDefendersList[0];
                if (passTarget.x < lastDefender.x - 22 && passTarget.x < player.x - 15) {
                  isOffside = Math.random() < 0.03;
                }
              }
            }

            if (isOffside && lastDefender) {
              const oppTeam = player.teamId === state.homeTeam.id ? state.awayTeam : state.homeTeam;

              refereeDecisionBanner = {
                type: 'offside',
                title: 'OFSAYT KARARI!',
                detail: `Hakem ofsayt bayrağını kaldırdı: ${passTarget.name} son savunmacı ${lastDefender.name}'in arkasında kaldı!`,
                teamName: player.teamId === state.homeTeam.id ? state.homeTeam.name : state.awayTeam.name,
                playerName: passTarget.name,
                isHome: isHome,
                timer: 4.0,
              };

              offsideLine = {
                x: lastDefender.x,
                attackerX: passTarget.x,
                attackerY: passTarget.y,
                defenderX: lastDefender.x,
                defenderY: lastDefender.y,
                attackerName: passTarget.name,
                defenderName: lastDefender.name,
                teamColor: isHome ? state.homeTeam.primaryColor : state.awayTeam.primaryColor,
                timer: 4.0,
              };

              newEvents.unshift({
                id: `ev-offside-${Date.now()}`,
                minute: currentMatchMinute,
                second: Math.floor(newSecond),
                type: 'foul',
                teamId: player.teamId,
                playerName: passTarget.name,
                detail: `OFSAYT! Hakem oyunu durdurdu. ${passTarget.name} son savunmacı ${lastDefender.name}'in arkasında yakalandı. Endirekt serbest vuruş ${oppTeam.name} lehine.`,
              });

              player.hasBall = false;
              ball.x = passTarget.x;
              ball.y = passTarget.y;
              ball.vx = 0;
              ball.vy = 0;
              ball.z = 0;
              ball.holderPlayerId = null;

              const fkTaker = players.find(p => p.teamId === oppTeam.id && !p.isRedCarded && p.role !== 'GK') ||
                players.find(p => p.teamId === oppTeam.id && !p.isRedCarded);

              if (fkTaker) {
                fkTaker.x = passTarget.x;
                fkTaker.y = passTarget.y;
                fkTaker.hasBall = true;
                fkTaker.actionCooldown = 0.2;
                ball.holderPlayerId = fkTaker.id;
              }
            } else {
              // Execute Pass
              player.hasBall = false;
              ball.holderPlayerId = null;
              player.actionCooldown = 1.1;

              const passAngle = Math.atan2(passTarget.y - player.y, passTarget.x - player.x) + (Math.random() * 0.08 - 0.04);
              const passDist = Math.hypot(passTarget.x - player.x, passTarget.y - player.y);

              const isLongPass = passDist > 220;
              const passSpeed = Math.min(480, Math.max(280, passDist * 2.5));

              ball.vx = Math.cos(passAngle) * passSpeed;
              ball.vy = Math.sin(passAngle) * passSpeed;
              ball.vz = isLongPass ? 42 : 8;

              stats.passes[teamStatIdx]++;
              soundManager.playKick();

              if (isLongPass && Math.random() < 0.35) {
                newEvents.unshift({
                  id: `ev-longpass-${Date.now()}`,
                  minute: currentMatchMinute,
                  second: Math.floor(newSecond),
                  type: 'pass',
                  teamId: player.teamId,
                  playerName: player.name,
                  detail: `${player.name} havadan uzun ve harika bir derin pas yolladı!`,
                });
              }
            }
          } else {
            // Take a short touch forward before checking options again
            player.actionCooldown = 0.35;
          }
        }
      }
    } else {
      // C. PLAYER DOES NOT HAVE BALL
      const distToBall = Math.hypot(ball.x - player.x, ball.y - player.y);

      let destinationX = targetX;
      let destinationY = targetY;

      if (player.role === 'GK') {
        const bounds = isLeftTeam ? HOME_GK_BOUNDS : AWAY_GK_BOUNDS;
        const isBallInGkBox = isLeftTeam
          ? (ball.x <= bounds.maxX + 40 && ball.y >= bounds.minY - 20 && ball.y <= bounds.maxY + 20)
          : (ball.x >= bounds.minX - 40 && ball.y >= bounds.minY - 20 && ball.y <= bounds.maxY + 20);

        if (!ball.holderPlayerId && isBallInGkBox) {
          destinationX = isLeftTeam ? Math.min(bounds.maxX - 10, ball.x) : Math.max(bounds.minX + 10, ball.x);
          destinationY = Math.max(bounds.minY, Math.min(bounds.maxY, ball.y));
        } else {
          destinationX = isLeftTeam ? bounds.minX + 18 : bounds.maxX - 18;
          destinationY = Math.max(GOAL_Y_TOP - 10, Math.min(GOAL_Y_BOTTOM + 10, ball.y));
        }
        destinationX = Math.max(bounds.minX, Math.min(bounds.maxX, destinationX));
        destinationY = Math.max(bounds.minY, Math.min(bounds.maxY, destinationY));
      } else {
        const sameTeamPlayers = players.filter(p => p.teamId === player.teamId && p.role !== 'GK' && !p.isRedCarded);
        let isClosestPresser = true;
        for (const tm of sameTeamPlayers) {
          if (tm.id !== player.id) {
            const tmDist = Math.hypot(ball.x - tm.x, ball.y - tm.y);
            if (tmDist < distToBall - 10) {
              isClosestPresser = false;
              break;
            }
          }
        }

        if (isClosestPresser && distToBall < 260) {
          destinationX = ball.x;
          destinationY = ball.y;
        }
      }

      const dx = destinationX - player.x;
      const dy = destinationY - player.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4) {
        const moveSpeed = Math.min(dist * 3.8, (player.playerData.pace / 100) * 125);
        player.vx = (dx / dist) * moveSpeed;
        player.vy = (dy / dist) * moveSpeed;
        player.headingAngle = Math.atan2(dy, dx);
      } else {
        player.vx *= 0.7;
        player.vy *= 0.7;
      }

      player.x += player.vx * effectiveDt;
      player.y += player.vy * effectiveDt;

      // BALL INTERCEPTION / TACKLE / SAVE / FOUL / PENALTY
      if (distToBall < 26 && player.actionCooldown <= 0 && !ball.isInGoal) {
        const teamStatIdx = isHome ? 0 : 1;
        const currentMatchMinute = Math.max(1, newMinute === 0 ? 1 : newMinute);

        if (ball.holderPlayerId) {
          const currentHolder = players.find(p => p.id === ball.holderPlayerId);
          if (currentHolder && currentHolder.teamId !== player.teamId && !currentHolder.isRedCarded) {
            // TACKLE FOUL CHECK - Faul ve kart oranları gerçekçi futbola göre optimize edildi
            const foulChance = 0.11;
            if (Math.random() < foulChance) {
              stats.fouls[teamStatIdx]++;

              const isInsideDefenderBox = isInsidePenaltyBox(player.x, player.y, isLeftTeam);

              // 1. PENALTY FOUL!
              if (isInsideDefenderBox) {
                refereeDecisionBanner = {
                  type: 'penalty',
                  title: 'PENALTI KARARI!',
                  detail: `Hakem beyaz noktayı gösterdi! ${player.name}, ceza sahasında ${currentHolder.name}'i düşürdü.`,
                  teamName: isHome ? state.awayTeam.name : state.homeTeam.name,
                  playerName: player.name,
                  isHome: !isHome,
                  timer: 4.5,
                };

                newEvents.unshift({
                  id: `ev-pen-${Date.now()}`,
                  minute: currentMatchMinute,
                  second: Math.floor(newSecond),
                  type: 'foul',
                  teamId: currentHolder.teamId,
                  playerName: currentHolder.name,
                  detail: `DÜDÜK ÇALDI: PENALTI! ${player.name} ceza alanında rakibini düşürdü! Hakem penaltı kararı verdi!`,
                });

                currentHolder.hasBall = false;
                player.hasBall = false;
                ball.holderPlayerId = null;

                restartTimer = 3.5;
                restartTeamId = currentHolder.teamId;
                restartReason = 'penalty';
                restartSpot = {
                  x: isLeftTeam ? MARGIN + 90 : PITCH_WIDTH - MARGIN - 90,
                  y: PITCH_HEIGHT * 0.5,
                };
                return;
              }

              // 2. OUTSIDE BOX FOUL (Kırmızı kart NADİR: %0.5, Sarı kart DENGELİ: %12)
              let givenCard: 'yellow' | 'second_yellow' | 'red' | null = null;
              const cardRoll = Math.random();

              if (cardRoll < 0.005) {
                // Çok nadir direkt kırmızı kart (%0.5)
                givenCard = 'red';
                player.isRedCarded = true;
                player.x = -100;
                player.y = -100;
              } else if (cardRoll < 0.12) {
                // Sarı kart (%12)
                player.yellowCards += 1;
                if (player.yellowCards >= 2) {
                  givenCard = 'second_yellow';
                  player.isRedCarded = true;
                  player.x = -100;
                  player.y = -100;
                } else {
                  givenCard = 'yellow';
                }
              }

              if (givenCard === 'red') {
                refereeDecisionBanner = {
                  type: 'red_card',
                  title: 'DİREKT KIRMIZI KART!',
                  detail: `Hakem kırmızı kartını çıkardı! ${player.name} oyundan atıldı.`,
                  teamName: isHome ? state.homeTeam.name : state.awayTeam.name,
                  playerName: player.name,
                  isHome: isHome,
                  timer: 4.0,
                };
                newEvents.unshift({
                  id: `ev-card-${Date.now()}`,
                  minute: currentMatchMinute,
                  second: Math.floor(newSecond),
                  type: 'red_card',
                  teamId: player.teamId,
                  playerName: player.name,
                  detail: `KIRMIZI KART! ${player.name} yaptığı çok sert faul nedeniyle hakem tarafından doğrudan ihraç edildi!`,
                });
              } else if (givenCard === 'second_yellow') {
                refereeDecisionBanner = {
                  type: 'second_yellow',
                  title: '2. SARIDAN KIRMIZI KART!',
                  detail: `2. sarı kart! ${player.name} kırmızı kartla oyun dışı kaldı.`,
                  teamName: isHome ? state.homeTeam.name : state.awayTeam.name,
                  playerName: player.name,
                  isHome: isHome,
                  timer: 4.0,
                };
                newEvents.unshift({
                  id: `ev-card-${Date.now()}`,
                  minute: currentMatchMinute,
                  second: Math.floor(newSecond),
                  type: 'red_card',
                  teamId: player.teamId,
                  playerName: player.name,
                  detail: `2. SARIDAN KIRMIZI! ${player.name} ikinci sarı kartını görerek kırmızı kartla oyundan atıldı!`,
                });
              } else if (givenCard === 'yellow') {
                refereeDecisionBanner = {
                  type: 'yellow_card',
                  title: 'SARI KART!',
                  detail: `Hakem sarı kartını gösterdi: ${player.name}`,
                  teamName: isHome ? state.homeTeam.name : state.awayTeam.name,
                  playerName: player.name,
                  isHome: isHome,
                  timer: 3.5,
                };
                newEvents.unshift({
                  id: `ev-card-${Date.now()}`,
                  minute: currentMatchMinute,
                  second: Math.floor(newSecond),
                  type: 'yellow_card',
                  teamId: player.teamId,
                  playerName: player.name,
                  detail: `SARI KART! ${player.name} kontrolsüz müdahalesi sebebiyle sarı kart gördü.`,
                });
              } else {
                refereeDecisionBanner = {
                  type: 'foul',
                  title: 'FAUL KARARI',
                  detail: `Hakem düdüğünü çaldı: ${player.name} rakibine faul yaptı.`,
                  teamName: isHome ? state.homeTeam.name : state.awayTeam.name,
                  playerName: player.name,
                  isHome: isHome,
                  timer: 2.5,
                };
                newEvents.unshift({
                  id: `ev-foul-${Date.now()}`,
                  minute: currentMatchMinute,
                  second: Math.floor(newSecond),
                  type: 'foul',
                  teamId: player.teamId,
                  playerName: player.name,
                  detail: `Faul: ${player.name} rakibini durdurdu. Serbest vuruş kullanılacak.`,
                });
              }

              currentHolder.hasBall = true;
              currentHolder.actionCooldown = 0.2;
              ball.x = currentHolder.x;
              ball.y = currentHolder.y;
              ball.vx = 0;
              ball.vy = 0;
              ball.z = 0;
              ball.holderPlayerId = currentHolder.id;
              player.hasBall = false;
            }

            // Clean tackle - bazen top seker veya savunmacı topu kornere / taca çeler
            const tackleSkill = 0.52 + (player.playerData.defending / 100) * 0.38;
            if (Math.random() < tackleSkill) {
              currentHolder.hasBall = false;
              currentHolder.actionCooldown = 1.0;

              // %22 ihtimalle seken top taca veya kornere yönelir
              if (Math.random() < 0.22) {
                ball.holderPlayerId = null;
                ball.lastTeamId = player.teamId;
                player.actionCooldown = 0.6;
                const deflectAngle = Math.random() * Math.PI * 2;
                ball.vx = Math.cos(deflectAngle) * 280;
                ball.vy = Math.sin(deflectAngle) * 280;
              } else {
                player.hasBall = true;
                ball.holderPlayerId = player.id;
                ball.lastTeamId = player.teamId;
                player.actionCooldown = 0.6;
              }
            }
          }
        } else {
          // Free ball pickup / Goalkeeper Save (Kaleci bazen topu kornere veya dışarı çeler)
          if (player.role === 'GK') {
            stats.saves[teamStatIdx]++;
            player.actionCooldown = 0.8;

            // %32 ihtimalle kaleci topu kornere çeler!
            if (Math.random() < 0.32) {
              ball.lastTeamId = player.teamId;
              ball.holderPlayerId = null;
              ball.vx = isLeftTeam ? -320 : 320;
              ball.vy = ball.y < PITCH_HEIGHT * 0.5 ? -220 : 220;
              ball.vz = 20;

              newEvents.unshift({
                id: `ev-save-corner-${Date.now()}`,
                minute: currentMatchMinute,
                second: Math.floor(newSecond),
                type: 'save',
                teamId: player.teamId,
                playerName: player.name,
                detail: `Kaleci ${player.name} son anda parmaklarının ucuyla topu kornere tokatladı!`,
              });
            } else {
              ball.vx = 0;
              ball.vy = 0;
              ball.vz = 0;
              player.hasBall = true;
              ball.holderPlayerId = player.id;
              ball.lastTeamId = player.teamId;

              newEvents.unshift({
                id: `ev-save-${Date.now()}`,
                minute: currentMatchMinute,
                second: Math.floor(newSecond),
                type: 'save',
                teamId: player.teamId,
                playerName: player.name,
                detail: `Kaleci ${player.name} harika uzandı ve topu kontrol etti!`,
              });
            }
          } else {
            // Outfield player meets loose ball
            // Check if ball is elevated (header or first-time volley shot in penalty area!)
            if (ball.z > 16 && distToGoal < 280) {
              player.actionCooldown = 2.0;
              ball.holderPlayerId = null;
              ball.lastTeamId = player.teamId;

              const targetYGoal = GOAL_Y_TOP + (Math.random() * (GOAL_HEIGHT + 100) - 50);
              const aimAngle = Math.atan2(targetYGoal - player.y, oppGoalX - player.x);
              const headerPower = 350 + Math.random() * 120;

              ball.vx = Math.cos(aimAngle) * headerPower;
              ball.vy = Math.sin(aimAngle) * headerPower;
              ball.vz = 10; // Snap header trajectory downward/forward

              stats.shots[teamStatIdx]++;
              soundManager.playKick();

              const isHeader = Math.random() < 0.65;
              newEvents.unshift({
                id: `ev-header-${Date.now()}`,
                minute: currentMatchMinute,
                second: Math.floor(newSecond),
                type: 'shot',
                teamId: player.teamId,
                playerName: player.name,
                detail: isHeader
                  ? `MÜTHİŞ KAFA VURUŞU! ⚽ ${player.name} ceza sahasında harika yükselip kafayı vurdu!`
                  : `GELİŞİNE VURUŞ! ⚽ ${player.name} havadan gelen topa gelişine sert voleyi yapıştırdı!`,
              });
            } else {
              player.actionCooldown = 0.4;
              player.hasBall = true;
              ball.holderPlayerId = player.id;
              ball.lastTeamId = player.teamId;
            }
          }
        }
      }
    }

    if (player.role === 'GK') {
      const bounds = isLeftTeam ? HOME_GK_BOUNDS : AWAY_GK_BOUNDS;
      player.x = Math.max(bounds.minX, Math.min(bounds.maxX, player.x));
      player.y = Math.max(bounds.minY, Math.min(bounds.maxY, player.y));
    } else if (!player.isRedCarded) {
      player.x = Math.max(16, Math.min(PITCH_WIDTH - 16, player.x));
      player.y = Math.max(16, Math.min(PITCH_HEIGHT - 16, player.y));
    }
  });

  // ANTI-CLUSTERING SEPARATION PASS
  const MIN_PLAYER_DISTANCE = 24;
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const pA = players[i];
      const pB = players[j];
      if (pA.isRedCarded || pB.isRedCarded) continue;

      const sepX = pB.x - pA.x;
      const sepY = pB.y - pA.y;
      const dist = Math.hypot(sepX, sepY);

      if (dist < MIN_PLAYER_DISTANCE && dist > 0.001) {
        const overlap = (MIN_PLAYER_DISTANCE - dist) * 0.5;
        const normX = sepX / dist;
        const normY = sepY / dist;

        if (pA.role !== 'GK') {
          pA.x -= normX * overlap;
          pA.y -= normY * overlap;
        }
        if (pB.role !== 'GK') {
          pB.x += normX * overlap;
          pB.y += normY * overlap;
        }
      }
    }
  }

  // 3. BALL PHYSICS SIMULATION
  if (!ball.holderPlayerId) {
    ball.x += ball.vx * effectiveDt;
    ball.y += ball.vy * effectiveDt;

    const friction = Math.pow(0.88, effectiveDt * 20);
    ball.vx *= friction;
    ball.vy *= friction;

    if (ball.z > 0 || ball.vz !== 0) {
      ball.z += ball.vz * effectiveDt;
      ball.vz -= 280 * effectiveDt;
      if (ball.z <= 0) {
        ball.z = 0;
        ball.vz = -ball.vz * 0.45;
        if (Math.abs(ball.vz) < 15) ball.vz = 0;
      }
    }
  }

  // 4. GOAL DETECTION & SOUND TRIGGER
  // Left Goal
  if (ball.x <= 16 && ball.y >= GOAL_Y_TOP && ball.y <= GOAL_Y_BOTTOM && !ball.isInGoal) {
    ball.isInGoal = true;
    const scoringTeam = sidesSwapped ? state.homeTeam : state.awayTeam;
    const defendingTeam = sidesSwapped ? state.awayTeam : state.homeTeam;
    const isScoringTeamHome = scoringTeam.id === state.homeTeam.id;

    if (isScoringTeamHome) {
      homeScore++;
    } else {
      awayScore++;
    }

    const scorer = players.find(p => p.teamId === scoringTeam.id && !p.isRedCarded && p.role === 'FW') ||
      players.find(p => p.teamId === scoringTeam.id && !p.isRedCarded && p.role === 'MF') ||
      players.find(p => p.teamId === scoringTeam.id && !p.isRedCarded);

    const currentMatchMinute = Math.max(1, newMinute === 0 ? 1 : newMinute);

    lastGoalBanner = {
      playerName: scorer ? scorer.name : scoringTeam.name,
      teamName: scoringTeam.name,
      minute: currentMatchMinute,
      teamColor: scoringTeam.primaryColor,
      isHome: isScoringTeamHome,
    };

    newEvents.unshift({
      id: `ev-goal-${Date.now()}`,
      minute: currentMatchMinute,
      second: Math.floor(newSecond),
      type: 'goal',
      teamId: scoringTeam.id,
      playerName: scorer ? scorer.name : scoringTeam.name,
      detail: `GOOOOOOL! ${scoringTeam.name} fileleri havalandırdı! (${homeScore} - ${awayScore})`,
    });

    soundManager.playGoalRoar();
    restartTimer = 3.5;
    restartTeamId = defendingTeam.id;
    restartReason = 'kickoff';
  }

  // Right Goal
  if (ball.x >= PITCH_WIDTH - 16 && ball.y >= GOAL_Y_TOP && ball.y <= GOAL_Y_BOTTOM && !ball.isInGoal) {
    ball.isInGoal = true;
    const scoringTeam = sidesSwapped ? state.awayTeam : state.homeTeam;
    const defendingTeam = sidesSwapped ? state.homeTeam : state.awayTeam;
    const isScoringTeamHome = scoringTeam.id === state.homeTeam.id;

    if (isScoringTeamHome) {
      homeScore++;
    } else {
      awayScore++;
    }

    const scorer = players.find(p => p.teamId === scoringTeam.id && !p.isRedCarded && p.role === 'FW') ||
      players.find(p => p.teamId === scoringTeam.id && !p.isRedCarded && p.role === 'MF') ||
      players.find(p => p.teamId === scoringTeam.id && !p.isRedCarded);

    const currentMatchMinute = Math.max(1, newMinute === 0 ? 1 : newMinute);

    lastGoalBanner = {
      playerName: scorer ? scorer.name : scoringTeam.name,
      teamName: scoringTeam.name,
      minute: currentMatchMinute,
      teamColor: scoringTeam.primaryColor,
      isHome: isScoringTeamHome,
    };

    newEvents.unshift({
      id: `ev-goal-${Date.now()}`,
      minute: currentMatchMinute,
      second: Math.floor(newSecond),
      type: 'goal',
      teamId: scoringTeam.id,
      playerName: scorer ? scorer.name : scoringTeam.name,
      detail: `GOOOOOOL! ${scoringTeam.name} muhteşem bir gol attı! (${homeScore} - ${awayScore})`,
    });

    soundManager.playGoalRoar();
    restartTimer = 3.5;
    restartTeamId = defendingTeam.id;
    restartReason = 'kickoff';
  }

  // 5. TOUCHLINE OUT (TAÇ ATIŞI / THROW-IN)
  if (!ball.isInGoal && (ball.y <= MARGIN || ball.y >= PITCH_HEIGHT - MARGIN)) {
    const outSpotY = ball.y <= MARGIN ? MARGIN + 2 : PITCH_HEIGHT - MARGIN - 2;
    const outSpotX = Math.max(MARGIN + 25, Math.min(PITCH_WIDTH - MARGIN - 25, ball.x));

    const lastTouchTeamId = ball.lastTeamId || state.homeTeam.id;
    const throwTeamId = lastTouchTeamId === state.homeTeam.id ? state.awayTeam.id : state.homeTeam.id;
    const throwTeam = throwTeamId === state.homeTeam.id ? state.homeTeam : state.awayTeam;

    const throwTaker = players.find(p => p.teamId === throwTeamId && !p.isRedCarded && p.role !== 'GK') ||
      players.find(p => p.teamId === throwTeamId && !p.isRedCarded);

    ball.x = outSpotX;
    ball.y = outSpotY;
    ball.vx = 0;
    ball.vy = 0;
    ball.z = 0;

    if (throwTaker) {
      throwTaker.x = outSpotX;
      throwTaker.y = outSpotY + (outSpotY < PITCH_HEIGHT * 0.5 ? 10 : -10);
      throwTaker.hasBall = true;
      throwTaker.actionCooldown = 0.2;
      ball.holderPlayerId = throwTaker.id;
    } else {
      ball.holderPlayerId = null;
    }

    newEvents.unshift({
      id: `ev-throw-${Date.now()}`,
      minute: Math.max(1, newMinute === 0 ? 1 : newMinute),
      second: Math.floor(newSecond),
      type: 'pass',
      teamId: throwTeamId,
      detail: `Top taca çıktı. Taç atışını ${throwTeam.name} kullanacak.`,
    });
  }

  // 6. GOALLINE OUT (KORNER VEYA AUT / GOAL KICK)
  if (!ball.isInGoal && restartTimer <= 0 && (ball.x <= MARGIN || ball.x >= PITCH_WIDTH - MARGIN)) {
    const isLeftOut = ball.x <= MARGIN;
    const leftTeam = sidesSwapped ? state.awayTeam : state.homeTeam;
    const rightTeam = sidesSwapped ? state.homeTeam : state.awayTeam;

    const lastTouchTeamId = ball.lastTeamId || state.homeTeam.id;
    const currentMatchMinute = Math.max(1, newMinute === 0 ? 1 : newMinute);

    if (isLeftOut) {
      // Out on left goal line
      if (lastTouchTeamId === leftTeam.id) {
        // CORNER for rightTeam!
        stats.corners[rightTeam.id === state.homeTeam.id ? 0 : 1]++;

        const cornerY = ball.y < PITCH_HEIGHT * 0.5 ? MARGIN + 4 : PITCH_HEIGHT - MARGIN - 4;
        const cornerX = MARGIN + 4;
        ball.x = cornerX;
        ball.y = cornerY;
        ball.vx = 0;
        ball.vy = 0;
        ball.z = 0;

        const cornerTaker = players.find(p => p.teamId === rightTeam.id && !p.isRedCarded && p.role === 'MF') ||
          players.find(p => p.teamId === rightTeam.id && !p.isRedCarded && p.role === 'FW') ||
          players.find(p => p.teamId === rightTeam.id && !p.isRedCarded);

        if (cornerTaker) {
          cornerTaker.x = cornerX + 8;
          cornerTaker.y = cornerY + (cornerY < PITCH_HEIGHT * 0.5 ? 8 : -8);
          cornerTaker.hasBall = true;
          cornerTaker.actionCooldown = 0.2;
          ball.holderPlayerId = cornerTaker.id;
        } else {
          ball.holderPlayerId = null;
        }

        refereeDecisionBanner = {
          type: 'corner',
          title: 'KORNER!',
          detail: `Top kornere çıktı! Köşe vuruşu ${rightTeam.name} lehine.`,
          teamName: rightTeam.name,
          isHome: rightTeam.id === state.homeTeam.id,
          timer: 3.0,
        };

        newEvents.unshift({
          id: `ev-corner-${Date.now()}`,
          minute: currentMatchMinute,
          second: Math.floor(newSecond),
          type: 'corner',
          teamId: rightTeam.id,
          detail: `KORNER! Savunmadan seken top dışarıda. ${rightTeam.name} köşe vuruşu kazandı.`,
        });
      } else {
        // GOAL KICK (AUT ATIŞI) for leftTeam
        const gkX = MARGIN + 45;
        const gkY = PITCH_HEIGHT * 0.5;
        ball.x = gkX;
        ball.y = gkY;
        ball.vx = 0;
        ball.vy = 0;
        ball.z = 0;

        const gk = players.find(p => p.teamId === leftTeam.id && p.role === 'GK');
        if (gk) {
          gk.x = gkX;
          gk.y = gkY;
          gk.hasBall = true;
          gk.actionCooldown = 0.2;
          ball.holderPlayerId = gk.id;
        } else {
          ball.holderPlayerId = null;
        }

        refereeDecisionBanner = {
          type: 'goal_kick',
          title: 'AUT ATIŞI',
          detail: `Top auta çıktı. Kaleci ${leftTeam.shortName} aut atışıyla oyunu başlatacak.`,
          teamName: leftTeam.name,
          isHome: leftTeam.id === state.homeTeam.id,
          timer: 2.8,
        };

        newEvents.unshift({
          id: `ev-aut-${Date.now()}`,
          minute: currentMatchMinute,
          second: Math.floor(newSecond),
          type: 'pass',
          teamId: leftTeam.id,
          detail: `Top auta çıktı. ${leftTeam.name} kalecisi aut atışı kullanacak.`,
        });
      }
    } else {
      // Out on right goal line
      if (lastTouchTeamId === rightTeam.id) {
        // CORNER for leftTeam!
        stats.corners[leftTeam.id === state.homeTeam.id ? 0 : 1]++;

        const cornerY = ball.y < PITCH_HEIGHT * 0.5 ? MARGIN + 4 : PITCH_HEIGHT - MARGIN - 4;
        const cornerX = PITCH_WIDTH - MARGIN - 4;
        ball.x = cornerX;
        ball.y = cornerY;
        ball.vx = 0;
        ball.vy = 0;
        ball.z = 0;

        const cornerTaker = players.find(p => p.teamId === leftTeam.id && !p.isRedCarded && p.role === 'MF') ||
          players.find(p => p.teamId === leftTeam.id && !p.isRedCarded && p.role === 'FW') ||
          players.find(p => p.teamId === leftTeam.id && !p.isRedCarded);

        if (cornerTaker) {
          cornerTaker.x = cornerX - 8;
          cornerTaker.y = cornerY + (cornerY < PITCH_HEIGHT * 0.5 ? 8 : -8);
          cornerTaker.hasBall = true;
          cornerTaker.actionCooldown = 0.2;
          ball.holderPlayerId = cornerTaker.id;
        } else {
          ball.holderPlayerId = null;
        }

        refereeDecisionBanner = {
          type: 'corner',
          title: 'KORNER!',
          detail: `Top kornere çıktı! Köşe vuruşu ${leftTeam.name} lehine.`,
          teamName: leftTeam.name,
          isHome: leftTeam.id === state.homeTeam.id,
          timer: 3.0,
        };

        newEvents.unshift({
          id: `ev-corner-${Date.now()}`,
          minute: currentMatchMinute,
          second: Math.floor(newSecond),
          type: 'corner',
          teamId: leftTeam.id,
          detail: `KORNER! ${leftTeam.name} köşe vuruşu kazandı.`,
        });
      } else {
        // GOAL KICK (AUT ATIŞI) for rightTeam
        const gkX = PITCH_WIDTH - MARGIN - 45;
        const gkY = PITCH_HEIGHT * 0.5;
        ball.x = gkX;
        ball.y = gkY;
        ball.vx = 0;
        ball.vy = 0;
        ball.z = 0;

        const gk = players.find(p => p.teamId === rightTeam.id && p.role === 'GK');
        if (gk) {
          gk.x = gkX;
          gk.y = gkY;
          gk.hasBall = true;
          gk.actionCooldown = 0.2;
          ball.holderPlayerId = gk.id;
        } else {
          ball.holderPlayerId = null;
        }

        refereeDecisionBanner = {
          type: 'goal_kick',
          title: 'AUT ATIŞI',
          detail: `Top auta çıktı. Kaleci ${rightTeam.shortName} aut atışıyla oyunu başlatacak.`,
          teamName: rightTeam.name,
          isHome: rightTeam.id === state.homeTeam.id,
          timer: 2.8,
        };

        newEvents.unshift({
          id: `ev-aut-${Date.now()}`,
          minute: currentMatchMinute,
          second: Math.floor(newSecond),
          type: 'pass',
          teamId: rightTeam.id,
          detail: `Top auta çıktı. ${rightTeam.name} kalecisi aut atışı kullanacak.`,
        });
      }
    }
  }

  return {
    ...state,
    homeTeam,
    awayTeam,
    minute: newMinute,
    second: newSecond,
    status: newStatus,
    homeScore,
    awayScore,
    ball,
    players,
    referee,
    events: newEvents.slice(0, 35),
    stats,
    lastGoalBanner,
    substitutionBanner,
    refereeDecisionBanner,
    offsideLine,
    pendingSubs,
    restartTimer,
    restartTeamId,
    restartReason,
    restartSpot,
    halfTimeTimer,
    sidesSwapped,
  };
}
