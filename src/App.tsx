import React, { useState } from 'react';
import { SuperCluedoEngine, MUSEUM_ROOMS, SUSPECTS, WEAPONS, RoleType } from './gameEngine';

export default function App() {
  const [engine] = useState(() => new SuperCluedoEngine());
  const [gameState, setGameState] = useState(() => engine.session);
  const [activeTab, setActiveTab] = useState<'board' | 'hq' | 'notes'>('board');
  const [accusationModal, setAccusationModal] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState(SUSPECTS[0].id);
  const [selectedWeapon, setSelectedWeapon] = useState(WEAPONS[0].id);
  const [selectedRoom, setSelectedRoom] = useState(1);
  const [interrogateFeedback, setInterrogateFeedback] = useState<string | null>(null);

  // Gestion des actions et du dé physique
  const [selectedAction, setSelectedAction] = useState<'deplacer' | 'fouiller_a' | 'fouiller_b' | 'interroger'>('deplacer');
  const [dieResult, setDieResult] = useState<number | null>(3); // Valeur par défaut

  const refreshState = () => {
    setGameState({ ...engine.session });
  };

  const activePlayer = gameState.players[gameState.activePlayerId] || Object.values(gameState.players)[0];
  const currentRoomState = gameState.roomsState[activePlayer.currentRoomId];
  const roomConfig = MUSEUM_ROOMS.find(r => r.id === activePlayer.currentRoomId);

  // Libellés élégants pour les ailes du musée
  const getWingLabel = (ring: string) => {
    switch (ring) {
      case 'hq': return '🏛️ QG Central';
      case 'inner': return '🏛️ Aile Historique';
      case 'outer': return '🖼️ Galerie Périphérique';
      default: return ring;
    }
  };

  // Compteurs globaux MJ
  const totalDiscoveredNpcs = Object.values(gameState.roomsState).reduce((acc: number, room: any) => acc + room.npcIds.length, 0);
  const totalWeaponsFound = Object.values(gameState.roomsState).filter((room: any) => room.weaponId && room.searchedZones.includes('A')).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      
      {/* EN-TÊTE PRINCIPAL */}
      <header className="max-w-7xl mx-auto mb-6 border-b border-slate-800 pb-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wider text-amber-400">SUPER CLUEDO — ÉDITION MUSÉE</h1>
          <p className="text-sm text-slate-400">
            Tour n°{gameState.turn} | Phase : <span className="text-emerald-400 uppercase font-semibold">{gameState.phase}</span>
          </p>
        </div>

        {/* Tableau de bord / Compteurs du MJ */}
        <div className="flex flex-wrap gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs">
          <div>👤 PNJ repérés : <span className="text-amber-300 font-bold">{totalDiscoveredNpcs} / 5</span></div>
          <div>🗡️ Armes trouvées : <span className="text-amber-300 font-bold">{totalWeaponsFound} / 10</span></div>
          <div>📦 Boîte QG : <span className="text-amber-300 font-bold">{gameState.hqInbox.length}</span></div>
          <div>🔬 Analysés : <span className="text-emerald-400 font-bold">{gameState.analyzedClues.length}</span></div>
        </div>

        {/* Contrôle du Joueur Actif & PA */}
        <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-xl text-sm flex items-center gap-3">
          <div>
            <span className="text-amber-300 font-semibold">{activePlayer.name}</span> 
            <span className="text-xs text-slate-400 ml-1">({activePlayer.role})</span>
          </div>
          <div className="border-l border-slate-700 pl-3">
            PA : <span className="text-emerald-400 font-bold">{activePlayer.actionPoints} / {activePlayer.maxActionPoints}</span>
          </div>
        </div>
      </header>

      {/* NAVIGATION INTERNE */}
      <nav className="max-w-7xl mx-auto mb-6 flex gap-2 border-b border-slate-800 pb-3">
        <button 
          onClick={() => setActiveTab('board')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'board' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
        >
          🗺️ Plan Tactique & Actions
        </button>
        <button 
          onClick={() => setActiveTab('hq')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'hq' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
        >
          🏢 QG Central & Analyses ({gameState.hqInbox.length})
        </button>
        <button 
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'notes' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
        >
          📜 Journal de Bord MJ
        </button>
      </nav>

      <main className="max-w-7xl mx-auto">
        
        {/* ONGLET 1 : PLAN TACTIQUE & ACTIONS */}
        {activeTab === 'board' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* GRILLE DU PRISME PENTAGONAL (SALLES ACCESSIBLES FILTRÉES) */}
            <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-lg font-semibold mb-2 text-slate-200">Plan Tactique du Musée (Prisme Pentagonal)</h2>
              <p className="text-xs text-slate-400 mb-4">Les salles accessibles depuis votre position actuelle sont surlignées en vert.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {MUSEUM_ROOMS.map((room) => {
                  const isPlayerHere = activePlayer.currentRoomId === room.id;
                  const roomState = gameState.roomsState[room.id];
                  const isHQ = room.id === 0;
                  const currentRoomCfg = MUSEUM_ROOMS.find(r => r.id === activePlayer.currentRoomId);
                  
                  // Calcul de l'accessibilité : QG central ou salle adjacente directe
                  const isAccessible = isHQ || activePlayer.currentRoomId === 0 || currentRoomCfg?.adjacentRooms.includes(room.id);

                  return (
                    <div 
                      key={room.id}
                      onClick={() => {
                        if (isAccessible && selectedAction === 'deplacer') {
                          engine.movePlayer(activePlayer.id, room.id);
                          refreshState();
                        }
                      }}
                      className={`p-4 rounded-xl border transition-all ${
                        isPlayerHere 
                          ? 'border-amber-400 bg-amber-950/40 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400' 
                          : isAccessible && selectedAction === 'deplacer'
                            ? 'border-emerald-500 bg-slate-900 hover:border-emerald-400 cursor-pointer shadow-md shadow-emerald-500/20'
                            : 'border-slate-800 bg-slate-950/80 opacity-60'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-slate-400 font-bold">#{room.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          {getWingLabel(room.ring)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm text-slate-100 mb-1">{room.name}</h3>
                      <p className="text-[11px] text-slate-400 mb-2 line-clamp-1">{room.description}</p>
                      
                      {roomState?.npcIds && roomState.npcIds.length > 0 && (
                        <div className="mt-2 text-xs text-rose-400 flex flex-wrap gap-1">
                          {roomState.npcIds.map((npcId: string) => {
                            const s = SUSPECTS.find(item => item.id === npcId);
                            return <span key={npcId} className="bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-900 font-medium">👤 {s?.name}</span>;
                          })}
                        </div>
                      )}

                      {roomState?.searchedZones.length > 0 && (
                        <div className="mt-2 text-[10px] text-slate-400 font-mono">
                          Zones fouillées : {roomState.searchedZones.join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PANNEAU LATÉRAL : SÉLECTEUR D'ACTIONS & DÉ PHYSIQUE */}
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h2 className="text-md font-semibold text-slate-200">
                  Position actuelle : <span className="text-amber-400">{roomConfig?.name}</span>
                </h2>
                
                {/* Sélecteur d'actions explicite */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sélectionner une Action :</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setSelectedAction('deplacer')}
                      className={`p-2.5 rounded-lg text-xs font-semibold border transition ${selectedAction === 'deplacer' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'}`}
                    >
                      🚶 Déplacement
                    </button>
                    <button 
                      onClick={() => setSelectedAction('fouiller_a')}
                      className={`p-2.5 rounded-lg text-xs font-semibold border transition ${selectedAction === 'fouiller_a' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'}`}
                    >
                      🔍 Fouiller Zone A
                    </button>
                    <button 
                      onClick={() => setSelectedAction('fouiller_b')}
                      className={`p-2.5 rounded-lg text-xs font-semibold border transition ${selectedAction === 'fouiller_b' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'}`}
                    >
                      🔎 Fouiller Zone B
                    </button>
                    <button 
                      onClick={() => setSelectedAction('interroger')}
                      className={`p-2.5 rounded-lg text-xs font-semibold border transition ${selectedAction === 'interroger' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'}`}
                    >
                      💬 Interroger
                    </button>
                  </div>
                </div>

                {/* Saisir le résultat du Dé Physique */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-300 font-medium">Résultat du Dé Physique :</span>
                    <span className="text-amber-400 font-bold text-lg bg-slate-900 px-3 py-0.5 rounded border border-slate-800">
                      {dieResult !== null ? dieResult : '-'}
                    </span>
                  </div>
                  <div className="flex gap-1 justify-between">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        onClick={() => setDieResult(num)}
                        className={`flex-1 py-1 rounded text-xs font-bold border transition ${dieResult === num ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exécution de l'action sélectionnée */}
                <div className="space-y-3 pt-2">
                  {selectedAction === 'fouiller_a' && (
                    <button 
                      onClick={() => {
                        const res = engine.searchRoomZone(activePlayer.id, 'A');
                        if (res.success && res.foundItem) {
                          engine.sendItemToHQ(res.foundItem);
                        }
                        refreshState();
                      }}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold py-2.5 rounded-lg text-sm transition shadow"
                    >
                      Exécuter la Fouille Zone A (1 PA)
                    </button>
                  )}

                  {selectedAction === 'fouiller_b' && (
                    <button 
                      onClick={() => {
                        engine.searchRoomZone(activePlayer.id, 'B');
                        refreshState();
                      }}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold py-2.5 rounded-lg text-sm transition shadow"
                    >
                      Exécuter la Fouille Zone B (1 PA)
                    </button>
                  )}

                  {selectedAction === 'interroger' && currentRoomState?.npcIds.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400 font-semibold">Choisir un suspect dans la salle :</p>
                      {currentRoomState.npcIds.map((npcId: string) => {
                        const npc = SUSPECTS.find(s => s.id === npcId);
                        return (
                          <button
                            key={npcId}
                            onClick={() => {
                              const res = engine.performInterrogation(activePlayer.id, npcId);
                              setInterrogateFeedback(`${npc?.name} : ${res.testimonial}`);
                              refreshState();
                            }}
                            className="w-full bg-rose-950/50 hover:bg-rose-950 border border-rose-900 text-xs py-2 px-3 rounded-lg text-rose-200 transition text-left font-medium"
                          >
                            💬 Interroger {npc?.name} (1 PA)
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedAction === 'deplacer' && (
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-center text-xs text-slate-400 italic">
                      Cliquez directement sur une salle voisine en surbrillance verte sur la carte pour vous y déplacer.
                    </div>
                  )}

                  {interrogateFeedback && (
                    <div className="bg-rose-950/30 border border-rose-900 p-3 rounded-lg text-xs text-rose-300 italic">
                      {interrogateFeedback}
                    </div>
                  )}

                  {/* Rôle Technicien : Analyse sur place */}
                  {activePlayer.role === 'technicien' && currentRoomState?.weaponId && (
                    <button 
                      onClick={() => {
                        engine.analyzeItem(currentRoomState.weaponId!);
                        refreshState();
                      }}
                      className="w-full bg-indigo-900/60 hover:bg-indigo-900 text-xs font-semibold py-2 px-3 rounded-lg border border-indigo-700 transition text-left text-indigo-200"
                    >
                      🔬 Analyser l'arme sur place (Technicien)
                    </button>
                  )}

                  <button 
                    onClick={() => {
                      engine.nextTurn();
                      setInterrogateFeedback(null);
                      refreshState();
                    }}
                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold py-2.5 px-3 rounded-lg transition text-white shadow-lg shadow-emerald-900/20"
                  >
                    ▶️ Terminer le Tour / Déplacer les PNJ
                  </button>

                  <button 
                    onClick={() => setAccusationModal(true)}
                    className="w-full bg-amber-600/80 hover:bg-amber-600 text-sm font-semibold py-2 px-3 rounded-lg transition text-slate-950"
                  >
                    ⚖️ Formuler une Accusation
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ONGLET 2 : QG CENTRAL & ANALYSES */}
        {activeTab === 'hq' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold mb-4 text-amber-400">Boîte de Réception du QG Central</h2>
            <p className="text-xs text-slate-400 mb-6">Les objets et indices envoyés gratuitement (0 PA) depuis le terrain arrivent ici pour analyse centralisée.</p>

            <div className="space-y-3">
              {gameState.hqInbox.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Aucun objet transmis au QG pour l'instant.</p>
              ) : (
                gameState.hqInbox.map((itemId: string) => {
                  const weapon = WEAPONS.find(w => w.id === itemId);
                  const isAnalyzed = gameState.analyzedClues.includes(itemId);
                  return (
                    <div key={itemId} className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-sm font-medium text-slate-200">🗡️ {weapon?.name || itemId}</span>
                        <span className={`ml-3 text-xs px-2 py-0.5 rounded ${isAnalyzed ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-amber-950 text-amber-400 border border-amber-900'}`}>
                          {isAnalyzed ? 'Analysé' : 'En attente'}
                        </span>
                      </div>
                      {!isAnalyzed && (
                        <button 
                          onClick={() => {
                            engine.analyzeItem(itemId);
                            refreshState();
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-xs px-3 py-1.5 rounded text-white font-medium transition"
                        >
                          Lancer l'analyse
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ONGLET 3 : JOURNAL DE BORD DU MJ */}
        {activeTab === 'notes' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold mb-4 text-amber-400">Journal d'Investigation du Maître du Jeu</h2>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2 max-h-[400px] overflow-y-auto">
              {gameState.gameLogs.map((log: string, index: number) => (
                <div key={index} className="text-slate-300 border-b border-slate-900 pb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* MODALE D'ACCUSATION */}
      {accusationModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold text-amber-400">Formuler l'Accusation Finale</h2>
            <p className="text-xs text-slate-400">Si vous désignez le coupable, l'arme et le lieu exacts, le suspect entrera en mode traque !</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Suspect :</label>
                <select value={selectedSuspect} onChange={(e) => setSelectedSuspect(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-100">
                  {SUSPECTS.map(s => <option key={s.id} value={s.id}>{s.name} ({s.title})</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Arme du crime :</label>
                <select value={selectedWeapon} onChange={(e) => setSelectedWeapon(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-100">
                  {WEAPONS.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Lieu du crime (Salle #) :</label>
                <input type="number" min="1" max="10" value={selectedRoom} onChange={(e) => setSelectedRoom(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-100" />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button onClick={() => setAccusationModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-sm transition">Annuler</button>
              <button onClick={() => {
                engine.submitAccusation(selectedSuspect, selectedWeapon, selectedRoom);
                setAccusationModal(false);
                refreshState();
              }} className="flex-1 bg-amber-600 hover:bg-amber-500 py-2 rounded-lg text-sm text-slate-950 font-semibold transition">Valider l'Accusation</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
