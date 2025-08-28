export interface PlayerData {
  player2: string;
  player3: string;
  player4: string;
  selectedTime?: string;
}

export interface TimeSlotData {
  createdBy?: string | null;
  player1: string;
  player2: string;
  player3: string;
  player4: string;
  selectedTime: string;
  selectedBox: number;
}

// Multiplayer Langırt Oyun Tipleri
export interface GameRoom {
  id: string;
  name: string;
  status: "waiting" | "playing" | "finished";
  players: {
    player1?: GamePlayer;
    player2?: GamePlayer;
  };
  maxPlayers: 2;
  createdAt: Date;
  gameState?: GameState;
}

export interface GamePlayer {
  id: string;
  username: string;
  team: 1 | 2; // 1: Mavi, 2: Kırmızı
  isReady: boolean;
  lastSeen: Date;
}

export interface GameState {
  isPlaying: boolean;
  player1Score: number;
  player2Score: number;
  winner: number | null;
  ball?: {
    x: number;
    y: number;
    vx: number;
    vy: number;
  };
  rods?: RodState[];
  rodPositions?: { x: number; y: number }[][];
  scores?: {
    player1: number;
    player2: number;
  };
  lastUpdated?: Date;
}

export interface RodState {
  rodIndex: number;
  players: {
    x: number;
    y: number;
    width: number;
    height: number;
    team: 1 | 2;
  }[];
}
