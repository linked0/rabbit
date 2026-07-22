"use server";

import { signOut } from "@/auth";

// 클라이언트 컴포넌트(UserMenu)에서 form action 으로 호출하는 로그아웃 서버 액션.
export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
