"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { requireDartmouth } from "@/lib/auth";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function redirectAfterAuth(uid: string) {
    const idToken = await auth.currentUser!.getIdToken();
    const res = await fetch(`/api/users/${uid}`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (res.status === 404) {
      router.replace("/onboarding");
    } else {
      router.replace("/projects");
    }
  }

  async function handleGoogle() {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ hd: "dartmouth.edu" });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!requireDartmouth(user.email)) {
        await signOut(auth);
        setError("Only Dartmouth students can access dArtwork");
        return;
      }

      await redirectAfterAuth(user.uid);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!requireDartmouth(email)) {
      setError("Only Dartmouth students can access dArtwork");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        await signOut(auth);
        setInfo("Verification email sent — check your inbox, then sign in.");
        setMode("signin");
        setPassword("");
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const user = cred.user;

        if (!user.emailVerified) {
          await signOut(auth);
          setError("Please verify your email before signing in.");
          return;
        }

        if (!requireDartmouth(user.email)) {
          await signOut(auth);
          setError("Only Dartmouth students can access dArtwork");
          return;
        }

        await redirectAfterAuth(user.uid);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Authentication failed";
      setError(msg.replace("Firebase: ", "").replace(/ \(auth\/.*\)\.?$/, ""));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div
        className="w-full max-w-sm rounded-3xl p-8 space-y-6"
        style={{ backgroundColor: "#132d1c", border: "1px solid #1e4430" }}
      >
        <div className="text-center">
          <h1
            className="text-4xl font-extrabold uppercase tracking-tight font-[family-name:var(--font-barlow)]"
            style={{ color: "#f5f5f0" }}
          >
            d<span style={{ color: "#FF6B35" }}>Art</span>work
          </h1>
          <p className="mt-1 text-xs uppercase tracking-widest" style={{ color: "#7fa88a" }}>
            Dartmouth creative community
          </p>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-full text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#f5f5f0", color: "#0a1f14" }}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ backgroundColor: "#1e4430" }} />
          <span className="text-xs" style={{ color: "#7fa88a" }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "#1e4430" }} />
        </div>

        {/* Mode toggle */}
        <div
          className="flex rounded-full overflow-hidden text-xs font-bold uppercase tracking-widest"
          style={{ border: "1px solid #1e4430" }}
        >
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setInfo(null); }}
              className="flex-1 py-2 transition-colors"
              style={{
                backgroundColor: mode === m ? "#FF6B35" : "transparent",
                color: mode === m ? "#fff" : "#7fa88a",
              }}
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="you@dartmouth.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-full px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
            style={{ backgroundColor: "#0a1f14", border: "1px solid #1e4430", color: "#f5f5f0" }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-full px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
            style={{ backgroundColor: "#0a1f14", border: "1px solid #1e4430", color: "#f5f5f0" }}
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#00693E" }}
          >
            {busy ? "…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {error && (
          <p className="text-sm text-center rounded-xl px-4 py-2" style={{ backgroundColor: "#3b0f0f", color: "#ff8a80" }}>
            {error}
          </p>
        )}
        {info && (
          <p className="text-sm text-center rounded-xl px-4 py-2" style={{ backgroundColor: "#0d2e1a", color: "#69e5a0" }}>
            {info}
          </p>
        )}
      </div>
    </main>
  );
}
