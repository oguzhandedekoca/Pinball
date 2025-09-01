"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Chip,
} from "@nextui-org/react";
import {
  Users,
  Gamepad2,
  Plus,
  Search,
  Play,
  Users2,
  Clock,
} from "lucide-react";
import { useUser } from "../providers";
import { database } from "../firebase/config";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  setDoc,
} from "firebase/firestore";
import { GameRoom } from "../types";

export default function MultiplayerPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomName, setRoomName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    // Oyun odalarını dinle
    const unsubscribe = onSnapshot(
      collection(database, "gameRooms"),
      (snapshot) => {
        const roomsData: GameRoom[] = [];
        snapshot.forEach((doc) => {
          roomsData.push({ id: doc.id, ...doc.data() } as GameRoom);
        });
        setRooms(roomsData);
        setLoading(false);
      },
      (error) => {
        console.error("Oda dinleme hatası:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, router]);

  const createRoom = async () => {
    if (!roomName.trim() || !currentUser) return;

    try {
      const newRoom: Omit<GameRoom, "id"> = {
        name: roomName.trim(),
        status: "waiting",
        players: {
          player1: {
            id: currentUser.uid,
            username: currentUser.displayName || currentUser.email || "Oyuncu",
            team: 1,
            isReady: true,
            lastSeen: new Date(),
          },
        },
        maxPlayers: 2,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(database, "gameRooms"), newRoom);

      // Odaya katıl
      router.push(`/multiplayer/game/${docRef.id}`);
    } catch (error) {
      console.error("Oda oluşturma hatası:", error);
    }
  };

  const joinRoom = async (room: GameRoom) => {
    if (!currentUser || room.players.player2) return;

    try {
      const roomRef = doc(database, "gameRooms", room.id);

      // setDoc ile merge seçeneği kullanarak güncelle
      await setDoc(
        roomRef,
        {
          players: {
            ...room.players,
            player2: {
              id: currentUser.uid,
              username:
                currentUser.displayName || currentUser.email || "Oyuncu",
              team: 2,
              isReady: true,
              lastSeen: new Date(),
            },
          },
          status: "playing",
        },
        { merge: true }
      );

      // Odaya katıl
      router.push(`/multiplayer/game/${room.id}`);
    } catch (error) {
      console.error("Odaya katılma hatası:", error);

      // Kullanıcıya hata mesajı göster
      alert("Odaya katılırken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      room.status === "waiting"
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="w-full backdrop-blur-md bg-white/10 border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <Gamepad2 className="text-white" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Multiplayer Langırt
            </h1>
          </div>
          <Button
            color="primary"
            variant="flat"
            onPress={() => router.push("/dashboard")}
            startContent={<Users2 size={20} />}
          >
            Dashboard&apos;a Dön
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Oda Oluştur */}
        <Card className="mb-6 backdrop-blur-md bg-white/10 border border-white/20">
          <CardHeader>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Plus size={24} />
              Yeni Oda Oluştur
            </h2>
          </CardHeader>
          <CardBody>
            <div className="flex gap-4">
              <Input
                placeholder="Oda adı girin..."
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="flex-1"
                classNames={{
                  input: "text-white",
                  inputWrapper: "bg-white/10 border-white/20",
                }}
              />
              <Button
                color="primary"
                onPress={createRoom}
                isLoading={false} // Removed creatingRoom state
                startContent={<Plus size={20} />}
              >
                Oda Oluştur
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Oda Ara */}
        <Card className="mb-6 backdrop-blur-md bg-white/10 border border-white/20">
          <CardHeader>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Search size={24} />
              Oda Ara
            </h2>
          </CardHeader>
          <CardBody>
            <Input
              placeholder="Oda adı ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Search size={20} />}
              classNames={{
                input: "text-white",
                inputWrapper: "bg-white/10 border-white/20",
              }}
            />
          </CardBody>
        </Card>

        {/* Mevcut Odalar */}
        <Card className="backdrop-blur-md bg-white/10 border border-white/20">
          <CardHeader>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users size={24} />
              Mevcut Odalar ({filteredRooms.length})
            </h2>
          </CardHeader>
          <CardBody>
            {filteredRooms.length === 0 ? (
              <div className="text-center text-white/60 py-8">
                <Users2 size={48} className="mx-auto mb-4 opacity-50" />
                <p>Henüz oda bulunmuyor. İlk odayı sen oluştur!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredRooms.map((room) => (
                  <Card
                    key={room.id}
                    className="bg-white/5 border border-white/10"
                  >
                    <CardBody>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                            <Gamepad2 className="text-white" size={24} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {room.name}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-white/60">
                              <span className="flex items-center gap-1">
                                <Users size={16} />
                                {Object.keys(room.players).length}/
                                {room.maxPlayers}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={16} />
                                {new Date(room.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Chip color="warning" variant="flat">
                            Bekleniyor
                          </Chip>
                          <Button
                            color="success"
                            variant="flat"
                            onPress={() => joinRoom(room)}
                            startContent={<Play size={20} />}
                            isDisabled={!!room.players.player2}
                          >
                            Katıl
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
