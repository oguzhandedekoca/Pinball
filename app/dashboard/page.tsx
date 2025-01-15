'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/react";
import { database } from '../firebase/config';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { Users, LogOut, Table2, Trash2 } from 'lucide-react';
import { useUser } from '../providers';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { StatsCards } from '../components/StatsCards';
import { PlayerForm } from '../components/PlayerForm';
import { TimeSlotGrid } from '../components/TimeSlotGrid';
import { PlayerData, TimeSlotData } from '../types';
import { LoadingScreen } from '../components/LoadingScreen';

export default function Dashboard() {
  const searchParams = useSearchParams();
  const player1 = searchParams.get('player1');
  const position = searchParams.get('position');
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
    return <LoadingScreen />;
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
              <span className="font-medium text-blue-600 dark:text-blue-400">
                Hoş geldin, {player1} ({position === 'kaleci' ? '🧤' : '🎯'})
              </span>
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
        <StatsCards 
          totalBookings={Object.keys(timeSlotSelections).length}
          availableSlots={37 - Object.keys(timeSlotSelections).length}
          totalPlayers={Object.values(timeSlotSelections).length * 4}
        />

        <PlayerForm 
          player1={player1 || ''}
          position={position || 'kaleci'}
          playerData={playerData}
          onPlayerDataChange={handlePlayerDataChange}
        />

        <TimeSlotGrid 
          timeSlots={timeSlots}
          selectedBox={selectedBox}
          timeSlotSelections={timeSlotSelections}
          onBoxSelect={handleBoxSelection}
          onDeleteClick={(index) => {
            setSelectedBoxForDelete(index);
            onOpen();
          }}
          isTimeSlotSelectable={isTimeSlotSelectable}
        />

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