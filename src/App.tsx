import React, { useState } from 'react';
import { SuperCluedoEngine, MUSEUM_ROOMS, SUSPECTS, WEAPONS, MOTIVES, MatrixColumn, TriState } from './gameEngine';

const engine = new SuperCluedoEngine('MUSE', [
  { id: 'p1', name: 'Robin (Profileuse)', roleId: 'PROFILER' },
  { id: 'p2', name: 'Emma (Vétéran)', roleId: 'VETERAN' },
]);

export default function App() {
  const [session, setSession] = useState(engine.getSession());
  const [currentViewMode, setCurrentViewMode] = useState<'PLAYER' | 'GM' | 'NOTEBOOK'>('PLAYER');
  const [selectedPlayerId, setSelectedPlayerId] = useState('p1');
  const [actionType, setActionType] = useState<'MOVE' | 'SEARCH' | 'INTERROGATE' | 'ANALYZE' | 'ACCUSE' | 'ARREST'>('MOVE');
  const [targetRoom, setTargetRoom] = useState(1);
  const [targetZone, setTargetZone] = useState<'A' | 'B'>('A');
  const [targetNpc, setTargetNpc] = useState(SUSPECTS[0].id);
  const [diceRoll, setDiceRoll] = useState(4);

  const refreshSession = () => setSession(engine.getSession());

  const handlePlayerSubmit = () => {
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
    engine.approvePendingAction();
    refreshSession();
  };

  const handleCycleCell = (suspectId: string, column: MatrixColumn) => {
    if (!session.notebook.visibleColumns[column]) return;
    const currentVal = session.notebook.playerNotes[suspectId][column];
    const nextVal: TriState = currentVal === 'NSP' ? 'YES' : currentVal === 'YES' ? 'NO' : 'NSP';
    engine.updateNotebookNote(suspectId, column, nextVal);
    refreshSession();
  };

  const activePlayer = session.players[selectedPlayerId];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans max-w-xl mx-auto">
      {/* En-tête de navigation */}
      <header className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-base font-bold text-amber-400">🏛️ Super Cluedo v2</h1>
            <p className="text-xs text-slate-400">Tour n°{session.turnNumber} | Phase : <span className="text-emerald-400 font-semibold">{session.phase}</span></p>
          </div>
          <select 
            value={selectedPlayerId} 
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="bg-slate-950 text-xs text-slate-300 border border-slate-700 rounded p-1"
          >
            {Object.values(session.players).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Boutons de bascule de vue */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button 
            onClick={() => setCurrentViewMode('PLAYER')}
            className={`py-2 rounded-lg font-bold transition ${currentViewMode === 'PLAYER' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
          >
            📱 Action
          </button>
          <button 
            onClick={() => setCurrentViewMode('NOTEBOOK')}
            className={`py-2 rounded-lg font-bold transition ${currentViewMode === 'NOTEBOOK' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
          >
            📋 Carnet
          </button>
          <button 
            onClick={() => setCurrentViewMode('GM')}
            className={`py-2 rounded-lg font-bold transition ${currentViewMode === 'GM' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}
          >
            💻 Console MJ
          </button>
        </div>
      </header>

      {/* --- VUE JOUEUR : TERMINAL D'ACTION --- */}
      {currentViewMode === 'PLAYER' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
            <div>
              <p className="text-slate-400">Position actuelle :</p>
              <p className="font-bold text-slate-200">
                {activePlayer.currentRoomId === 0 ? '🔒 QG Central' : `Salle ${activePlayer.currentRoomId}`}
              </p>
            </div>
            <span className="bg-blue-950 text-blue-300 border border-blue-800 px-3 py-1 rounded-lg font-semibold">
              ⚡ PA : {activePlayer.remainingAP} / 2
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <label className="block text-slate-400">Action à réaliser :</label>
            <select 
              value={actionType} 
              onChange={(e) => setActionType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200"
            >
              <option value="MOVE">🏃 Se déplacer vers une salle</option>
              <option value="SEARCH">🔍 Fouiller une zone (A ou B)</option>
              <option value="INTERROGATE">💬 Interroger un PNJ</option>
              <option value="ANALYZE">🔬 Analyser un indice</option>
              <option value="ACCUSE">🚨 Accusation officielle (QG)</option>
              <option value="ARREST">🎯 Tenter l'interpellation</option>
            </select>

            {actionType === 'MOVE' && (
              <div>
                <label className="block text-slate-400 mt-2 mb-1">Salle cible :</label>
                <select 
                  value={targetRoom} 
                  onChange={(e) => setTargetRoom(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  {MUSEUM_ROOMS.map((r) => (
                    <option key={r.id} value={r.id}>Salle {r.id} - {r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {actionType === 'SEARCH' && (
              <div className="flex space-x-2 mt-2">
                <button onClick={() => setTargetZone('A')} className={`flex-1 py-2 rounded border ${targetZone === 'A' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>Zone A</button>
                <button onClick={() => setTargetZone('B')} className={`flex-1 py-2 rounded border ${targetZone === 'B' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>Zone B</button>
              </div>
            )}

            {actionType === 'INTERROGATE' && (
              <div>
                <label className="block text-slate-400 mt-2 mb-1">Suspect :</label>
                <select 
                  value={targetNpc} 
                  onChange={(e) => setTargetNpc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  {SUSPECTS.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-3">
              <label className="block text-slate-400 mb-1">Résultat de votre Dé (1 à 6) :</label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setDiceRoll(num)}
                    className={`flex-1 py-2 rounded-lg font-bold border transition ${diceRoll === num ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 border-slate-800 text-slate-300'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={handlePlayerSubmit}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition text-xs shadow-lg mt-2"
          >
            Transmettre l'Action au Maître du Jeu
          </button>
        </div>
      )}

      {/* --- VUE CARNET MATRICIEL INTERACTIF --- */}
      {currentViewMode === 'NOTEBOOK' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 text-xs">
          <h2 className="text-sm font-bold text-amber-400 mb-2">📋 Carnet d'Enquête (Grille Matricielle)</h2>
          <p className="text-slate-400 text-[11px]">Cliquez sur les cellules pour basculer entre <span className="text-slate-500">? (NSP)</span>, <span className="text-emerald-400 font-bold">OUI</span> et <span className="text-rose-400 font-bold">NON</span>.</p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
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
                        <td className="p-2">Inconnu (Salle non visitée)</td>
                        <td colSpan={4} className="p-2 text-center text-[10px]">🔒 Non rencontré</td>
                      </tr>
                    );
                  }
                  const notes = session.notebook.playerNotes[s.id];
                  return (
                    <tr key={s.id} className="border-b border-slate-800/60 hover:bg-slate-950/40">
                      <td className="p-2 font-semibold text-slate-200">{s.name}</td>
                      {(['GENDER', 'STATUS', 'TITLE', 'LETTER_O'] as MatrixColumn[]).map((col) => {
                        const unlocked = session.notebook.visibleColumns[col];
                        const val = notes[col];
                        return (
                          <td key={col} className="p-2 text-center">
                            {unlocked ? (
                              <button
                                onClick={() => handleCycleCell(s.id, col)}
                                className={`w-8 h-8 rounded font-bold text-xs transition border ${
                                  val === 'YES' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700' :
                                  val === 'NO' ? 'bg-rose-950/80 text-rose-300 border-rose-700' :
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

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mt-4">
            <h3 className="font-semibold text-slate-300 mb-2">📜 Journal des Indices Publics :</h3>
            <div className="space-y-1.5 max-h-32 overflow-y-auto text-[11px]">
              {session.notebook.publicCluesLog.length === 0 ? (
                <p className="text-slate-500 italic">Aucun palier d'indice découvert pour l'instant.</p>
              ) : (
                session.notebook.publicCluesLog.map((log, i) => (
                  <p key={i} className="text-slate-300">• {log.text}</p>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- VUE CONSOLE MJ --- */}
      {currentViewMode === 'GM' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 text-xs">
          <h2 className="text-sm font-bold text-indigo-400">💻 Console d'Arbitrage MJ</h2>
          <div className="bg-indigo-950/40 p-3 rounded-xl border border-indigo-900/50">
            <p className="font-bold text-indigo-300 mb-1">🔒 Solution Secrète :</p>
            <p className="text-slate-300">
              Meurtrier : <span className="text-amber-400 font-semibold">{SUSPECTS.find(s => s.id === session.secretSolution.killerId)?.name}</span> | Arme : <span className="text-amber-400 font-semibold">{WEAPONS.find(w => w.id === session.secretSolution.weaponId)?.name}</span>
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <p className="font-semibold text-slate-300 mb-2">📡 Action en attente :</p>
            {session.pendingAction ? (
              <div className="space-y-2">
                <p className="text-amber-400 font-bold">{session.pendingAction.playerName} ({session.pendingAction.actionType})</p>
                <p className="bg-slate-900 p-2 rounded text-slate-300 font-mono text-[11px]">{session.pendingAction.secretGmVerdict}</p>
                <button onClick={handleGmApprove} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded transition">
                  Valider & Mettre à jour
                </button>
              </div>
            ) : (
              <p className="text-slate-500 italic">Aucune action en attente...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
