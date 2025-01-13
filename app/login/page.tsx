'use client';
import { useState } from 'react';
import { database } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Input, Button, Card, CardBody, CardHeader } from "@nextui-org/react";
import { Trophy, Users, Table2, Timer, Gamepad2 } from 'lucide-react';
import { useUser } from '../providers';

export default function Login() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setCurrentUser } = useUser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsLoading(true);
      try {
        const docRef = await addDoc(collection(database, 'users'), {
          username: username,
          loginTime: new Date().toISOString(),
          role: 'player1'
        });

        setCurrentUser(username);
        router.push(`/dashboard?player1=${username}`);
      } catch (error) {
        console.error("Giriş hatası:", error);
        alert("Giriş yapılırken bir hata oluştu!");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header */}
      <div className="w-full bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <Table2 className="text-blue-600 mr-2" size={32} />
          <h1 className="text-2xl md:text-3xl font-bold text-blue-600">
            Langırt Randevu Sistemi
          </h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 gap-8 max-w-7xl mx-auto">
        {/* Sol taraf - Bilgi Kartları */}
        <div className="w-full md:w-1/2 space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 text-center md:text-left mb-6">
            Hoş Geldiniz! 👋
          </h2>
          
          {/* Bilgi Kartları */}
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardBody className="flex items-center gap-4 p-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Trophy size={24} />
              </div>
              <div>
                <p className="font-semibold">Arkadaşlarınla Rekabet Et</p>
                <p className="text-sm opacity-80">2v2 maçlar ile eğlenceli vakit geçir</p>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardBody className="flex items-center gap-4 p-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Timer size={24} />
              </div>
              <div>
                <p className="font-semibold">Kolay Rezervasyon</p>
                <p className="text-sm opacity-80">İstediğin saati seç ve hemen oynamaya başla</p>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardBody className="flex items-center gap-4 p-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <p className="font-semibold">Takımını Oluştur</p>
                <p className="text-sm opacity-80">Arkadaşlarınla takım ol ve maça başla</p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sağ taraf - Login Formu */}
        <div className="w-full md:w-1/2 max-w-md">
          <Card className="border-2 border-blue-100">
            <CardHeader className="flex gap-3 justify-center pb-0">
              <div className="flex flex-col items-center">
                <Gamepad2 size={40} className="text-blue-600 mb-2" />
                <h1 className="text-xl font-bold text-gray-800">Oyuncu Girişi</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Hemen giriş yap ve maç programı oluştur
                </p>
              </div>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Oyuncu adını gir"
                  variant="bordered"
                  labelPlacement="outside"
                  startContent={
                    <Users className="text-gray-400" size={18} />
                  }
                  required
                />
                <Button
                  type="submit"
                  color="primary"
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600"
                  size="lg"
                  isLoading={isLoading}
                >
                  {isLoading ? "Giriş Yapılıyor..." : "Hemen Başla"}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-white mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 text-center text-sm text-gray-500">
          © 2024 Langırt Randevu Sistemi. Tüm hakları saklıdır.
        </div>
      </div>
    </div>
  );
} 