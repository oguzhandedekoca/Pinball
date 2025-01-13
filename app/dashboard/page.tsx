'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input, Card, CardBody, Button, Tooltip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/react";
import { database } from '../firebase/config';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { Trash2, RefreshCw, Trophy, Users, LogOut, Table2, Timer } from 'lucide-react';
import { useUser } from '../providers';
import Image from 'next/image';

interface PlayerData {
  player2: string;
  player3: string;
  player4: string;
  selectedTime?: string;
}

interface TimeSlotData {
  player1: string;
  player2: string;
  player3: string;
  player4: string;
  selectedTime: string;
  selectedBox: number;
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
  const [timeSlotSelections, setTimeSlotSelections] = useState<{ [key: number]: TimeSlotData }>({});
  const [isLoading, setIsLoading] = useState(true);
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [selectedBoxForDelete, setSelectedBoxForDelete] = useState<number | null>(null);
  const { logout } = useUser();

  // Zaman dilimlerini oluştur
  const timeSlots = Array.from({ length: 9 }, (_, index) => {
    const baseTime = new Date();
    baseTime.setHours(9, 0, 0, 0);
    baseTime.setMinutes(baseTime.getMinutes() + (index * 15));
    return baseTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  });

  // Mevcut seçimleri Firebase'den çek
  useEffect(() => {
    const fetchSelections = async () => {
      try {
        const selectionsRef = collection(database, 'selections');
        const querySnapshot = await getDocs(selectionsRef);
        const selections: { [key: number]: TimeSlotData } = {};
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() as TimeSlotData;
          selections[data.selectedBox] = data;
        });
        
        setTimeSlotSelections(selections);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching selections:", error);
        setIsLoading(false);
      }
    };

    fetchSelections();
  }, []);

  const handlePlayerDataChange = (field: keyof PlayerData, value: string) => {
    setPlayerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isTimeSlotSelectable = (boxIndex: number) => {
    return !timeSlotSelections[boxIndex];
  };

  const areAllPlayersEntered = () => {
    return playerData.player2 && playerData.player3 && playerData.player4;
  };

  const handleBoxSelection = async (boxIndex: number) => {
    if (!isTimeSlotSelectable(boxIndex)) {
      alert("Bu zaman dilimi dolu!");
      return;
    }

    if (!areAllPlayersEntered()) {
      alert("Lütfen tüm oyuncuların isimlerini girin!");
      return;
    }

    setSelectedBox(boxIndex);
  };

  const handleConfirmSelection = async () => {
    if (selectedBox === null || !player1) return;

    try {
      await addDoc(collection(database, 'selections'), {
        player1: player1,
        ...playerData,
        selectedTime: timeSlots[selectedBox],
        selectedBox: selectedBox,
        selectionTime: new Date().toISOString()
      });

      // Yerel state'i güncelle
      setTimeSlotSelections(prev => ({
        ...prev,
        [selectedBox]: {
          player1: player1,
          ...playerData,
          selectedTime: timeSlots[selectedBox],
          selectedBox: selectedBox
        }
      }));

      alert("Seçiminiz başarıyla kaydedildi!");
      setSelectedBox(null);
      setPlayerData({ player2: '', player3: '', player4: '' });
    } catch (error) {
      console.error("Error saving selection:", error);
      alert("Seçim kaydedilirken bir hata oluştu!");
    }
  };

  const handleDeleteTimeSlot = async (boxIndex: number) => {
    try {
      const selectionsRef = collection(database, 'selections');
      const q = query(selectionsRef, where('selectedBox', '==', boxIndex));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(database, 'selections', document.id));
      });

      // Yerel state'i güncelle
      const newTimeSlotSelections = { ...timeSlotSelections };
      delete newTimeSlotSelections[boxIndex];
      setTimeSlotSelections(newTimeSlotSelections);

      onClose(); // Modal'ı kapat
      alert("Seçim başarıyla silindi!");
    } catch (error) {
      console.error("Error deleting time slot:", error);
      alert("Silme işlemi sırasında bir hata oluştu!");
    }
  };

  const handleClearAllSelections = async () => {
    if (window.confirm("Tüm seçimleri silmek istediğinizden emin misiniz?")) {
      try {
        const selectionsRef = collection(database, 'selections');
        const querySnapshot = await getDocs(selectionsRef);
        
        const deletePromises = querySnapshot.docs.map(doc => 
          deleteDoc(doc.ref)
        );
        
        await Promise.all(deletePromises);
        
        // Yerel state'i temizle
        setTimeSlotSelections({});
        alert("Tüm seçimler başarıyla silindi!");
      } catch (error) {
        console.error("Error clearing selections:", error);
        alert("Temizleme işlemi sırasında bir hata oluştu!");
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-md p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Table2 className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-blue-600">Langırt Randevu Sistemi</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users size={20} />
              <span>Hoş geldin, {player1}</span>
            </div>
            <Button
              color="danger"
              variant="light"
              startContent={<LogOut size={20} />}
              onPress={logout}
            >
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 space-y-6">
        {/* Üst Bilgi Kartları */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Timer size={24} />
              </div>
              <div>
                <p className="text-sm opacity-80">Bugünkü Randevular</p>
                <p className="text-2xl font-bold">{Object.keys(timeSlotSelections).length}/9</p>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Trophy size={24} />
              </div>
              <div>
                <p className="text-sm opacity-80">Müsait Masalar</p>
                <p className="text-2xl font-bold">{9 - Object.keys(timeSlotSelections).length}</p>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm opacity-80">Toplam Oyuncu</p>
                <p className="text-2xl font-bold">
                  {Object.values(timeSlotSelections).reduce((acc, curr) => acc + 4, 0)}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Oyuncu Girişi Kartı */}
        <Card className="border-2 border-blue-100">
          <CardBody>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users size={24} className="text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-blue-600">Takımını Oluştur</h2>
              </div>
              <Input
                label="2. Oyuncu"
                placeholder="Kaleci 🧤"
                value={playerData.player2}
                onChange={(e) => handlePlayerDataChange('player2', e.target.value)}
                variant="bordered"
                labelPlacement="outside"
              />
              <Input
                label="3. Oyuncu"
                placeholder="Orta Saha 🎯"
                value={playerData.player3}
                onChange={(e) => handlePlayerDataChange('player3', e.target.value)}
                variant="bordered"
                labelPlacement="outside"
              />
              <Input
                label="4. Oyuncu"
                placeholder="Forvet ⚡"
                value={playerData.player4}
                onChange={(e) => handlePlayerDataChange('player4', e.target.value)}
                variant="bordered"
                labelPlacement="outside"
              />
            </div>
          </CardBody>
        </Card>

        {/* Zaman Dilimleri Grid'i */}
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, index) => {
            const isSelected = selectedBox === index;
            const existingSelection = timeSlotSelections[index];
            const isSelectable = isTimeSlotSelectable(index);

            return (
              <Card
                key={index}
                isPressable={isSelectable}
                onPress={() => isSelectable && handleBoxSelection(index)}
                className={`transition-all duration-300 ${
                  isSelected 
                    ? 'border-4 border-blue-500 scale-105 shadow-lg bg-blue-50'
                    : existingSelection
                    ? 'bg-gray-50 border border-gray-200'
                    : 'hover:scale-102 hover:shadow-md hover:border-blue-200'
                }`}
              >
                <CardBody>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="font-bold text-gray-600">Masa Saati</p>
                      <p className="text-xl font-semibold text-blue-600">
                        {timeSlots[index]}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {existingSelection ? (
                        <>
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="font-medium">🎮 {existingSelection.player1}</p>
                              <p className="text-sm">🧤 {existingSelection.player2}</p>
                              <p className="text-sm">🎯 {existingSelection.player3}</p>
                              <p className="text-sm">⚡ {existingSelection.player4}</p>
                            </div>
                            <Tooltip content="Bu maçı iptal et">
                              <Button
                                isIconOnly
                                color="danger"
                                variant="light"
                                onPress={() => {
                                  setSelectedBoxForDelete(index);
                                  onOpen();
                                }}
                              >
                                <Trash2 size={20} />
                              </Button>
                            </Tooltip>
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-2">
                          <p className="text-gray-500">Müsait Masa</p>
                          <div className="text-3xl">🎮</div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Onay Butonu */}
        {selectedBox !== null && areAllPlayersEntered() && (
          <div className="fixed bottom-8 right-8">
            <Button
              color="primary"
              size="lg"
              onClick={handleConfirmSelection}
              className="bg-gradient-to-r from-blue-500 to-blue-600"
              startContent={<Trophy size={20} />}
            >
              Maçı Kaydet
            </Button>
          </div>
        )}

        {/* Silme Modalı */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader className="flex gap-2 items-center">
              <Table2 size={24} />
              Maçı İptal Et
            </ModalHeader>
            <ModalBody>
              Bu masa rezervasyonunu iptal etmek istediğinizden emin misiniz?
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Vazgeç
              </Button>
              <Button 
                color="danger" 
                onPress={() => {
                  if (selectedBoxForDelete !== null) {
                    handleDeleteTimeSlot(selectedBoxForDelete);
                  }
                }}
                startContent={<Trash2 size={20} />}
              >
                İptal Et
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
} 