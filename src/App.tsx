import React, { useState } from 'react';
import { SuperCluedoEngine, MUSEUM_ROOMS, SUSPECTS, WEAPONS, RoleType } from './gameEngine';

export default function App() {
  const [engine, setEngine] = useState<SuperCluedoEngine | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  
  // États de l'écran de configuration initiale (Menu des joueurs)
  const [gameStarted, setGameStarted] = useState(false);
  const [p1Name, setP1Name] = useState('Robin');
  const [p1Role, setP1Role] = useState<RoleType>('profileuse');
  const [p2Name, setP2Name] = useState('Emma');
  const [p2Role, setP2Role] = useState<RoleType>('veteran');
  const [mjName, setMjName] = useState('Maître du Jeu');

  // États de navigation en cours de partie
  const [userRole, setUserRole] = useState<'player' | 'mj'>('player');
  const [activeTab, setActiveTab] = useState<'board' | 'hq' | 'notes'>('board');
  const [interrogateFeedback, setInterrogateFeedback] = useState<string | null>(null);

  // Lancer la partie avec les paramètres choisis
  const handleStartGame = () => {
    const newEngine = new SuperCluedoEngine();
    // Personnaliser les noms et rôles dans la session
    newEngine.session.players = {
      player1: { id: 'player1', name: p1Name, role: p1Role, currentRoomId: 0, actionPoints: 2, maxActionPoints: 2, notes: {} },
      player2: { id: 'player2', name: p2Name, role: p2Role, currentRoomId: 0, actionPoints: 2, maxActionPoints: 2, notes: {} },
    };
    setEngine(newEngine);
    setGameState(newEngine.session);
    setGameStarted(true);
  };

  const refreshState = () => {
    if (engine) setGameState({ ...engine.session });
  };

  // --- ÉCRAN 1 : MENU DE SÉLECTION DES JOUEURS ---
  if (!gameStarted || !engine) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-xl w-full shadow-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-wider text-amber-400">SUPER CLUEDO — ÉDITION MUSÉE</h1>
            <p className="text-xs text-slate-400 mt-1">Configuration de la partie (3 Joueurs : 2 Détectives + 1 Maître du Jeu)</p>
          </div>

          <div className="space-y-4">
            {/* Détective 1 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-semibold text-amber-300">🕵️ Détective 1</h3>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  value={p1Name} 
                  onChange={(e) => setP1Name(e.target.value)} 
                  placeholder="Nom du joueur"
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100"
                />
                <select 
                  value={p1Role} 
                  onChange={(e) => setP1Role(e.target.value as RoleType)}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100"
                >
                  <option value="profileuse">Profileuse</option>
                  <option value="veteran">Vétéran</option>
                  <option value="technicien">Technicien</option>
                  <option value="analyste">Analyste</option>
                </select>
              </div>
            </div>

            {/* Détective 2 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-semibold text-amber-300">🕵️ Détective 2</h3>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  value={p2Name} 
                  onChange={(e) => setP2Name(e.target.value)} 
                  placeholder="Nom du joueur"
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100"
                />
                <select 
                  value={p2Role} 
                  onChange={(e) => setP2Role(e.target.value as RoleType)}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100"
                >
                  <option value="profileuse">Profileuse</option>
                  <option value="veteran">Vétéran</option>
                  <option value="technicien">Technicien</option>
                  <option value="analyste">Analyste</option>
                </select>
              </div>
            </div>

            {/* Maître du Jeu (MJ) */}
            <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/50 space-y-2">
              <h3 className="text-sm font-semibold text-rose-400">👁️ Maître du Jeu (Arbitre)</h3>
              <input 
                type="text" 
                value={mjName} 
                onChange={(e) => setMjName(e.target.value)} 
                placeholder="Nom du MJ"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100"
              />
            </div>
          </div>

          <button 
            onClick={handleStartGame}
            className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg text-center"
          >
            Lancer l'Enquête 🚀
          </button>
        </div>
      </div>
    );
  }

  // --- ÉCRAN 2 : PLATEAU DE JEU PRINCIPAL ---
  const activePlayer = gameState.players[gameState.activePlayerId] || Object.values(gameState.players)[0];
  const currentRoomState = gameState.roomsState[activePlayer.currentRoomId];
  const roomConfig = MUSEUM_ROOMS.find(r => r.id === activePlayer.currentRoomId);

  const totalDiscoveredNpcs = Object.values(gameState.roomsState).reduce((acc: number, room: any) => acc + room.npcIds.length, 0);
  const totalWeaponsFound = Object.values(gameState.roomsState).filter((room: any) => room.weaponId && room.searchedZones.includes('A')).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      
      {/* EN-TÊTE */}
      <header className="max-w-7xl mx-auto mb-6 border-b border-slate-800 pb-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-wider text-amber-400">SUPER CLUEDO — ÉDITION MUSÉE</h1>
          <p className="text-sm text-slate-400">
            Tour n°{gameState.turn} | Phase : <span className="text-emerald-400 uppercase font-semibold">{gameState.phase}</span>
          </p>
        </div>

        {/* Bascule Vue Détective / Vue MJ */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setUserRole('player')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${userRole === 'player' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
          >
            🕵️ Vue Détective ({activePlayer.name})
          </button>
          <button 
            onClick={() => setUserRole('mj')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${userRole === 'mj' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            👁️ Vue Maître du Jeu ({mjName})
          </button>
        </div>

        {/* Infos Joueur Actif */}
        {userRole === 'player' && (
          <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-xl text-sm flex items-center gap-3">
            <div>
              <span className="text-amber-300 font-semibold">{activePlayer.name}</span> 
              <span className="text-xs text-slate-400 ml-1">({activePlayer.role})</span>
            </div>
            <div className="border-l border-slate-700 pl-3">
              PA : <span className="text-emerald-400 font-bold">{activePlayer.actionPoints} / {activePlayer.maxActionPoints}</span>
            </div>
          </div>
        )}
      </header>

      {/* NAVIGATION INTERNE */}
      <nav className="max-w-7xl mx-auto mb-6 flex gap-2 border-b border-slate-800 pb-3">
        {userRole === 'player' ? (
          <>
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
              🏢 QG Central ({gameState.hqInbox.length})
            </button>
          </>
        ) : (
          <button 
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition bg-rose-950/40 text-rose-300 border border-rose-900`}
          >
            📋 Console Secrète du MJ (Solution & Journal)
          </button>
        )}
      </nav>

      <main className="max-w-7xl mx-auto">
        
        {/* VUE DÉTECTIVE */}
        {userRole === 'player' && activeTab === 'board' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Prisme Pentagonal */}
            <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 text-slate-200">Prisme Pentagonal (QG & Salles 1-10)</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {MUSEUM_ROOMS.map((room) => {
                  const isPlayerHere = activePlayer.currentRoomId === room.id;
                  const roomState = gameState.roomsState[room.id];
                  const isHQ = room.id === 0;

                  return (
                    <div 
                      key={room.id}
                      onClick={() => {
                        if (isHQ || activePlayer.currentRoomId === 0 || roomConfig?.adjacentRooms.includes(room.id)) {
                          engine.movePlayer(activePlayer.id, room.id);
                          refreshState();
                        }
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isPlayerHere 
                          ? 'border-amber-400 bg-amber-950/30 shadow-lg shadow-amber-500/10' 
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-slate-500">#{room.id}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {room.ring.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-medium text-sm text-slate-100 mb-1">{room.name}</h3>
                      
                      {roomState?.npcIds && roomState.npcIds.length > 0 && (
                        <div className="mt-2 text-xs text-rose-400 flex flex-wrap gap-1">
                          {roomState.npcIds.map((npcId: string) => {
                            const s = SUSPECTS.find(item => item.id === npcId);
                            return <span key={npcId} className="bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-900">👤 {s?.name}</span>;
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions du Joueur */}
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h2 className="text-md font-semibold mb-3 text-slate-200">
                  Actions : <span className="text-amber-400">{roomConfig?.name}</span>
                </h2>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => {
                      const res = engine.searchRoomZone(activePlayer.id, 'A');
                      if (res.success && res.foundItem) {
                        engine.sendItemToHQ(res.foundItem);
                      }
                      refreshState();
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-sm font-medium py-2 px-3 rounded-lg border border-slate-700 transition flex justify-between items-center"
                  >
                    <span>🔍 Fouiller Zone A</span>
                    <span className="text-xs text-amber-400">1 PA</span>
                  </button>

                  <button 
                    onClick={() => {
                      engine.searchRoomZone(activePlayer.id, 'B');
                      refreshState();
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-sm font-medium py-2 px-3 rounded-lg border border-slate-700 transition flex justify-between items-center"
                  >
                    <span>🔍 Fouiller Zone B</span>
                    <span className="text-xs text-amber-400">1 PA</span>
                  </button>

                  {currentRoomState?.npcIds.length > 0 && (
                    <div className="pt-3 border-t border-slate-800">
                      <p className="text-xs text-slate-400 mb-2 font-semibold uppercase">Suspects présents :</p>
                      <div className="space-y-2">
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
                              className="w-full bg-rose-950/40 hover:bg-rose-950/70 border border-rose-900/60 text-xs py-2 px-3 rounded-lg text-rose-200 transition text-left flex justify-between items-center"
                            >
                              <span>💬 Interroger {npc?.name}</span>
                              <span className="text-[10px] text-rose-400">1 PA</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {interrogateFeedback && (
                    <div className="bg-rose-950/20 border border-rose-900 p-3 rounded-lg text-xs text-rose-300 italic">
                      {interrogateFeedback}
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      engine.session.activePlayerId = gameState.activePlayerId === 'player1' ? 'player2' : 'player1';
                      if (engine.session.activePlayerId === 'player1') {
                        engine.nextTurn();
                      }
                      setInterrogateFeedback(null);
                      refreshState();
                    }}
                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold py-2.5 px-3 rounded-lg transition text-white shadow-lg shadow-emerald-900/20"
                  >
                    ▶️ Fin du Tour du Joueur (Changer de Détective)
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* VUE MAÎTRE DU JEU */}
        {userRole === 'mj' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-3xl mx-auto space-y-6">
            <h2 className="text-lg font-bold text-rose-400">Console Secrète du Maître du Jeu ({mjName})</h2>
            
            <div className="bg-rose-950/20 border border-rose-900 p-4 rounded-xl space-y-2">
              <h3 className="text-xs uppercase font-semibold text-rose-300 tracking-wider">Solution Secrète :</h3>
              <p className="text-sm text-slate-200">
                👤 Meurtrier : <span className="text-amber-400 font-bold">{SUSPECTS.find(s => s.id === gameState.secretSolution.murdererId)?.name}</span><br />
                🗡️ Arme : <span className="text-amber-400 font-bold">{WEAPONS.find(w => w.id === gameState.secretSolution.weaponId)?.name}</span><br />
                📍 Lieu : <span className="text-amber-400 font-bold">Salle #{gameState.secretSolution.roomId} ({MUSEUM_ROOMS.find(r => r.id === gameState.secretSolution.roomId)?.name})</span>
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Journal d'Investigation :</h3>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2 max-h-[300px] overflow-y-auto">
                {gameState.gameLogs.map((log: string, index: number) => (
                  <div key={index} className="text-slate-300 border-b border-slate-900 pb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
