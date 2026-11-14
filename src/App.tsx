import React, { useState } from 'react';
import { SuperCluedoEngine, MUSEUM_ROOMS, SUSPECTS, WEAPONS, MOTIVES } from './gameEngine'; // Ou tout dans le même fichier

// --- INITIALISATION D'UNE SESSION DE TEST ---
const engine = new SuperCluedoEngine('MUSE', [
  { id: 'p1', name: 'Robin (Profileuse)', roleId: 'PROFILER' },
  { id: 'p2', name: 'Emma (Vétéran)', roleId: 'VETERAN' },
]);

export default function App() {
  const [session, setSession] = useState(engine.getSession());
  const [currentViewMode, setCurrentViewMode] = useState<'PLAYER' | 'GM'>('PLAYER');
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

  const activePlayer = session.players[selectedPlayerId];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans">
      {/* Barre de navigation / Sélecteur de mode (Outil de test) */}
      <header className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-amber-400">🏛️ Super Cluedo v2 : Édition Musée</h1>
          <p className="text-xs text-slate-400">Phase actuelle : <span className="text-emerald-400 font-semibold">{session.phase}</span> | Tour n°{session.turnNumber}</p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400">Mode d'affichage :</span>
          <button 
            onClick={() => setCurrentViewMode('PLAYER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${currentViewMode === 'PLAYER' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
          >
            📱 Vue Joueur (Mobile)
          </button>
          <button 
            onClick={() => setCurrentViewMode('GM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${currentViewMode === 'GM' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}
          >
            💻 Console Maître du Jeu
          </button>
        </div>
      </header>

      {/* --- VUE JOUEUR (TERMINAL MOBILE) --- */}
      {currentViewMode === 'PLAYER' && (
        <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-amber-400">Terminal d'Enquête</h2>
              <select 
                value={selectedPlayerId} 
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="bg-slate-950 text-xs text-slate-300 border border-slate-700 rounded p-1 mt-1"
              >
                {Object.values(session.players).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.roleId})</option>
                ))}
              </select>
            </div>
            <div className="text-right">
              <span className="bg-blue-900/60 text-blue-300 border border-blue-700 px-2.5 py-1 rounded text-xs font-semibold">
                ⚡ PA : {activePlayer.remainingAP} / 2
              </span>
            </div>
          </div>

          {/* Statut de la salle actuelle */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 text-xs">
            <p className="text-slate-400">Position actuelle :</p>
            <p className="font-bold text-slate-200">
              {activePlayer.currentRoomId === 0 ? '🔒 QG Central' : `Salle ${activePlayer.currentRoomId} (${MUSEUM_ROOMS.find(r => r.id === activePlayer.currentRoomId)?.name})`}
            </p>
          </div>

          {/* Choix de l'action */}
          <div className="space-y-3 text-xs mb-4">
            <label className="block text-slate-400">Action à réaliser (1 PA) :</label>
            <select 
              value={actionType} 
              onChange={(e) => setActionType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200"
            >
              <option value="MOVE">🏃 Se déplacer vers une salle adjacente</option>
              <option value="SEARCH">🔍 Fouiller une zone (A ou B)</option>
              <option value="INTERROGATE">💬 Interroger un PNJ présent</option>
              <option value="ANALYZE">🔬 Analyser un indice en labo</option>
              <option value="ACCUSE">🚨 Accusation officielle (QG)</option>
              <option value="ARREST">🎯 Tenter l'interpellation (Chasse à l'homme)</option>
            </select>

            {/* Paramètres dynamiques selon l'action */}
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
              <div>
                <label className="block text-slate-400 mt-2 mb-1">Zone cible :</label>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setTargetZone('A')} 
                    className={`flex-1 py-2 rounded border ${targetZone === 'A' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  >
                    Zone A
                  </button>
                  <button 
                    onClick={() => setTargetZone('B')} 
                    className={`flex-1 py-2 rounded border ${targetZone === 'B' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  >
                    Zone B
                  </button>
                </div>
              </div>
            )}

            {actionType === 'INTERROGATE' && (
              <div>
                <label className="block text-slate-400 mt-2 mb-1">Suspect à interroger :</label>
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

            {/* Saisie du dé */}
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
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg text-sm"
          >
            Transmettre l'Action au Maître du Jeu
          </button>
        </div>
      )}

      {/* --- VUE MAÎTRE DU JEU (CONSOLE D'ARBITRAGE) --- */}
      {currentViewMode === 'GM' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-lg font-bold text-indigo-400 mb-4">💻 Console d'Arbitrage du Maître du Jeu</h2>

            {/* Solution secrète (rappel MJ) */}
            <div className="bg-indigo-950/40 border border-indigo-900/50 p-4 rounded-xl mb-6 text-xs">
              <p className="font-bold text-indigo-300 mb-1">🔒 Solution Secrète de la Partie :</p>
              <p className="text-slate-300">
                Meurtrier : <span className="text-amber-400 font-semibold">{SUSPECTS.find(s => s.id === session.secretSolution.killerId)?.name}</span> | 
                Arme : <span className="text-amber-400 font-semibold">{WEAPONS.find(w => w.id === session.secretSolution.weaponId)?.name}</span> | 
                Salle du Crime : <span className="text-amber-400 font-semibold">Salle {session.secretSolution.crimeSceneRoomId}</span> | 
                Mobile : <span className="text-amber-400 font-semibold">{MOTIVES.find(m => m.id === session.secretSolution.motiveId)?.name}</span>
              </p>
            </div>

            {/* Action en attente d'approbation */}
            <div className="border border-slate-800 rounded-xl p-4 bg-slate-950">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">📡 File d'attente des actions joueurs :</h3>
              {session.pendingAction ? (
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-400">{session.pendingAction.playerName} ({session.pendingAction.roleId})</span>
                    <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">Action : {session.pendingAction.actionType}</span>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded border border-slate-800 font-mono">
                    {session.pendingAction.secretGmVerdict}
                  </p>
                  <button 
                    onClick={handleGmApprove}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition text-xs shadow"
                  >
                    Valider & Mettre à jour le Plateau
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-6">Aucune action en attente. En attente de soumission sur les terminaux mobiles...</p>
              )}
            </div>
          </div>

          {/* Journal public des indices */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">📜 Journal Public des Preuves & Paliers</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
              {session.notebook.publicCluesLog.length === 0 ? (
                <p className="text-slate-500 italic">Aucun indice découvert pour l'instant.</p>
              ) : (
                session.notebook.publicCluesLog.map((log, idx) => (
                  <div key={idx} className="bg-slate-950 p-2.5 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-200">{log.text}</span>
                    <span className="text-slate-500 font-mono">Tour {log.turn}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
