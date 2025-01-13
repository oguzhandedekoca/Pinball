'use client';
import { useState } from 'react';
import { database } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Input, Button, Card, CardBody, CardHeader } from "@nextui-org/react";

export default function Login() {
  const [username, setUsername] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      try {
        // Kullanıcıyı direkt olarak koleksiyona ekle
        const docRef = await addDoc(collection(database, 'Users'), {
          username: username,
          loginTime: new Date().toISOString(),
          role: 'player1'
        });

        // Dashboard sayfasına yönlendir
        router.push(`/dashboard?player1=${username}`);
      } catch (error) {
        console.error("Giriş hatası:", error);
        alert("Giriş yapılırken bir hata oluştu!");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader className="flex gap-3 justify-center">
          <h1 className="text-2xl font-bold">Oyun Girişi</h1>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kullanıcı adınızı girin"
              variant="bordered"
              labelPlacement="outside"
              required
            />
            <Button
              type="submit"
              color="primary"
              className="w-full"
            >
              Giriş Yap
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
} 