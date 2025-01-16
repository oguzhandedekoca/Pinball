'use client';
import { Card, CardBody, Button, Tooltip } from "@nextui-org/react";
import { Trash2 } from 'lucide-react';
import { TimeSlotData } from '../types';

interface TimeSlotGridProps {
  timeSlots: string[];
  selectedBox: number | null;
  timeSlotSelections: { [key: number]: TimeSlotData };
  onBoxSelect: (index: number) => void;
  onDeleteClick: (index: number) => void;
  isTimeSlotSelectable: (index: number) => boolean;
  currentUserUid: string | null;
}

export function TimeSlotGrid({
  timeSlots,
  selectedBox,
  timeSlotSelections,
  onBoxSelect,
  onDeleteClick,
  isTimeSlotSelectable,
  currentUserUid
}: TimeSlotGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {Array.from({ length: 37 }).map((_, index) => {
        const isSelected = selectedBox === index;
        const existingSelection = timeSlotSelections[index];
        const isSelectable = isTimeSlotSelectable(index);
        const canDelete = existingSelection?.createdBy === currentUserUid;

        return (
          <Card
            key={index}
            isPressable={isSelectable}
            onPress={() => isSelectable && onBoxSelect(index)}
            className={`transition-all duration-300 relative group ${
              isSelected 
                ? 'border-4 border-blue-500 shadow-lg bg-blue-50 dark:bg-blue-900/20'
                : existingSelection
                ? 'opacity-90 bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700'
                : 'hover:shadow-md hover:border-blue-200 dark:hover:border-blue-400'
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
                    {/* Silme butonu - sadece hover durumunda ve yetkili kullanıcı için görünür */}
                    {canDelete && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Tooltip content="Bu maçı iptal et">
                          <Button
                            isIconOnly
                            color="danger"
                            variant="light"
                            size="sm"
                            onPress={() => onDeleteClick(index)}
                            className="bg-white/80 dark:bg-gray-800/80 hover:bg-red-100 dark:hover:bg-red-900/30"
                          >
                            <Trash2 size={14} className="text-red-500 dark:text-red-400" />
                          </Button>
                        </Tooltip>
                      </div>
                    )}
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
  );
} 