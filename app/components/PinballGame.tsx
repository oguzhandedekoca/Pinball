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
  rodPositions?: { x: number; y: number }[][];
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

  // Canvas boyutları - Daha büyük ve modern
  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 700;
  const TABLE_WIDTH = 900;
  const TABLE_HEIGHT = 500;
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

    // Gerçek langırt taktiği - büyük saha için ölçeklenmiş
    const allRods = [
      // 1. Mavi Kaleci (1 oyuncu)
      {
        x: TABLE_X + 60,
        y: TABLE_Y + 60,
        width: 10,
        height: 380,
        team: 1 as const,
        rodIndex: 0,
      },
      // 2. Mavi Defans (3 oyuncu)
      {
        x: TABLE_X + 150,
        y: TABLE_Y + 60,
        width: 10,
        height: 380,
        team: 1 as const,
        rodIndex: 1,
      },
      // 3. Kırmızı Forvet (3 oyuncu)
      {
        x: TABLE_X + 240,
        y: TABLE_Y + 60,
        width: 10,
        height: 380,
        team: 2 as const,
        rodIndex: 2,
      },
      // 4. Mavi Orta Saha (4 oyuncu)
      {
        x: TABLE_X + 350,
        y: TABLE_Y + 60,
        width: 10,
        height: 380,
        team: 1 as const,
        rodIndex: 3,
      },
      // 5. Kırmızı Orta Saha (4 oyuncu)
      {
        x: TABLE_X + 550,
        y: TABLE_Y + 60,
        width: 10,
        height: 380,
        team: 2 as const,
        rodIndex: 4,
      },
      // 6. Mavi Forvet (3 oyuncu)
      {
        x: TABLE_X + 660,
        y: TABLE_Y + 60,
        width: 10,
        height: 380,
        team: 1 as const,
        rodIndex: 5,
      },
      // 7. Kırmızı Defans (3 oyuncu)
      {
        x: TABLE_X + 750,
        y: TABLE_Y + 60,
        width: 10,
        height: 380,
        team: 2 as const,
        rodIndex: 6,
      },
      // 8. Kırmızı Kaleci (1 oyuncu)
      {
        x: TABLE_X + 840,
        y: TABLE_Y + 60,
        width: 10,
        height: 380,
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
          x: rodConfig.x - 25, // Büyük saha için daha büyük oyuncular
          y: playerY,
          width: 50, // Daha büyük oyuncular
          height: 35, // Daha büyük oyuncular
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
    const isEditableTarget = (target: EventTarget | null): boolean => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      if (el.isContentEditable) return true;
      const tag = (el.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select")
        return true;
      return !!el.closest("input, textarea, select, [contenteditable='true']");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Eğer kullanıcı bir input/textarea/select içinde yazıyorsa oyunu tetikleme
      if (isEditableTarget(e.target)) return;
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
      if (isEditableTarget(e.target)) return;
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
      let rodMoved = false;

      if (keys.current["w"] || keys.current["ArrowUp"]) {
        // Tüm oyuncuları aynı anda yukarı hareket ettir
        const canMoveUp = selectedRodObj.players[0].y > TABLE_Y + 20;
        if (canMoveUp) {
          selectedRodObj.players.forEach((player) => {
            player.y -= 4; // Biraz daha hızlı hareket
          });
          rodMoved = true;
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
            player.y += 4; // Biraz daha hızlı hareket
          });
          rodMoved = true;
        }
      }

      // Multiplayer modda rod hareketini güncelle - NO THROTTLE (ultra responsive)
      if (rodMoved && multiplayer && onGameStateUpdate) {
        const rodPositions = rodsArray.map((rod) =>
          rod.players.map((player) => ({ x: player.x, y: player.y }))
        );

        // Rod hareketlerini ANINDA gönder - throttle yok!
        onGameStateUpdate({
          rodPositions: rodPositions,
          lastUpdated: new Date(),
        });
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

      // Mesafeye göre adaptif interpolation - biraz daha hızlı
      let lerpFactor;
      if (distance > 100) {
        // Çok büyük farklılıklar (reset, çarpışma) - anlık snap
        lerpFactor = 1.0;
      } else if (distance > 30) {
        lerpFactor = 0.8; // Uzaksa daha hızlı yakalama
      } else if (distance > 10) {
        lerpFactor = 0.6; // Orta mesafede daha responsive
      } else {
        lerpFactor = 0.4; // Yakınsa biraz daha hızlı
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

    // Masa sınırları - SADECE HOST hesaplar (gol alanları hariç)
    if (isHost) {
      const GOAL_HEIGHT = 160;
      const leftGoalY = TABLE_Y + (TABLE_HEIGHT - GOAL_HEIGHT) / 2;
      const rightGoalY = TABLE_Y + (TABLE_HEIGHT - GOAL_HEIGHT) / 2;

      // Sol kenar - gol alanı dışında
      if (ballObj.x <= TABLE_X + ballObj.radius) {
        // Eğer gol alanında değilse zıpla
        if (ballObj.y < leftGoalY || ballObj.y > leftGoalY + GOAL_HEIGHT) {
          ballObj.vx *= -BOUNCE;
          ballObj.x = TABLE_X + ballObj.radius;
          if (Math.abs(ballObj.vx) < MIN_BALL_SPEED) {
            ballObj.vx = MIN_BALL_SPEED * 2;
          }
        }
      }

      // Sağ kenar - gol alanı dışında
      if (ballObj.x >= TABLE_X + TABLE_WIDTH - ballObj.radius) {
        // Eğer gol alanında değilse zıpla
        if (ballObj.y < rightGoalY || ballObj.y > rightGoalY + GOAL_HEIGHT) {
          ballObj.vx *= -BOUNCE;
          ballObj.x = TABLE_X + TABLE_WIDTH - ballObj.radius;
          if (Math.abs(ballObj.vx) < MIN_BALL_SPEED) {
            ballObj.vx = -MIN_BALL_SPEED * 2;
          }
        }
      }

      // Üst ve alt kenarlar
      if (ballObj.y <= TABLE_Y + ballObj.radius) {
        ballObj.vy *= -BOUNCE;
        ballObj.y = TABLE_Y + ballObj.radius;
        if (Math.abs(ballObj.vy) < MIN_BALL_SPEED) {
          ballObj.vy = MIN_BALL_SPEED * 2;
        }
      }
      if (ballObj.y >= TABLE_Y + TABLE_HEIGHT - ballObj.radius) {
        ballObj.vy *= -BOUNCE;
        ballObj.y = TABLE_Y + TABLE_HEIGHT - ballObj.radius;
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
      // Gol kontrolü - daha esnek gol alanı
      const GOAL_HEIGHT = 160;
      const leftGoalY = TABLE_Y + (TABLE_HEIGHT - GOAL_HEIGHT) / 2;
      const rightGoalY = TABLE_Y + (TABLE_HEIGHT - GOAL_HEIGHT) / 2;

      // Sol gol - top masa kenarını geçtiğinde ve kale alanında olduğunda
      if (
        ballObj.x <= TABLE_X - 10 && // Masa kenarından biraz daha içeri
        ballObj.y >= leftGoalY - 10 && // Biraz daha esnek alan
        ballObj.y <= leftGoalY + GOAL_HEIGHT + 10
      ) {
        console.log("⚽ SOL GOL! Kırmızı takım gol attı! (Mavi kaleye)");
        scoreGoal(2); // Kırmızı takım puanı
      }

      // Sağ gol - top masa kenarını geçtiğinde ve kale alanında olduğunda
      if (
        ballObj.x >= TABLE_X + TABLE_WIDTH + 10 && // Masa kenarından biraz daha içeri
        ballObj.y >= rightGoalY - 10 && // Biraz daha esnek alan
        ballObj.y <= rightGoalY + GOAL_HEIGHT + 10
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

    // Mevcut skorları al
    const currentPlayer1Score = gameState.player1Score;
    const currentPlayer2Score = gameState.player2Score;

    const newPlayer1Score =
      scoringTeam === 1 ? currentPlayer1Score + 1 : currentPlayer1Score;
    const newPlayer2Score =
      scoringTeam === 2 ? currentPlayer2Score + 1 : currentPlayer2Score;

    console.log("📊 Skor güncelleniyor:", {
      eski: { player1: currentPlayer1Score, player2: currentPlayer2Score },
      yeni: { player1: newPlayer1Score, player2: newPlayer2Score },
      scoringTeam,
    });

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

  // Topu sıfırla ve veri döndür - büyük saha için güncellenmiş
  const resetBallAndGetData = () => {
    const randomSide = Math.random() > 0.5 ? 1 : -1; // 1: sağ, -1: sol
    const randomX = CANVAS_WIDTH / 2 + randomSide * (Math.random() * 120 + 60); // Büyük saha için daha geniş
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

  // Topu kurtar (sıkıştıysa) - büyük saha için güncellenmiş
  const rescueBall = () => {
    console.log("🚑 Top kurtarılıyor!");
    // Topu masanın ortasına, biraz yukarıya koy
    ball.current.x = CANVAS_WIDTH / 2;
    ball.current.y = TABLE_Y + TABLE_HEIGHT / 2 - 60; // Büyük saha için daha yukarı
    ball.current.vx = (Math.random() - 0.5) * 4; // Rastgele yön
    ball.current.vy = -3; // Yukarı doğru hafif hareket

    // Multiplayer modda güncelle
    if (multiplayer && onGameStateUpdate) {
      onGameStateUpdate({
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

    // Gerçekçi kaleler - 3D görünüm
    const GOAL_HEIGHT = 160;
    const GOAL_DEPTH = 50;

    // Sol kale (Mavi takım)
    const leftGoalY = TABLE_Y + (TABLE_HEIGHT - GOAL_HEIGHT) / 2;

    // Kale zemini - gradient
    const leftGoalGradient = ctx.createLinearGradient(
      TABLE_X - GOAL_DEPTH,
      leftGoalY,
      TABLE_X,
      leftGoalY
    );
    leftGoalGradient.addColorStop(0, "#2a4d3a");
    leftGoalGradient.addColorStop(1, "#1e3a2e");
    ctx.fillStyle = leftGoalGradient;
    ctx.fillRect(TABLE_X - GOAL_DEPTH, leftGoalY, GOAL_DEPTH, GOAL_HEIGHT);

    // Sol kale direkleri
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(TABLE_X - 5, leftGoalY - 10, 10, 10); // Üst direk
    ctx.fillRect(TABLE_X - 5, leftGoalY + GOAL_HEIGHT, 10, 10); // Alt direk
    ctx.fillRect(
      TABLE_X - GOAL_DEPTH - 5,
      leftGoalY - 10,
      10,
      GOAL_HEIGHT + 20
    ); // Arka direk

    // Sol kale ağı - 3D file görünümü
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 1.5;

    // Dikey çizgiler
    for (let i = 0; i <= 8; i++) {
      const x = TABLE_X - GOAL_DEPTH + (i * GOAL_DEPTH) / 8;
      ctx.beginPath();
      ctx.moveTo(x, leftGoalY);
      ctx.lineTo(x, leftGoalY + GOAL_HEIGHT);
      ctx.stroke();
    }

    // Yatay çizgiler
    for (let i = 0; i <= 8; i++) {
      const y = leftGoalY + (i * GOAL_HEIGHT) / 8;
      ctx.beginPath();
      ctx.moveTo(TABLE_X - GOAL_DEPTH, y);
      ctx.lineTo(TABLE_X, y);
      ctx.stroke();
    }

    // Çapraz çizgiler (3D efekt)
    for (let i = 0; i <= 4; i++) {
      const x = TABLE_X - GOAL_DEPTH + (i * GOAL_DEPTH) / 4;
      const y = leftGoalY + (i * GOAL_HEIGHT) / 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(TABLE_X, leftGoalY + GOAL_HEIGHT);
      ctx.stroke();
    }

    // Sağ kale (Kırmızı takım)
    const rightGoalY = TABLE_Y + (TABLE_HEIGHT - GOAL_HEIGHT) / 2;

    // Kale zemini - gradient
    const rightGoalGradient = ctx.createLinearGradient(
      TABLE_X + TABLE_WIDTH,
      rightGoalY,
      TABLE_X + TABLE_WIDTH + GOAL_DEPTH,
      rightGoalY
    );
    rightGoalGradient.addColorStop(0, "#1e3a2e");
    rightGoalGradient.addColorStop(1, "#2a4d3a");
    ctx.fillStyle = rightGoalGradient;
    ctx.fillRect(TABLE_X + TABLE_WIDTH, rightGoalY, GOAL_DEPTH, GOAL_HEIGHT);

    // Sağ kale direkleri
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(TABLE_X + TABLE_WIDTH - 5, rightGoalY - 10, 10, 10); // Üst direk
    ctx.fillRect(TABLE_X + TABLE_WIDTH - 5, rightGoalY + GOAL_HEIGHT, 10, 10); // Alt direk
    ctx.fillRect(
      TABLE_X + TABLE_WIDTH + GOAL_DEPTH - 5,
      rightGoalY - 10,
      10,
      GOAL_HEIGHT + 20
    ); // Arka direk

    // Sağ kale ağı - 3D file görünümü
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 1.5;

    // Dikey çizgiler
    for (let i = 0; i <= 8; i++) {
      const x = TABLE_X + TABLE_WIDTH + (i * GOAL_DEPTH) / 8;
      ctx.beginPath();
      ctx.moveTo(x, rightGoalY);
      ctx.lineTo(x, rightGoalY + GOAL_HEIGHT);
      ctx.stroke();
    }

    // Yatay çizgiler
    for (let i = 0; i <= 8; i++) {
      const y = rightGoalY + (i * GOAL_HEIGHT) / 8;
      ctx.beginPath();
      ctx.moveTo(TABLE_X + TABLE_WIDTH, y);
      ctx.lineTo(TABLE_X + TABLE_WIDTH + GOAL_DEPTH, y);
      ctx.stroke();
    }

    // Çapraz çizgiler (3D efekt)
    for (let i = 0; i <= 4; i++) {
      const x = TABLE_X + TABLE_WIDTH + (i * GOAL_DEPTH) / 4;
      const y = rightGoalY + (i * GOAL_HEIGHT) / 4;
      ctx.beginPath();
      ctx.moveTo(TABLE_X + TABLE_WIDTH, rightGoalY);
      ctx.lineTo(x, y + GOAL_HEIGHT);
      ctx.stroke();
    }

    // Kale çizgileri (ceza sahası)
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // Sol ceza sahası
    ctx.strokeRect(TABLE_X, leftGoalY - 20, 80, GOAL_HEIGHT + 40);

    // Sağ ceza sahası
    ctx.strokeRect(
      TABLE_X + TABLE_WIDTH - 80,
      rightGoalY - 20,
      80,
      GOAL_HEIGHT + 40
    );

    ctx.setLineDash([]);

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

        // Oyuncu detayları - büyük saha için ölçeklenmiş
        ctx.fillStyle = "#FFFFFF";
        // Gözler - daha büyük
        ctx.fillRect(player.x + 10, player.y + 8, 8, 8);
        ctx.fillRect(player.x + 32, player.y + 8, 8, 8);

        // Gölge ekle
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(player.x + 12, player.y + 10, 8, 8);
        ctx.fillRect(player.x + 34, player.y + 10, 8, 8);

        // Gülümseme - daha büyük
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + 22, 10, 0, Math.PI);
        ctx.stroke();

        // Takım numarası - daha büyük ve belirgin
        ctx.fillStyle = "#FFFF00";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.strokeText(
          player.team.toString(),
          player.x + player.width / 2,
          player.y + player.height - 5
        );
        ctx.fillText(
          player.team.toString(),
          player.x + player.width / 2,
          player.y + player.height - 5
        );
      });
    });

    // Topu çiz - büyük ve modern tasarım
    const ballRadius = 8; // Daha büyük top

    // Gölge önce - daha belirgin
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.arc(ball.current.x + 3, ball.current.y + 3, ballRadius, 0, Math.PI * 2);
    ctx.fill();

    // Ana top - gradient
    const ballGradient = ctx.createRadialGradient(
      ball.current.x - 3,
      ball.current.y - 3,
      0,
      ball.current.x,
      ball.current.y,
      ballRadius
    );
    ballGradient.addColorStop(0, "#FFFFFF");
    ballGradient.addColorStop(0.3, "#F8F8F8");
    ballGradient.addColorStop(0.7, "#E0E0E0");
    ballGradient.addColorStop(1, "#C0C0C0");

    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(ball.current.x, ball.current.y, ballRadius, 0, Math.PI * 2);
    ctx.fill();

    // Top sınır çizgisi - daha kalın
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Parlama efekti - daha büyük
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(ball.current.x - 2, ball.current.y - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // İkinci parlama - küçük
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.arc(ball.current.x + 1, ball.current.y - 1, 1, 0, Math.PI * 2);
    ctx.fill();

    // Modern skor tablosu - üstte ortalanmış kart
    const scoreCardWidth = 300;
    const scoreCardHeight = 80;
    const scoreCardX = (CANVAS_WIDTH - scoreCardWidth) / 2;
    const scoreCardY = 20;

    // Skor kartı arka planı - gradient
    const scoreGradient = ctx.createLinearGradient(
      scoreCardX,
      scoreCardY,
      scoreCardX,
      scoreCardY + scoreCardHeight
    );
    scoreGradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
    scoreGradient.addColorStop(1, "rgba(0, 0, 0, 0.6)");
    ctx.fillStyle = scoreGradient;
    ctx.fillRect(scoreCardX, scoreCardY, scoreCardWidth, scoreCardHeight);

    // Skor kartı kenarlığı
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.strokeRect(scoreCardX, scoreCardY, scoreCardWidth, scoreCardHeight);

    // Debug: Skor bilgilerini konsola yazdır
    console.log("🎯 Render sırasında skorlar:", {
      player1Score: gameState.player1Score,
      player2Score: gameState.player2Score,
      gameState: gameState,
    });

    // Mavi takım skoru
    ctx.fillStyle = "#4A90E2";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      gameState.player1Score.toString(),
      scoreCardX + 75,
      scoreCardY + 50
    );

    // Ortadaki çizgi
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 28px Arial";
    ctx.fillText("-", CANVAS_WIDTH / 2, scoreCardY + 50);

    // Kırmızı takım skoru
    ctx.fillStyle = "#E24A4A";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      gameState.player2Score.toString(),
      scoreCardX + scoreCardWidth - 75,
      scoreCardY + 50
    );

    // Takım isimleri
    ctx.fillStyle = "#4A90E2";
    ctx.font = "bold 12px Arial";
    ctx.fillText("MAVI", scoreCardX + 75, scoreCardY + 70);

    ctx.fillStyle = "#E24A4A";
    ctx.fillText("KIRMIZI", scoreCardX + scoreCardWidth - 75, scoreCardY + 70);

    // Kontrol bilgileri
    ctx.font = "14px Arial";
    ctx.textAlign = "left";

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

      // Rod pozisyonlarını güncelle - SADECE diğer takımın hareketlerini al
      if (externalGameState.rodPositions && multiplayer && myTeam) {
        console.log("🎮 Rod pozisyonları INSTANT güncelleniyor:", {
          myTeam,
          totalRods: rods.current.length,
          externalRodCount: externalGameState.rodPositions.length,
          timestamp: new Date().toISOString(),
        });

        rods.current.forEach((rod, rodIndex) => {
          // Sadece karşı takımın rod'larını güncelle
          if (
            rod.team !== myTeam &&
            externalGameState.rodPositions &&
            externalGameState.rodPositions[rodIndex]
          ) {
            console.log(
              `📍 Güncelleyen rod ${rodIndex + 1} (Takım ${rod.team})`
            );
            rod.players.forEach((player, playerIndex) => {
              if (externalGameState.rodPositions![rodIndex][playerIndex]) {
                const newPos =
                  externalGameState.rodPositions![rodIndex][playerIndex];

                // INSTANT rod sync - top fiziği ile perfect sync için
                player.x = newPos.x;
                player.y = newPos.y;
              }
            });
          }
        });
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

  // Multiplayer modda sürekli oyun durumunu güncelle - SADECE HOST
  useEffect(() => {
    if (!multiplayer || !onGameStateUpdate || !gameState.isPlaying) return;

    const interval = setInterval(() => {
      // Rod pozisyonlarını topla
      const rodPositions = rods.current.map((rod) =>
        rod.players.map((player) => ({ x: player.x, y: player.y }))
      );

      if (myTeam === 1) {
        // 1. oyuncu (HOST): Top fiziği + rod pozisyonları
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
          rodPositions: rodPositions,
          isPlaying: gameState.isPlaying,
          player1Score: gameState.player1Score,
          player2Score: gameState.player2Score,
          winner: gameState.winner,
          lastUpdated: new Date(),
        });
      } else {
        // 2. oyuncu (CLIENT): Sürekli rod pozisyonları - ultra responsive
        onGameStateUpdate({
          rodPositions: rodPositions,
          lastUpdated: new Date(),
        });
      }
    }, 33); // 33ms = 30 FPS - Fast but stable

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
            🏓 Langırt Oyna
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gerçek langırt masası! İki takım ve gerçekçi oyun deneyimi!
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
