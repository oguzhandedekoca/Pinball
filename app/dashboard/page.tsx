'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input, Card, CardBody } from "@nextui-org/react";
import { database } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { collection, addDoc } from 'firebase/firestore';

interface PlayerData {
  player2: string;
  player3: string;
  player4: string;
  selectedTime?: string;
}

export default function Dashboard() {
  const searchParams = useSearchParams();
  const player1 = searchParams.get('player1');
  const [playerData, setPlayerData] = useState<PlayerData>({
    player2: '',
    player3: '',
    player4: '',
  });
  const [selectedBox, setSelectedBox] = useState<number | null>(null);

  const timeSlots = Array.from({ length: 9 }, (_, index) => {
    const baseTime = new Date();
    baseTime.setHours(9, 0, 0, 0);
    baseTime.setMinutes(baseTime.getMinutes() + (index * 15));
    return baseTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  });

  const handlePlayerDataChange = (field: keyof PlayerData, value: string) => {
    setPlayerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBoxSelection = async (boxIndex: number) => {
    setSelectedBox(boxIndex);
    if (player1) {
      try {
        await addDoc(collection(database, 'selections'), {
          player1: player1,
          ...playerData,
          selectedTime: timeSlots[boxIndex],
          selectedBox: boxIndex,
          selectionTime: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error saving selection:", error);
        alert("Seçim kaydedilirken bir hata oluştu!");
      }
    }
  };

  if (!player1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardBody>
            <p className="text-lg">Lütfen önce giriş yapın</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardBody>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="col-span-2">
                <h2 className="text-xl font-bold mb-2">Ana Oyuncu: {player1}</h2>
              </div>
              <Input
                label="2. Oyuncu"
                placeholder="İsim giriniz"
                value={playerData.player2}
                onChange={(e) => handlePlayerDataChange('player2', e.target.value)}
                variant="bordered"
                labelPlacement="outside"
              />
              <Input
                label="3. Oyuncu"
                placeholder="İsim giriniz"
                value={playerData.player3}
                onChange={(e) => handlePlayerDataChange('player3', e.target.value)}
                variant="bordered"
                labelPlacement="outside"
              />
              <Input
                label="4. Oyuncu"
                placeholder="İsim giriniz"
                value={playerData.player4}
                onChange={(e) => handlePlayerDataChange('player4', e.target.value)}
                variant="bordered"
                labelPlacement="outside"
              />
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, index) => (
            <Card
              key={index}
              isPressable
              onPress={() => handleBoxSelection(index)}
              className={`transition-all duration-200 ${
                selectedBox === index 
                  ? 'border-4 border-primary scale-105 shadow-lg bg-primary-50' 
                  : 'hover:scale-102 hover:shadow-md'
              }`}
            >
              <CardBody>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="font-bold">Saat Dilimi</p>
                    <p className="text-xl font-semibold text-primary">
                      {timeSlots[index]}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p>2. Oyuncu: {playerData.player2 || 'Belirlenmedi'}</p>
                    <p>3. Oyuncu: {playerData.player3 || 'Belirlenmedi'}</p>
                    <p>4. Oyuncu: {playerData.player4 || 'Belirlenmedi'}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 