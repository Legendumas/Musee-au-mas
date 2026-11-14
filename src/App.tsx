import React, { useState } from 'react';
import { SuperCluedoEngine, MUSEUM_ROOMS, SUSPECTS, WEAPONS, MatrixColumn, TriState, RoleId } from './gameEngine';

export default function App() {
  const [engine, setEngine] = useState<SuperCluedoEngine | null>(null);
  const [session, setSession] = useState<any>(null);

  const [playerNames, setPlayerNames] = useState<string[]>(['Robin', 'Emma']);
  const [playerRoles, setPlayerRoles] = useState<RoleId[]>(['PROFILER', 'VETERAN']);

  const [currentViewMode, setCurrentViewMode] = useState<'PLAYER' | 'GM' | 'NOTEBOOK'>('PLAYER');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [actionType, setActionType] = useState<'MOVE' | 'SEARCH' | 'INTERROGATE' | 'ANALYZE' | 'ACCUSE' | 'ARREST'>('MOVE');
  const [targetRoom, setTargetRoom] = useState(1);
  const [targetZone, setTargetZone] = useState<'A' | 'B'>('A');
  const [targetNpc, setTargetNpc] = useState(SUSPECTS[0].id);
  const [diceRoll, setDiceRoll] = useState<number>(3);

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
    if (!engine) return;
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

  if (!session || !engine) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 p-6 flex flex-col justify-center items-center font-sans">
        <div className="max-w-md w-full bg-[#111827] border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Édition Musée v2
            </span>
            <h1 className="text-2xl font-black text-white mt-3">SUPER CLUEDO</h1>
            <p className="text-xs text-slate-400 mt-1">Module d'enquête interactif & arbitrage</p>
          </div>

          <form onSubmit={handleStartGame} className="space-y-4 text-xs">
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
                    className={`py-2 rounded-xl font-bold border transition ${
                      playerNames.length === count ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-[#0b0f17] text-slate-400 border-slate-800'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {playerNames.map((name, index) => (
                <div key={index} className="bg-[#0b0f17] p-3.5 rounded-2xl border border-slate-800 space-y-2">
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
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl p-2.5 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                    required
                  />
                  <select
                    value={playerRoles[index]}
                    onChange={(e) => {
                      const updated = [...playerRoles];
                      updated[index] = e.target.value as RoleId;
                      setPlayerRoles(updated);
                    }}
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl p-2.5 text-slate-300 text-xs focus:border-indigo-500 focus:outline-none"
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
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-2xl transition shadow-lg text-xs uppercase tracking-wider mt-2"
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
      {/* En-tête tactique */}
      <header className="bg-[#111827] border border-slate-800 p-4 rounded-2xl mb-4 shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-base font-black text-white">Super Cluedo v2</h1>
            <p className="text-[11px] text-slate-400">Module d'enquête interactif & arbitrage</p>
          </div>
          <select 
            value={selectedPlayerId} 
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="bg-[#0b0f17] text-xs text-slate-200 border border-slate-700 rounded-xl px-3 py-2 font-bold focus:outline-none"
          >
            {Object.values(session.players).map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} ({p.roleId})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs font-bold">
          <button 
            onClick={() => setCurrentViewMode('PLAYER')}
            className={`py-2 rounded-xl transition border ${currentViewMode === 'PLAYER' ? 'bg-indigo-600 text-white border-indigo-500 shadow' : 'bg-[#0b0f17] text-slate-400 border-slate-800'}`}
          >
            Vue Joueur
          </button>
          <button 
            onClick={() => setCurrentViewMode('NOTEBOOK')}
            className={`py-2 rounded-xl transition border ${currentViewMode === 'NOTEBOOK' ? 'bg-indigo-600 text-white border-indigo-500 shadow' : 'bg-[#0b0f17] text-slate-400 border-slate-800'}`}
          >
            Carnet
          </button>
          <button 
            onClick={() => setCurrentViewMode('GM')}
            className={`py-2 rounded-xl transition border ${currentViewMode === 'GM' ? 'bg-indigo-600 text-white border-indigo-500 shadow' : 'bg-[#0b0f17] text-slate-400 border-slate-800'}`}
          >
            Admin / MJ
          </button>
        </div>
      </header>

      {/* VUE JOUEUR */}
      {currentViewMode === 'PLAYER' && (
        <div className="space-y-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Détective Actif</span>
                <h2 className="text-lg font-black text-white">{activePlayer.name}</h2>
              </div>
              <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-3 py-1 rounded-xl font-bold text-xs">
                {activePlayer.remainingAP} / 2 PA
              </span>
            </div>
            <p className="text-xs text-slate-400">Rôle : <span className="text-slate-200 font-semibold">{activePlayer.roleId}</span></p>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Position actuelle</span>
            <div className="flex justify-between items-center mt-1">
              <h3 className="font-bold text-white text-sm">
                Salle {activePlayer.currentRoomId} · {MUSEUM_ROOMS.find(r => r.id === activePlayer.currentRoomId)?.name}
              </h3>
              <span className="text-xs text-slate-400">Tour {session.turnNumber}</span>
            </div>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Actions du Tour (1 PA)</span>
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
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs border transition ${actionType === act.id ? 'bg-indigo-600 text-white border-indigo-500 shadow' : 'bg-[#0b0f17] text-slate-300 border-slate-800'}`}
                >
                  {act.label}
                </button>
              ))}
            </div>

            {actionType === 'MOVE' && (
              <div className="pt-2">
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Salle cible :</label>
                <select 
                  value={targetRoom} 
                  onChange={(e) => setTargetRoom(Number(e.target.value))}
                  className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:outline-none"
                >
                  {MUSEUM_ROOMS.map((r) => (
                    <option key={r.id} value={r.id}>Salle {r.id} - {r.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Lancer de dé physique (1–6)</span>
            <div className="flex space-x-1.5">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setDiceRoll(num)}
                  className={`flex-1 py-3 rounded-xl font-black text-xs border transition ${diceRoll === num ? 'bg-indigo-600 text-white border-indigo-500 shadow' : 'bg-[#0b0f17] border-slate-800 text-slate-400'}`}
                >
                  {num}
                </button>
              ))}
            </div>

            <button 
              onClick={handlePlayerSubmit}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-xl transition shadow text-xs uppercase tracking-wider mt-1"
            >
              Soumettre l'action au MJ
            </button>
          </div>
        </div>
      )}

      {/* CARNET MUTUALISÉ */}
      {currentViewMode === 'NOTEBOOK' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4 text-xs">
          <h2 className="text-sm font-black text-white">Carnet d'Enquête Mutualisé</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                  <th className="p-2.5">Élément</th>
                  <th className="p-2.5">Catégorie</th>
                  <th className="p-2.5 text-center">Robin</th>
                  <th className="p-2.5 text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {SUSPECTS.slice(0, 5).map((s) => (
                  <tr key={s.id} className="border-b border-slate-800/60">
                    <td className="p-2.5 font-bold text-slate-200">{s.name}</td>
                    <td className="p-2.5 text-slate-400">Suspect</td>
                    <td className="p-2.5 text-center">
                      <span className="inline-block w-7 h-7 leading-7 rounded-lg bg-emerald-950 text-emerald-300 font-bold text-xs border border-emerald-800">✓</span>
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">Innocent</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONSOLE MJ */}
      {currentViewMode === 'GM' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4 text-xs">
          <h2 className="text-sm font-black text-indigo-400">Console d'Arbitrage MJ</h2>
          <div className="bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-900/50">
            <p className="font-bold text-indigo-300 uppercase text-[10px]">🔒 Solution Secrète :</p>
            <p className="text-slate-300 mt-1">
              Meurtrier : <span className="text-amber-400 font-bold">{SUSPECTS.find(s => s.id === session.secretSolution.killerId)?.name}</span>
            </p>
          </div>
          <div className="bg-[#0b0f17] p-3.5 rounded-xl border border-slate-800">
            <p className="font-bold text-slate-300 mb-2 text-[10px] uppercase">Action en attente :</p>
            {session.pendingAction ? (
              <div className="space-y-3">
                <p className="text-amber-400 font-bold">{session.pendingAction.playerName} ({session.pendingAction.actionType})</p>
                <button onClick={handleGmApprove} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition">
                  Valider & Mettre à jour le Plateau
                </button>
              </div>
            ) : (
              <p className="text-slate-500 italic text-center py-4">Aucune action en attente...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
