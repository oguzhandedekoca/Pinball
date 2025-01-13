'use client';
import { useState } from 'react';
import { database } from '../firebase/config';
import { ref, set } from 'firebase/database';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [username, setUsername] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      // Kullanıcıyı Firebase'e kaydet
      const userRef = ref(database, 'users/' + username);
      await set(userRef, {
        username: username,
        loginTime: new Date().toISOString(),
      });

      // Seçim sayfasına yönlendir
      router.push(`/selection?username=${username}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Giriş Yap</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Kullanıcı adınızı girin"
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
          >
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
} 