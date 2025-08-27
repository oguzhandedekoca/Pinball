"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Chip } from "@nextui-org/react";
import { Users, Gamepad2, ArrowLeft, Trophy, Users2 } from "lucide-react";
import { useUser } from "../../../providers";
import { auth, database, realtimeDatabase } from "../../../firebase/config";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import {
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp,
} from "firebase/database";
import { GameRoom, GamePlayer, GameState } from "../../../types";
import { PinballGame } from "../../../components/PinballGame";

export default function MultiplayerGamePage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useUser();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myTeam, setMyTeam] = useState<1 | 2 | null>(null);
  const [opponent, setOpponent] = useState<GamePlayer | null>(null);

  const gameStateRef = useRef<GameState | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!currentUser || !roomId) {
      router.push("/multiplayer");
      return;
    }

    // Oda bilgilerini dinle
    const unsubscribeRoom = onSnapshot(
      doc(database, "gameRooms", roomId),
      (doc) => {
        if (doc.exists()) {
          const roomData = { id: doc.id, ...doc.data() } as GameRoom;
          setRoom(roomData);

          // Hangi takımda olduğumu belirle
          if (roomData.players.player1?.id === currentUser.uid) {
            setMyTeam(1);
            setOpponent(roomData.players.player2 || null);
          } else if (roomData.players.player2?.id === currentUser.uid) {
            setMyTeam(2);
            setOpponent(roomData.players.player1 || null);
          }

          setLoading(false);
        } else {
          router.push("/multiplayer");
        }
      },
      (error) => {
        console.error("Oda dinleme hatası:", error);
        router.push("/multiplayer");
      }
    );

    // Oyun durumunu dinle
    const gameStateRef = ref(realtimeDatabase, `games/${roomId}/gameState`);
    const unsubscribeGame = onValue(gameStateRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setGameState(data);
        gameStateRef.current = data;
      }
    });

    // Oyuncu online durumunu güncelle
    const playerStatusRef = ref(
      realtimeDatabase,
      `games/${roomId}/players/${currentUser.uid}`
    );
    set(playerStatusRef, {
      online: true,
      lastSeen: serverTimestamp(),
      team: myTeam,
    });

    // Oyuncu offline olduğunda durumu güncelle
    onDisconnect(playerStatusRef).set({
      online: false,
      lastSeen: serverTimestamp(),
    });

    return () => {
      unsubscribeRoom();
      unsubscribeGame();
    };
  }, [currentUser, roomId, router, myTeam]);

  const leaveRoom = async () => {
    if (!room || !currentUser) return;

    try {
      // Oda durumunu güncelle
      const roomRef = doc(database, "gameRooms", roomId);
      if (myTeam === 1) {
        await updateDoc(roomRef, {
          "players.player1": null,
          status: room.players.player2 ? "waiting" : "finished",
        });
      } else if (myTeam === 2) {
        await updateDoc(roomRef, {
          "players.player2": null,
          status: "waiting",
        });
      }

      router.push("/multiplayer");
    } catch (error) {
      console.error("Odadan çıkma hatası:", error);
    }
  };

  const updateGameState = (newGameState: Partial<GameState>) => {
    if (!roomId || !myTeam) return;

    const now = Date.now();
    // Çok sık güncelleme yapmayı önle (100ms)
    if (now - lastUpdateRef.current < 100) return;
    lastUpdateRef.current = now;

    const gameRef = ref(realtimeDatabase, `games/${roomId}/gameState`);
    set(gameRef, {
      ...gameStateRef.current,
      ...newGameState,
      lastUpdated: serverTimestamp(),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Oyun yükleniyor...</div>
      </div>
    );
  }

  if (!room || !myTeam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Oda bulunamadı</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="w-full backdrop-blur-md bg-white/10 border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              color="primary"
              variant="flat"
              onPress={leaveRoom}
              startContent={<ArrowLeft size={20} />}
            >
              Odadan Çık
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Gamepad2 className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{room.name}</h1>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Chip
                    color={room.status === "playing" ? "success" : "warning"}
                    variant="flat"
                    size="sm"
                  >
                    {room.status === "playing" ? "Oynanıyor" : "Bekleniyor"}
                  </Chip>
                  <span className="flex items-center gap-1">
                    <Users size={16} />
                    {
                      Object.keys(room.players).filter((p) => room.players[p])
                        .length
                    }
                    /2
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-sm text-white/60">Senin Takımın</div>
              <Chip color={myTeam === 1 ? "primary" : "danger"} variant="flat">
                {myTeam === 1 ? "🔵 Mavi" : "🔴 Kırmızı"}
              </Chip>
            </div>
            {opponent && (
              <div className="text-center">
                <div className="text-sm text-white/60">Rakip</div>
                <div className="text-white font-medium">
                  {opponent.username}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {room.status === "waiting" ? (
          <Card className="backdrop-blur-md bg-white/10 border border-white/20">
            <CardBody className="text-center py-12">
              <Users2 size={64} className="mx-auto mb-4 text-white/60" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Rakip Bekleniyor
              </h2>
              <p className="text-white/60 mb-6">
                {opponent
                  ? "Rakip hazırlanıyor..."
                  : "Başka bir oyuncu odaya katılsın"}
              </p>
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <div className="text-sm text-white/60">Sen</div>
                  <Chip color="primary" variant="flat">
                    {myTeam === 1 ? "🔵 Mavi Takım" : "🔴 Kırmızı Takım"}
                  </Chip>
                </div>
                {opponent && (
                  <div className="text-center">
                    <div className="text-sm text-white/60">Rakip</div>
                    <Chip color="danger" variant="flat">
                      {myTeam === 1 ? "🔴 Kırmızı Takım" : "🔵 Mavi Takım"}
                    </Chip>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Skor Tablosu */}
            <Card className="backdrop-blur-md bg-white/10 border border-white/20">
              <CardBody>
                <div className="flex justify-center items-center gap-8">
                  <div className="text-center">
                    <div className="text-sm text-white/60 mb-2">Mavi Takım</div>
                    <div className="text-3xl font-bold text-blue-400">
                      {gameState?.scores?.player1 || 0}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white">-</div>
                  <div className="text-center">
                    <div className="text-sm text-white/60 mb-2">
                      Kırmızı Takım
                    </div>
                    <div className="text-3xl font-bold text-red-400">
                      {gameState?.scores?.player2 || 0}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Oyun Alanı */}
            <Card className="backdrop-blur-md bg-white/10 border border-white/20">
              <CardBody>
                <PinballGame
                  multiplayer={true}
                  myTeam={myTeam}
                  onGameStateUpdate={updateGameState}
                  gameState={gameState}
                />
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
