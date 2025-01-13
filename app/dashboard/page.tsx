'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input, Card, CardBody, Button, Tooltip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/react";
import { database } from '../firebase/config';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { Trash2, RefreshCw, Trophy, Users, LogOut, Table2, Timer } from 'lucide-react';
import { useUser } from '../providers';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

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
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Zaman dilimlerini oluştur
  const timeSlots = Array.from({ length: 37 }, (_, index) => {
    const baseTime = new Date();
    baseTime.setHours(9, 0, 0, 0);
    baseTime.setMinutes(baseTime.getMinutes() + (index * 15));
    return baseTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) return null;
  
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-md p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Table2 className="text-blue-600 dark:text-blue-400" size={24} />
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Langırt Randevu Sistemi</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-gray-800 px-4 py-2 rounded-lg">
              <Users size={20} className="text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-600 dark:text-blue-400">Hoş geldin, {player1}</span>
            </div>
            <Button
              isIconOnly
              variant="light"
              onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="min-w-unit-10"
            >
              {theme === 'dark' ? (
                <Sun className="text-yellow-400" size={24} />
              ) : (
                <Moon className="text-gray-600" size={24} />
              )}
            </Button>
            <Button
              color="danger"
              variant="flat"
              startContent={<LogOut size={20} />}
              onPress={logout}
            >
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
        {/* Üst Bilgi Kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardBody className="flex flex-row items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Timer size={24} />
              </div>
              <div>
                <p className="text-sm opacity-80">Bugünkü Randevular</p>
                <p className="text-2xl font-bold">{Object.keys(timeSlotSelections).length}/37</p>
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
                <p className="text-2xl font-bold">{37 - Object.keys(timeSlotSelections).length}</p>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white sm:col-span-2 lg:col-span-1">
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
        <Card className="border-2 border-blue-100 dark:border-gray-700">
          <CardBody>
            <div className="space-y-6">
              {/* 1. Takım */}
              <div className="border-b border-blue-100 dark:border-gray-700 pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Trophy size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">1. Takım</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">1. Oyuncu (Kaleci)</p>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="font-medium text-gray-800 dark:text-gray-200">🧤 {player1}</p>
                    </div>
                  </div>
                  <Input
                    label="2. Oyuncu (Forvet)"
                    placeholder="Forvet oyuncusu 🎯"
                    value={playerData.player2}
                    onChange={(e) => handlePlayerDataChange('player2', e.target.value)}
                    variant="bordered"
                    labelPlacement="outside"
                    classNames={{
                      label: "text-gray-600 dark:text-gray-400",
                    }}
                  />
                </div>
              </div>

              {/* 2. Takım */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Trophy size={24} className="text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">2. Takım</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="3. Oyuncu (Kaleci)"
                    placeholder="Kaleci 🧤"
                    value={playerData.player3}
                    onChange={(e) => handlePlayerDataChange('player3', e.target.value)}
                    variant="bordered"
                    labelPlacement="outside"
                    classNames={{
                      label: "text-gray-600 dark:text-gray-400",
                    }}
                  />
                  <Input
                    label="4. Oyuncu (Forvet)"
                    placeholder="Forvet 🎯"
                    value={playerData.player4}
                    onChange={(e) => handlePlayerDataChange('player4', e.target.value)}
                    variant="bordered"
                    labelPlacement="outside"
                    classNames={{
                      label: "text-gray-600 dark:text-gray-400",
                    }}
                  />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Zaman Dilimleri Grid'i */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 37 }).map((_, index) => {
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
                    ? 'border-4 border-blue-500 scale-105 shadow-lg bg-blue-50 dark:bg-blue-900/20'
                    : existingSelection
                    ? 'opacity-90 bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 cursor-not-allowed'
                    : 'hover:scale-102 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-400'
                }`}
              >
                <CardBody className="p-3">
                  <div className="flex flex-col">
                    <div className="text-center mb-2">
                      <p className="font-bold text-gray-600 dark:text-gray-300 text-sm">Masa Saati</p>
                      <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {timeSlots[index]}
                      </p>
                    </div>
                    {existingSelection ? (
                      <div>
                        <div className="grid grid-cols-2 gap-2">
                          {/* 1. Takım */}
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">1. Takım</p>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-700 dark:text-gray-300">🧤 {existingSelection.player1}</p>
                              <p className="text-xs text-gray-700 dark:text-gray-300">🎯 {existingSelection.player2}</p>
                            </div>
                          </div>
                          {/* 2. Takım */}
                          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                            <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">2. Takım</p>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-700 dark:text-gray-300">🧤 {existingSelection.player3}</p>
                              <p className="text-xs text-gray-700 dark:text-gray-300">🎯 {existingSelection.player4}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <Tooltip content="Bu maçı iptal et">
                            <Button
                              isIconOnly
                              color="danger"
                              variant="light"
                              size="sm"
                              onPress={() => {
                                setSelectedBoxForDelete(index);
                                onOpen();
                              }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Müsait Masa</p>
                        <div className="text-2xl mt-2">🎮</div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Onay Butonu */}
        {selectedBox !== null && areAllPlayersEntered() && (
          <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50">
            <Button
              color="primary"
              size="lg"
              onClick={handleConfirmSelection}
              className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700"
              startContent={<Trophy size={20} />}
            >
              Maçı Kaydet
            </Button>
          </div>
        )}

        {/* Modal */}
        <Modal 
          isOpen={isOpen} 
          onClose={onClose}
          classNames={{
            header: "dark:text-gray-200",
            body: "dark:text-gray-300",
          }}
        >
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