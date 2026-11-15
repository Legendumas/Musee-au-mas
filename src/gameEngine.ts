// ==========================================
// SUPER CLUEDO - ÉDITION MUSÉE (GAME ENGINE COMPLET & DYNAMIQUE)
// ==========================================

export type RoleType = 'profileuse' | 'veteran' | 'technicien' | 'analyste';

export interface RoomConfig {
  id: number;
  name: string;
  ring: 'inner' | 'outer' | 'hq';
  adjacentRooms: number[];
}

export interface Suspect {
  id: string;
  name: string;
  title: string;
  role: string;
}

export interface Weapon {
  id: string;
  name: string;
}

export interface NpcMovement {
  npcId: string;
  initialRoomId: number;
  finalRoomId: number;
  path: number[];
}

export interface PlayerState {
  id: string;
  name: string;
  role: RoleType;
  currentRoomId: number;
  actionPoints: number;
  maxActionPoints: number;
}

export interface RoomState {
  roomId: number;
  npcIds: string[];
  weaponId?: string;
  searchedZones: ('A' | 'B')[];
  clueIds: string[];
}

export interface GameSession {
  turn: number;
  activePlayerId: string;
  phase: 'investigation' | 'chase' | 'victory' | 'defeat';
  secretSolution: {
    murdererId: string;
    weaponId: string;
    roomId: number;
    motiveId: string;
  };
  players: Record<string, PlayerState>;
  roomsState: Record<number, RoomState>;
  npcMovements: Record<string, NpcMovement>;
  analyzedClues: string[];
  hqInbox: string[];
  gameLogs: string[];
}

// ------------------------------------------
// CONSTANTES DU PLATEAU (Prisme Pentagonal)
// ------------------------------------------
export const MUSEUM_ROOMS: RoomConfig[] = [
  { id: 0, name: 'QG Central', ring: 'hq', adjacentRooms: [1, 2, 3, 4, 5] },
  // Anneau Intérieur (1-5)
  { id: 1, name: 'Galerie des Antiques', ring: 'inner', adjacentRooms: [0, 2, 5, 6] },
  { id: 2, name: 'Salon des Horloges', ring: 'inner', adjacentRooms: [0, 1, 3, 7] },
  { id: 3, name: 'Salle des Armures', ring: 'inner', adjacentRooms: [0, 2, 4, 8] },
  { id: 4, name: 'Rotonde des Peintures', ring: 'inner', adjacentRooms: [0, 3, 5, 9] },
  { id: 5, name: 'Bibliothèque Ancienne', ring: 'inner', adjacentRooms: [0, 1, 4, 10] },
  // Anneau Extérieur (6-10)
  { id: 6, name: 'Atelier de Restauration', ring: 'outer', adjacentRooms: [1, 7, 10] },
  { id: 7, name: 'Serre Botanique', ring: 'outer', adjacentRooms: [2, 6, 8] },
  { id: 8, name: 'Réserve Technique', ring: 'outer', adjacentRooms: [3, 7, 9] },
  { id: 9, name: 'Crypte Souterraine', ring: 'outer', adjacentRooms: [4, 8, 10] },
  { id: 10, name: 'Observatoire du Dôme', ring: 'outer', adjacentRooms: [5, 6, 9] },
];

export const SUSPECTS: Suspect[] = [
  { id: 's1', name: 'Éléonore Vance', title: 'Conservatrice', role: 'Staff' },
  { id: 's2', name: 'Arthur Pendelton', title: 'Mécène', role: 'Visitor' },
  { id: 's3', name: 'Dr. Claire Sterling', title: 'Historienne', role: 'Expert' },
  { id: 's4', name: 'Marcus Brody', title: 'Archiviste', role: 'Staff' },
  { id: 's5', name: 'Helena Rostova', title: 'Restauratrice', role: 'Expert' },
];

export const WEAPONS: Weapon[] = [
  { id: 'w1', name: 'Dague cérémonielle' },
  { id: 'w2', name: 'Statuette en bronze' },
  { id: 'w3', name: 'Flacon de venin' },
  { id: 'w4', name: 'Lourd chandelier' },
  { id: 'w5', name: 'Sabre d’apparat' },
  { id: 'w6', name: 'Couteau de dissection' },
  { id: 'w7', name: 'Livre empoisonné' },
  { id: 'w8', name: 'Poids de balance' },
  { id: 'w9', name: 'Corde de hissage' },
  { id: 'w10', name: 'Presse-papier en onyx' },
];

// ------------------------------------------
// CLASSE DU MOTEUR DE JEU COMPLET
// ------------------------------------------
export class SuperCluedoEngine {
  public session: GameSession;

  constructor(playersConfig?: Array<{ name: string; role: RoleType }>) {
    this.session = this.initNewGame(playersConfig);
  }

  private log(message: string): void {
    const timestamp = `[Tour ${this.session.turn}]`;
    this.session.gameLogs.unshift(`${timestamp} ${message}`);
  }

  public initNewGame(playersConfig?: Array<{ name: string; role: RoleType }>): GameSession {
    const murderer = SUSPECTS[Math.floor(Math.random() * SUSPECTS.length)];
    const weapon = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
    const targetRoomId = Math.floor(Math.random() * 10) + 1;
    const motifs = ['M1_THEFT', 'M2_PASSION', 'M3_BLACKMAIL', 'M4_REVENGE'];
    const motive = motifs[Math.floor(Math.random() * motifs.length)];

    const roomsState: Record<number, RoomState> = {};
    for (const r of MUSEUM_ROOMS) {
      // PNJ initialement cachés (npcIds vide)
      roomsState[r.id] = { roomId: r.id, npcIds: [], searchedZones: [], clueIds: [] };
    }

    // Répartition exclusive des armes (1 par salle de 1 à 10)
    WEAPONS.forEach((w, index) => {
      const roomId = (index % 10) + 1;
      roomsState[roomId].weaponId = w.id;
    });

    // Configuration dynamique des joueurs
    const players: Record<string, PlayerState> = {};
    if (playersConfig && playersConfig.length > 0) {
      playersConfig.forEach((p, index) => {
        const playerId = `player${index + 1}`;
        players[playerId] = {
          id: playerId,
          name: p.name.trim() || `Détective ${index + 1}`,
          role: p.role,
          currentRoomId: 0,
          actionPoints: 2,
          maxActionPoints: 2,
        };
      });
    } else {
      players['player1'] = { id: 'player1', name: 'Détective 1', role: 'profileuse', currentRoomId: 0, actionPoints: 2, maxActionPoints: 2 };
    }

    const firstPlayerId = Object.keys(players)[0];

    return {
      turn: 1,
      activePlayerId: firstPlayerId,
      phase: 'investigation',
      secretSolution: {
        murdererId: murderer.id,
        weaponId: weapon.id,
        roomId: targetRoomId,
        motiveId: motive,
      },
      players,
      roomsState,
      npcMovements: {},
      analyzedClues: [],
      hqInbox: [],
      gameLogs: ["Partie initialisée. Les PNJ sont dissimulés dans le musée."],
    };
  }

  /**
   * Déplacement du joueur (coûte 1 PA)
   */
  public movePlayer(playerId: string, targetRoomId: number): boolean {
    const player = this.session.players[playerId];
    if (!player || player.actionPoints < 1) return false;

    const currentRoom = MUSEUM_ROOMS.find((r) => r.id === player.currentRoomId);
    if (!currentRoom || !currentRoom.adjacentRooms.includes(targetRoomId)) return false;

    player.currentRoomId = targetRoomId;
    player.actionPoints -= 1;

    const targetConfig = MUSEUM_ROOMS.find(r => r.id === targetRoomId);
    this.log(`${player.name} s'est déplacé vers ${targetConfig?.name} (Salle #${targetRoomId}).`);
    return true;
  }

  /**
   * Fouille d'une zone (A ou B) dans la salle actuelle (coûte 1 PA)
   */
  public searchRoomZone(playerId: string, zone: 'A' | 'B'): { success: boolean; message: string; foundItem?: string } {
    const player = this.session.players[playerId];
    if (!player || player.actionPoints < 1) {
      return { success: false, message: "Points d'action insuffisants." };
    }

    const roomState = this.session.roomsState[player.currentRoomId];
    if (!roomState) return { success: false, message: "Salle invalide." };

    if (roomState.searchedZones.includes(zone)) {
      return { success: false, message: `La zone ${zone} de cette salle a déjà été fouillée.` };
    }

    roomState.searchedZones.push(zone);
    player.actionPoints -= 1;

    // Révélation potentielle d'un PNJ caché lors de la fouille
    const hiddenSuspects = SUSPECTS.filter(s => !Object.values(this.session.roomsState).some(rs => rs.npcIds.includes(s.id)));
    if (hiddenSuspects.length > 0 && Math.random() > 0.3 && roomState.npcIds.length === 0 && roomState.roomId !== 0) {
      const revealedNpc = hiddenSuspects[Math.floor(Math.random() * hiddenSuspects.length)];
      roomState.npcIds.push(revealedNpc.id);
      this.log(`${player.name} a fouillé la zone ${zone} (Salle #${roomState.roomId}) et a repéré le suspect : ${revealedNpc.name}.`);
    } else {
      this.log(`${player.name} a fouillé la zone ${zone} de la salle #${roomState.roomId}.`);
    }

    // Découverte potentielle (Arme unique de la salle)
    if (zone === 'A' && roomState.weaponId) {
      const weapon = WEAPONS.find((w) => w.id === roomState.weaponId);
      this.log(`Arme découverte : ${weapon?.name} dans la salle #${roomState.roomId}.`);
      return {
        success: true,
        message: `Fouille réussie ! Vous avez découvert l'arme : ${weapon?.name}. Vous pouvez l'envoyer au QG gratuitement.`,
        foundItem: roomState.weaponId,
      };
    }

    return {
      success: true,
      message: `Fouille de la zone ${zone} effectuée.`,
    };
  }

  /**
   * Action gratuite (0 PA) : Envoyer une arme au QG central
   */
  public sendItemToHQ(itemId: string): void {
    if (!this.session.hqInbox.includes(itemId)) {
      this.session.hqInbox.push(itemId);
      const weapon = WEAPONS.find(w => w.id === itemId);
      this.log(`Objet transmis au QG central : ${weapon?.name || itemId}`);
    }
  }

  /**
   * Analyse d'une pièce à conviction
   */
  public analyzeItem(itemId: string): boolean {
    if (!this.session.analyzedClues.includes(itemId)) {
      this.session.analyzedClues.push(itemId);
      const weapon = WEAPONS.find(w => w.id === itemId);
      this.log(`Analyse QG validée pour l'élément : ${weapon?.name || itemId}`);
      return true;
    }
    return false;
  }

  /**
   * Interrogatoire d'un PNJ avec gestion du dé physique (1-3 : Vérité, info partielle ou panique ; 4-6 : Succès complet)
   */
  public performInterrogation(playerId: string, npcId: string, dieRoll: number): { testimonial: string; isUseful: boolean } {
    const player = this.session.players[playerId];
    if (!player || player.actionPoints < 1) {
      return { testimonial: "PA insuffisants pour interroger.", isUseful: false };
    }

    const roomState = this.session.roomsState[player.currentRoomId];
    if (!roomState || !roomState.npcIds.includes(npcId)) {
      return { testimonial: "Ce suspect n'est pas dans votre salle.", isUseful: false };
    }

    player.actionPoints -= 1;
    const npcObject = SUSPECTS.find((s) => s.id === npcId)!;
    const movement = this.session.npcMovements[npcId];

    const fromRoomName = movement ? MUSEUM_ROOMS.find(r => r.id === movement.initialRoomId)?.name || `Salle #${movement.initialRoomId}` : 'une autre salle';
    const toRoomName = movement ? MUSEUM_ROOMS.find(r => r.id === movement.finalRoomId)?.name || `Salle #${movement.finalRoomId}` : 'ici';

    let testimonial = "";
    let isUseful = false;

    if (dieRoll >= 4) {
      // --- SUCCÈS (4, 5, 6) : Vérité complète ---
      testimonial = `"${npcObject.name} : Je venais de ${fromRoomName} pour me rendre dans la salle ${toRoomName}."`;
      isUseful = true;
      this.log(`${player.name} a réussi l'interrogatoire de ${npcObject.name} (Dé : ${dieRoll}). Témoignage complet.`);
    } else {
      // --- ÉCHEC (1, 2, 3) : Vérité, info partielle ou panique/mensonge ---
      const failBehaviors = [
        `"${npcObject.name} : Pour tout vous dire, je venais de ${fromRoomName} et je suis arrivé ici (${toRoomName})."`, // Vérité malgré l'échec
        `"${npcObject.name} : Tout ce dont je me souviens, c'est que je partais de ${fromRoomName}..."`, // Info partielle (départ)
        `"${npcObject.name} : Je me dirigeais vers ${toRoomName}, mais le reste est flou."`, // Info partielle (arrivée)
        `"${npcObject.name} : Laissez-moi tranquille ! Je n'ai bougé de nulle part, je n'ai rien vu !"`, // Panique / Mensonge
        `"${npcObject.name} : Je venais de l'autre bout du musée..."` // Faux témoignage de panique
      ];

      testimonial = failBehaviors[Math.floor(Math.random() * failBehaviors.length)];
      isUseful = false;
      this.log(`${player.name} a obtenu un témoignage incertain de ${npcObject.name} suite à un échec au dé (Dé : ${dieRoll}).`);
    }

    return { testimonial, isUseful };
  }

  /**
   * Fin de tour : recharge les PA (les PNJ restent immobiles par défaut)
   */
  public nextTurn(): void {
    this.session.turn += 1;
    for (const pId of Object.keys(this.session.players)) {
      this.session.players[pId].actionPoints = this.session.players[pId].maxActionPoints;
    }
    this.log(`Début du tour n°${this.session.turn}.`);
  }

  public submitAccusation(suspectId: string, weaponId: string, roomId: number) {
    const sol = this.session.secretSolution;
    if (sol.murdererId === suspectId && sol.weaponId === weaponId && sol.roomId === roomId) {
      this.session.phase = 'chase';
      this.log(`ACCUSATION CORRECTE ! Le suspect prend la fuite (Mode Traque activé).`);
    } else {
      this.log(`Accusation fausse formulée par les détectives.`);
    }
  }
}
// ==========================================
// EXTENSION : MODE TRAQUE & FIN DE PARTIE
// ==========================================

export interface ChaseState {
  fugitiveId: string;
  currentRoomId: number;
  remainingTurns: number;
  status: 'active' | 'arrested' | 'escaped';
}
