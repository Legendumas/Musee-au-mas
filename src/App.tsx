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
  const [diceRoll, setDiceRoll] = useState(4);

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

  // --- ÉCRAN DE CONFIGURATION (LOBBY) ---
  if (!session || !engine) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col justify-center items-center font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-semibold">
              Édition Musée v2
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight mt-3">SUPER CLUEDO</h1>
            <p className="text-xs text-slate-400 mt-1">Centre de Commandement & Enquête Immersive</p>
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
                      playerNames.length === count ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {playerNames.map((name, index) => (
                <div key={index} className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-2">
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-200 text-xs focus:border-amber-500 focus:outline-none"
                    required
                  />
                  <select
                    value={playerRoles[index]}
                    onChange={(e) => {
                      const updated = [...playerRoles];
                      updated[index] = e.target.value as RoleId;
                      setPlayerRoles(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-300 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="PROFILER">🧠 Profileuse (Bonus Interrogatoire & Lapsus)</option>
                    <option value="VETERAN">⭐ Vétéran (Bonus Fouille & Coup de maître)</option>
                    <option value="FORENSIC">🔬 Technicien Forensic (Bonus Labo)</option>
                    <option value="NEGOTIATOR">🤝 Négociateur</option>
                    <option value="GEEK">💻 Geek</option>
                  </select>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-2xl transition shadow-xl shadow-amber-500/20 text-xs tracking-wider uppercase mt-2"
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans max-w-md mx-auto">
      {/* Barre de navigation tactique */}
      <header className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl mb-4 shadow-xl backdrop-blur-md">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-sm font-black text-amber-400 tracking-wider">🏛️ SUPER CLUEDO v2</h1>
            <p className="text-[11px] text-slate-400">Tour n°{session.turnNumber} | Phase : <span className="text-emerald-400 font-semibold">{session.phase}</span></p>
          </div>
          <select 
            value={selectedPlayerId} 
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="bg-slate-950 text-xs text-amber-300 border border-slate-700 rounded-xl p-2 font-bold focus:outline-none"
          >
            {Object.values(session.players).map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} ({p.roleId})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs font-bold">
          <button 
            onClick={() => setCurrentViewMode('PLAYER')}
            className={`py-2 rounded-xl transition border ${currentViewMode === 'PLAYER' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
          >
            📱 Action
          </button>
          <button 
            onClick={() => setCurrentViewMode('NOTEBOOK')}
            className={`py-2 rounded-xl transition border ${currentViewMode === 'NOTEBOOK' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
          >
            📋 Carnet
          </button>
          <button 
            onClick={() => setCurrentViewMode('GM')}
            className={`py-2 rounded-xl transition border ${currentViewMode === 'GM' ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
          >
            💻 MJ
          </button>
        </div>
      </header>

      {/* VUE JOUEUR (TERMINAL MOBILE TACTIQUE) */}
      {currentViewMode === 'PLAYER' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl">
          <div className="flex justify-between items-center bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs">
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Position actuelle :</p>
              <p className="font-extrabold text-slate-200 mt-0.5">
                {activePlayer.currentRoomId === 0 ? '🔒 QG Central' : `Salle ${activePlayer.currentRoomId} (${MUSEUM_ROOMS.find(r => r.id === activePlayer.currentRoomId)?.name})`}
              </p>
            </div>
            <span className="bg-blue-950/80 text-blue-300 border border-blue-800 px-3 py-1.5 rounded-xl font-black text-xs">
              ⚡ {activePlayer.remainingAP} / 2 PA
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <label className="block text-slate-400 font-bold uppercase tracking-wider text-[10px]">Action prioritaire (1 PA) :</label>
            <select 
              value={actionType} 
              onChange={(e) => setActionType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3.5 text-slate-200 font-semibold focus:border-amber-500 focus:outline-none"
            >
              <option value="MOVE">🏃 Se déplacer vers une salle adjacente</option>
              <option value="SEARCH">🔍 Fouiller une zone (A ou B)</option>
              <option value="INTERROGATE">💬 Interroger un PNJ présent</option>
              <option value="ANALYZE">🔬 Analyser un indice en labo</option>
              <option value="ACCUSE">🚨 Accusation officielle (QG)</option>
              <option value="ARREST">🎯 Tenter l'interpellation</option>
            </select>

            {actionType === 'MOVE' && (
              <div>
                <label className="block text-slate-400 mt-2 mb-1 font-bold text-[10px] uppercase">Sélectionner la salle :</label>
                <select 
                  value={targetRoom} 
                  onChange={(e) => setTargetRoom(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-slate-200 focus:outline-none"
                >
                  {MUSEUM_ROOMS.map((r) => (
                    <option key={r.id} value={r.id}>Salle {r.id} - {r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {actionType === 'SEARCH' && (
              <div className="flex space-x-2 mt-2">
                <button onClick={() => setTargetZone('A')} className={`flex-1 py-3 rounded-2xl border font-bold transition ${targetZone === 'A' ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>Zone A</button>
                <button onClick={() => setTargetZone('B')} className={`flex-1 py-3 rounded-2xl border font-bold transition ${targetZone === 'B' ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>Zone B</button>
              </div>
            )}

            {actionType === 'INTERROGATE' && (
              <div>
                <label className="block text-slate-400 mt-2 mb-1 font-bold text-[10px] uppercase">Suspect interrogé :</label>
                <select 
                  value={targetNpc} 
                  onChange={(e) => setTargetNpc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-slate-200 focus:outline-none"
                >
                  {SUSPECTS.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.gender}, {s.status})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-4">
              <label className="block text-slate-400 mb-1.5 font-bold text-[10px] uppercase">Résultat du dé de l'enquêteur :</label>
              <div className="flex space-x-1.5">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setDiceRoll(num)}
                    className={`flex-1 py-3 rounded-xl font-black border transition ${diceRoll === num ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20' : 'bg-slate-950 border-slate-800 text-slate-300'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={handlePlayerSubmit}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-2xl transition shadow-xl shadow-amber-500/20 text-xs tracking-wider uppercase mt-3"
          >
            Transmettre l'Action au Maître du Jeu ⚡
          </button>
        </div>
      )}

      {/* VUE CARNET MATRICIEL */}
      {currentViewMode === 'NOTEBOOK' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl text-xs">
          <div>
            <h2 className="text-sm font-black text-amber-400 tracking-wider">📋 CARNET MATRICIEL</h2>
            <p className="text-slate-400 text-[11px] mt-0.5">Appuyez pour basculer : <span className="text-slate-500 font-bold">?</span> → <span className="text-emerald-400 font-bold">OUI</span> → <span className="text-rose-400 font-bold">NON</span></p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="p-2">Suspect</th>
                  <th className="p-2 text-center">Sexe {session.notebook.visibleColumns.GENDER ? '🔓' : '🔒'}</th>
                  <th className="p-2 text-center">Statut {session.notebook.visibleColumns.STATUS ? '🔓' : '🔒'}</th>
                  <th className="p-2 text-center">Titre {session.notebook.visibleColumns.TITLE ? '🔓' : '🔒'}</th>
                  <th className="p-2 text-center">Lettre O {session.notebook.visibleColumns.LETTER_O ? '🔓' : '🔒'}</th>
                </tr>
              </thead>
              <tbody>
                {SUSPECTS.map((s) => {
                  const isDiscovered = session.notebook.discoveredSuspectIds.includes(s.id);
                  if (!isDiscovered) {
                    return (
                      <tr key={s.id} className="border-b border-slate-900 text-slate-600 italic">
                        <td className="p-2">Inconnu</td>
                        <td colSpan={4} className="p-2 text-center text-[10px]">🔒 Salle non visitée</td>
                      </tr>
                    );
                  }
                  const notes = session.notebook.playerNotes[s.id];
                  return (
                    <tr key={s.id} className="border-b border-slate-800/60">
                      <td className="p-2 font-bold text-slate-200">{s.name}</td>
                      {(['GENDER', 'STATUS', 'TITLE', 'LETTER_O'] as MatrixColumn[]).map((col) => {
                        const unlocked = session.notebook.visibleColumns[col];
                        const val = notes[col];
                        return (
                          <td key={col} className="p-2 text-center">
                            {unlocked ? (
                              <button
                                onClick={() => handleCycleCell(s.id, col)}
                                className={`w-9 h-9 rounded-xl font-bold text-xs transition border ${
                                  val === 'YES' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 shadow-md' :
                                  val === 'NO' ? 'bg-rose-950/80 text-rose-300 border-rose-700 shadow-md' :
                                  'bg-slate-950 text-slate-500 border-slate-800'
                                }`}
                              >
                                {val === 'YES' ? '✓' : val === 'NO' ? '✗' : '?'}
                              </button>
                            ) : (
                              <span className="text-slate-700 text-[10px]">🔒</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mt-2">
            <h3 className="font-bold text-slate-300 mb-2 uppercase tracking-wider text-[10px]">📜 Journal des Indices Publics :</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto text-[11px]">
              {session.notebook.publicCluesLog.length === 0 ? (
                <p className="text-slate-500 italic">Aucun indice découvert pour l'instant.</p>
              ) : (
                session.notebook.publicCluesLog.map((log: any, i: number) => (
                  <p key={i} className="text-slate-300 leading-relaxed">• {log.text}</p>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* VUE CONSOLE MJ */}
      {currentViewMode === 'GM' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl text-xs">
          <h2 className="text-sm font-black text-indigo-400 tracking-wider">💻 CONSOLE D'ARBITRAGE MJ</h2>
          <div className="bg-indigo-950/40 p-4 rounded-2xl border border-indigo-900/50 space-y-1">
            <p className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">🔒 Solution Secrète :</p>
            <p className="text-slate-300 leading-relaxed">
              Meurtrier : <span className="text-amber-400 font-bold">{SUSPECTS.find(s => s.id === session.secretSolution.killerId)?.name}</span><br />
              Arme : <span className="text-amber-400 font-bold">{WEAPONS.find(w => w.id === session.secretSolution.weaponId)?.name}</span><br />
              Salle : <span className="text-amber-400 font-bold">Salle {session.secretSolution.crimeSceneRoomId}</span>
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <p className="font-bold text-slate-300 mb-2 uppercase tracking-wider text-[10px]">📡 Action en attente d'arbitrage :</p>
            {session.pendingAction ? (
              <div className="space-y-3">
                <p className="text-amber-400 font-bold">{session.pendingAction.playerName} ({session.pendingAction.actionType})</p>
                <p className="bg-slate-900 p-3 rounded-xl text-slate-300 font-mono text-[11px] border border-slate-800 leading-relaxed">{session.pendingAction.secretGmVerdict}</p>
                <button onClick={handleGmApprove} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl transition shadow-lg tracking-wider uppercase text-xs">
                  Valider & Mettre à jour le Plateau 🛡️
                </button>
              </div>
            ) : (
              <p className="text-slate-500 italic text-center py-6">Aucune action en attente. En attente des joueurs...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
