"use client";

import { useEffect, useState } from "react";

// 다크/라이트 토글. 초기값은 layout 의 인라인 스크립트가 <html data-theme> 로 미리 설정(플래시 방지).
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    const current =
      (document.documentElement.getAttribute("data-theme") as "dark" | "light") || "light";
    setTheme(current);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* localStorage 불가 시 무시 */
    }
  }

  return (
    <button
      className="ghost"
      onClick={toggle}
      aria-label="다크/라이트 모드 전환"
      title={theme === "dark" ? "라이트 모드로" : "다크 모드로"}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
