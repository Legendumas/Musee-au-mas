import React, { useState } from 'react';
import { SuperCluedoEngine, MUSEUM_ROOMS, SUSPECTS, WEAPONS, MatrixColumn, TriState, RoleId } from './gameEngine';

export default function App() {
  const [engine, setEngine] = useState<SuperCluedoEngine | null>(null);
  const [session, setSession] = useState<any>(null);

  // Configuration initiale avec option MJ
  const [participantNames, setParticipantNames] = useState<string[]>(['Robin', 'Emma', 'Arbitre']);
  const [participantRoles, setParticipantRoles] = useState<string[]>(['PROFILER', 'VETERAN', 'GM']);

  const [appMode, setAppMode] = useState<'SETUP' | 'PLAYER_TERMINAL' | 'GM_CONSOLE'>('SETUP');
  const [currentViewMode, setCurrentViewMode] = useState<'PLAYER' | 'NOTEBOOK'>('PLAYER');
  
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [actionType, setActionType] = useState<'MOVE' | 'SEARCH' | 'INTERROGATE' | 'ANALYZE' | 'ACCUSE' | 'ARREST'>('MOVE');
  const [targetRoom, setTargetRoom] = useState(1);
  const [targetZone, setTargetZone] = useState<'A' | 'B'>('A');
  const [targetNpc, setTargetNpc] = useState(SUSPECTS[0].id);
  const [diceRoll, setDiceRoll] = useState<number>(3);

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Séparer les vrais joueurs des Maîtres du Jeu
    const playersConfig = participantNames
      .map((name, index) => ({
        name: name.trim() || `Participant ${index + 1}`,
        role: participantRoles[index],
        index,
      }))
      .filter((p) => p.role !== 'GM');

    if (playersConfig.length === 0) {
      alert("Il faut au moins un détective (joueur) pour lancer la partie !");
      return;
    }

    const formattedPlayers = playersConfig.map((p, i) => ({
      id: `p${i + 1}`,
      name: p.name,
      roleId: p.role as RoleId,
    }));

    const newEngine = new SuperCluedoEngine('MUSE_V2', formattedPlayers);
    setEngine(newEngine);
    const newSession = newEngine.getSession();
    setSession(newSession);
    setSelectedPlayerId(newSession.turnOrder[0]);
    setAppMode('PLAYER_TERMINAL');
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

  // Filtrer les salles accessibles depuis le QG (Salles de l'aile intérieure : 1, 2, 3 par exemple)
  const activePlayer = session?.players[selectedPlayerId];
  const availableRooms = activePlayer?.currentRoomId === 0 
    ? MUSEUM_ROOMS.filter(r => r.id >= 1 && r.id <= 4) // restriction QG vers l'aile intérieure
    : MUSEUM_ROOMS;

  // --- 1. LOBBY DE CONFIGURATION AVEC RÔLE MJ ---
  if (appMode === 'SETUP' || !session || !engine) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 p-6 flex flex-col justify-center items-center font-sans">
        <div className="max-w-md w-full bg-[#111827] border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Édition Musée v2
            </span>
            <h1 className="text-2xl font-black text-white mt-3">SUPER CLUEDO</h1>
            <p className="text-xs text-slate-400 mt-1">Configuration des rôles et des participants</p>
          </div>

          <form onSubmit={handleStartGame} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-2 uppercase tracking-wider text-[10px]">Nombre de participants :</label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      setParticipantNames(Array.from({ length: count }, (_, i) => participantNames[i] || `Participant ${i + 1}`));
                      setParticipantRoles(Array.from({ length: count }, (_, i) => participantRoles[i] || (i === count - 1 ? 'GM' : 'PROFILER')));
                    }}
                    className={`py-2 rounded-xl font-bold border transition ${
                      participantNames.length === count ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-[#0b0f17] text-slate-400 border-slate-800'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {participantNames.map((name, index) => (
                <div key={index} className="bg-[#0b0f17] p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="font-bold text-amber-400 text-[11px]">Participant n°{index + 1}</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      const updated = [...participantNames];
                      updated[index] = e.target.value;
                      setParticipantNames(updated);
                    }}
                    placeholder={`Nom du participant ${index + 1}`}
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl p-2.5 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                    required
                  />
                  <select
                    value={participantRoles[index]}
                    onChange={(e) => {
                      const updated = [...participantRoles];
                      updated[index] = e.target.value;
                      setParticipantRoles(updated);
                    }}
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl p-2.5 text-slate-300 text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="PROFILER">🧠 Profileuse (Détective)</option>
                    <option value="VETERAN">⭐ Vétéran (Détective)</option>
                    <option value="FORENSIC">🔬 Technicien Forensic (Détective)</option>
                    <option value="NEGOTIATOR">🤝 Négociateur (Détective)</option>
                    <option value="GM">💻 Maître du Jeu (Arbitre exclusif)</option>
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

  // --- 2. CONSOLE EXCLUSIVE DU MAÎTRE DU JEU ---
  if (appMode === 'GM_CONSOLE') {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-slate-100 p-4 font-sans max-w-xl mx-auto">
        <header className="bg-[#111827] border border-slate-800 p-4 rounded-2xl mb-4 shadow-xl flex justify-between items-center">
          <div>
            <h1 className="text-base font-black text-indigo-400">Console d'Arbitrage MJ</h1>
            <p className="text-[11px] text-slate-400">Espace exclusif réservé au Maître du Jeu</p>
          </div>
          <button 
            onClick={() => setAppMode('PLAYER_TERMINAL')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs border border-slate-700"
          >
            ← Retour Terminal
          </button>
        </header>

        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4 text-xs">
          <div className="bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-900/50">
            <p className="font-bold text-indigo-300 uppercase text-[10px]">🔒 Solution Secrète :</p>
            <p className="text-slate-300 mt-1">
              Meurtrier : <span className="text-amber-400 font-bold">{SUSPECTS.find(s => s.id === session.secretSolution.killerId)?.name}</span><br />
              Arme : <span className="text-amber-400 font-bold">{WEAPONS.find(w => w.id === session.secretSolution.weaponId)?.name}</span>
            </p>
          </div>

          <div className="bg-[#0b0f17] p-3.5 rounded-xl border border-slate-800">
            <p className="font-bold text-slate-300 mb-2 text-[10px] uppercase">Action soumise par un joueur :</p>
            {session.pendingAction ? (
              <div className="space-y-3">
                <div className="bg-[#111827] p-3 rounded-xl border border-slate-800 space-y-1">
                  <p className="text-amber-400 font-bold">{session.pendingAction.playerName} ({session.pendingAction.actionType})</p>
                  <p className="text-slate-300 text-[11px] font-mono">{session.pendingAction.secretGmVerdict}</p>
                </div>
                <button onClick={handleGmApprove} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition shadow">
                  Valider & Appliquer sur le Plateau 🛡️
                </button>
              </div>
            ) : (
              <p className="text-slate-500 italic text-center py-6">Aucune action en attente de validation...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- 3. TERMINAL JOUEUR (SANS ACCÈS MJ SAUF SI LE RÔLE GM EST UTILISÉ SUR CET APPAREIL) ---
  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 p-4 font-sans max-w-xl mx-auto">
      <header className="bg-[#111827] border border-slate-800 p-4 rounded-2xl mb-4 shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-base font-black text-white">Super Cluedo v2</h1>
            <p className="text-[11px] text-slate-400">Tour n°{session.turnNumber} | Phase : {session.phase}</p>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={selectedPlayerId} 
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="bg-[#0b0f17] text-xs text-slate-200 border border-slate-700 rounded-xl px-3 py-2 font-bold focus:outline-none"
            >
              {Object.values(session.players).map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} ({p.roleId})</option>
              ))}
            </select>
            <button 
              onClick={() => setAppMode('GM_CONSOLE')}
              className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-2 rounded-xl text-[10px] font-bold"
              title="Accès Maître du Jeu"
            >
              💻 MJ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <button 
            onClick={() => setCurrentViewMode('PLAYER')}
            className={`py-2 rounded-xl transition border ${currentViewMode === 'PLAYER' ? 'bg-indigo-600 text-white border-indigo-500 shadow' : 'bg-[#0b0f17] text-slate-400 border-slate-800'}`}
          >
            Terminal Joueur
          </button>
          <button 
            onClick={() => setCurrentViewMode('NOTEBOOK')}
            className={`py-2 rounded-xl transition border ${currentViewMode === 'NOTEBOOK' ? 'bg-indigo-600 text-white border-indigo-500 shadow' : 'bg-[#0b0f17] text-slate-400 border-slate-800'}`}
          >
            Carnet d'Enquête
          </button>
        </div>
      </header>

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
                {activePlayer.currentRoomId === 0 ? '🔒 QG Central (Départ)' : `Salle ${activePlayer.currentRoomId} · ${MUSEUM_ROOMS.find(r => r.id === activePlayer.currentRoomId)?.name}`}
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
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                  {activePlayer.currentRoomId === 0 ? 'Salle cible (Aile intérieure depuis le QG) :' : 'Salle cible adjacente :'}
                </label>
                <select 
                  value={targetRoom} 
                  onChange={(e) => setTargetRoom(Number(e.target.value))}
                  className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:outline-none"
                >
                  {availableRooms.map((r) => (
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

            {session.pendingAction ? (
              <div className="bg-amber-950/40 border border-amber-800/50 p-3 rounded-xl text-center text-amber-300 text-xs">
                ⏳ Action transmise ! En attente de validation par le Maître du Jeu...
              </div>
            ) : (
              <button 
                onClick={handlePlayerSubmit}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-2xl transition shadow text-xs uppercase tracking-wider mt-1"
              >
                Soumettre l'action au MJ ⚡
              </button>
            )}
          </div>
        </div>
      )}

      {currentViewMode === 'NOTEBOOK' && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4 text-xs">
          <h2 className="text-sm font-black text-white">Carnet d'Enquête Mutualisé</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                  <th className="p-2.5">Élément</th>
                  <th className="p-2.5">Catégorie</th>
                  <th className="p-2.5 text-center">Notes</th>
                  <th className="p-2.5 text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {SUSPECTS.slice(0, 5).map((s) => (
                  <tr key={s.id} className="border-b border-slate-800/60">
                    <td className="p-2.5 font-bold text-slate-200">{s.name}</td>
                    <td className="p-2.5 text-slate-400">Suspect</td>
                    <td className="p-2.5 text-center">
                      <button 
                        onClick={() => handleCycleCell(s.id, 'GENDER')}
                        className="w-7 h-7 rounded-lg bg-[#0b0f17] text-slate-300 font-bold text-xs border border-slate-800"
                      >
                        ?
                      </button>
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
    </div>
  );
}
