// ==========================================
// SUPER CLUEDO - ÉDITION MUSÉE (GAME ENGINE COMPLET)
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

  constructor() {
    this.session = this.initNewGame();
  }

  public initNewGame(): GameSession {
    const murderer = SUSPECTS[Math.floor(Math.random() * SUSPECTS.length)];
    const weapon = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
    const targetRoomId = Math.floor(Math.random() * 10) + 1;
    const motifs = ['M1_THEFT', 'M2_PASSION', 'M3_BLACKMAIL', 'M4_REVENGE'];
    const motive = motifs[Math.floor(Math.random() * motifs.length)];

    const roomsState: Record<number, RoomState> = {};
    for (const r of MUSEUM_ROOMS) {
      roomsState[r.id] = { roomId: r.id, npcIds: [], searchedZones: [], clueIds: [] };
    }

    // Répartition exclusive des armes (1 par salle de 1 à 10)
    WEAPONS.forEach((w, index) => {
      const roomId = (index % 10) + 1;
      roomsState[roomId].weaponId = w.id;
    });

    // Placement initial des PNJ (max 2 par pièce)
    SUSPECTS.forEach((suspect, idx) => {
      const targetRoom = (idx % 10) + 1;
      if (roomsState[targetRoom].npcIds.length < 2) {
        roomsState[targetRoom].npcIds.push(suspect.id);
      } else {
        roomsState[1].npcIds.push(suspect.id);
      }
    });

    return {
      turn: 1,
      activePlayerId: 'player1',
      phase: 'investigation',
      secretSolution: {
        murdererId: murderer.id,
        weaponId: weapon.id,
        roomId: targetRoomId,
        motiveId: motive,
      },
      players: {
        player1: { id: 'player1', name: 'Robin', role: 'profileuse', currentRoomId: 0, actionPoints: 2, maxActionPoints: 2 },
        player2: { id: 'player2', name: 'Emma', role: 'veteran', currentRoomId: 0, actionPoints: 2, maxActionPoints: 2 },
      },
      roomsState,
      npcMovements: {},
      analyzedClues: [],
      hqInbox: [],
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

    // Découverte potentielle (Arme unique de la salle ou Indice de motif)
    if (zone === 'A' && roomState.weaponId) {
      const weapon = WEAPONS.find((w) => w.id === roomState.weaponId);
      return {
        success: true,
        message: `Fouille réussie ! Vous avez découvert l'arme : ${weapon?.name}. Vous pouvez l'envoyer au QG gratuitement.`,
        foundItem: roomState.weaponId,
      };
    }

    return {
        success: true,
        message: `Fouille de la zone ${zone} effectuée. Aucun objet majeur trouvé ici, mais l'indice est consigné.`,
    };
  }

  /**
   * Action gratuite (0 PA) : Envoyer une arme ou un indice au QG central
   */
  public sendItemToHQ(itemId: string): void {
    if (!this.session.hqInbox.includes(itemId)) {
      this.session.hqInbox.push(itemId);
    }
  }

  /**
   * Analyse d'une pièce à conviction (sur place pour le Technicien, ou centralisée)
   */
  public analyzeItem(itemId: string): boolean {
    if (!this.session.analyzedClues.includes(itemId)) {
      this.session.analyzedClues.push(itemId);
      return true;
    }
    return false;
  }

  /**
   * Interrogatoire d'un PNJ présent dans la même salle (coûte 1 PA ou gratuit selon variante, ici 1 PA)
   */
  public performInterrogation(playerId: string, npcId: string): { testimonial: string; isUseful: boolean } {
    const player = this.session.players[playerId];
    if (!player || player.actionPoints < 1) {
      return { testimonial: "PA insuffisants pour interroger.", isUseful: false };
    }

    const roomState = this.session.roomsState[player.currentRoomId];
    if (!roomState || !roomState.npcIds.includes(npcId)) {
      return { testimonial: "Ce suspect n'est pas dans votre salle.", isUseful: false };
    }

    player.actionPoints -= 1;
    const npcMovement = this.session.npcMovements[npcId];
    const npcObject = SUSPECTS.find((s) => s.id === npcId)!;

    const start = npcMovement ? npcMovement.initialRoomId : player.currentRoomId;
    const end = npcMovement ? npcMovement.finalRoomId : player.currentRoomId;
    const movementText = start === end 
      ? `Je suis resté discret dans la zone ${start} ces derniers tours.` 
      : `Je me suis déplacé de la salle ${start} pour rejoindre ici (${end}).`;

    const hasElevatorSound = player.currentRoomId >= 6 && player.currentRoomId <= 10;
    const soundText = hasElevatorSound 
      ? " J'ai perçu les grincements sourds du monte-charge à travers les cloisons." 
      : " L'ambiance était calme.";

    return {
      testimonial: `"${movementText}${soundText}"`,
      isUseful: true,
    };
  }

  /**
   * Déplacement automatique des PNJ (0 à 2 pas, respect de max 2 PNJ/salle et anti-duo)
   */
  public moveAllNpcs(): void {
    const previousRoomByNpc: Record<string, number> = {};
    const roommatesBefore: Record<string, string[]> = {};

    for (const r of MUSEUM_ROOMS) {
      const npcsInRoom = this.session.roomsState[r.id].npcIds;
      for (const npcId of npcsInRoom) {
        previousRoomByNpc[npcId] = r.id;
        roommatesBefore[npcId] = npcsInRoom.filter((id) => id !== npcId);
      }
    }

    for (const r of MUSEUM_ROOMS) {
      this.session.roomsState[r.id].npcIds = [];
    }

    const newRoomByNpc: Record<string, number> = {};

    for (const [npcId, oldRoom] of Object.entries(previousRoomByNpc)) {
      const oldPartners = roommatesBefore[npcId] || [];
      let chosenRoom = oldRoom;
      let attempts = 0;
      let validMove = false;

      while (!validMove && attempts < 15) {
        attempts++;
        const steps = Math.floor(Math.random() * 3); // 0, 1 ou 2 pas
        let currentPathNode = oldRoom;

        for (let s = 0; s < steps; s++) {
          const roomConfig = MUSEUM_ROOMS.find((r) => r.id === currentPathNode)!;
          const neighbors = roomConfig.adjacentRooms.filter((id) => id !== 0); // Évite le QG
          if (neighbors.length > 0) {
            currentPathNode = neighbors[Math.floor(Math.random() * neighbors.length)];
          }
        }

        const candidateRoom = currentPathNode;
        const npcsInCandidate = this.session.roomsState[candidateRoom]?.npcIds || [];

        const sharesPartnerWithOld = oldPartners.some((partnerId) => newRoomByNpc[partnerId] === candidateRoom);
        const wouldBeValid = npcsInCandidate.length < 2 && !sharesPartnerWithOld;

        if (wouldBeValid) {
          chosenRoom = candidateRoom;
          validMove = true;
        }
      }

      newRoomByNpc[npcId] = chosenRoom;
      this.session.roomsState[chosenRoom].npcIds.push(npcId);

      this.session.npcMovements[npcId] = {
        npcId,
        initialRoomId: oldRoom,
        finalRoomId: chosenRoom,
        path: [oldRoom, chosenRoom],
      };
    }
  }

  /**
   * Fin de tour : recharge les PA et déplace les PNJ
   */
  public nextTurn(): void {
    this.session.turn += 1;
    for (const pId of Object.keys(this.session.players)) {
      this.session.players[pId].actionPoints = this.session.players[pId].maxActionPoints;
    }
    this.moveAllNpcs();
  }
}
