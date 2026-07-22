"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "./LangContext";
import { pick } from "@/lib/i18n";
import { signOutAction } from "./auth-actions";

// 로그인 사용자 표시 — 그라디언트 아바타 버튼 + 드롭다운(이메일 + 로그아웃).
// 이메일/로그아웃을 한 곳에 모아 상단바를 깔끔하게 정리한다.
export default function UserMenu({ email }: { email: string }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = (email.trim()[0] || "?").toUpperCase();

  // 바깥 클릭 / ESC 로 닫기.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="usermenu">
      <button
        className="avatar-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={email}
        aria-haspopup="menu"
        aria-expanded={open}
        title={email}
      >
        {initial}
      </button>
      {open && (
        <div className="usermenu-pop" role="menu">
          <div className="usermenu-email">{email}</div>
          <form action={signOutAction}>
            <button type="submit" className="usermenu-signout">
              {pick(lang, "로그아웃", "Sign out")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
