"use client";
import { Card, CardBody, Input } from "@nextui-org/react";
import { Trophy } from "lucide-react";
import { PlayerData } from "../types";

interface PlayerFormProps {
  player1: string;
  position: string;
  playerData: PlayerData;
  onPlayerDataChange: (field: keyof PlayerData, value: string) => void;
}

export function PlayerForm({
  player1,
  position,
  playerData,
  onPlayerDataChange,
}: PlayerFormProps) {
  const isGoalkeeper = position === "kaleci";

  return (
    <Card className="border-2 border-blue-100 dark:border-gray-700">
      <CardBody>
        <div className="space-y-6">
          {/* 1. Takım */}
          <div className="border-b border-blue-100 dark:border-gray-700 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Trophy
                  size={24}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                1. Takım
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isGoalkeeper ? (
                <>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      1. Oyuncu (Kaleci)
                    </p>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        🧤 {player1}
                      </p>
                    </div>
                  </div>
                  <Input
                    label="2. Oyuncu (Forvet)"
                    placeholder="Forvet 🎯"
                    value={playerData.player2}
                    onChange={(e) =>
                      onPlayerDataChange("player2", e.target.value)
                    }
                    variant="bordered"
                    labelPlacement="outside"
                    classNames={{
                      label: "text-gray-600 dark:text-gray-400",
                    }}
                  />
                </>
              ) : (
                <>
                  <Input
                    label="1. Oyuncu (Kaleci)"
                    placeholder="Kaleci 🧤"
                    value={playerData.player2}
                    onChange={(e) =>
                      onPlayerDataChange("player2", e.target.value)
                    }
                    variant="bordered"
                    labelPlacement="outside"
                    classNames={{
                      label: "text-gray-600 dark:text-gray-400",
                    }}
                  />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      2. Oyuncu (Forvet)
                    </p>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        🎯 {player1}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 2. Takım */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Trophy size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
                2. Takım
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="3. Oyuncu (Kaleci)"
                placeholder="Kaleci 🧤"
                value={playerData.player3}
                onChange={(e) => onPlayerDataChange("player3", e.target.value)}
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
                onChange={(e) => onPlayerDataChange("player4", e.target.value)}
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
  );
}
