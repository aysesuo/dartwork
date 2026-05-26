"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";
import type { User } from "firebase/auth";

export function useAuth(): { user: User | null | undefined; loading: boolean } {
  const [user, loading] = useAuthState(auth);
  return { user: user ?? null, loading };
}

// Anchored — must be exactly X@dartmouth.edu with no subdomain tricks
const DARTMOUTH_RE = /^[^@]+@dartmouth\.edu$/i;

export function requireDartmouth(email: string | null | undefined): boolean {
  if (!email) return false;
  return DARTMOUTH_RE.test(email);
}
