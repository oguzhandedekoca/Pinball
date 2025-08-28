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

  // 2. oyuncu için smooth interpolation
  const targetBall = useRef<Ball>({
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
  const GRAVITY = 0.04; // Yerçekimini biraz daha azalttım
  const FRICTION = 0.997; // Sürtünmeyi artırdım - top biraz daha yavaş
  const BOUNCE = 0.75; // Zıplamayı azalttım
  const MIN_BALL_SPEED = 0.4; // Minimum top hızını düşürdüm

  // Oyunu başlat
  const startGame = () => {
    console.log("🎮 Oyun başlatılıyor...");
    setGameState((prev) => ({ ...prev, isPlaying: true }));

    // Multiplayer modda oyun durumunu güncelle
    if (multiplayer && onGameStateUpdate) {
      onGameStateUpdate({
        isPlaying: true,
        player1Score: gameState.player1Score,
        player2Score: gameState.player2Score,
        winner: null,
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
    const ballResetData = resetBallAndGetData();
    ball.current = {
      ...ballResetData,
      radius: 6,
    };

    // Target ball'u da aynı pozisyona ayarla
    targetBall.current = {
      ...ballResetData,
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
        scores: {
          player1: 0,
          player2: 0,
        },
        ball: ballResetData,
        lastUpdated: new Date(),
      });
    }
  };

  // Rod'ları oluştur
  const createRods = () => {
    const newRods: Rod[] = [];

    // Gerçek langırt taktiği - dengeli dizilim
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
        x: TABLE_X + 120,
        y: TABLE_Y + 50,
        width: 8,
        height: 300,
        team: 1 as const,
        rodIndex: 1,
      },
      // 3. Kırmızı Forvet (3 oyuncu)
      {
        x: TABLE_X + 190,
        y: TABLE_Y + 50,
        width: 8,
        height: 300,
        team: 2 as const,
        rodIndex: 2,
      },
      // 4. Mavi Orta Saha (4 oyuncu) - Daha geri çekildi
      {
        x: TABLE_X + 280,
        y: TABLE_Y + 50,
        width: 8,
        height: 300,
        team: 1 as const,
        rodIndex: 3,
      },
      // 5. Kırmızı Orta Saha (4 oyuncu)
      {
        x: TABLE_X + 420,
        y: TABLE_Y + 50,
        width: 8,
        height: 300,
        team: 2 as const,
        rodIndex: 4,
      },
      // 6. Mavi Forvet (3 oyuncu)
      {
        x: TABLE_X + 500,
        y: TABLE_Y + 50,
        width: 8,
        height: 300,
        team: 1 as const,
        rodIndex: 5,
      },
      // 7. Kırmızı Defans (3 oyuncu) - Daha geri çekildi, kaleciden uzaklaştırıldı
      {
        x: TABLE_X + 570,
        y: TABLE_Y + 50,
        width: 8,
        height: 300,
        team: 2 as const,
        rodIndex: 6,
      },
      // 8. Kırmızı Kaleci (1 oyuncu) - Defanstan daha uzak
      {
        x: TABLE_X + 640,
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
        let playerY;

        // Kaleciler için özel pozisyon - kalenin ortasında
        if (playerCount === 1) {
          // Kaleci - tam ortada
          playerY = rodConfig.y + rodConfig.height / 2 - 15; // Oyuncu boyutunun yarısı kadar yukarı
        } else {
          // Diğer oyuncular - eşit aralıklarla dağıt
          const spacing = (rodConfig.height - 100) / (playerCount - 1); // Üst ve alt boşluk bırak
          playerY = rodConfig.y + 50 + i * spacing;
        }

        players.push({
          x: rodConfig.x - 20, // Biraz daha büyük rod genişliği
          y: playerY,
          width: 40, // Daha büyük oyuncular
          height: 30, // Daha büyük oyuncular
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
        // Multiplayer modda sadece kendi takımının rod'larını seç
        if (multiplayer && myTeam) {
          const myRods = rods.current.filter((rod) => rod.team === myTeam);
          const currentIndex = myRods.findIndex(
            (rod) => rod.rodIndex === selectedRod.current
          );
          const nextIndex = Math.max(0, currentIndex - 1);
          selectedRod.current =
            myRods[nextIndex]?.rodIndex || myRods[0]?.rodIndex || 0;
        } else {
          selectedRod.current = Math.max(0, selectedRod.current - 1);
        }
        console.log(`🎯 Rod ${selectedRod.current + 1} seçildi (Sol)`);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        // Multiplayer modda sadece kendi takımının rod'larını seç
        if (multiplayer && myTeam) {
          const myRods = rods.current.filter((rod) => rod.team === myTeam);
          const currentIndex = myRods.findIndex(
            (rod) => rod.rodIndex === selectedRod.current
          );
          const nextIndex = Math.min(myRods.length - 1, currentIndex + 1);
          selectedRod.current =
            myRods[nextIndex]?.rodIndex || myRods[0]?.rodIndex || 0;
        } else {
          selectedRod.current = Math.min(7, selectedRod.current + 1);
        }
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

    // Multiplayer modda SADECE 1. OYUNCU (HOST) top fiziğini hesaplar
    const isHost = !multiplayer || myTeam === 1;

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

      // Vuruş - multiplayer modda sadece kendi rod'unu kontrol et
      if (
        keys.current[" "] &&
        (!multiplayer || selectedRodObj.team === myTeam)
      ) {
        selectedRodObj.players.forEach((player) => {
          const dx = ballObj.x - (player.x + player.width / 2);
          const dy = ballObj.y - (player.y + player.height / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 40) {
            // Vuruş alanını genişlet
            const power = 8; // Vuruş gücünü biraz azalttım

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
              power,
              "Multiplayer:",
              multiplayer,
              "MyTeam:",
              myTeam
            );
          }
        });
      }
    }

    // Top fiziği - HOST ve CLIENT farklı işlemler yapar
    if (isHost) {
      // HOST: Normal fizik hesaplaması
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
    } else if (multiplayer && myTeam === 2) {
      // CLIENT: Responsive interpolation ile hedef pozisyona yaklaş
      const distance = Math.sqrt(
        Math.pow(targetBall.current.x - ballObj.x, 2) +
          Math.pow(targetBall.current.y - ballObj.y, 2)
      );

      // Mesafeye göre adaptif interpolation - uzaksa hızlı, yakınsa yumuşak
      let lerpFactor;
      if (distance > 100) {
        // Çok büyük farklılıklar (reset, çarpışma) - anlık snap
        lerpFactor = 1.0;
      } else if (distance > 30) {
        lerpFactor = 0.7; // Uzaksa hızlı yakalama
      } else if (distance > 10) {
        lerpFactor = 0.4; // Orta mesafede responsive
      } else {
        lerpFactor = 0.2; // Yakınsa smooth
      }

      // Pozisyon güncelleme
      ballObj.x += (targetBall.current.x - ballObj.x) * lerpFactor;
      ballObj.y += (targetBall.current.y - ballObj.y) * lerpFactor;

      // Hız değişiklikleri için daha agresif güncelleme (vuruş, çarpışma için)
      const velocityDiff = Math.sqrt(
        Math.pow(targetBall.current.vx - ballObj.vx, 2) +
          Math.pow(targetBall.current.vy - ballObj.vy, 2)
      );

      const velocityLerpFactor = velocityDiff > 5 ? 0.8 : lerpFactor;
      ballObj.vx += (targetBall.current.vx - ballObj.vx) * velocityLerpFactor;
      ballObj.vy += (targetBall.current.vy - ballObj.vy) * velocityLerpFactor;
    }

    // Masa sınırları - SADECE HOST hesaplar
    if (isHost) {
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
    }

    // Oyuncular ile çarpışma - SADECE HOST hesaplar
    if (isHost) {
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
              const power = 6; // Çarpışma gücünü azalttım
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
    }

    // Gol kontrolü ve diğer oyun olayları - SADECE HOST kontrol eder
    if (isHost) {
      // Gol kontrolü - top gol alanına girdiğinde hemen gol
      if (
        ballObj.x <= TABLE_X + 20 && // Sol gol alanı - Mavi takımın kalesi
        ballObj.y >= TABLE_Y + (TABLE_HEIGHT - 120) / 2 &&
        ballObj.y <= TABLE_Y + (TABLE_HEIGHT + 120) / 2
      ) {
        console.log("⚽ SOL GOL! Kırmızı takım gol attı! (Mavi kaleye)");
        scoreGoal(2); // Kırmızı takım puanı
      }

      if (
        ballObj.x >= TABLE_X + TABLE_WIDTH - 20 && // Sağ gol alanı - Kırmızı takımın kalesi
        ballObj.y >= TABLE_Y + (TABLE_HEIGHT - 120) / 2 &&
        ballObj.y <= TABLE_Y + (TABLE_HEIGHT + 120) / 2
      ) {
        console.log("⚽ SAĞ GOL! Mavi takım gol attı! (Kırmızı kaleye)");
        scoreGoal(1); // Mavi takım puanı
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
    }

    // Multiplayer modda top pozisyonunu sürekli güncelle - SADECE HOST
    if (multiplayer && onGameStateUpdate && gameState.isPlaying && isHost) {
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

    const newPlayer1Score =
      scoringTeam === 1 ? gameState.player1Score + 1 : gameState.player1Score;
    const newPlayer2Score =
      scoringTeam === 2 ? gameState.player2Score + 1 : gameState.player2Score;

    // State'i güncelle
    setGameState((prev) => ({
      ...prev,
      player1Score: newPlayer1Score,
      player2Score: newPlayer2Score,
    }));

    // Topu sıfırla
    const resetBallData = resetBallAndGetData();

    // Multiplayer modda oyun durumunu güncelle (top pozisyonu dahil) - SADECE HOST
    if (multiplayer && onGameStateUpdate && (!myTeam || myTeam === 1)) {
      console.log("📊 Skor güncelleniyor:", {
        newPlayer1Score,
        newPlayer2Score,
        scoringTeam,
      });
      onGameStateUpdate({
        player1Score: newPlayer1Score,
        player2Score: newPlayer2Score,
        scores: {
          player1: newPlayer1Score,
          player2: newPlayer2Score,
        },
        ball: resetBallData,
        lastUpdated: new Date(),
      });
    }

    // Oyun bitti mi kontrol et
    if (newPlayer1Score >= 4 || newPlayer2Score >= 4) {
      endGame();
    }
  };

  // Topu sıfırla ve veri döndür - multiplayer için
  const resetBallAndGetData = () => {
    const randomSide = Math.random() > 0.5 ? 1 : -1; // 1: sağ, -1: sol
    const randomX = CANVAS_WIDTH / 2 + randomSide * (Math.random() * 100 + 50); // Ortadan 50-150 piksel uzakta
    const vx = randomSide * (Math.random() * 2 + 1); // Rastgele hız ve yön
    const vy = (Math.random() - 0.5) * 2; // Dikey rastgele hareket

    ball.current.x = randomX;
    ball.current.y = TABLE_Y + TABLE_HEIGHT / 2;
    ball.current.vx = vx;
    ball.current.vy = vy;

    return {
      x: randomX,
      y: TABLE_Y + TABLE_HEIGHT / 2,
      vx: vx,
      vy: vy,
    };
  };

  // Topu sıfırla - rastgele sağa/sola (eski fonksiyon)
  const resetBall = () => {
    resetBallAndGetData();
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

    // Arka plan - güzel gradient
    const backgroundGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    backgroundGradient.addColorStop(0, "#0f1419");
    backgroundGradient.addColorStop(0.5, "#1a2332");
    backgroundGradient.addColorStop(1, "#0f1419");
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Langırt masası - daha güzel gradient
    const tableGradient = ctx.createLinearGradient(
      TABLE_X,
      TABLE_Y,
      TABLE_X,
      TABLE_Y + TABLE_HEIGHT
    );
    tableGradient.addColorStop(0, "#2d8659");
    tableGradient.addColorStop(0.5, "#228B22");
    tableGradient.addColorStop(1, "#1e7a1e");
    ctx.fillStyle = tableGradient;
    ctx.fillRect(TABLE_X, TABLE_Y, TABLE_WIDTH, TABLE_HEIGHT);

    // Masa kenarlığı - daha güzel
    ctx.strokeStyle = "#8B4513";
    ctx.lineWidth = 4;
    ctx.strokeRect(TABLE_X, TABLE_Y, TABLE_WIDTH, TABLE_HEIGHT);

    // İç kenarlık
    ctx.strokeStyle = "#654321";
    ctx.lineWidth = 2;
    ctx.strokeRect(TABLE_X + 2, TABLE_Y + 2, TABLE_WIDTH - 4, TABLE_HEIGHT - 4);

    // Orta çizgi - daha belirgin
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(TABLE_X + TABLE_WIDTH / 2, TABLE_Y + 10);
    ctx.lineTo(TABLE_X + TABLE_WIDTH / 2, TABLE_Y + TABLE_HEIGHT - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // Orta daire
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      TABLE_X + TABLE_WIDTH / 2,
      TABLE_Y + TABLE_HEIGHT / 2,
      40,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    // Goller - daha güzel tasarım
    const goalGradient1 = ctx.createLinearGradient(
      TABLE_X - 40,
      TABLE_Y,
      TABLE_X,
      TABLE_Y
    );
    goalGradient1.addColorStop(0, "#FF4444");
    goalGradient1.addColorStop(1, "#CC0000");

    const goalGradient2 = ctx.createLinearGradient(
      TABLE_X + TABLE_WIDTH,
      TABLE_Y,
      TABLE_X + TABLE_WIDTH + 60,
      TABLE_Y
    );
    goalGradient2.addColorStop(0, "#CC0000");
    goalGradient2.addColorStop(1, "#FF4444");

    // Sol gol - Mavi takımın kalesi
    ctx.fillStyle = goalGradient1;
    ctx.fillRect(TABLE_X - 40, TABLE_Y + (TABLE_HEIGHT - 120) / 2, 40, 120);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.strokeRect(TABLE_X - 40, TABLE_Y + (TABLE_HEIGHT - 120) / 2, 40, 120);

    // Sağ gol - Kırmızı takımın kalesi
    ctx.fillStyle = goalGradient2;
    ctx.fillRect(
      TABLE_X + TABLE_WIDTH,
      TABLE_Y + (TABLE_HEIGHT - 120) / 2,
      60,
      120
    );
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.strokeRect(
      TABLE_X + TABLE_WIDTH,
      TABLE_Y + (TABLE_HEIGHT - 120) / 2,
      60,
      120
    );

    // Gol ağları - detay için
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    // Sol gol ağı
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(TABLE_X - 40, TABLE_Y + (TABLE_HEIGHT - 120) / 2 + i * 20);
      ctx.lineTo(TABLE_X, TABLE_Y + (TABLE_HEIGHT - 120) / 2 + i * 20);
      ctx.stroke();
    }
    // Sağ gol ağı
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(
        TABLE_X + TABLE_WIDTH,
        TABLE_Y + (TABLE_HEIGHT - 120) / 2 + i * 20
      );
      ctx.lineTo(
        TABLE_X + TABLE_WIDTH + 60,
        TABLE_Y + (TABLE_HEIGHT - 120) / 2 + i * 20
      );
      ctx.stroke();
    }

    // Rod'ları ve oyuncuları çiz
    rods.current.forEach((rod, index) => {
      // Rod çubuğu - metalik görünüm
      const rodGradient = ctx.createLinearGradient(
        rod.x,
        rod.y,
        rod.x + rod.width,
        rod.y
      );
      rodGradient.addColorStop(0, "#FFED4A");
      rodGradient.addColorStop(0.3, "#FFD700");
      rodGradient.addColorStop(0.7, "#FFD700");
      rodGradient.addColorStop(1, "#B8860B");
      ctx.fillStyle = rodGradient;
      ctx.fillRect(rod.x, rod.y, rod.width, rod.height);

      // Rod sınır çizgisi
      ctx.strokeStyle = "#B8860B";
      ctx.lineWidth = 1;
      ctx.strokeRect(rod.x, rod.y, rod.width, rod.height);

      // Seçili rod vurgusu - daha güzel ve belirgin
      if (selectedRod.current === index) {
        // Parlayan efekt için gradient
        const gradient = ctx.createLinearGradient(
          rod.x - 5,
          rod.y - 5,
          rod.x + rod.width + 5,
          rod.y + rod.height + 5
        );
        gradient.addColorStop(0, "#00FF88");
        gradient.addColorStop(0.5, "#00FF00");
        gradient.addColorStop(1, "#00DD66");

        // Ana vurgu çerçevesi
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.strokeRect(rod.x - 3, rod.y - 3, rod.width + 6, rod.height + 6);

        // İkinci parlayan çerçeve
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(rod.x - 5, rod.y - 5, rod.width + 10, rod.height + 10);

        // Glow efekti
        ctx.shadowColor = "#00FF00";
        ctx.shadowBlur = 10;
        ctx.strokeRect(rod.x - 1, rod.y - 1, rod.width + 2, rod.height + 2);
        ctx.shadowBlur = 0; // Shadow'u sıfırla
      }

      // Oyuncular - daha güzel tasarım
      rod.players.forEach((player) => {
        // Ana oyuncu gövdesi - gradient renk
        const playerGradient = ctx.createLinearGradient(
          player.x,
          player.y,
          player.x,
          player.y + player.height
        );
        if (player.team === 1) {
          playerGradient.addColorStop(0, "#4A90E2");
          playerGradient.addColorStop(1, "#2E5C8A");
        } else {
          playerGradient.addColorStop(0, "#E24A4A");
          playerGradient.addColorStop(1, "#B83E3E");
        }

        ctx.fillStyle = playerGradient;
        ctx.fillRect(player.x, player.y, player.width, player.height);

        // Oyuncu sınır çizgisi
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(player.x, player.y, player.width, player.height);

        // Oyuncu yüzü ve detayları - daha büyük
        ctx.fillStyle = "#FFFFFF";
        // Gözler
        ctx.fillRect(player.x + 8, player.y + 8, 6, 6);
        ctx.fillRect(player.x + 26, player.y + 8, 6, 6);
        // Gülümseme
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + 20, 8, 0, Math.PI);
        ctx.stroke();

        // Takım numarası
        ctx.fillStyle = "#FFFF00";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          player.team.toString(),
          player.x + player.width / 2,
          player.y + player.height - 3
        );
      });
    });

    // Topu çiz - daha güzel tasarım
    const ballGradient = ctx.createRadialGradient(
      ball.current.x - 2,
      ball.current.y - 2,
      0,
      ball.current.x,
      ball.current.y,
      ball.current.radius
    );
    ballGradient.addColorStop(0, "#FFFFFF");
    ballGradient.addColorStop(0.7, "#F0F0F0");
    ballGradient.addColorStop(1, "#D0D0D0");

    // Gölge önce
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.arc(
      ball.current.x + 2,
      ball.current.y + 2,
      ball.current.radius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Ana top
    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(
      ball.current.x,
      ball.current.y,
      ball.current.radius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Top sınır çizgisi
    ctx.strokeStyle = "#999999";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Top üzerinde küçük parlama efekti
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(ball.current.x - 1.5, ball.current.y - 1.5, 1.5, 0, Math.PI * 2);
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

    // Multiplayer modda başlangıç rod'u seçimi
    if (multiplayer && myTeam) {
      const myRods = rods.current.filter((rod) => rod.team === myTeam);
      if (myRods.length > 0) {
        selectedRod.current = myRods[0].rodIndex;
        console.log(
          `🎯 Başlangıç rod'u seçildi: ${
            selectedRod.current + 1
          } (Takım ${myTeam})`
        );
      }
    }

    console.log("🎮 Component mount oldu, oyun hazırlanıyor...");
  }, [multiplayer, myTeam]);

  // Multiplayer oyun durumu senkronizasyonu
  useEffect(() => {
    if (multiplayer && externalGameState) {
      console.log("🔄 Multiplayer senkronizasyon:", {
        external: externalGameState,
        local: gameState,
        myTeam,
      });

      // Dış oyun durumundan güncelle - SADECE CLIENT (2. oyuncu) top pozisyonunu alır
      if (externalGameState.ball && (!multiplayer || myTeam === 2)) {
        console.log(
          "⚽ Top hedef pozisyonu güncelleniyor (Client):",
          externalGameState.ball
        );
        // Smooth interpolation için hedef pozisyonu ayarla + predictive tracking
        const networkDelay = 0.05; // Tahmini 50ms network gecikmesi
        const predictedX =
          externalGameState.ball.x + externalGameState.ball.vx * networkDelay;
        const predictedY =
          externalGameState.ball.y + externalGameState.ball.vy * networkDelay;

        targetBall.current = {
          x: predictedX,
          y: predictedY,
          vx: externalGameState.ball.vx,
          vy: externalGameState.ball.vy,
          radius: 6,
        };
      }

      // Skorları güncelle
      let shouldUpdateScore = false;
      const newState = { ...gameState };

      if (externalGameState.scores) {
        console.log("📈 Skor güncelleniyor:", externalGameState.scores);
        if (
          newState.player1Score !== externalGameState.scores.player1 ||
          newState.player2Score !== externalGameState.scores.player2
        ) {
          newState.player1Score = externalGameState.scores.player1;
          newState.player2Score = externalGameState.scores.player2;
          shouldUpdateScore = true;
        }
      }

      // Oyun durumunu güncelle - BU ÇOK ÖNEMLİ!
      if (externalGameState.isPlaying !== undefined) {
        console.log(
          "🎮 Oyun durumu güncelleniyor:",
          "Dış:",
          externalGameState.isPlaying,
          "Mevcut:",
          gameState.isPlaying,
          "Benim takımım:",
          myTeam
        );

        if (newState.isPlaying !== externalGameState.isPlaying) {
          newState.isPlaying = externalGameState.isPlaying;
          shouldUpdateScore = true;

          console.log(
            "✅ Oyun durumu güncellendi:",
            externalGameState.isPlaying
          );

          // Eğer oyun başlatılıyorsa ve client ise, top pozisyonunu da sıfırla
          if (
            externalGameState.isPlaying &&
            externalGameState.ball &&
            myTeam === 2
          ) {
            console.log("🎯 Oyun başladı, top pozisyonu sıfırlanıyor (Client)");
            const ballData = {
              x: externalGameState.ball.x,
              y: externalGameState.ball.y,
              vx: externalGameState.ball.vx,
              vy: externalGameState.ball.vy,
              radius: 6,
            };

            // Hem current hem de target'ı aynı pozisyona ayarla (anlık reset için)
            ball.current = ballData;
            targetBall.current = ballData;
          }
        }
      }

      // Winner durumunu kontrol et
      if (
        externalGameState.winner !== undefined &&
        newState.winner !== externalGameState.winner
      ) {
        newState.winner = externalGameState.winner;
        shouldUpdateScore = true;
      }

      // Eğer değişiklik varsa state'i güncelle
      if (shouldUpdateScore) {
        console.log("🔄 Local state güncelleniyor:", newState);
        setGameState(newState);
      }
    }
  }, [multiplayer, externalGameState, myTeam]);

  // Multiplayer modda sürekli oyun durumunu güncelle - SADECE 1. OYUNCU
  useEffect(() => {
    if (
      !multiplayer ||
      !onGameStateUpdate ||
      !gameState.isPlaying ||
      myTeam !== 1
    )
      return;

    const interval = setInterval(() => {
      // Sadece 1. oyuncu (mavi takım) oyun durumunu sürekli günceller
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
        player1Score: gameState.player1Score,
        player2Score: gameState.player2Score,
        winner: gameState.winner,
        lastUpdated: new Date(),
      });
    }, 33); // 33ms'de bir güncelle (30 FPS) - Daha responsive tracking

    return () => clearInterval(interval);
  }, [
    multiplayer,
    onGameStateUpdate,
    gameState.player1Score,
    gameState.player2Score,
    gameState.isPlaying,
    gameState.winner,
    myTeam,
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
