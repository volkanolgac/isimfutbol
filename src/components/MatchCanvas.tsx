import React, { useEffect, useRef } from 'react';
import { MatchState } from '../types';
import {
  PITCH_WIDTH,
  PITCH_HEIGHT,
  MARGIN,
  PENALTY_BOX_WIDTH,
  PENALTY_BOX_HEIGHT,
  PENALTY_BOX_TOP,
  PENALTY_BOX_BOTTOM,
  GOAL_AREA_WIDTH,
  GOAL_AREA_HEIGHT,
  GOAL_AREA_TOP,
  GOAL_AREA_BOTTOM,
  GOAL_Y_TOP,
  GOAL_Y_BOTTOM,
} from '../engine/simulationEngine';
import { ArrowDown, ArrowUp, AlertTriangle, ShieldAlert } from 'lucide-react';

interface MatchCanvasProps {
  state: MatchState;
}

export const MatchCanvas: React.FC<MatchCanvasProps> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Canvas
    ctx.clearRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);

    // 1. PITCH BASE GRASS (High visual fidelity with authentic green stripes)
    const stripeCount = 14;
    const stripeWidth = PITCH_WIDTH / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#1b4d2e' : '#1e5433';
      ctx.fillRect(i * stripeWidth, 0, stripeWidth, PITCH_HEIGHT);
    }

    // Outer Stadium run-off border
    ctx.fillStyle = '#143c24';
    ctx.fillRect(0, 0, PITCH_WIDTH, MARGIN);
    ctx.fillRect(0, PITCH_HEIGHT - MARGIN, PITCH_WIDTH, MARGIN);
    ctx.fillRect(0, 0, MARGIN, PITCH_HEIGHT);
    ctx.fillRect(PITCH_WIDTH - MARGIN, 0, MARGIN, PITCH_HEIGHT);

    // 2. LINE MARKINGS (Pure White, Crisp)
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;

    const margin = 20;
    const pw = PITCH_WIDTH - margin * 2;
    const ph = PITCH_HEIGHT - margin * 2;

    // Boundary Outer Line
    ctx.strokeRect(margin, margin, pw, ph);

    // Halfway Line
    ctx.beginPath();
    ctx.moveTo(PITCH_WIDTH * 0.5, margin);
    ctx.lineTo(PITCH_WIDTH * 0.5, PITCH_HEIGHT - margin);
    ctx.stroke();

    // Center Circle & Spot
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH * 0.5, PITCH_HEIGHT * 0.5, 70, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH * 0.5, PITCH_HEIGHT * 0.5, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Corner Arcs
    const drawCornerArc = (cx: number, cy: number, startAngle: number, endAngle: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 18, startAngle, endAngle);
      ctx.stroke();
    };
    drawCornerArc(margin, margin, 0, Math.PI * 0.5);
    drawCornerArc(PITCH_WIDTH - margin, margin, Math.PI * 0.5, Math.PI);
    drawCornerArc(PITCH_WIDTH - margin, PITCH_HEIGHT - margin, Math.PI, Math.PI * 1.5);
    drawCornerArc(margin, PITCH_HEIGHT - margin, Math.PI * 1.5, Math.PI * 2);

    // Left Penalty Area (16.5m)
    ctx.strokeRect(MARGIN, PENALTY_BOX_TOP, PENALTY_BOX_WIDTH, PENALTY_BOX_HEIGHT);

    // Left Goal Area (5.5m)
    ctx.strokeRect(MARGIN, GOAL_AREA_TOP, GOAL_AREA_WIDTH, GOAL_AREA_HEIGHT);

    // Left Penalty Spot & Outer Penalty Arc (Ceza sahası yay çizgisi - ceza sahasının DIŞINDA, çizgiye bitişik)
    const leftPenaltySpotX = MARGIN + 90;
    const penaltyArcRadius = 55;
    const leftIntersectAngle = Math.acos((MARGIN + PENALTY_BOX_WIDTH - leftPenaltySpotX) / penaltyArcRadius);
    ctx.beginPath();
    ctx.arc(leftPenaltySpotX, PITCH_HEIGHT * 0.5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(leftPenaltySpotX, PITCH_HEIGHT * 0.5, penaltyArcRadius, -leftIntersectAngle, leftIntersectAngle);
    ctx.stroke();

    // Right Penalty Area
    ctx.strokeRect(PITCH_WIDTH - MARGIN - PENALTY_BOX_WIDTH, PENALTY_BOX_TOP, PENALTY_BOX_WIDTH, PENALTY_BOX_HEIGHT);

    // Right Goal Area
    ctx.strokeRect(PITCH_WIDTH - MARGIN - GOAL_AREA_WIDTH, GOAL_AREA_TOP, GOAL_AREA_WIDTH, GOAL_AREA_HEIGHT);

    // Right Penalty Spot & Outer Penalty Arc (Ceza sahası yay çizgisi - ceza sahasının DIŞINDA, çizgiye bitişik)
    const rightPenaltySpotX = PITCH_WIDTH - MARGIN - 90;
    const rightIntersectAngle = Math.acos((rightPenaltySpotX - (PITCH_WIDTH - MARGIN - PENALTY_BOX_WIDTH)) / penaltyArcRadius);
    ctx.beginPath();
    ctx.arc(rightPenaltySpotX, PITCH_HEIGHT * 0.5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      rightPenaltySpotX,
      PITCH_HEIGHT * 0.5,
      penaltyArcRadius,
      Math.PI - rightIntersectAngle,
      Math.PI + rightIntersectAngle
    );
    ctx.stroke();

    // 4. GOAL POSTS & NETTINGS (Left & Right)
    const drawGoalNet = (gx: number, depth: number) => {
      ctx.fillStyle = 'rgba(240, 240, 240, 0.15)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1;
      const x1 = depth > 0 ? gx : gx + depth;
      const w = Math.abs(depth);
      ctx.fillRect(x1, GOAL_Y_TOP, w, GOAL_Y_BOTTOM - GOAL_Y_TOP);

      for (let nx = x1; nx <= x1 + w; nx += 4) {
        ctx.beginPath();
        ctx.moveTo(nx, GOAL_Y_TOP);
        ctx.lineTo(nx, GOAL_Y_BOTTOM);
        ctx.stroke();
      }
      for (let ny = GOAL_Y_TOP; ny <= GOAL_Y_BOTTOM; ny += 5) {
        ctx.beginPath();
        ctx.moveTo(x1, ny);
        ctx.lineTo(x1 + w, ny);
        ctx.stroke();
      }

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(x1, GOAL_Y_TOP, w, GOAL_Y_BOTTOM - GOAL_Y_TOP);
    };

    drawGoalNet(margin, -18);
    drawGoalNet(PITCH_WIDTH - margin, 18);

    ctx.restore();

    // 5. DRAW OFFSIDE LINE (OFSAYT KIRMIZI ÇİZGİSİ VE OYUNCU İZ DÜŞÜMÜ)
    if (state.offsideLine) {
      const line = state.offsideLine;
      ctx.save();

      // Translucent shaded offside zone (ofsayt bölgesi gölgelendirmesi)
      const isAttackingRight = line.attackerX > line.defenderX;
      const zoneStart = line.x;
      const zoneWidth = isAttackingRight ? (PITCH_WIDTH - margin) - line.x : margin - line.x;

      ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
      ctx.fillRect(zoneStart, margin, zoneWidth, PITCH_HEIGHT - margin * 2);

      // Main Bright Red Laser Offside Line through pitch (Son Savunmacı Hattı)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 5]);
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(line.x, margin - 6);
      ctx.lineTo(line.x, PITCH_HEIGHT - margin + 6);
      ctx.stroke();

      // Secondary attacker line (Hücumcu İzdüşüm Çizgisi)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 6;

      ctx.beginPath();
      ctx.moveTo(line.attackerX, margin - 4);
      ctx.lineTo(line.attackerX, PITCH_HEIGHT - margin + 4);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Indicator badge at top of offside line
      const badgeY = margin + 18;
      const badgeText = 'OFSAYT ÇİZGİSİ (VAR)';
      ctx.font = '900 10px "Chakra Petch", sans-serif';
      const bMetrics = ctx.measureText(badgeText);
      const bW = bMetrics.width + 16;
      const bH = 20;

      ctx.fillStyle = 'rgba(220, 38, 38, 0.95)';
      ctx.strokeStyle = '#fecaca';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(line.x - bW * 0.5, badgeY - bH * 0.5, bW, bH, 5);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, line.x, badgeY);

      // Distance difference indicator between defender and attacker
      const diffDistPx = Math.abs(line.attackerX - line.defenderX);
      const diffMeters = (diffDistPx * (105 / (PITCH_WIDTH - margin * 2))).toFixed(1);
      
      const midY = (line.attackerY + line.defenderY) * 0.5;
      const distLabel = `+${diffMeters}m Önde`;
      ctx.font = 'bold 9px "Outfit", sans-serif';
      const dMetrics = ctx.measureText(distLabel);
      const dW = dMetrics.width + 12;
      const dH = 16;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect((line.attackerX + line.defenderX) * 0.5 - dW * 0.5, midY - dH * 0.5, dW, dH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fca5a5';
      ctx.fillText(distLabel, (line.attackerX + line.defenderX) * 0.5, midY);

      // Red circle spotlight highlight on offside attacker
      ctx.beginPath();
      ctx.arc(line.attackerX, line.attackerY, 26, 0, Math.PI * 2);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fill();

      // Blue circle highlight on last defender
      ctx.beginPath();
      ctx.arc(line.defenderX, line.defenderY, 22, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.fill();

      ctx.restore();
    }

    // 6. DRAW REFEREE (HAKEM)
    if (state.referee) {
      const ref = state.referee;
      ctx.save();
      // Referee shadow
      ctx.beginPath();
      ctx.ellipse(ref.x, ref.y + 4, 11, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      // Referee Outer Circle (Bright Fluorescent Neon Yellow Kit)
      ctx.beginPath();
      ctx.arc(ref.x, ref.y, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#09090b';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(ref.x, ref.y, 9.5, 0, Math.PI * 2);
      ctx.fillStyle = '#eab308'; // Referee yellow
      ctx.fill();

      // Ref badge "H"
      ctx.fillStyle = '#09090b';
      ctx.font = '900 9px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('REF', ref.x, ref.y);

      // Name Label Pill Underneath
      ctx.font = 'bold 8.5px "Outfit", sans-serif';
      const refLabel = 'Hakem';
      const refMetrics = ctx.measureText(refLabel);
      const rBadgeW = refMetrics.width + 8;
      const rBadgeH = 13;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(ref.x - rBadgeW * 0.5, ref.y + 13, rBadgeW, rBadgeH, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.fillText(refLabel, ref.x, ref.y + 19.5);
      ctx.restore();
    }

    // 6. DRAW PLAYERS
    state.players.forEach(player => {
      if (player.isRedCarded) return; // Expelled from pitch

      const isHome = player.teamId === state.homeTeam.id;
      const team = isHome ? state.homeTeam : state.awayTeam;
      const isGk = player.role === 'GK';
      const kit = isGk ? team.gkKit : (isHome ? team.homeKit : team.awayKit);

      ctx.save();

      // Shadow under player
      ctx.beginPath();
      ctx.ellipse(player.x, player.y + 4, 13, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      // Ball carrier pulse aura
      if (player.hasBall) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, 22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Outer Ring / Border
      ctx.beginPath();
      ctx.arc(player.x, player.y, 14.5, 0, Math.PI * 2);
      ctx.fillStyle = kit.jerseySecondary;
      ctx.fill();

      // Inner Jersey Circle
      ctx.beginPath();
      ctx.arc(player.x, player.y, 12.5, 0, Math.PI * 2);
      ctx.fillStyle = kit.jerseyMain;
      ctx.fill();

      // Number in center of circle
      ctx.fillStyle = kit.numberColor;
      ctx.font = '900 11px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.number.toString(), player.x, player.y);

      // Facing indicator pip
      const pipDist = 16;
      const pipX = player.x + Math.cos(player.headingAngle) * pipDist;
      const pipY = player.y + Math.sin(player.headingAngle) * pipDist;
      ctx.beginPath();
      ctx.arc(pipX, pipY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = isHome ? '#60a5fa' : '#f87171';
      ctx.fill();

      // Yellow Card Badge if booked
      if (player.yellowCards > 0) {
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 0.8;
        ctx.fillRect(player.x + 8, player.y - 14, 6, 8);
        ctx.strokeRect(player.x + 8, player.y - 14, 6, 8);
      }

      // Name Label Pill Underneath
      const labelText = player.name;
      ctx.font = 'bold 9.5px "Outfit", sans-serif';
      const textMetrics = ctx.measureText(labelText);
      const badgeW = Math.max(34, textMetrics.width + 10);
      const badgeH = 15;
      const badgeX = player.x - badgeW * 0.5;
      const badgeY = player.y + 16;

      // Badge background pill
      ctx.fillStyle = isHome ? 'rgba(15, 23, 42, 0.85)' : 'rgba(24, 24, 27, 0.85)';
      ctx.strokeStyle = isHome ? '#38bdf8' : '#fb7185';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
      ctx.fill();
      ctx.stroke();

      // Badge text
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, player.x, badgeY + badgeH * 0.5);

      ctx.restore();
    });

    // 7. DRAW BALL
    const ball = state.ball;
    ctx.save();

    // Ball shadow (scales with z height)
    const shadowScale = Math.max(0.5, 1 - ball.z / 120);
    ctx.beginPath();
    ctx.ellipse(ball.x, ball.y + 4 + ball.z * 0.2, 7 * shadowScale, 3.5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();

    // Ball motion trail if fast or high
    const ballSpeed = Math.hypot(ball.vx, ball.vy);
    if (ballSpeed > 180 || ball.z > 15) {
      ctx.strokeStyle = ball.z > 20 ? 'rgba(251, 191, 36, 0.5)' : 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = ball.z > 20 ? 6 : 4;
      ctx.beginPath();
      ctx.moveTo(ball.x, ball.y - ball.z);
      ctx.lineTo(ball.x - ball.vx * 0.05, ball.y - ball.vy * 0.05 - ball.z);
      ctx.stroke();
    }

    // Ball circle (elevates on screen by -ball.z, grows larger at apex of cross)
    const ballRadius = 6.5 + Math.min(10, ball.z * 0.18);
    const ballScreenY = ball.y - ball.z;
    ctx.beginPath();
    ctx.arc(ball.x, ballScreenY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Ball pattern detail
    ctx.beginPath();
    ctx.arc(ball.x, ballScreenY, ballRadius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    ctx.restore();
  }, [state]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[105/68] max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950"
    >
      <canvas
        ref={canvasRef}
        width={PITCH_WIDTH}
        height={PITCH_HEIGHT}
        className="w-full h-full block cursor-crosshair"
      />

      {/* 1. SUBSTITUTION BANNER (OYUNCU DEĞİŞİKLİĞİ ANİMASYONLU BİLGİ PANELİ) */}
      {state.substitutionBanner && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 animate-bounce pointer-events-none w-[90%] max-w-lg">
          <div className="bg-slate-950/95 border-2 border-emerald-500 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-md flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: state.substitutionBanner.teamColor }} />
                <span className="font-extrabold text-sm text-amber-400 font-['Chakra_Petch'] uppercase tracking-wider">
                  {state.substitutionBanner.teamName} - OYUNCU DEĞİŞİKLİĞİ
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                CANLI
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Çıkan Oyuncu: Kırmızı Aşağı Ok */}
              <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-2 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-500 text-slate-950 flex items-center justify-center font-black">
                  <ArrowDown className="w-5 h-5 stroke-[3]" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Çıkan:</div>
                  <div className="font-black text-white truncate font-['Outfit'] text-xs sm:text-sm">
                    #{state.substitutionBanner.outPlayer.number} {state.substitutionBanner.outPlayer.name}
                  </div>
                  <div className="text-[10px] text-slate-400">({state.substitutionBanner.outPlayer.position})</div>
                </div>
              </div>

              {/* Giren Oyuncu: Yeşil Yukarı Ok */}
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-400 text-slate-950 flex items-center justify-center font-black">
                  <ArrowUp className="w-5 h-5 stroke-[3]" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Giren:</div>
                  <div className="font-black text-white truncate font-['Outfit'] text-xs sm:text-sm">
                    #{state.substitutionBanner.inPlayer.number} {state.substitutionBanner.inPlayer.name}
                  </div>
                  <div className="text-[10px] text-slate-400">({state.substitutionBanner.inPlayer.position})</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. REFEREE DECISION BANNER (HAKEM KARARI: FAUL, KARTLAR, PENALTI, OFSAYT, KORNER) */}
      {state.refereeDecisionBanner && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-fade-in w-[90%] max-w-md">
          <div
            className={`rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-md border-2 flex items-center gap-3.5 ${
              state.refereeDecisionBanner.type === 'red_card' || state.refereeDecisionBanner.type === 'second_yellow'
                ? 'bg-rose-950/95 border-rose-500 text-rose-100'
                : state.refereeDecisionBanner.type === 'penalty'
                ? 'bg-amber-950/95 border-amber-400 text-amber-100 animate-pulse'
                : state.refereeDecisionBanner.type === 'yellow_card'
                ? 'bg-yellow-950/95 border-yellow-400 text-yellow-100'
                : state.refereeDecisionBanner.type === 'offside'
                ? 'bg-red-950/95 border-red-500 text-red-100'
                : 'bg-slate-900/95 border-emerald-500 text-slate-100'
            }`}
          >
            {/* Decision Icon */}
            <div className="flex-shrink-0">
              {state.refereeDecisionBanner.type === 'red_card' || state.refereeDecisionBanner.type === 'second_yellow' ? (
                <div className="w-8 h-11 bg-rose-600 border-2 border-white rounded shadow-md flex items-center justify-center font-black text-white text-xs">
                  KR
                </div>
              ) : state.refereeDecisionBanner.type === 'yellow_card' ? (
                <div className="w-8 h-11 bg-yellow-400 border-2 border-slate-900 rounded shadow-md flex items-center justify-center font-black text-slate-950 text-xs">
                  SR
                </div>
              ) : state.refereeDecisionBanner.type === 'penalty' ? (
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg font-black font-['Chakra_Petch']">
                  PEN
                </div>
              ) : state.refereeDecisionBanner.type === 'offside' ? (
                <div className="w-10 h-10 rounded-xl bg-red-600 border border-red-400 text-white flex items-center justify-center shadow-lg font-black font-['Chakra_Petch'] text-xs">
                  VAR
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center text-amber-400 font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Decision Text */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-sm uppercase tracking-wider font-['Chakra_Petch']">
                  {state.refereeDecisionBanner.title}
                </span>
                {state.refereeDecisionBanner.teamName && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 font-bold">
                    {state.refereeDecisionBanner.teamName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 mt-0.5 leading-snug">
                {state.refereeDecisionBanner.detail}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. HALFTIME INTERMISSION BANNER */}
      {state.status === 'halftime' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-slate-950/75 backdrop-blur-sm animate-fade-in z-30">
          <div className="text-center p-6 rounded-2xl bg-slate-900/95 border-2 border-amber-500/80 shadow-2xl max-w-md mx-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider mb-3">
              Devre Arası
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-white font-['Chakra_Petch'] mb-2">
              İlk Yarı Sona Erdi
            </h3>
            <p className="text-sm text-slate-300 mb-4">
              Takımlar kale yönlerini değiştiriyor! Sağdakiler sola, soldakiler sağa geçiyor.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono text-sm font-bold shadow-inner">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>İkinci yarı başlıyor: {Math.max(1, Math.ceil(state.halfTimeTimer ?? 3))}s</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. GOAL CELEBRATION OVERLAY */}
      {state.lastGoalBanner && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          <div className="absolute inset-0 animate-pulse bg-white/25 mix-blend-screen" />
          <div
            className="absolute inset-0"
            style={{
              animation: 'strobeFlash 0.25s infinite alternate',
              background: `radial-gradient(circle at 50% 50%, ${state.lastGoalBanner.teamColor}55 0%, rgba(255,255,255,0.4) 30%, transparent 70%)`
            }}
          />

          <div className="absolute top-0 left-0 w-64 h-64 bg-amber-300/30 rounded-full blur-3xl animate-ping" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-200/30 rounded-full blur-3xl animate-ping" style={{ animationDelay: '0.12s' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-200/30 rounded-full blur-3xl animate-ping" style={{ animationDelay: '0.08s' }} />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-300/30 rounded-full blur-3xl animate-ping" style={{ animationDelay: '0.18s' }} />

          <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
            <div className="text-center transform scale-105 sm:scale-110 transition-transform">
              <div className="inline-block px-6 py-3 sm:px-8 sm:py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white shadow-2xl border-2 border-yellow-300 animate-bounce">
                <span className="text-3xl sm:text-5xl md:text-6xl font-black tracking-widest uppercase font-['Chakra_Petch'] drop-shadow-md">
                  GOOOOOOL!
                </span>
              </div>
              <div className="mt-3 bg-slate-900/90 border border-slate-700 px-5 py-2 sm:px-6 sm:py-2.5 rounded-full inline-flex items-center gap-2.5 sm:gap-3 text-slate-100 shadow-xl">
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: state.lastGoalBanner.teamColor }} />
                <span className="font-extrabold text-amber-400 font-['Outfit'] text-base sm:text-lg">
                  {state.lastGoalBanner.teamName}
                </span>
                <span className="text-slate-400">|</span>
                <span className="font-semibold text-white text-sm sm:text-base">
                  {state.lastGoalBanner.playerName} ({state.lastGoalBanner.minute}')
                </span>
              </div>
              {state.restartTimer !== undefined && state.restartTimer > 0 && (
                <div className="mt-2 block">
                  <span className="text-xs font-mono font-bold text-amber-300 bg-slate-950/90 px-4 py-1.5 rounded-full border border-amber-500/40 shadow-lg inline-block">
                    Santra Yapılıyor ({Math.max(1, Math.ceil(state.restartTimer))}s)...
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
