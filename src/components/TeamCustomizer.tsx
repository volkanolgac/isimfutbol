import React, { useState } from 'react';
import { Team, Player, Position } from '../types';
import { TeamFlag } from './TeamFlag';
import { JerseyBackView } from './JerseyBackView';
import { Edit3, Save, RotateCcw, Download, Upload, CheckCircle2 } from 'lucide-react';
import { toTurkishUpper } from '../utils/textUtils';

interface TeamCustomizerProps {
  teams: Team[];
  onUpdateTeam: (updatedTeam: Team) => void;
  onResetTeams: () => void;
  gameMode?: 'isimfutbol' | 'superlig';
  onSwitchGameMode?: (mode: 'isimfutbol' | 'superlig') => void;
}

export const TeamCustomizer: React.FC<TeamCustomizerProps> = ({
  teams,
  onUpdateTeam,
  onResetTeams,
  gameMode = 'isimfutbol',
  onSwitchGameMode,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || 'volkanspor');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [saveToast, setSaveToast] = useState(false);

  const team = teams.find(t => t.id === selectedTeamId) || teams[0];

  const handlePlayerChange = (field: keyof Player, value: any) => {
    if (!editingPlayer) return;
    setEditingPlayer({
      ...editingPlayer,
      [field]: value,
    });
  };

  const handleSavePlayer = () => {
    if (!editingPlayer || !team) return;
    const updatedPlayers = team.players.map(p =>
      p.id === editingPlayer.id ? editingPlayer : p
    );
    const updatedTeam = {
      ...team,
      players: updatedPlayers,
    };
    onUpdateTeam(updatedTeam);
    setEditingPlayer(null);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  // Export team roster as JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(team, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${team.id}_kadro.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON file
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const imported = JSON.parse(event.target?.result as string) as Team;
        if (imported.id && imported.players) {
          onUpdateTeam(imported);
          setSaveToast(true);
          setTimeout(() => setSaveToast(false), 2500);
        }
      } catch (err) {
        console.error('JSON okuma hatası:', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white font-['Chakra_Petch'] tracking-wide flex items-center gap-2">
            <Edit3 className="w-6 h-6 text-amber-400" />
            <span>KULÜP & OYUNCU AYARLARI (JSON EDİTÖR)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Oyuncu isimlerini (İ, ı, ğ, ü, ş, ö harflerine duyarlı), forma numaralarını ve güçlerini güncelleyin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Kadro JSON dosyasını indir"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>JSON İndir</span>
          </button>

          <label className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>JSON Yükle</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={onResetTeams}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Varsayılan kadro ve renk ayarlarına dön"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Sıfırla</span>
          </button>
        </div>
      </div>

      {/* GAME MODE SWITCHER BANNER */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900 border border-amber-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="text-xs font-black uppercase tracking-widest text-amber-400 font-['Chakra_Petch'] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>OYUN MODU SEÇİMİ</span>
          </div>
          <h3 className="text-base font-black text-white font-['Chakra_Petch']">
            {gameMode === 'superlig' ? '🇹🇷 Türkiye Süper Lig Modu (Aktif)' : '⚽ İsimfutbol Modu (Aktif)'}
          </h3>
          <p className="text-xs text-slate-300">
            {gameMode === 'superlig' 
              ? '18 Türkiye Süper Lig takımı (Galatasaray, Fenerbahçe, Beşiktaş, Trabzonspor vb.) gerçek oyuncu kadroları ve formalarıyla oynanabilir.'
              : 'Varsayılan İsimfutbol takımları ve oyuncuları aktif.'}
          </p>
        </div>

        {onSwitchGameMode && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSwitchGameMode('isimfutbol')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                gameMode === 'isimfutbol'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
              }`}
            >
              İsimfutbol Modu
            </button>
            <button
              onClick={() => onSwitchGameMode('superlig')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5 ${
                gameMode === 'superlig'
                  ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30 ring-2 ring-red-400/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
              }`}
            >
              <span>🇹🇷 Türkiye Süper Lig</span>
            </button>
          </div>
        )}
      </div>

      {/* Team Selector Pills */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Düzenlenecek Takımı Seçin:
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {teams.map(t => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTeamId(t.id);
                setEditingPlayer(null);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all border ${
                selectedTeamId === t.id
                  ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg ring-1 ring-amber-500'
                  : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <TeamFlag team={t} size="sm" showPole={false} />
              <span className="font-['Chakra_Petch']">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Team Summary Info Banner */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <TeamFlag team={team} size="md" />
          <div>
            <h3 className="text-lg font-black text-white font-['Chakra_Petch']">{team.name}</h3>
            <p className="text-xs text-amber-400 font-medium">"{team.slogan}"</p>
            <div className="text-[11px] text-slate-400 mt-1">
              Stadyum: {team.stadium} • Reyting: <span className="text-white font-bold">{team.rating}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Ev Sahibi Forma</div>
            <div className="flex items-center gap-1.5 justify-center">
              <span className="w-5 h-5 rounded-full border border-slate-600" style={{ backgroundColor: team.homeKit.jerseyMain }} />
              <span className="w-5 h-5 rounded-full border border-slate-600" style={{ backgroundColor: team.homeKit.jerseySecondary }} />
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Deplasman Forma</div>
            <div className="flex items-center gap-1.5 justify-center">
              <span className="w-5 h-5 rounded-full border border-slate-600" style={{ backgroundColor: team.awayKit.jerseyMain }} />
              <span className="w-5 h-5 rounded-full border border-slate-600" style={{ backgroundColor: team.awayKit.jerseySecondary }} />
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Kaleci Forması</div>
            <div className="flex items-center gap-1.5 justify-center">
              <span className="w-5 h-5 rounded-full border border-slate-600" style={{ backgroundColor: team.gkKit.jerseyMain }} />
              <span className="w-5 h-5 rounded-full border border-slate-600" style={{ backgroundColor: team.gkKit.jerseySecondary }} />
            </div>
          </div>
        </div>
      </div>

      {/* Player Editor Modal / Panel */}
      {editingPlayer && (
        <div className="bg-slate-950 p-5 rounded-xl border border-amber-500/50 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="font-bold text-base text-amber-400 font-['Chakra_Petch']">
              Oyuncu Bilgilerini Düzenle: {editingPlayer.name}
            </h4>
            <div className="text-xs text-slate-400">Türkçe Karakter Uyumlu (İ, ı, ğ, ü, ş, ö, ç)</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Oyuncu Adı (Forma Arkası)</label>
              <input
                type="text"
                value={editingPlayer.name}
                onChange={e => handlePlayerChange('name', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Forma Numarası (Sırt No)</label>
              <input
                type="number"
                min="1"
                max="99"
                value={editingPlayer.number}
                onChange={e => handlePlayerChange('number', parseInt(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Mevki / Pozisyon</label>
              <select
                value={editingPlayer.position}
                onChange={e => handlePlayerChange('position', e.target.value as Position)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold focus:border-amber-500 outline-none"
              >
                <option value="GK">Kaleci (GK)</option>
                <option value="DF">Defans (DF)</option>
                <option value="MF">Orta Saha (MF)</option>
                <option value="FW">Forvet (FW)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">Genel Güç (Reyting)</label>
              <input
                type="number"
                min="50"
                max="99"
                value={editingPlayer.rating}
                onChange={e => handlePlayerChange('rating', parseInt(e.target.value) || 75)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Player Detailed Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Hız (Pace): {editingPlayer.pace}</span>
              <input
                type="range"
                min="50"
                max="99"
                value={editingPlayer.pace}
                onChange={e => handlePlayerChange('pace', parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Şut (Shooting): {editingPlayer.shooting}</span>
              <input
                type="range"
                min="50"
                max="99"
                value={editingPlayer.shooting}
                onChange={e => handlePlayerChange('shooting', parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Pas (Passing): {editingPlayer.passing}</span>
              <input
                type="range"
                min="50"
                max="99"
                value={editingPlayer.passing}
                onChange={e => handlePlayerChange('passing', parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Defans (Defending): {editingPlayer.defending}</span>
              <input
                type="range"
                min="50"
                max="99"
                value={editingPlayer.defending}
                onChange={e => handlePlayerChange('defending', parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              onClick={() => setEditingPlayer(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
            >
              Vazgeç
            </button>
            <button
              onClick={handleSavePlayer}
              className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-lg hover:bg-amber-400 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Değişiklikleri Kaydet</span>
            </button>
          </div>
        </div>
      )}

      {/* Squad Jersey Grid (Sırt Görüntüleri) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Kadro Listesi (6 Sahada [1 GK + 5] • 5 Yedekte [1 GK + 4]):
          </h4>
          <span className="text-xs text-slate-400">Düzenlemek için oyuncunun üzerine tıklayın</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {team.players.map(player => {
            const isSelected = editingPlayer?.id === player.id;
            return (
              <div
                key={player.id}
                onClick={() => setEditingPlayer({ ...player })}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-between ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-400'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="w-full flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
                  <span>{player.isStarter ? '11\'DE' : 'YEDEK'}</span>
                  <span className="text-amber-400">{player.rating}</span>
                </div>

                {/* 3D Realistic Jersey Back View */}
                <JerseyBackView player={player} team={team} size="sm" showLabel={true} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
