"use client";
import { useEffect, useRef, useState } from "react";

// 간단한 캔버스 미니게임 (plan §2 #2): 떨어지는 코인(₿·Ξ)을 바구니로 받기.
// 의존성 없이 가볍게 2D 캔버스로 구현(원하면 추후 WebGL로 교체 가능).
// 조작: 마우스 / 터치 / ← → 키.
type Coin = { x: number; y: number; vy: number; sym: string; r: number };

const WIDTH = 640;
const HEIGHT = 420;

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [lives, setLives] = useState(3);

  // 게임 상태는 ref에 담아 리렌더 없이 루프에서 갱신한다.
  const state = useRef({
    basketX: WIDTH / 2,
    coins: [] as Coin[],
    spawn: 0,
    running: false,
    score: 0,
    lives: 3,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const move = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * WIDTH;
      state.current.basketX = Math.max(48, Math.min(WIDTH - 48, x));
    };
    const onMouse = (e: MouseEvent) => move(e.clientX);
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) move(e.touches[0].clientX);
    };
    const onKey = (e: KeyboardEvent) => {
      const s = state.current;
      if (e.key === "ArrowLeft") s.basketX = Math.max(48, s.basketX - 28);
      if (e.key === "ArrowRight") s.basketX = Math.min(WIDTH - 48, s.basketX + 28);
    };
    canvas.addEventListener("mousemove", onMouse);
    canvas.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("keydown", onKey);

    const loop = () => {
      const s = state.current;
      ctx.fillStyle = "#0b1020";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      if (s.running) {
        s.spawn -= 1;
        if (s.spawn <= 0) {
          s.coins.push({
            x: 40 + Math.random() * (WIDTH - 80),
            y: -20,
            vy: 2.5 + Math.random() * 1.5,
            sym: Math.random() < 0.5 ? "₿" : "Ξ",
            r: 16,
          });
          s.spawn = Math.max(18, 58 - s.score); // 점수가 오를수록 더 자주 떨어진다
        }
        const basketY = HEIGHT - 40;
        for (let i = s.coins.length - 1; i >= 0; i--) {
          const c = s.coins[i];
          c.y += c.vy;
          if (c.y + c.r >= basketY && Math.abs(c.x - s.basketX) < 52) {
            s.coins.splice(i, 1);
            s.score += 1;
            setScore(s.score);
          } else if (c.y - c.r > HEIGHT) {
            s.coins.splice(i, 1);
            s.lives -= 1;
            setLives(s.lives);
            if (s.lives <= 0) {
              s.running = false;
              setRunning(false);
              setBest((b) => Math.max(b, s.score));
            }
          }
        }
      }

      for (const c of s.coins) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fillStyle = c.sym === "₿" ? "#f7931a" : "#627eea";
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 18px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(c.sym, c.x, c.y + 1);
      }
      ctx.fillStyle = "#e8eaed";
      ctx.fillRect(s.basketX - 50, HEIGHT - 34, 100, 14);
      ctx.fillStyle = "#9aa0a6";
      ctx.fillRect(s.basketX - 50, HEIGHT - 22, 100, 6);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", onMouse);
      canvas.removeEventListener("touchmove", onTouch);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const start = () => {
    const s = state.current;
    s.coins = [];
    s.score = 0;
    s.lives = 3;
    s.spawn = 0;
    s.running = true;
    setScore(0);
    setLives(3);
    setRunning(true);
  };

  return (
    <div className="panel" style={{ maxWidth: WIDTH + 32 }}>
      <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
        <span>점수 <b>{score}</b></span>
        <span>최고 <b>{best}</b></span>
        <span>♥ {lives > 0 ? "♥".repeat(lives) : "—"}</span>
      </div>
      <div style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          style={{
            width: "100%",
            borderRadius: 12,
            display: "block",
            touchAction: "none",
            cursor: "none",
          }}
        />
        {!running && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              background: "rgba(0,0,0,0.45)",
              borderRadius: 12,
            }}
          >
            <h2 style={{ margin: 0, color: "#fff" }}>🪙 코인 받기</h2>
            <p style={{ color: "#cdd1d6", margin: 0, textAlign: "center", maxWidth: 360 }}>
              마우스·터치 또는 ← → 키로 바구니를 움직여 떨어지는 코인을 받으세요. 3번 놓치면 끝!
            </p>
            <button type="button" onClick={start}>
              {score > 0 || best > 0 ? "다시 시작" : "시작"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
