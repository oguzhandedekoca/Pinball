"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Input,
  Button,
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
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
  Zap,
  Target,
  Shield,
} from "lucide-react";
import { useUser } from "../providers";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
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
    { label: "Kaleci 🧤", value: "kaleci", icon: Shield },
    { label: "Forvet 🎯", value: "forvet", icon: Target },
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

  const getErrorMessage = (errorCode: string) => {
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
        return "Bir hata oluştu";
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
        } catch (error: unknown) {
          if (error instanceof Error) {
            const errorMessage = getErrorMessage(error.message);
            showToast(errorMessage);
            console.error("Login error:", error);
          } else {
            showToast("Beklenmeyen bir hata oluştu");
            console.error("Unknown login error:", error);
          }
          setIsLoading(false);
          return;
        }

        setCurrentUser(userCredential.user);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 w-full backdrop-blur-md bg-white/10 dark:bg-black/20 border-b border-white/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center group">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mr-3 group-hover:scale-110 transition-transform duration-300">
              <Table2 className="text-white" size={28} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Langırt Randevu Sistemi
            </h1>
          </div>
          <Button
            isIconOnly
            variant="light"
            onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-300"
          >
            {theme === "dark" ? (
              <Sun className="text-yellow-300" size={24} />
            ) : (
              <Moon className="text-blue-300" size={24} />
            )}
          </Button>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center p-4 gap-8 max-w-7xl mx-auto">
        {/* Sol taraf - Bilgi Kartları */}
        <div className="w-full md:w-1/2 space-y-6">
          <div className="text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4">
              Hoş Geldiniz! 👋
            </h2>
            <p className="text-lg text-purple-200/80">
              Langırt dünyasına adım at ve efsane maçlar yap!
            </p>
          </div>

          {/* Bilgi Kartları */}
          <div className="space-y-4">
            <Card className="backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 group hover:scale-105">
              <CardBody className="flex items-center gap-4 p-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Trophy size={28} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-lg">
                    Arkadaşlarınla Rekabet Et
                  </p>
                  <p className="text-blue-200/80">
                    2v2 maçlar ile efsane anlar yaşa
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 group hover:scale-105">
              <CardBody className="flex items-center gap-4 p-6">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Timer size={28} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-lg">
                    Kolay Rezervasyon
                  </p>
                  <p className="text-purple-200/80">
                    İstediğin saati seç ve hemen oynamaya başla
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 group hover:scale-105">
              <CardBody className="flex items-center gap-4 p-6">
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Users size={28} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-white text-lg">
                    Takımını Oluştur
                  </p>
                  <p className="text-green-200/80">
                    Arkadaşlarınla takım ol ve maça başla
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Sağ taraf - Login Formu */}
        <div className="w-full md:w-1/2 max-w-md">
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl">
            <CardHeader className="flex gap-3 justify-center pb-6 pt-8">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Gamepad2 size={48} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Oyuncu Girişi
                </h1>
                <p className="text-purple-200/80 text-center">
                  Hemen giriş yap ve maç programı oluştur
                </p>
              </div>
            </CardHeader>
            <CardBody className="px-8 pb-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Oyuncu adını gir"
                  variant="bordered"
                  labelPlacement="outside"
                  startContent={<Users className="text-purple-400" size={20} />}
                  classNames={{
                    input: "text-white placeholder:text-purple-200/60",
                    inputWrapper:
                      "backdrop-blur-md bg-white/10 border-white/20 hover:border-purple-400 focus-within:border-purple-400",
                    label: "text-purple-200 font-medium",
                  }}
                  required
                />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta adresiniz"
                  variant="bordered"
                  labelPlacement="outside"
                  startContent={<Mail className="text-purple-400" size={20} />}
                  classNames={{
                    input: "text-white placeholder:text-purple-200/60",
                    inputWrapper:
                      "backdrop-blur-md bg-white/10 border-white/20 hover:border-purple-400 focus-within:border-purple-400",
                    label: "text-purple-200 font-medium",
                  }}
                  required
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifreniz (en az 6 karakter)"
                  variant="bordered"
                  labelPlacement="outside"
                  startContent={<Lock className="text-purple-400" size={20} />}
                  classNames={{
                    input: "text-white placeholder:text-purple-200/60",
                    inputWrapper:
                      "backdrop-blur-md bg-white/10 border-white/20 hover:border-purple-400 focus-within:border-purple-400",
                    label: "text-purple-200 font-medium",
                  }}
                  required
                />
                <Select
                  placeholder="Pozisyon seçin"
                  selectedKeys={[position]}
                  onChange={(e) => setPosition(e.target.value)}
                  variant="bordered"
                  labelPlacement="outside"
                  className="w-full"
                  classNames={{
                    trigger:
                      "backdrop-blur-md bg-white/10 border-white/20 hover:border-purple-400 focus-within:border-purple-400",
                    label: "text-purple-200 font-medium",
                    value: "text-white",
                    // placeholder: "text-purple-200/60",
                  }}
                >
                  {positions.map((pos) => (
                    <SelectItem
                      key={pos.value}
                      value={pos.value}
                      className="text-gray-800"
                    >
                      <div className="flex items-center gap-2">
                        <pos.icon size={18} />
                        {pos.label}
                      </div>
                    </SelectItem>
                  ))}
                </Select>
                <Button
                  type="submit"
                  color="primary"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  size="lg"
                  isLoading={isLoading}
                  startContent={isLoading ? undefined : <Zap size={20} />}
                >
                  {isLoading ? "Giriş Yapılıyor..." : "Hemen Başla"}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full backdrop-blur-md bg-white/10 dark:bg-black/20 border-t border-white/20 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 text-center text-sm text-purple-200/60">
          © 2025 Langırt Randevu Sistemi. Tüm hakları saklıdır.
        </div>
      </div>

      {/* Toast Notification */}
      <div
        className={`fixed top-4 right-4 z-50 transition-all duration-500 ${
          toast.show
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-full opacity-0 scale-95"
        }`}
      >
        <Card
          className={`backdrop-blur-md border border-white/20 shadow-2xl ${
            toast.type === "error" ? "bg-red-500/90" : "bg-green-500/90"
          } text-white`}
        >
          <CardBody className="py-3 px-4">
            <div className="flex items-center gap-3">
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
