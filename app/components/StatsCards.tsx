'use client';
import { Card, CardBody } from "@nextui-org/react";
import { Trophy, Users, Timer } from 'lucide-react';

interface StatsCardsProps {
  totalBookings: number;
  availableSlots: number;
  totalPlayers: number;
}

export function StatsCards({ totalBookings, availableSlots, totalPlayers }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardBody className="flex flex-row items-center gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Timer size={24} />
          </div>
          <div>
            <p className="text-sm opacity-80">Bugünkü Randevular</p>
            <p className="text-2xl font-bold">{totalBookings}/37</p>
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
            <p className="text-2xl font-bold">{availableSlots}</p>
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
            <p className="text-2xl font-bold">{totalPlayers}</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 