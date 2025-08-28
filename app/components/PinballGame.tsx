"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Card, CardBody } from "@nextui-org/react";
import { Play, Pause, RotateCcw, Trophy, Users } from "lucide-react";

interface GameState {
  isPlaying: boolean;
  player1Score: number;
  player2Score: number;
  winner: number | null;
  ball?: {
    x: number;
    y: number;
    vx: number;
    vy: number;
  };
  scores?: {
    player1: number;
    player2: number;
  };
  lastUpdated?: Date;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  team: 1 | 2;
  rodIndex: number;
}

interface Rod {
  x: number;
  y: number;
  width: number;
  height: number;
  team: 1 | 2;
  players: Player[];
  rodIndex: number;
}

interface PinballGameProps {
  multiplayer?: boolean;
  myTeam?: 1 | 2;
  onGameStateUpdate?: (gameState: Partial<GameState>) => void;
  gameState?: GameState | null;
}

export function PinballGame({
  multiplayer = false,
  myTeam,
  onGameStateUpdate,
  gameState: externalGameState,
}: PinballGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    player1Score: 0,
    player2Score: 0,
    winner: null,
  });

  // Oyun nesneleri
  const ball = useRef<Ball>({
    x: 400,
    y: 300,
    vx: 0,
    vy: 0,
    radius: 6,
  });

  const rods = useRef<Rod[]>([]);
  const keys = useRef<{ [key: string]: boolean }>({});
  const selectedRod = useRef<number>(0);

  // Canvas boyutları
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const TABLE_WIDTH = 700;
  const TABLE_HEIGHT = 400;
  const TABLE_X = (CANVAS_WIDTH - TABLE_WIDTH) / 2;
  const TABLE_Y = (CANVAS_HEIGHT - TABLE_HEIGHT) / 2;

  // Oyun ayarları
  const GRAVITY = 0.05; // Yerçekimini azalttım
  const FRICTION = 0.995; // Sürtünmeyi azalttım - top daha az yavaşlayacak
  const BOUNCE = 0.8; // Zıplamayı artırdım
  const MIN_BALL_SPEED = 0.5; // Minimum top hızı

  // Oyunu başlat
  const startGame = () => {
    console.log("🎮 Oyun başlatılıyor...");
    setGameState((prev) => ({ ...prev, isPlaying: true }));

    // Multiplayer modda oyun durumunu güncelle
    if (multiplayer && onGameStateUpdate) {
      onGameStateUpdate({
        isPlaying: true,
        scores: {
          player1: gameState.player1Score,
          player2: gameState.player2Score,
        },
        ball: {
          x: ball.current.x,
          y: ball.current.y,
          vx: ball.current.vx,
          vy: ball.current.vy,
        },
        lastUpdated: new Date(),
      });
    }
  };

  // Oyunu durdur
  const pauseGame = () => {
    console.log("⏸️ Oyun duraklatılıyor...");
    setGameState((prev) => ({ ...prev, isPlaying: false }));

    // Multiplayer modda oyun durumunu güncelle
    if (multiplayer && onGameStateUpdate) {
      onGameStateUpdate({
        isPlaying: false,
        lastUpdated: new Date(),
      });
    }
  };

  // Oyunu sıfırla
  const resetGame = () => {
    console.log("🔄 Oyun sıfırlanıyor...");
    setGameState({
      isPlaying: false,
      player1Score: 0,
      player2Score: 0,
      winner: null,
    });

    // Topu başlangıç pozisyonuna getir - rastgele sağa/sola
    const randomSide = Math.random() > 0.5 ? 1 : -1; // 1: sağ, -1: sol
    const randomX = CANVAS_WIDTH / 2 + randomSide * (Math.random() * 100 + 50); // Ortadan 50-150 piksel uzakta

    ball.current = {
      x: randomX,
      y: TABLE_Y + TABLE_HEIGHT / 2,
      vx: randomSide * (Math.random() * 2 + 1), // Rastgele hız ve yön
      vy: (Math.random() - 0.5) * 2, // Dikey rastgele hareket
      radius: 6,
    };

    // Rod'ları oluştur
    createRods();

    // Multiplayer modda oyun durumunu güncelle
    if (multiplayer && onGameStateUpdate) {
      onGameStateUpdate({
        isPlaying: false,
        player1Score: 0,
        player2Score: 0,
        winner: null,
        ball: {
          x: ball.current.x,
          y: ball.current.y,
          vx: ball.current.vx,
          vy: ball.current.vy,
        },
        lastUpdated: new Date(),
      });
    }
  };

  // Rod'ları oluştur
  const createRods = () => {
    const newRods: Rod[] = [];

    // Gerçek langırt taktiği - soldan sağa karışık dizilim
    const allRods = [
      // 1. Mavi Kaleci (1 oyuncu)
      {
        x: TABLE_X + 50,
        y: TABLE_Y + 50,
        width: 8,
        height: 300,
        team: 1 as const,
        rodIndex: 0,
      },
      // 2. Mavi Defans (3 oyuncu)
      {
        x: TABLE_X + 150,
        y: TABLE_Y + 50,
        width: 8,
        height: 300,
        team: 1 as const,
        rodIndex: 1,
      },
      // 3. Kırmızı Forvet (3 oyuncu)
      {
        x: TABLE_X + 250,
        y: TABLE_Y + 50,
        width: 8,
        height: 300,
        team: 2 as const,
        rodIndex: 2,
      },
      // 4. Mavi Orta Saha (4 oyuncu)
      {
        x: TABLE_X + 350,
        y: TABLE_Y + 50,
        width: 8,
        height: 300,
        team: 1 as const,
        rodIndex: 3,
      },
      // 5. Kırmızı Orta Saha (4 oyuncu)
      {
        x: TABLE_X + 450,
        y: TABLE_Y + 50,
        width: 8,
        height: 300,
        team: 2 as const,
        rodIndex: 4,
      },
      // 6. Mavi Forvet (3 oyuncu)
      {
        x: TABLE_X + 550,
        y: TABLE_Y + 50,
        width: 8,
        height: 300,
        team: 1 as const,
        rodIndex: 5,
      },
      // 7. Kırmızı Defans (3 oyuncu)
      {
        x: TABLE_X + 650,
        y: TABLE_Y + 50,
        width: 8,
        height: 300,
        team: 2 as const,
        rodIndex: 6,
      },
      // 8. Kırmızı Kaleci (1 oyuncu)
      {
        x: TABLE_X + 700,
        y: TABLE_Y + 50,
        width: 8,
        height: 300,
        team: 2 as const,
        rodIndex: 7,
      },
    ];

    // Rod'lar zaten allRods array'inde tanımlandı

    allRods.forEach((rodConfig) => {
      const players: Player[] = [];

      // Her rod'da oyuncu sayısı - gerçek langırt taktiği
      let playerCount = 3; // Varsayılan 3 oyuncu

      // Kaleci rod'ları (rod 0 ve rod 7) 1 oyuncu
      if (rodConfig.rodIndex === 0 || rodConfig.rodIndex === 7) {
        playerCount = 1;
      }
      // Orta saha rod'ları (rod 3 ve rod 4) 4 oyuncu
      else if (rodConfig.rodIndex === 3 || rodConfig.rodIndex === 4) {
        playerCount = 4;
      }

      for (let i = 0; i < playerCount; i++) {
        const playerY = rodConfig.y + 50 + i * 80;
        players.push({
          x: rodConfig.x - 15,
          y: playerY,
          width: 30,
          height: 20,
          team: rodConfig.team,
          rodIndex: rodConfig.rodIndex,
        });
      }

      newRods.push({
        ...rodConfig,
        players,
      });
    });

    rods.current = newRods;
    console.log(`${newRods.length} rod oluşturuldu`);
  };

  // Klavye olaylarını dinle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Sayfa kaydırmasını engelle
      if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === " " ||
        e.key === "a" ||
        e.key === "d" ||
        e.key === "w" ||
        e.key === "s"
      ) {
        e.preventDefault();
      }

      keys.current[e.key] = true;

      // Rod seçimi - Sağ/Sol ok tuşları veya A/D tuşları ile
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        selectedRod.current = Math.max(0, selectedRod.current - 1);
        console.log(`🎯 Rod ${selectedRod.current + 1} seçildi (Sol)`);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        selectedRod.current = Math.min(7, selectedRod.current + 1);
        console.log(`🎯 Rod ${selectedRod.current + 1} seçildi (Sağ)`);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Oyun mantığını güncelle
  const updateGame = () => {
    if (!gameState.isPlaying) return;

    // Multiplayer modda sadece kendi takımını kontrol et
    if (multiplayer && myTeam) {
      // Sadece kendi takımının rod'larını kontrol et
      const myRods = rods.current.filter((rod) => rod.team === myTeam);

      // Seçili rod sadece kendi takımından olmalı
      if (
        selectedRod.current >= 0 &&
        selectedRod.current < rods.current.length
      ) {
        const selectedRodObj = rods.current[selectedRod.current];
        if (selectedRodObj.team !== myTeam) {
          // Başka takımın rod'unu seçmeye çalışıyorsa, kendi takımından birini seç
          const firstMyRod = myRods[0];
          if (firstMyRod) {
            selectedRod.current = firstMyRod.rodIndex;
          }
        }
      }
    }

    const ballObj = ball.current;
    const rodsArray = rods.current;

    // Seçili rod'u hareket ettir
    if (selectedRod.current >= 0 && selectedRod.current < rodsArray.length) {
      const selectedRodObj = rodsArray[selectedRod.current];

      if (keys.current["w"] || keys.current["ArrowUp"]) {
        // Tüm oyuncuları aynı anda yukarı hareket ettir
        const canMoveUp = selectedRodObj.players[0].y > TABLE_Y + 20;
        if (canMoveUp) {
          selectedRodObj.players.forEach((player) => {
            player.y -= 3;
          });
        }
      }

      if (keys.current["s"] || keys.current["ArrowDown"]) {
        // Tüm oyuncuları aynı anda aşağı hareket ettir
        const lastPlayer =
          selectedRodObj.players[selectedRodObj.players.length - 1];
        const canMoveDown =
          lastPlayer.y + lastPlayer.height < TABLE_Y + TABLE_HEIGHT - 20;
        if (canMoveDown) {
          selectedRodObj.players.forEach((player) => {
            player.y += 3;
          });
        }
      }

      // Vuruş
      if (keys.current[" "]) {
        selectedRodObj.players.forEach((player) => {
          const dx = ballObj.x - (player.x + player.width / 2);
          const dy = ballObj.y - (player.y + player.height / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 40) {
            // Vuruş alanını genişlet
            const power = 10;

            // Vuruş yönünü düzelt - top her zaman ileri doğru gitmeli
            if (selectedRodObj.team === 1) {
              // Mavi takım (sol taraf) - sağa doğru vur
              ballObj.vx = Math.abs(power);
              ballObj.vy = (dy / distance) * power * 0.5; // Dikey hareket az
            } else {
              // Kırmızı takım (sağ taraf) - sola doğru vur
              ballObj.vx = -Math.abs(power);
              ballObj.vy = (dy / distance) * power * 0.5; // Dikey hareket az
            }

            console.log(
              "⚽ Topa vuruldu! Takım:",
              selectedRodObj.team,
              "Güç:",
              power
            );
          }
        });
      }
    }

    // Top fiziği
    ballObj.x += ballObj.vx;
    ballObj.y += ballObj.vy;
    ballObj.vy += GRAVITY;

    // Sürtünme - top çok yavaşlamasın
    ballObj.vx *= FRICTION;
    ballObj.vy *= FRICTION;

    // Minimum hız kontrolü - top neredeyse durmasın
    if (Math.abs(ballObj.vx) < MIN_BALL_SPEED && Math.abs(ballObj.vx) > 0.1) {
      ballObj.vx = ballObj.vx > 0 ? MIN_BALL_SPEED : -MIN_BALL_SPEED;
    }
    if (Math.abs(ballObj.vy) < MIN_BALL_SPEED && Math.abs(ballObj.vy) > 0.1) {
      ballObj.vy = ballObj.vy > 0 ? MIN_BALL_SPEED : -MIN_BALL_SPEED;
    }

    // Masa sınırları
    if (ballObj.x <= TABLE_X + ballObj.radius) {
      ballObj.vx *= -BOUNCE;
      ballObj.x = TABLE_X + ballObj.radius;
      // Top çok yavaşsa hızlandır
      if (Math.abs(ballObj.vx) < MIN_BALL_SPEED) {
        ballObj.vx = MIN_BALL_SPEED * 2;
      }
    }
    if (ballObj.x >= TABLE_X + TABLE_WIDTH - ballObj.radius) {
      ballObj.vx *= -BOUNCE;
      ballObj.x = TABLE_X + TABLE_WIDTH - ballObj.radius;
      // Top çok yavaşsa hızlandır
      if (Math.abs(ballObj.vx) < MIN_BALL_SPEED) {
        ballObj.vx = -MIN_BALL_SPEED * 2;
      }
    }
    if (ballObj.y <= TABLE_Y + ballObj.radius) {
      ballObj.vy *= -BOUNCE;
      ballObj.y = TABLE_Y + ballObj.radius;
      // Top çok yavaşsa hızlandır
      if (Math.abs(ballObj.vy) < MIN_BALL_SPEED) {
        ballObj.vy = MIN_BALL_SPEED * 2;
      }
    }
    if (ballObj.y >= TABLE_Y + TABLE_HEIGHT - ballObj.radius) {
      ballObj.vy *= -BOUNCE;
      ballObj.y = TABLE_Y + TABLE_HEIGHT - ballObj.radius;
      // Top çok yavaşsa hızlandır
      if (Math.abs(ballObj.vy) < MIN_BALL_SPEED) {
        ballObj.vy = -MIN_BALL_SPEED * 2;
      }
    }

    // Oyuncular ile çarpışma
    rodsArray.forEach((rod) => {
      rod.players.forEach((player) => {
        if (
          ballObj.x + ballObj.radius >= player.x &&
          ballObj.x - ballObj.radius <= player.x + player.width &&
          ballObj.y + ballObj.radius >= player.y &&
          ballObj.y - ballObj.radius <= player.y + player.height
        ) {
          const dx = ballObj.x - (player.x + player.width / 2);
          const dy = ballObj.y - (player.y + player.height / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0) {
            const power = 8; // Çarpışma gücünü artırdım
            ballObj.vx = (dx / distance) * power;
            ballObj.vy = (dy / distance) * power;

            // Top çok yavaşsa hızlandır
            if (Math.abs(ballObj.vx) < MIN_BALL_SPEED) {
              ballObj.vx =
                ballObj.vx > 0 ? MIN_BALL_SPEED * 2 : -MIN_BALL_SPEED * 2;
            }
            if (Math.abs(ballObj.vy) < MIN_BALL_SPEED) {
              ballObj.vy =
                ballObj.vy > 0 ? MIN_BALL_SPEED * 2 : -MIN_BALL_SPEED * 2;
            }
          }
        }
      });
    });

    // Gol kontrolü - top gol alanına girdiğinde hemen gol
    if (
      ballObj.x <= TABLE_X + 20 && // Sol gol alanı - top gol alanına girdiğinde
      ballObj.y >= TABLE_Y + (TABLE_HEIGHT - 120) / 2 &&
      ballObj.y <= TABLE_Y + (TABLE_HEIGHT + 120) / 2
    ) {
      console.log("⚽ SOL GOL! Mavi takım gol attı!");
      scoreGoal(2);
    }

    if (
      ballObj.x >= TABLE_X + TABLE_WIDTH - 20 && // Sağ gol alanı - top gol alanına girdiğinde
      ballObj.y >= TABLE_Y + (TABLE_HEIGHT - 120) / 2 &&
      ballObj.y <= TABLE_Y + (TABLE_HEIGHT + 120) / 2
    ) {
      console.log("⚽ SAĞ GOL! Kırmızı takım gol attı!");
      scoreGoal(1);
    }

    // Top masadan çıktı mı kontrol et
    if (
      ballObj.x < TABLE_X - 50 ||
      ballObj.x > TABLE_X + TABLE_WIDTH + 50 ||
      ballObj.y < TABLE_Y - 50 ||
      ballObj.y > TABLE_Y + TABLE_HEIGHT + 50
    ) {
      resetBall();
    }

    // Multiplayer modda top pozisyonunu sürekli güncelle
    if (multiplayer && onGameStateUpdate && gameState.isPlaying) {
      onGameStateUpdate({
        ball: {
          x: ballObj.x,
          y: ballObj.y,
          vx: ballObj.vx,
          vy: ballObj.vy,
        },
        scores: {
          player1: gameState.player1Score,
          player2: gameState.player2Score,
        },
        isPlaying: gameState.isPlaying,
        lastUpdated: new Date(),
      });
    }
  };

  // Gol at
  const scoreGoal = (scoringTeam: number) => {
    console.log(`⚽ GOAL! Takım ${scoringTeam} gol attı!`);

    if (scoringTeam === 1) {
      setGameState((prev) => ({
        ...prev,
        player1Score: prev.player1Score + 1,
      }));
    } else {
      setGameState((prev) => ({
        ...prev,
        player2Score: prev.player2Score + 1,
      }));
    }

    // Multiplayer modda oyun durumunu güncelle
    if (multiplayer && onGameStateUpdate) {
      onGameStateUpdate({
        scores: {
          player1:
            scoringTeam === 1
              ? gameState.player1Score + 1
              : gameState.player1Score,
          player2:
            scoringTeam === 2
              ? gameState.player2Score + 1
              : gameState.player2Score,
        },
      });
    }

    resetBall();

    // Oyun bitti mi kontrol et
    if (gameState.player1Score >= 4 || gameState.player2Score >= 4) {
      endGame();
    }
  };

  // Topu sıfırla - rastgele sağa/sola
  const resetBall = () => {
    const randomSide = Math.random() > 0.5 ? 1 : -1; // 1: sağ, -1: sol
    const randomX = CANVAS_WIDTH / 2 + randomSide * (Math.random() * 100 + 50); // Ortadan 50-150 piksel uzakta

    ball.current.x = randomX;
    ball.current.y = TABLE_Y + TABLE_HEIGHT / 2;
    ball.current.vx = randomSide * (Math.random() * 2 + 1); // Rastgele hız ve yön
    ball.current.vy = (Math.random() - 0.5) * 2; // Dikey rastgele hareket
  };

  // Topu kurtar (sıkıştıysa)
  const rescueBall = () => {
    console.log("🚑 Top kurtarılıyor!");
    // Topu masanın ortasına, biraz yukarıya koy
    ball.current.x = CANVAS_WIDTH / 2;
    ball.current.y = TABLE_Y + TABLE_HEIGHT / 2 - 50;
    ball.current.vx = (Math.random() - 0.5) * 4; // Rastgele yön
    ball.current.vy = -3; // Yukarı doğru hafif hareket
  };

  // Oyunu bitir
  const endGame = () => {
    const winner = gameState.player1Score >= 4 ? 1 : 2;
    console.log(`🏆 OYUN BİTTİ! Takım ${winner} kazandı!`);

    setGameState((prev) => ({
      ...prev,
      isPlaying: false,
      winner,
    }));
  };

  // Oyunu çiz
  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas'ı temizle
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Arka plan
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Langırt masası
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(TABLE_X, TABLE_Y, TABLE_WIDTH, TABLE_HEIGHT);

    // Masa kenarlığı
    ctx.strokeStyle = "#654321";
    ctx.lineWidth = 3;
    ctx.strokeRect(TABLE_X, TABLE_Y, TABLE_WIDTH, TABLE_HEIGHT);

    // Orta çizgi
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(TABLE_X + TABLE_WIDTH / 2, TABLE_Y);
    ctx.lineTo(TABLE_X + TABLE_WIDTH / 2, TABLE_Y + TABLE_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Goller - doğru pozisyonlarda
    ctx.fillStyle = "#FF0000";
    // Sol gol - mavi kaleci çubuğunun arkasında, masanın dışında
    ctx.fillRect(TABLE_X - 40, TABLE_Y + (TABLE_HEIGHT - 120) / 2, 40, 120);
    // Sağ gol - kırmızı kaleci çubuğunun arkasında, masanın dışında (daha geride)
    ctx.fillRect(
      TABLE_X + TABLE_WIDTH + 20,
      TABLE_Y + (TABLE_HEIGHT - 120) / 2,
      40,
      120
    );

    // Rod'ları ve oyuncuları çiz
    rods.current.forEach((rod, index) => {
      // Rod çubuğu
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(rod.x, rod.y, rod.width, rod.height);

      // Seçili rod vurgusu
      if (selectedRod.current === index) {
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 3;
        ctx.strokeRect(rod.x - 2, rod.y - 2, rod.width + 4, rod.height + 4);
      }

      // Oyuncular
      rod.players.forEach((player) => {
        ctx.fillStyle = player.team === 1 ? "#0000FF" : "#FF0000";
        ctx.fillRect(player.x, player.y, player.width, player.height);

        // Oyuncu detayları
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(player.x + 5, player.y + 5, 5, 5);
        ctx.fillRect(player.x + 20, player.y + 5, 5, 5);
        ctx.fillRect(player.x + 5, player.y + 15, 5, 5);
        ctx.fillRect(player.x + 20, player.y + 15, 5, 5);
      });
    });

    // Topu çiz
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(
      ball.current.x,
      ball.current.y,
      ball.current.radius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Top gölgesi
    ctx.fillStyle = "#CCCCCC";
    ctx.beginPath();
    ctx.arc(
      ball.current.x + 1,
      ball.current.y + 1,
      ball.current.radius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Skor tablosu
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      `${gameState.player1Score} - ${gameState.player2Score}`,
      CANVAS_WIDTH / 2,
      30
    );

    // Takım bilgileri
    ctx.font = "16px Arial";
    ctx.fillText("Mavi Takım", TABLE_X + 100, 60);
    ctx.fillText("Kırmızı Takım", TABLE_X + TABLE_WIDTH - 100, 60);

    // Kontrol bilgileri
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Kontroller:", 20, CANVAS_HEIGHT - 120);
    ctx.fillText("←/→ veya A/D: Rod seç (Sol/Sağ)", 20, CANVAS_HEIGHT - 100);
    ctx.fillText("W/S: Yukarı/Aşağı", 20, CANVAS_HEIGHT - 80);
    ctx.fillText("Space: Vuruş", 20, CANVAS_HEIGHT - 60);

    // Seçili rod bilgisi
    if (selectedRod.current >= 0) {
      ctx.fillStyle = "#00FF00";
      ctx.font = "16px Arial";
      ctx.fillText(
        `Seçili Rod: ${selectedRod.current + 1}`,
        20,
        CANVAS_HEIGHT - 40
      );
    }

    // Oyun durumu
    if (!gameState.isPlaying && !gameState.winner) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = "white";
      ctx.font = "48px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        "Langırt Oyununu Başlat",
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2
      );

      ctx.font = "24px Arial";
      ctx.fillText(
        "Başlat butonuna tıkla",
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2 + 50
      );
    }

    if (gameState.winner) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = gameState.winner === 1 ? "#0000FF" : "#FF0000";
      ctx.font = "48px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        `TAKIM ${gameState.winner} KAZANDI!`,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2 - 50
      );

      ctx.fillStyle = "white";
      ctx.font = "24px Arial";
      ctx.fillText(
        `Final Skor: ${gameState.player1Score} - ${gameState.player2Score}`,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2
      );
      ctx.fillText(
        "Tekrar oynamak için Reset butonuna tıkla",
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2 + 50
      );
    }
  };

  // Ana oyun döngüsü
  const gameLoop = () => {
    if (gameState.isPlaying) {
      updateGame();
      renderGame();
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  };

  // Component mount olduğunda oyunu hazırla
  useEffect(() => {
    resetGame();
    console.log("🎮 Component mount oldu, oyun hazırlanıyor...");
  }, []);

  // Multiplayer oyun durumu senkronizasyonu
  useEffect(() => {
    if (multiplayer && externalGameState) {
      console.log("🔄 Multiplayer senkronizasyon:", externalGameState);
      console.log("📊 Mevcut local gameState:", gameState);

      // Dış oyun durumundan güncelle
      if (externalGameState.ball) {
        console.log("⚽ Top pozisyonu güncelleniyor:", externalGameState.ball);
        ball.current = {
          x: externalGameState.ball.x,
          y: externalGameState.ball.y,
          vx: externalGameState.ball.vx,
          vy: externalGameState.ball.vy,
          radius: 6,
        };
      }

      if (externalGameState.scores) {
        console.log("📈 Skor güncelleniyor:", externalGameState.scores);
        setGameState((prev) => ({
          ...prev,
          player1Score: externalGameState?.scores?.player1 ?? 0,
          player2Score: externalGameState?.scores?.player2 ?? 0,
        }));
      }

      // Oyun durumunu güncelle - BU ÇOK ÖNEMLİ!
      if (externalGameState.isPlaying !== undefined) {
        console.log(
          "🎮 Oyun durumu güncelleniyor:",
          externalGameState.isPlaying,
          "Mevcut durum:",
          gameState.isPlaying
        );

        // Her zaman güncelle (senkronizasyon için)
        setGameState((prev) => ({
          ...prev,
          isPlaying: externalGameState.isPlaying,
        }));

        console.log("✅ Oyun durumu güncellendi:", externalGameState.isPlaying);

        // Eğer oyun başlatılıyorsa, top pozisyonunu da sıfırla
        if (externalGameState.isPlaying && externalGameState.ball) {
          console.log("🎯 Oyun başladı, top pozisyonu sıfırlanıyor");
          ball.current = {
            x: externalGameState.ball.x,
            y: externalGameState.ball.y,
            vx: externalGameState.ball.vx,
            vy: externalGameState.ball.vy,
            radius: 6,
          };
        }
      }
    }
  }, [multiplayer, externalGameState]);

  // Multiplayer modda sürekli oyun durumunu güncelle - SADECE KENDİ TAKIMINDA
  useEffect(() => {
    if (!multiplayer || !onGameStateUpdate) return;

    const interval = setInterval(() => {
      // Sadece kendi takımının oyun durumunu güncelle
      if (gameState.isPlaying) {
        onGameStateUpdate({
          ball: {
            x: ball.current.x,
            y: ball.current.y,
            vx: ball.current.vx,
            vy: ball.current.vy,
          },
          scores: {
            player1: gameState.player1Score,
            player2: gameState.player2Score,
          },
          isPlaying: gameState.isPlaying,
          lastUpdated: new Date(),
        });
      }
    }, 100); // 100ms'de bir güncelle (10 FPS) - daha az sıklıkta

    return () => clearInterval(interval);
  }, [
    multiplayer,
    onGameStateUpdate,
    gameState.player1Score,
    gameState.player2Score,
    gameState.isPlaying,
  ]);

  // Oyun durumu değiştiğinde gameLoop'u başlat/durdur
  useEffect(() => {
    console.log(
      "🎮 Oyun durumu değişti:",
      gameState.isPlaying,
      "Multiplayer:",
      multiplayer
    );

    if (gameState.isPlaying) {
      console.log("🚀 Oyun başladı, gameLoop başlatılıyor...");
      gameLoop();
    } else {
      console.log("⏸️ Oyun durdu, gameLoop durduruluyor...");
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [gameState.isPlaying, multiplayer]);

  // Component unmount olduğunda temizlik
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardBody className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            🏓 Langırt Oyunu
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gerçek langırt masası! İki takım, 8 rod ve gerçekçi oyun deneyimi!
          </p>
        </div>

        {/* Oyun Kontrolleri */}
        <div className="flex justify-center gap-4 mb-6">
          <Button
            color="primary"
            variant="flat"
            onPress={startGame}
            isDisabled={gameState.isPlaying}
            startContent={<Play size={20} />}
          >
            Başlat
          </Button>

          <Button
            color="warning"
            variant="flat"
            onPress={pauseGame}
            isDisabled={!gameState.isPlaying}
            startContent={<Pause size={20} />}
          >
            Duraklat
          </Button>

          <Button
            color="secondary"
            variant="flat"
            onPress={resetGame}
            startContent={<RotateCcw size={20} />}
          >
            Sıfırla
          </Button>

          <Button
            color="success"
            variant="flat"
            onPress={rescueBall}
            startContent={<Trophy size={20} />}
          >
            Topu Kurtar
          </Button>
        </div>

        {/* Oyun Canvas */}
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>

        {/* Oyun Talimatları */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
            🎮 Langırt Kontrolleri:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <p>
                <strong>←/→ veya A/D:</strong> Rod seç (Sol/Sağ ok tuşları veya
                A/D tuşları ile)
              </p>
              <p>
                <strong>W / Yukarı Ok:</strong> Seçili rod&apos;u yukarı hareket
                ettir
              </p>
              <p>
                <strong>S / Aşağı Ok:</strong> Seçili rod&apos;u aşağı hareket
                ettir
              </p>
              <p>
                <strong>Space:</strong> Topa vur
              </p>
            </div>
            <div>
              <p>
                <strong>🎯 Hedef:</strong> Topu karşı takımın kalesine at
              </p>
              <p>
                <strong>🏆 Skor:</strong> İlk 4 golü atan takım kazanır
              </p>
              <p>
                <strong>⚽ Fizik:</strong> Gerçekçi top hareketi ve çarpışma
              </p>
            </div>
          </div>
        </div>

        {/* Gelecek Özellikler */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold mb-2 text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Users size={20} />
            Gelecek Özellikler
          </h3>
          <p className="text-blue-600 dark:text-blue-400 text-sm">
            🔥 Firebase ile çok oyunculu mod • 🏆 Liderlik tablosu • 🎨 Özel
            temalar • 💪 Güçlendiriciler • 🌟 Başarım sistemi • 🤖 AI rakip
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
