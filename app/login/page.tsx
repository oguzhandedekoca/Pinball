"use client";
import { useState, useEffect } from "react";
import { database } from "../firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  Input,
  Button,
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
  Tooltip,
} from "@nextui-org/react";
import {
  Trophy,
  Users,
  Table2,
  Timer,
  Gamepad2,
  Mail,
  Lock,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { useUser } from "../providers";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase/config";

export default function Login() {
  const [username, setUsername] = useState("");
  const [position, setPosition] = useState("kaleci");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setCurrentUser } = useUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "error",
  });

  const positions = [
    { label: "Kaleci 🧤", value: "kaleci" },
    { label: "Forvet 🎯", value: "forvet" },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const showToast = (message: string, type: "error" | "success" = "error") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "error" }),
      3000
    );
  };

  const getErrorMessage = (errorCode: string, message: string) => {
    switch (errorCode) {
      case "auth/user-not-found":
        return "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı";
      case "auth/wrong-password":
        return "Hatalı şifre girdiniz";
      case "auth/email-already-in-use":
        return "Bu e-posta adresi zaten kullanımda";
      case "auth/weak-password":
        return "Şifre en az 6 karakter olmalıdır";
      case "auth/invalid-credential":
      case "INVALID_LOGIN_CREDENTIALS":
        return "E-posta veya şifre hatalı";
      default:
        return message || "Bir hata oluştu";
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && email && password) {
      setIsLoading(true);
      try {
        let userCredential;
        try {
          userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
          );
        } catch (error: any) {
          const errorMessage = getErrorMessage(error.code, error.message);
          showToast(errorMessage);
          console.error("Login error:", error);
          setIsLoading(false);
          return;
        }

        // Firestore'a kullanıcı bilgilerini kaydet
        const userDoc = await addDoc(collection(database, "users"), {
          uid: userCredential.user.uid,
          username: username,
          position: position,
          email: email,
          loginTime: new Date().toISOString(),
        });

        setCurrentUser(username);
        router.push(`/dashboard?player1=${username}&position=${position}`);
      } catch (error) {
        console.error("Giriş hatası:", error);
        showToast("Giriş yapılırken bir hata oluştu!");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <div className="w-full bg-white dark:bg-gray-900 shadow-sm p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Table2
              className="text-blue-600 dark:text-blue-400 mr-2"
              size={32}
            />
            <h1 className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
              Langırt Randevu Sistemi
            </h1>
          </div>
          <Button
            isIconOnly
            variant="light"
            onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="text-yellow-400" size={24} />
            ) : (
              <Moon className="text-gray-600" size={24} />
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 gap-8 max-w-7xl mx-auto">
        {/* Sol taraf - Bilgi Kartları */}
        <div className="w-full md:w-1/2 space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center md:text-left mb-6">
            Hoş Geldiniz! 👋
          </h2>

          {/* Bilgi Kartları */}
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardBody className="flex items-center gap-4 p-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Trophy size={24} />
              </div>
              <div>
                <p className="font-semibold">Arkadaşlarınla Rekabet Et</p>
                <p className="text-sm opacity-80">
                  2v2 maçlar ile eğlenceli vakit geçir
                </p>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardBody className="flex items-center gap-4 p-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Timer size={24} />
              </div>
              <div>
                <p className="font-semibold">Kolay Rezervasyon</p>
                <p className="text-sm opacity-80">
                  İstediğin saati seç ve hemen oynamaya başla
                </p>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardBody className="flex items-center gap-4 p-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <p className="font-semibold">Takımını Oluştur</p>
                <p className="text-sm opacity-80">
                  Arkadaşlarınla takım ol ve maça başla
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sağ taraf - Login Formu */}
        <div className="w-full md:w-1/2 max-w-md">
          <Card className="border-2 border-blue-100 dark:border-gray-700">
            <CardHeader className="flex gap-3 justify-center pb-0">
              <div className="flex flex-col items-center">
                <Gamepad2
                  size={40}
                  className="text-blue-600 dark:text-blue-400 mb-2"
                />
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  Oyuncu Girişi
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Hemen giriş yap ve maç programı oluştur
                </p>
              </div>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Oyuncu adını gir"
                  variant="bordered"
                  labelPlacement="outside"
                  startContent={<Users className="text-gray-400" size={18} />}
                  required
                />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta adresiniz"
                  variant="bordered"
                  labelPlacement="outside"
                  startContent={<Mail className="text-gray-400" size={18} />}
                  required
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifreniz (en az 6 karakter)"
                  variant="bordered"
                  labelPlacement="outside"
                  startContent={<Lock className="text-gray-400" size={18} />}
                  required
                />
                <Select
                  placeholder="Pozisyon seçin"
                  selectedKeys={[position]}
                  onChange={(e) => setPosition(e.target.value)}
                  variant="bordered"
                  labelPlacement="outside"
                  className="w-full"
                >
                  {positions.map((pos) => (
                    <SelectItem
                      className="text-gray-600 dark:text-gray-400"
                      key={pos.value}
                      value={pos.value}
                    >
                      {pos.label}
                    </SelectItem>
                  ))}
                </Select>
                <Button
                  type="submit"
                  color="primary"
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600"
                  size="lg"
                  isLoading={isLoading}
                >
                  {isLoading ? "Giriş Yapılıyor..." : "Hemen Başla"}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-white dark:bg-gray-900 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          © 2025 Langırt Randevu Sistemi. Tüm hakları saklıdır.
        </div>
      </div>

      {/* Toast Notification */}
      <div
        className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
          toast.show
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }`}
      >
        <Card
          className={`${
            toast.type === "error" ? "bg-red-500" : "bg-green-500"
          } text-white shadow-lg`}
        >
          <CardBody className="py-3 px-4">
            <div className="flex items-center gap-2">
              {toast.type === "error" ? (
                <XCircle size={20} />
              ) : (
                <CheckCircle size={20} />
              )}
              <p className="font-medium">{toast.message}</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
