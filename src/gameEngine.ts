// ============================================================================
// SUPER CLUEDO : ÉDITION MUSÉE (V2) — MOTEUR MÉTIER
// ============================================================================

export type Wing = 'HQ' | 'WEST' | 'EAST';
export type Gender = 'M' | 'F';
export type Status = 'EMPLOYEE' | 'VISITOR';
export type RoleId = 'VETERAN' | 'PROFILER' | 'FORENSIC' | 'NEGOTIATOR' | 'GEEK';
export type MatrixColumn = 'GENDER' | 'STATUS' | 'TITLE' | 'LETTER_O';
export type TriState = 'NSP' | 'YES' | 'NO';
export type GamePhase = 'LOBBY' | 'INVESTIGATION' | 'MANHUNT' | 'VICTORY' | 'DEFEAT';
export type ActionType = 'MOVE' | 'SEARCH' | 'INTERROGATE' | 'ANALYZE' | 'ACCUSE' | 'ARREST';

export interface RoomConfig {
  id: number;
  name: string;
  wing: Wing;
  adjacentRooms: number[];
  crossingId: string | null;
}

export interface Suspect {
  id: string;
  name: string;
  gender: Gender;
  status: Status;
  hasTitle: boolean;
  hasLetterO: boolean;
}

export interface Weapon {
  id: string;
  name: string;
  woundSignature: string;
}

export interface ClueStage {
  stageNumber: number;
  type: string;
  rawText: string;
  unlockColumn?: MatrixColumn;
}

export interface Motive {
  id: string;
  name: string;
  stages: ClueStage[];
}

export interface ZoneState {
  contentType: 'WEAPON' | 'MOTIVE_CLUE' | 'DECOY_CLUE' | 'EMPTY';
  itemId: string | null;
  stageNumber?: number;
  isSearched: boolean;
  cumulativeSearchScore: number;
  isAnalyzed: boolean;
  isDestroyed: boolean;
}

export interface RoomState {
  id: number;
  isVisited: boolean;
  npcIds: string[];
  zones: {
    A: ZoneState;
    B: ZoneState;
  };
}

export interface NpcMovementRecord {
  npcId: string;
  initialRoomId: number;
  finalRoomId: number;
  path: number[];
}

export interface PlayerState {
  id: string;
  name: string;
  roleId: RoleId;
  currentRoomId: number;
  remainingAP: number;
  rerollUsedThisTurn: boolean;
}

export interface PendingAction {
  id: string;
  playerId: string;
  playerName: string;
  roleId: RoleId;
  actionType: ActionType;
  targetRoomId?: number;
  targetZone?: 'A' | 'B';
  targetNpcId?: string;
  accusationPayload?: {
    killerId: string;
    weaponId: string;
    roomId: number;
    motiveId: string;
  };
  rawDiceRoll: number;
  secretGmVerdict: string;
  isCriticalAlert: boolean;
}

export interface ManhuntState {
  isActive: boolean;
  killerCurrentRoomId: number;
  roomsTraversedCount: number;
  maxRoomsAllowed: number;
  visitedHistory: number[];
  isHoldingPosition: boolean;
  lastLog: string;
}

export interface UnifiedGameSession {
  sessionId: string;
  phase: GamePhase;
  turnNumber: number;
  turnOrder: string[];
  activePlayerId: string;
  geekTimerEndTimestamp: number | null;
  secretSolution: {
    killerId: string;
    weaponId: string;
    crimeSceneRoomId: number;
    motiveId: string;
    crimeWing: 'WEST' | 'EAST';
  };
  players: Record<string, PlayerState>;
  roomsState: Record<number, RoomState>;
  npcMovements: Record<string, NpcMovementRecord>;
  nextMotiveStageToDistribute: number;
  notebook: {
    visibleColumns: Record<MatrixColumn, boolean>;
    discoveredSuspectIds: string[];
    playerNotes: Record<string, Record<MatrixColumn, TriState>>;
    eliminatedSuspectIds: string[];
    publicCluesLog: { turn: number; text: string }[];
  };
  pendingAction: PendingAction | null;
  manhunt: ManhuntState;
}

export const MUSEUM_ROOMS: RoomConfig[] = [
  { id: 0, name: 'QG Central (Surveillance)', wing: 'HQ', adjacentRooms: [6, 7, 8, 9, 10], crossingId: null },
  { id: 1, name: 'Galerie des Antiques', wing: 'WEST', adjacentRooms: [5, 2, 6], crossingId: 'T1' },
  { id: 2, name: 'Salon des Horloges', wing: 'WEST', adjacentRooms: [1, 3, 7], crossingId: 'T5' },
  { id: 3, name: 'Salle des Armures', wing: 'WEST', adjacentRooms: [2, 4, 8], crossingId: 'T2' },
  { id: 4, name: 'Cabinet des Estampes', wing: 'WEST', adjacentRooms: [3, 5, 9], crossingId: 'T3' },
  { id: 5, name: 'Rotonde Renaissance', wing: 'WEST', adjacentRooms: [4, 1, 10], crossingId: 'T4' },
  { id: 6, name: 'Verrière Contemporaine', wing: 'EAST', adjacentRooms: [10, 7, 1, 0], crossingId: 'T1' },
  { id: 7, name: 'Salle des Joyaux', wing: 'EAST', adjacentRooms: [6, 8, 2, 0], crossingId: 'T5' },
  { id: 8, name: 'Réserve Technique', wing: 'EAST', adjacentRooms: [7, 9, 3, 0], crossingId: 'T2' },
  { id: 9, name: 'Bibliothèque Historique', wing: 'EAST', adjacentRooms: [8, 10, 4, 0], crossingId: 'T3' },
  { id: 10, name: 'Galerie des Donateurs', wing: 'EAST', adjacentRooms: [9, 6, 5, 0], crossingId: 'T4' },
];

export const SUSPECTS: Suspect[] = [
  { id: 'S1', name: 'Éléonore Vance', gender: 'F', status: 'EMPLOYEE', hasTitle: true, hasLetterO: true },
  { id: 'S2', name: 'Victor Moreau', gender: 'M', status: 'VISITOR', hasTitle: false, hasLetterO: true },
  { id: 'S3', name: 'Dr. Claire Sterling', gender: 'F', status: 'EMPLOYEE', hasTitle: true, hasLetterO: false },
  { id: 'S4', name: 'Arthur Pendelton', gender: 'M', status: 'VISITOR', hasTitle: false, hasLetterO: true },
  { id: 'S5', name: 'Comtesse Léa de Valois', gender: 'F', status: 'VISITOR', hasTitle: true, hasLetterO: true },
  { id: 'S6', name: 'Julien Mercier', gender: 'M', status: 'EMPLOYEE', hasTitle: false, hasLetterO: false },
  { id: 'S7', name: 'Camille Laurent', gender: 'F', status: 'VISITOR', hasTitle: false, hasLetterO: false },
  { id: 'S8', name: 'Prof. Henri Beaumont', gender: 'M', status: 'EMPLOYEE', hasTitle: true, hasLetterO: true },
  { id: 'S9', name: 'Inès Benali', gender: 'F', status: 'EMPLOYEE', hasTitle: false, hasLetterO: false },
  { id: 'S10', name: 'Baron Maxence K.', gender: 'M', status: 'VISITOR', hasTitle: true, hasLetterO: false },
];

export const WEAPONS: Weapon[] = [
  { id: 'W1', name: 'Dague cérémonielle', woundSignature: 'Incision nette à lame étroite' },
  { id: 'W2', name: 'Statuette en bronze', woundSignature: 'Traumatisme crânien contondant' },
  { id: 'W3', name: 'Cordon de velours', woundSignature: 'Sillon de strangulation fibreux' },
  { id: 'W4', name: 'Scalpel de restauration', woundSignature: 'Coupure chirurgicale ultra-fine' },
  { id: 'W5', name: 'Chandelier en argent', woundSignature: 'Impact lourd circulaire' },
  { id: 'W6', name: 'Fiole de cyanure', woundSignature: 'Odeur d’amande amère' },
  { id: 'W7', name: 'Pistolet à silex', woundSignature: 'Brûlures de poudre noire' },
  { id: 'W8', name: 'Serre-livres en marbre', woundSignature: 'Fracture angulaire' },
  { id: 'W9', name: 'Aiguille à tapisserie', woundSignature: 'Piqûre profonde' },
  { id: 'W10', name: 'Marteau de commissaire-priseur', woundSignature: 'Contusion nette' },
];

export const MOTIVES: Motive[] = [
  {
    id: 'M1_THEFT',
    name: 'Le Vol',
    stages: [
      { stageNumber: 1, type: 'LIGHT_1', rawText: 'Poussière de fibre synthétique sur une vitrine.' },
      { stageNumber: 2, type: 'LIGHT_2', rawText: 'Catalogue d’enchères annoté au crayon rouge.' },
      { stageNumber: 3, type: 'NOTE_ORIENTATION', rawText: 'Note : "L’acheteur s’impatiente, la pièce doit sortir ce soir."' },
      { stageNumber: 4, type: 'MATRIX_REVELATION', rawText: 'Bordereau : le suspect porte un titre officiel.', unlockColumn: 'TITLE' },
      { stageNumber: 5, type: 'MOBILE_CONFIRMATION', rawText: 'Mobile officiel confirmé : Le Vol.' },
      { stageNumber: 6, type: 'SILENT_ALARM', rawText: 'Alarme silencieuse : effraction dans l’aile du crime.' },
    ],
  },
  {
    id: 'M2_PASSION',
    name: 'Crime Passionnel',
    stages: [
      { stageNumber: 1, type: 'LIGHT_1', rawText: 'Parfum rare imprégné sur un fauteuil.' },
      { stageNumber: 2, type: 'LIGHT_2', rawText: 'Verre de cocktail contenant des traces de sédatif.' },
      { stageNumber: 3, type: 'NOTE_ORIENTATION', rawText: 'Lettre déchirée : "...tu as choisi un autre."' },
      { stageNumber: 4, type: 'MATRIX_REVELATION', rawText: 'Mouchoir brodé : le genre est déterminant.', unlockColumn: 'GENDER' },
      { stageNumber: 5, type: 'MOBILE_CONFIRMATION', rawText: 'Mobile officiel confirmé : Crime Passionnel.' },
      { stageNumber: 6, type: 'SILENT_ALARM', rawText: 'Alarme silencieuse : capteur de choc déclenché.' },
    ],
  },
  {
    id: 'M3_BLACKMAIL',
    name: 'Le Chantage',
    stages: [
      { stageNumber: 1, type: 'LIGHT_1', rawText: 'Clé USB cryptée sous un socle.' },
      { stageNumber: 2, type: 'LIGHT_2', rawText: 'Enveloppe kraft avec traces bancaires.' },
      { stageNumber: 3, type: 'NOTE_ORIENTATION', rawText: 'Note : "Signez le transfert avant minuit."' },
      { stageNumber: 4, type: 'MATRIX_REVELATION', rawText: 'Badge partiel : vérifiez le statut.', unlockColumn: 'STATUS' },
      { stageNumber: 5, type: 'MOBILE_CONFIRMATION', rawText: 'Mobile officiel confirmé : Le Chantage.' },
      { stageNumber: 6, type: 'SILENT_ALARM', rawText: 'Alarme silencieuse : ouverture forcée signalée.' },
    ],
  },
  {
    id: 'M4_REVENGE',
    name: 'Vengeance Professionnelle',
    stages: [
      { stageNumber: 1, type: 'LIGHT_1', rawText: 'Badge d’accès forcé mécaniquement.' },
      { stageNumber: 2, type: 'LIGHT_2', rawText: 'Résidus de solvant sur un rapport d’audit.' },
      { stageNumber: 3, type: 'NOTE_ORIENTATION', rawText: 'Avis de rétrogradation : "Incompétence notoire."' },
      { stageNumber: 4, type: 'MATRIX_REVELATION', rawText: 'Initiale gravée : surveillez la lettre O.', unlockColumn: 'LETTER_O' },
      { stageNumber: 5, type: 'MOBILE_CONFIRMATION', rawText: 'Mobile officiel confirmé : Vengeance.' },
      { stageNumber: 6, type: 'SILENT_ALARM', rawText: 'Alarme silencieuse : sabotage détecté.' },
    ],
  },
];

export class SuperCluedoEngine {
  private session: UnifiedGameSession;

  constructor(sessionCode: string, initialPlayers: { id: string; name: string; roleId: RoleId }[]) {
    this.session = this.createNewSession(sessionCode, initialPlayers);
  }

  public getSession(): UnifiedGameSession {
    return structuredClone(this.session);
  }

  private createNewSession(
    sessionId: string,
    playerConfigs: { id: string; name: string; roleId: RoleId }[]
  ): UnifiedGameSession {
    const killer = this.pickRandom(SUSPECTS);
    const weapon = this.pickRandom(WEAPONS);
    const crimeRoomId = Math.floor(Math.random() * 10) + 1;
    const motive = this.pickRandom(MOTIVES);
    const crimeRoomConfig = MUSEUM_ROOMS.find((r) => r.id === crimeRoomId)!;

    const roomsState: Record<number, RoomState> = {};
    for (const r of MUSEUM_ROOMS) {
      roomsState[r.id] = {
        id: r.id,
        isVisited: r.id === 0,
        npcIds: [],
        zones: { A: this.createEmptyZone(), B: this.createEmptyZone() },
      };
    }

    const shuffledSuspects = this.shuffle(SUSPECTS);
    const initialRoomByNpc: Record<string, number> = {};
    const slots = this.shuffle([1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10]).slice(0, 10);
    shuffledSuspects.forEach((s, i) => (initialRoomByNpc[s.id] = slots[i]));

    const npcMovements: Record<string, NpcMovementRecord> = {};
    shuffledSuspects.forEach((s) => {
      const start = initialRoomByNpc[s.id];
      roomsState[start].npcIds.push(s.id);
      npcMovements[s.id] = { npcId: s.id, initialRoomId: start, finalRoomId: start, path: [start] };
    });

    const otherWeapons = this.shuffle(WEAPONS.filter((w) => w.id !== weapon.id));
    const otherRooms = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((id) => id !== crimeRoomId));
    const weaponByRoom: Record<number, Weapon> = { [crimeRoomId]: weapon };
    otherRooms.forEach((rId, idx) => (weaponByRoom[rId] = otherWeapons[idx]));

    const clueRooms = new Set(this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 6));

    for (let rId = 1; rId <= 10; rId++) {
      const wZone = Math.random() < 0.5 ? 'A' : 'B';
      const cZone = wZone === 'A' ? 'B' : 'A';
      roomsState[rId].zones[wZone].contentType = 'WEAPON';
      roomsState[rId].zones[wZone].itemId = weaponByRoom[rId].id;
      if (clueRooms.has(rId)) {
        roomsState[rId].zones[cZone].contentType = 'MOTIVE_CLUE';
        roomsState[rId].zones[cZone].itemId = motive.id;
      } else {
        roomsState[rId].zones[cZone].contentType = 'DECOY_CLUE';
        roomsState[rId].zones[cZone].itemId = 'DECOY';
      }
    }

    const players: Record<string, PlayerState> = {};
    const turnOrder = playerConfigs.map((p) => p.id);
    playerConfigs.forEach((p) => {
      players[p.id] = { id: p.id, name: p.name, roleId: p.roleId, currentRoomId: 0, remainingAP: 2, rerollUsedThisTurn: false };
    });

    const playerNotes: Record<string, Record<MatrixColumn, TriState>> = {};
    SUSPECTS.forEach((s) => {
      playerNotes[s.id] = { GENDER: 'NSP', STATUS: 'NSP', TITLE: 'NSP', LETTER_O: 'NSP' };
    });

    return {
      sessionId,
      phase: 'INVESTIGATION',
      turnNumber: 1,
      turnOrder,
      activePlayerId: turnOrder[0],
      geekTimerEndTimestamp: Date.now() + 600_000,
      secretSolution: {
        killerId: killer.id,
        weaponId: weapon.id,
        crimeSceneRoomId: crimeRoomId,
        motiveId: motive.id,
        crimeWing: crimeRoomConfig.wing as 'WEST' | 'EAST',
      },
      players,
      roomsState,
      npcMovements,
      nextMotiveStageToDistribute: 1,
      notebook: {
        visibleColumns: { GENDER: false, STATUS: false, TITLE: false, LETTER_O: false },
        discoveredSuspectIds: [],
        playerNotes,
        eliminatedSuspectIds: [],
        publicCluesLog: [],
      },
      pendingAction: null,
      manhunt: {
        isActive: false,
        killerCurrentRoomId: 0,
        roomsTraversedCount: 0,
        maxRoomsAllowed: 6,
        visitedHistory: [],
        isHoldingPosition: false,
        lastLog: '',
      },
    };
  }

  public submitPlayerAction(payload: Omit<PendingAction, 'id' | 'secretGmVerdict' | 'isCriticalAlert'>): void {
    const player = this.session.players[payload.playerId];
    if (!player || player.id !== this.session.activePlayerId) throw new Error('Ce n’est pas le tour de ce joueur.');
    if (player.remainingAP <= 0) throw new Error('Plus de PA disponibles.');

    const { verdict, isCritical } = this.computeSecretGmVerdict(payload);
    this.session.pendingAction = {
      ...payload,
      id: `ACT_${Date.now()}`,
      secretGmVerdict: verdict,
      isCriticalAlert: isCritical,
    };
  }

  private computeSecretGmVerdict(payload: Omit<PendingAction, 'id' | 'secretGmVerdict' | 'isCriticalAlert'>): { verdict: string; isCritical: boolean } {
    const roll = payload.rawDiceRoll;
    switch (payload.actionType) {
      case 'MOVE':
        return { verdict: `Déplacement vers la Salle ${payload.targetRoomId}.`, isCritical: false };
      case 'SEARCH':
        return { verdict: `Fouille effectuée en Zone ${payload.targetZone}. Dé : ${roll}`, isCritical: false };
      case 'INTERROGATE':
        return { verdict: `Interrogatoire de ${payload.targetNpcId}. Dé : ${roll}`, isCritical: false };
      case 'ANALYZE':
        return { verdict: `Analyse en labo. Dé : ${roll}`, isCritical: false };
      case 'ACCUSE':
        return { verdict: `Accusation officielle enregistrée.`, isCritical: true };
      case 'ARREST':
        return { verdict: `Tentative d'interpellation. Dé : ${roll}`, isCritical: true };
    }
  }

  public approvePendingAction(): void {
    const action = this.session.pendingAction;
    if (!action) return;

    const player = this.session.players[action.playerId];
    player.remainingAP = Math.max(0, player.remainingAP - 1);

    if (action.actionType === 'MOVE' && action.targetRoomId !== undefined) {
      player.currentRoomId = action.targetRoomId;
      const room = this.session.roomsState[action.targetRoomId];
      room.isVisited = true;
      for (const npcId of room.npcIds) {
        if (!this.session.notebook.discoveredSuspectIds.includes(npcId)) {
          this.session.notebook.discoveredSuspectIds.push(npcId);
        }
      }
    }

    this.session.pendingAction = null;
    if (player.remainingAP === 0) {
      this.advanceTurn();
    }
  }

  private advanceTurn(): void {
    const currentIndex = this.session.turnOrder.indexOf(this.session.activePlayerId);
    const nextIndex = (currentIndex + 1) % this.session.turnOrder.length;
    if (nextIndex === 0) {
      this.session.turnNumber++;
      Object.values(this.session.players).forEach((p) => {
        p.remainingAP = 2;
      });
    }
    this.session.activePlayerId = this.session.turnOrder[nextIndex];
  }

  private createEmptyZone(): ZoneState {
    return {
      contentType: 'EMPTY',
      itemId: null,
      isSearched: false,
      cumulativeSearchScore: 0,
      isAnalyzed: false,
      isDestroyed: false,
    };
  }

  private pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}
