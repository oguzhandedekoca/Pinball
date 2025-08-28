"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, CardBody, Chip } from "@nextui-org/react";
import { Users, Gamepad2, ArrowLeft, Users2, Play } from "lucide-react";
import { useUser } from "../../../providers";
import { database, realtimeDatabase } from "../../../firebase/config";
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

  const localGameStateRef = useRef<GameState | null>(null);
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
          console.log("🏠 Oda bilgileri güncellendi:", {
            roomId: roomData.id,
            status: roomData.status,
            players: roomData.players,
            currentUser: currentUser?.uid,
          });

          setRoom(roomData);

          // Hangi takımda olduğumu belirle
          if (roomData.players.player1?.id === currentUser.uid) {
            setMyTeam(1);
            setOpponent(roomData.players.player2 || null);
            console.log("🔵 Mavi takım (player1) olarak ayarlandı");
          } else if (roomData.players.player2?.id === currentUser.uid) {
            setMyTeam(2);
            setOpponent(roomData.players.player1 || null);
            console.log("🔴 Kırmızı takım (player2) olarak ayarlandı");
          }

          setLoading(false);
        } else {
          console.log(
            "❌ Oda bulunamadı, multiplayer sayfasına yönlendiriliyor"
          );
          router.push("/multiplayer");
        }
      },
      (error) => {
        console.error("❌ Oda dinleme hatası:", error);
        router.push("/multiplayer");
      }
    );

    // Oyun durumunu dinle
    const gameStateRef = ref(realtimeDatabase, `games/${roomId}/gameState`);
    console.log("🔍 Oyun durumu dinleniyor:", {
      roomId,
      fullPath: `games/${roomId}/gameState`,
      realtimeDatabase: realtimeDatabase.app.name,
      currentUser: currentUser?.uid,
      myTeam,
    });

    const unsubscribeGame = onValue(gameStateRef, (snapshot) => {
      console.log("📡 Realtime Database'den veri geldi:", {
        exists: snapshot.exists(),
        key: snapshot.key,
        ref: snapshot.ref.toString(),
        timestamp: new Date().toISOString(),
        myTeam,
        currentUser: currentUser?.uid,
      });

      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log("🎮 Oyun durumu alındı:", data);
        console.log("📊 Mevcut local state:", gameState);
        console.log("👤 Benim takımım:", myTeam);

        // Sadece farklıysa güncelle (gereksiz re-render'ları önle)
        const currentStateString = JSON.stringify(gameState);
        const newStateString = JSON.stringify(data);

        if (currentStateString !== newStateString) {
          console.log("🔄 Oyun durumu değişti, güncelleniyor...");
          setGameState(data);
          localGameStateRef.current = data;
        } else {
          console.log("📋 Oyun durumu aynı, güncelleme yapılmıyor");
        }

        // Eğer oyun başlatılıyorsa, oda durumunu da güncelle (sadece gerektiğinde)
        if (data.isPlaying && room && room.status !== "playing") {
          const roomRef = doc(database, "gameRooms", roomId);
          updateDoc(roomRef, {
            status: "playing",
          })
            .then(() => {
              console.log("🏠 Oda durumu otomatik olarak 'playing' yapıldı");
            })
            .catch((error) => {
              console.error("❌ Oda durumu güncellenemedi:", error);
            });
        }

        // Debug: Oyun durumu değişikliklerini takip et
        if (data.isPlaying) {
          console.log("🎮 OYUN BAŞLADI! Her iki oyuncu da oyunda olmalı!", {
            player1Score: data.player1Score || data.scores?.player1 || 0,
            player2Score: data.player2Score || data.scores?.player2 || 0,
            ballPosition: data.ball,
          });
        } else {
          console.log("⏸️ Oyun durdu veya henüz başlamadı");
        }
      } else {
        console.log("📭 Henüz oyun durumu yok - ilk oyun durumu oluşturulacak");
        // Eğer veri yoksa ve 1. oyuncuysa, varsayılan oyun durumunu oluştur
        if (myTeam === 1) {
          console.log(
            "🎯 1. oyuncu olarak varsayılan oyun durumu oluşturuluyor..."
          );
          const defaultGameState: GameState = {
            isPlaying: false,
            player1Score: 0,
            player2Score: 0,
            winner: null,
            scores: {
              player1: 0,
              player2: 0,
            },
            ball: {
              x: 400,
              y: 300,
              vx: 0,
              vy: 0,
            },
            lastUpdated: new Date(),
          };

          updateGameState(defaultGameState).catch((error) => {
            console.error("❌ Varsayılan oyun durumu oluşturulamadı:", error);
          });
        }
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

  const updateGameState = async (newGameState: Partial<GameState>) => {
    if (!roomId) return;

    const now = Date.now();
    // Çok sık güncelleme yapmayı önle (50ms) - Daha responsive tracking için
    if (now - lastUpdateRef.current < 50) return;
    lastUpdateRef.current = now;

    try {
      console.log("🚀 updateGameState çağrıldı:", {
        roomId,
        myTeam,
        newGameState,
        currentTime: now,
      });

      // Mevcut oyun durumu ile birleştir
      const currentState = localGameStateRef.current || gameState || {};
      const updatedGameState = {
        ...currentState,
        ...newGameState,
        lastUpdated: serverTimestamp(),
      };

      console.log("📊 Birleştirilmiş oyun durumu:", updatedGameState);

      // Realtime Database'e kaydet
      const gameRef = ref(realtimeDatabase, `games/${roomId}/gameState`);
      console.log("💾 Realtime Database'e yazılıyor:", {
        roomId,
        fullPath: `games/${roomId}/gameState`,
        realtimeDatabase: realtimeDatabase.app.name,
        data: updatedGameState,
      });

      await set(gameRef, updatedGameState);
      console.log("✅ Realtime Database'e yazıldı:", gameRef.toString());

      // Local state'i güncelle
      setGameState(updatedGameState as GameState);
      localGameStateRef.current = updatedGameState as GameState;

      console.log("🔄 Oyun durumu güncellendi:", newGameState);
    } catch (error) {
      console.error("❌ Oyun durumu güncelleme hatası:", error);
      throw error;
    }
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
                      Object.keys(room.players).filter(
                        (p) => room.players[p as keyof typeof room.players]
                      ).length
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
        {!opponent ? (
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
            {/* Oyun Kontrolleri */}
            {myTeam === 1 && !gameState?.isPlaying && opponent && (
              <Card className="backdrop-blur-md bg-white/10 border border-white/20">
                <CardBody className="text-center py-6">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Oyunu Başlat
                  </h3>
                  <Button
                    color="success"
                    size="lg"
                    onPress={async () => {
                      try {
                        console.log("🎮 Oyun başlatılıyor...");
                        console.log("🔍 Debug bilgileri:", {
                          roomId,
                          myTeam,
                          roomStatus: room?.status,
                          currentUser: currentUser?.uid,
                        });

                        // Tamamen yeni bir oyun durumu oluştur
                        const newGameState: GameState = {
                          isPlaying: true,
                          player1Score: 0,
                          player2Score: 0,
                          winner: null,
                          scores: {
                            player1: 0,
                            player2: 0,
                          },
                          ball: {
                            x: 400,
                            y: 300,
                            vx: 0,
                            vy: 0,
                          },
                          lastUpdated: new Date(),
                        };

                        console.log("🆕 Yeni oyun durumu:", newGameState);

                        // Önce Realtime Database'e kaydet
                        console.log("📡 updateGameState çağrılıyor...");
                        await updateGameState(newGameState);
                        console.log("✅ updateGameState tamamlandı!");

                        // Sonra local state'i güncelle
                        setGameState(newGameState);
                        localGameStateRef.current = newGameState;

                        console.log("✅ Oyun başarıyla başlatıldı!");

                        // Oda durumunu da güncelle (eğer zaten playing değilse)
                        if (room && room.status !== "playing") {
                          const roomRef = doc(database, "gameRooms", roomId);
                          await updateDoc(roomRef, {
                            status: "playing",
                          });
                          console.log(
                            "🏠 Oda durumu 'playing' olarak güncellendi"
                          );
                        }

                        // 2. oyuncuya bildirim gönder
                        console.log(
                          "📢 2. oyuncuya oyun başlatma bildirimi gönderildi"
                        );
                      } catch (error) {
                        console.error("❌ Oyun başlatma hatası:", error);
                        alert("Oyun başlatılırken bir hata oluştu!");
                      }
                    }}
                    startContent={<Play size={20} />}
                  >
                    Oyunu Başlat
                  </Button>
                </CardBody>
              </Card>
            )}

            {/* Oyun Durumu Bilgisi */}
            {gameState?.isPlaying && (
              <Card className="backdrop-blur-md bg-green-500/20 border border-green-500/30">
                <CardBody className="text-center py-4">
                  <h3 className="text-lg font-bold text-green-400">
                    🎮 Oyun Devam Ediyor!
                  </h3>
                  <p className="text-green-300 text-sm">
                    Her iki oyuncu da oyunda! Gerçek zamanlı oynayın.
                  </p>
                </CardBody>
              </Card>
            )}

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
