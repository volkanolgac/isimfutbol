import React, { useState, useEffect } from 'react';
import { Team } from '../types';
import { Users, Eye, Radio, Globe, Copy, Check, ShieldCheck, Play, LogOut } from 'lucide-react';

interface MultiplayerModalProps {
  teams: Team[];
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (roomId: string, teamId: string, role: 'host' | 'guest' | 'spectator') => void;
  onStartOnlineMatch?: (homeTeamId: string, awayTeamId: string) => void;
  onLeaveRoom?: () => void;
  activeRoomId?: string | null;
  userRole?: 'host' | 'guest' | 'spectator' | null;
  spectatorCount?: number;
  guestConnected?: boolean;
  hostConnected?: boolean;
  hostTeamId?: string | null;
  guestTeamId?: string | null;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  teams,
  isOpen,
  onClose,
  onJoinRoom,
  onStartOnlineMatch,
  onLeaveRoom,
  activeRoomId,
  userRole,
  spectatorCount = 0,
  guestConnected = false,
  hostTeamId,
  guestTeamId,
}) => {
  const [roomId, setRoomId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || 'volkanspor');
  const [selectedRole, setSelectedRole] = useState<'host' | 'guest' | 'spectator'>('host');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setRoomId(Math.floor(1000 + Math.random() * 9000).toString());
    }
  }, []);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeRoomId || roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = () => {
    if (!roomId.trim()) return;
    onJoinRoom(roomId.trim(), selectedTeamId, selectedRole);
  };

  const hostTeam = teams.find(t => t.id === hostTeamId) || teams[0];
  const guestTeam = teams.find(t => t.id === guestTeamId) || teams.find(t => t.id !== hostTeam?.id) || teams[1];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-['Chakra_Petch'] tracking-wide">
                ONLINE ÇOK OYUNCULU & SEYİRCİ
              </h3>
              <p className="text-xs text-slate-400">Oda numarası ile arkadaşınla oyna veya maçı canlı izle</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold">
            ✕
          </button>
        </div>

        {activeRoomId ? (
          /* Already in Room */
          <div className="space-y-5 text-center">
            <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block">
                AKTİF ONLİNE ODA
              </span>
              <div className="text-3xl font-black text-white font-mono flex items-center justify-center gap-3">
                <span className="bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-700">{activeRoomId}</span>
                <button
                  onClick={handleCopyLink}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Oda Kodunu Kopyala"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              {/* Status info */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Rolünüz:</span>
                  <span className="font-bold text-sky-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    {userRole === 'host' ? 'Ev Sahibi (1. Oyuncu)' : userRole === 'guest' ? 'Deplasman (2. Oyuncu)' : 'Canlı Seyirci'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Rakip Durumu:</span>
                  <span className={`font-bold ${guestConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {guestConnected ? `✅ Deplasman Bağlandı (${guestTeam?.name})` : '⏳ Deplasman Bekleniyor...'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Seyirci Sayısı:</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {spectatorCount}
                  </span>
                </div>
              </div>

              {/* Action buttons for Host / Guest */}
              {userRole === 'host' && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (onStartOnlineMatch) {
                        onStartOnlineMatch(hostTeamId || teams[0].id, guestTeamId || teams[1].id);
                      }
                      onClose();
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>RAKİPLE MAÇI BAŞLAT</span>
                  </button>
                </div>
              )}

              {userRole === 'guest' && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                  ⏳ Ev sahibinin maçı başlatması veya hamle yapması bekleniyor... Maç anında senkronize olacaktır.
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {onLeaveRoom && (
                <button
                  onClick={() => {
                    onLeaveRoom();
                    onClose();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs hover:bg-rose-500/30 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Odadan Ayrıl</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Kapat ve Oyuna Dön
              </button>
            </div>
          </div>
        ) : (
          /* Join Room Form */
          <div className="space-y-4">
            {/* Room ID input */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                Oda Numarası (Room Code)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                  placeholder="Örn: 2026"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono font-bold text-base focus:border-indigo-500 outline-none"
                />
                <button
                  onClick={() => setRoomId(Math.floor(1000 + Math.random() * 9000).toString())}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  Rastgele
                </button>
              </div>
            </div>

            {/* Role selection: Host vs Guest vs Spectator */}
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5">
                Katılım Türü / Rolü Seçin:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('host')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedRole === 'host'
                      ? 'bg-blue-600/30 border-blue-500 text-white shadow ring-1 ring-blue-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Users className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                  <div className="text-xs font-bold">Oda Kur (1. Oyuncu)</div>
                  <div className="text-[10px] text-slate-400">Ev Sahibi Menajer</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('guest')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedRole === 'guest'
                      ? 'bg-rose-600/30 border-rose-500 text-white shadow ring-1 ring-rose-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Radio className="w-5 h-5 mx-auto mb-1 text-rose-400" />
                  <div className="text-xs font-bold">Odaya Gir (2. Oyuncu)</div>
                  <div className="text-[10px] text-slate-400">Deplasman Menajer</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('spectator')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedRole === 'spectator'
                      ? 'bg-amber-600/30 border-amber-500 text-white shadow ring-1 ring-amber-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Eye className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                  <div className="text-xs font-bold">Seyirci Modu</div>
                  <div className="text-[10px] text-slate-400">Maçı Canlı İzle</div>
                </button>
              </div>
            </div>

            {/* Team selection (only for players) */}
            {selectedRole !== 'spectator' && (
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Yöneteceğiniz Takımı Seçin:
                </label>
                <select
                  value={selectedTeamId}
                  onChange={e => setSelectedTeamId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none"
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Reyting: {t.rating})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConnect}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xs shadow-lg hover:brightness-110 flex items-center justify-center gap-2"
              >
                <Globe className="w-4 h-4" />
                <span>{selectedRole === 'spectator' ? 'Seyirci Olarak İzle' : 'Odaya Bağlan'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
