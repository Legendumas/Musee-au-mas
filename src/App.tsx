import React, { useState } from 'react';
import { SuperCluedoEngine, MUSEUM_ROOMS, SUSPECTS, WEAPONS, MOTIVES, MatrixColumn, TriState, RoleId } from './gameEngine';

export default function App() {
  const [engine, setEngine] = useState<SuperCluedoEngine | null>(null);
  const [session, setSession] = useState<any>(null);

  // Configuration initiale du Lobby
  const [playerNames, setPlayerNames] = useState<string[]>(['Robin', 'Emma']);
  const [playerRoles, setPlayerRoles] = useState<RoleId[]>(['PROFILER', 'VETERAN']);

  // États de l'application
  const [currentViewMode, setCurrentViewMode] = useState<'PLAYER' | 'GM' | 'NOTEBOOK'>('PLAYER');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [actionType, setActionType] = useState<'MOVE' | 'SEARCH' | 'INTERROGATE' | 'ANALYZE' | 'ACCUSE' | 'ARREST'>('MOVE');
  const [targetRoom, setTargetRoom] = useState(1);
  const [targetZone, setTargetZone] = useState<'A' | 'B'>('A');
  const [targetNpc, setTargetNpc] = useState(SUSPECTS[0].id);
  const [diceRoll, setDiceRoll] = useState<number | null>(3);

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedPlayers = playerNames.map((name, index) => ({
      id: `p${index + 1}`,
      name: name.trim() || `Détective ${index + 1}`,
      roleId: playerRoles[index],
    }));

    const newEngine = new SuperCluedoEngine('MUSE_V2', formattedPlayers);
    setEngine(newEngine);
    const newSession = newEngine.getSession();
    setSession(newSession);
    setSelectedPlayerId(newSession.turnOrder[0]);
  };

  const refreshSession = () => {
    if (engine) setSession(engine.getSession());
  };

  const handlePlayerSubmit = () => {
    if (!engine || diceRoll === null) return;
    try {
      engine.submitPlayerAction({
        playerId: selectedPlayerId,
        playerName: session.players[selectedPlayerId].name,
        roleId: session.players[selectedPlayerId].roleId,
        actionType,
        targetRoomId: actionType === 'MOVE' ? targetRoom : undefined,
        targetZone: actionType === 'SEARCH' ? targetZone : undefined,
        targetNpcId: actionType === 'INTERROGATE' ? targetNpc : undefined,
        rawDiceRoll: diceRoll,
      });
      refreshSession();
      alert('Action transmise au Maître du Jeu avec succès !');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleGmApprove = () => {
    if (!engine) return;
    engine.approvePendingAction();
    refreshSession();
  };

  const handleCycleCell = (suspectId: string, column: MatrixColumn) => {
    if (!engine) return;
    if (!session.notebook.visibleColumns[column]) return;
    const currentVal = session.notebook.playerNotes[suspectId][column];
    const nextVal: TriState = currentVal === 'NSP' ? 'YES' : currentVal === 'YES' ? 'NO' : 'NSP';
    engine.updateNotebookNote(suspectId, column, nextVal);
    refreshSession();
  };

  // --- ÉCRAN DE CONFIGURATION (LOBBY TACTIQUE) ---
  if (!session || !engine) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 p-6 flex flex-col justify-center items-center font-sans">
        <div className="max-w-md w-full bg-[#111827] border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">
              Édition Musée v2
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight mt-3">SUPER CLUEDO</h1>
            <p className="text-xs text-slate-400 mt-1">Module d'enquête interactif & arbitrage</p>
          </div>

          <form onSubmit={handleStartGame} className="space-y-5 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-2 uppercase tracking-wider text-[10px]">Nombre d'enquêteurs :</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      setPlayerNames(Array.from({ length: count }, (_, i) => playerNames[i] || `Joueur ${i + 1}`));
                      setPlayerRoles(Array.from({ length: count }, (_, i) => playerRoles[i] || 'PROFILER'));
                    }}
                    className={`py-2.5 rounded-xl font-bold border transition ${
                      playerNames.length === count ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-[#0b0f17] text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {playerNames.map((name, index) => (
                <div key={index} className="bg-[#0b0f17] p-4 rounded-2xl border border-slate-800/80 space-y-2">
                  <span className="font-bold text-amber-400 text-[11px]">Enquêteur n°{index + 1}</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      const updated = [...playerNames];
                      updated[index] = e.target.value;
                      setPlayerNames(updated);
                    }}
                    placeholder={`Nom du joueur ${index + 1}`}
                    className="w-full bg-[#111827] border border-slate-700/80 rounded-xl p-2.5 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                    required
                  />
                  <select
                    value={playerRoles[index]}
                    onChange={(e) => {
                      const updated = [...playerRoles];
                      updated[index] = e.target.value as RoleId;
                      setPlayerRoles(updated);
                    }}
                    className="w-full bg-[#111827] border border-slate-700/80 rounded-xl p-2.5 text-slate-300 text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="PROFILER">🧠 Profileuse (Bonus Interrogatoire)</option>
                    <option value="VETERAN">⭐ Vétéran (Bonus Fouille)</option>
                    <option value="FORENSIC">🔬 Technicien Forensic (Bonus Labo)</option>
                    <option value="NEGOTIATOR">🤝 Négociateur</option>
                    <option value="GEEK">💻 Geek</option>
                  </select>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition shadow-xl shadow-indigo-600/20 text-xs tracking-wider uppercase mt-2"
            >
              Lancer l'Enquête 🚀
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activePlayer = session.players[selectedPlayerId];

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 p-4 font-sans max-w-xl mx-auto">
      {/* En-tête tactique sombre */}
      <header className="bg-[#111827] border border-slate-800/80 p-4 rounded-2xl mb-4 shadow-xl backdrop-blur-md">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-base font-black text-white tracking-wide">Super Cluedo v2</h1>
            <p className="text-[11px] text-slate-400">Module d'enquête interactif & arbitrage</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <select 
              value={selectedPlayerId} 
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="bg-[#0b0f17] text-xs text-slate-200 border border-slate-700/80 rounded-xl px-3 py-2 font-bold focus:outline-none"
            >
              {Object.values(session.players).map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} ({p.roleId})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs font-bold">
          <button 
            onClick={() => setCurrentViewMode('PLAYER')}
            className={`py-2 rounded-xl transition border ${currentViewMode === 'PLAYER' ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-[#0b0f17] text-slate-400 border-slate-800'}`}
          >
            Vue Joueur
          </button>
          <button 
            onClick={() => setCurrentViewMode('NOTEBOOK')}
            className={`py-2 rounded-xl transition border ${currentViewMode === 'NOTEBOOK' ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-[#0b0f17] text-slate-400 border-slate-800'}`}
          >
            Carnet
          </button>
          <button 
            onClick={() => setCurrentViewMode('GM')}
            className={`py-2 rounded-xl transition border ${currentViewMode === 'GM' ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-[#0b0f17] text-slate-400 border-slate-800'}`}
          >
            Admin / MJ
          </button>
        </div>
      </header>

      {/* VUE JOUEUR : TERMINAL TACTIQUE */}
      {currentViewMode === 'PLAYER' && (
        <div className="space-y-4">
          {/* Carte Profil Détective Actif */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-4 shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Détective Actif</span>
                <h2 className="text-lg font-black text-white">{activePlayer.name}</h2>
              </div>
              <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 px-3 py-1 rounded-xl font-black text-xs">
                {activePlayer.remainingAP} / 2 PA
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Rôle actif : <span className="text-slate-200 font-semibold">{activePlayer.roleId}</span></p>
            <div className="flex flex-wrap gap-1.5">
              {['Vétéran', 'Profileuse', 'Forensique', 'Négociateur', 'Geek'].map((r, idx) => (
                <span key={idx} className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border ${activePlayer.roleId.toLowerCase().includes(r.toLowerCase().slice(0,3)) ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50' : 'bg-[#0b0f17] text-slate-500 border-slate-800'}`}>
                  {r}
                </span>
              ))}
            </div>
          </div>

          {/* Position actuelle & Salle */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-4 shadow-xl">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Position actuelle</span>
            <div className="flex justify-between items-center mt-1">
              <h3 className="font-extrabold text-white text-sm">
                Salle {activePlayer.currentRoomId} · {MUSEUM_ROOMS.find(r => r.id === activePlayer.currentRoomId)?.name}
              </h3>
              <span className="text-xs text-slate-400 italic">Tour {session.turnNumber}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
              <div className="bg-[#0b0f17] p-2.5 rounded-xl border border-slate-800/60">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Zones d'exploration</p>
                <p className="text-slate-200 font-medium mt-0.5">Zone A libre · Zone B fouillée</p>
              </div>
              <div className="bg-[#0b0f17] p-2.5 rounded-xl border border-slate-800/60">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Présence & Indices</p>
                <p className="text-slate-200 font-medium mt-0.5">Éléonore Vance · 1 brut</p>
              </div>
            </div>
          </div>

          {/* Actions du Tour */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Actions du Tour</span>
              <span className="text-[10px] text-slate-400">Coût : 1 PA</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'MOVE', label: 'Déplacement' },
                { id: 'SEARCH', label: 'Fouille (1 PA)' },
                { id: 'INTERROGATE', label: 'Interro (2 PA)' },
                { id: 'ANALYZE', label: 'Analyse (1 PA)' },
              ].map((act) => (
                <button
                  key={act.id}
                  onClick={() => setActionType(act.id as any)}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition ${actionType === act.id ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-[#0b0f17] text-slate-300 border-slate-800 hover:border-slate-700'}`}
                >
                  {act.label}
                </button>
              ))}
            </div>

            {actionType === 'MOVE' && (
              <div className="pt-2">
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Sélectionner la salle cible :</label>
                <select 
                  value={targetRoom} 
                  onChange={(e) => setTargetRoom(Number(e.target.value))}
                  className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl p-3 text-slate-200 text-xs focus:outline-none"
                >
                  {MUSEUM_ROOMS.map((r) => (
                    <option key={r.id} value={r.id}>Salle {r.id} - {r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {actionType === 'SEARCH' && (
              <div className="flex space-x-2 pt-1">
                <button onClick={() => setTargetZone('A')} className={`flex-1 py-2 rounded-xl border text-xs font-bold ${targetZone === 'A' ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300' : 'bg-[#0b0f17] border-slate-800 text-slate-400'}`}>Zone A</button>
                <button onClick={() => setTargetZone('B')} className={`flex-1 py-2 rounded-xl border text-xs font-bold ${targetZone === 'B' ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300' : 'bg-[#0b0f17] border-slate-800 text-slate-400'}`}>Zone B</button>
              </div>
            )}

            {actionType === 'INTERROGATE' && (
              <div className="pt-2">
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Suspect :</label>
                <select 
                  value={targetNpc} 
                  onChange={(e) => setTargetNpc(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl p-3 text-slate-200 text-xs focus:outline-none"
                >
                  {SUSPECTS.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Lancer de dé physique */}
          <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Lancer de dé physique</span>
              <span className="text-[10px] text-slate-400">Saisir le résultat (1–6)</span>
            </div>

            <div className="flex space-x-1.5">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setDiceRoll(num)}
                  className={`flex-1 py-3 rounded-xl font-black text-xs border transition ${diceRoll === num ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-[#0b0f17] border-slate-800 text-slate-400 hover:border-slate-700'}`}
                >
                  {num}
                </button>
              ))}
            </div>

            <button 
              onClick={handlePlayerSubmit}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-xl transition shadow-lg shadow-indigo-600/20 text-xs tracking-wider uppercase mt-1"
            >
              Soumettre l'action au MJ
            </button>
          </div>
        </div>
      )}

      {/* VUE CARNET MATRICIEL MUTUALISÉ */}
      {currentViewMode === 'NOTEBOOK' && (
        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-4 text-xs">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-black text-white tracking-wide">Carnet d'Enquête Mutualisé</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Cliquez sur les cases pour annoter</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="p-2.5">Élément</th>
                  <th className="p-2.5">Catégorie</th>
                  <th className="p-2.5 text-center">Robin</th>
                  <th className="p-2.5 text-center">Emma</th>
                  <th className="p-2.5 text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {SUSPECTS.slice(0, 5).map((s, idx) => {
                  const isDiscovered = session.notebook.discoveredSuspectIds.includes(s.id);
                  const statuses = ['Innocent', 'Suspect', 'Confirmé', 'Innocent', 'Innocent'];
                  const statusColors = ['bg-emerald-950/80 text-emerald-300 border-emerald-800', 'bg-rose-950/80 text-rose-300 border-rose-800', 'bg-blue-950/80 text-blue-300 border-blue-800', 'bg-emerald-950/80 text-emerald-300 border-emerald-800', 'bg-emerald-950/80 text-emerald-300 border-emerald-800'];
                  
                  return (
                    <tr key={s.id} className="border-b border-slate-800/60 hover:bg-[#0b0f17]/40 transition">
                      <td className="p-2.5 font-bold text-slate-200">{s.name}</td>
                      <td className="p-2.5 text-slate-400 text-[11px]">Suspect</td>
                      <td className="p-2.5 text-center">
                        <span className="inline-block w-7 h-7 leading-7 rounded-lg bg-emerald-950/80 text-emerald-300 font-bold text-xs border border-emerald-800/80">✓</span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="inline-block w-7 h-7 leading-7 rounded-lg bg-[#0b0f17] text-slate-500 font-bold text-xs border border-slate-800">?</span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${statusColors[idx]}`}>
                          {statuses[idx]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VUE CONSOLE MJ / ADMIN */}
      {currentViewMode === 'GM' && (
        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-4 text-xs">
          <h2 className="text-sm font-black text-indigo-400 tracking-wide">Console d'Arbitrage MJ</h2>
          
          <div className="bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-900/50 space-y-1">
            <p className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">🔒 Solution Secrète :</p>
            <p className="text-slate-300">
              Meurtrier : <span className="text-amber-400 font-bold">{SUSPECTS.find(s => s.id === session.secretSolution.killerId)?.name}</span><br />
              Arme : <span className="text-amber-400 font-bold">{WEAPONS.find(w => w.id === session.secretSolution.weaponId)?.name}</span>
            </p>
          </div>

          <div className="bg-[#0b0f17] p-3.5 rounded-xl border border-slate-800/80">
            <p className="font-bold text-slate-300 mb-2 uppercase tracking-wider text-[10px]">📡 Action en attente :</p>
            {session.pendingAction ? (
              <div className="space-y-3">
                <p className="text-amber-400 font-bold">{session.pendingAction.playerName} ({session.pendingAction.actionType})</p>
                <p className="bg-[#111827] p-3 rounded-xl text-slate-300 font-mono text-[11px] border border-slate-800">{session.pendingAction.secretGmVerdict}</p>
                <button onClick={handleGmApprove} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl transition shadow">
                  Valider & Mettre à jour le Plateau
                </button>
              </div>
            ) : (
              <p className="text-slate-500 italic text-center py-6">Aucune action en attente...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
