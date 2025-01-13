'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input, Card, CardBody, Button, Tooltip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/react";
import { database } from '../firebase/config';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { Trash2, RefreshCw } from 'lucide-react';

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
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-end gap-4 mb-4">
          <Tooltip content="Tüm seçimleri temizle">
            <Button
              color="danger"
              variant="flat"
              onPress={handleClearAllSelections}
              startContent={<RefreshCw size={20} />}
            >
              Tümünü Temizle
            </Button>
          </Tooltip>
        </div>

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
          {Array.from({ length: 9 }).map((_, index) => {
            const isSelected = selectedBox === index;
            const existingSelection = timeSlotSelections[index];
            const isSelectable = isTimeSlotSelectable(index);

            return (
              <Card
                key={index}
                isPressable={isSelectable}
                onPress={() => isSelectable && handleBoxSelection(index)}
                className={`transition-all duration-200 ${
                  isSelected 
                    ? 'border-4 border-primary scale-105 shadow-lg bg-primary-50'
                    : existingSelection
                    ? 'opacity-75 bg-gray-100'
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
                      {existingSelection ? (
                        <>
                          <div className="flex justify-between items-center">
                            <div>
                              <p>1. Oyuncu: {existingSelection.player1}</p>
                              <p>2. Oyuncu: {existingSelection.player2}</p>
                              <p>3. Oyuncu: {existingSelection.player3}</p>
                              <p>4. Oyuncu: {existingSelection.player4}</p>
                            </div>
                            <Tooltip content="Bu seçimi sil">
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
                        <p className="text-center text-gray-500">Müsait</p>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {selectedBox !== null && areAllPlayersEntered() && (
          <div className="fixed bottom-8 right-8">
            <Button
              color="primary"
              size="lg"
              onClick={handleConfirmSelection}
            >
              Seçimi Onayla
            </Button>
          </div>
        )}

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>Seçimi Sil</ModalHeader>
            <ModalBody>
              Bu zaman dilimindeki seçimi silmek istediğinizden emin misiniz?
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                İptal
              </Button>
              <Button 
                color="danger" 
                onPress={() => {
                  if (selectedBoxForDelete !== null) {
                    handleDeleteTimeSlot(selectedBoxForDelete);
                  }
                }}
              >
                Sil
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
} 