'use client';
import { useState } from 'react';
import { database } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

const selections = [
  "Seçenek 1",
  "Seçenek 2",
  "Seçenek 3",
  "Seçenek 4"
];

export default function Selection() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username');
  const [selectedOption, setSelectedOption] = useState('');

  const handleSelection = async (selection: string) => {
    if (username) {
      try {
        const userRef = doc(database, 'Users', username);
        await updateDoc(userRef, {
          selection: selection,
          selectionTime: new Date().toISOString()
        });
        setSelectedOption(selection);
      } catch (error) {
        console.error("Error updating document: ", error);
        alert("Seçim kaydedilirken bir hata oluştu!");
      }
    }
  };

  if (!username) {
    return <div>Lütfen önce giriş yapın</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Hoş geldin, {username}</h1>
        <div className="grid grid-cols-2 gap-4">
          {selections.map((selection) => (
            <button
              key={selection}
              onClick={() => handleSelection(selection)}
              className={`p-4 rounded-lg border ${
                selectedOption === selection
                  ? 'bg-blue-500 text-white'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              {selection}
            </button>
          ))}
        </div>
        {selectedOption && (
          <p className="mt-4 text-green-600">
            Seçiminiz kaydedildi: {selectedOption}
          </p>
        )}
      </div>
    </div>
  );
} 