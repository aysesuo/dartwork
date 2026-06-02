"use client";

import { useState, useEffect, useRef } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/lib/auth";
import { storage } from "@/lib/firebase";
import { DISCIPLINES } from "@/lib/disciplines";

interface PastProject {
  id:          string;
  title:       string;
  discipline:  string;
  description: string;
  mediaUrl?:   string | null;
}

type Theme = "light" | "dark";

const THEMES: Record<Theme, {
  input:     React.CSSProperties;
  inputCls:  string;
  cardBg:    string;
  cardBorder:string;
  muted:     string;
  text:      string;
}> = {
  light: {
    input:      { backgroundColor: "#ffffff", border: "1px solid #cfd8d2", color: "#1a1008" },
    inputCls:   "w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700",
    cardBg:     "rgba(255,255,255,0.55)",
    cardBorder: "rgba(26,16,8,0.2)",
    muted:      "#5a4a32",
    text:       "#1a1008",
  },
  dark: {
    input:      { backgroundColor: "#132d1c", border: "1px solid #1e4430", color: "#f5f5f0" },
    inputCls:   "w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700",
    cardBg:     "#132d1c",
    cardBorder: "#1e4430",
    muted:      "#7fa88a",
    text:       "#f5f5f0",
  },
};

export default function PastProjectsManager({ theme = "dark" }: { theme?: Theme }) {
  const t = THEMES[theme];
  const { user } = useAuth();

  const [items, setItems] = useState<PastProject[]>([]);

  const [title,       setTitle]       = useState("");
  const [discipline,  setDiscipline]  = useState("");
  const [description, setDescription] = useState("");

  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load this user's existing past-work entries
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken(true);
        const res   = await fetch(`/api/projects?uid=${user.uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          setItems(
            data
              .filter((p: { isPast?: boolean }) => p.isPast === true)
              .map((p: PastProject) => ({
                id:          p.id,
                title:       p.title,
                discipline:  p.discipline,
                description: p.description,
                mediaUrl:    p.mediaUrl ?? null,
              })),
          );
        }
      } catch { /* silent */ }
    })();
  }, [user]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function resetForm() {
    setTitle("");
    setDiscipline("");
    setDescription("");
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAdd() {
    if (!user) return;
    setError(null);

    if (!title.trim())                  { setError("Title is required");                       return; }
    if (!discipline)                    { setError("Select a discipline");                     return; }
    if (description.trim().length < 10) { setError("Description must be at least 10 characters"); return; }

    setBusy(true);
    try {
      let mediaUrl: string | null = null;
      if (imageFile) {
        const compressed = await compressImage(imageFile, 1200);
        const storageRef = ref(storage, `project-images/${user.uid}_${Date.now()}`);
        await uploadBytes(storageRef, compressed, { contentType: "image/jpeg" });
        mediaUrl = await getDownloadURL(storageRef);
      }

      const token = await user.getIdToken(true);
      const res   = await fetch("/api/projects", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          title:        title.trim(),
          description:  description.trim(),
          discipline,
          mediaUrl,
          isPast:       true,
          showOnProfile: true,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Could not add project"); return; }

      setItems((prev) => [
        { id: data.id, title: title.trim(), discipline, description: description.trim(), mediaUrl },
        ...prev,
      ]);
      resetForm();
    } catch {
      setError("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    if (!user) return;
    setItems((prev) => prev.filter((p) => p.id !== id));
    try {
      const token = await user.getIdToken(true);
      await fetch(`/api/projects/${id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { /* optimistic — already removed from UI */ }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Existing past projects */}
      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((p) => (
            <div
              key={p.id}
              className="flex items-start gap-3 rounded-lg px-3 py-2.5"
              style={{ backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}` }}
            >
              {p.mediaUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.mediaUrl}
                  alt={p.title}
                  style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: t.text }}>{p.title}</p>
                <p className="text-xs" style={{ color: t.muted }}>{p.discipline}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(p.id)}
                aria-label={`Remove ${p.title}`}
                className="text-sm hover:opacity-70 transition-opacity"
                style={{ color: t.muted }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Mini add form */}
      <div
        className="flex flex-col gap-3 rounded-xl p-4"
        style={{ backgroundColor: t.cardBg, border: `1px dashed ${t.cardBorder}` }}
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Project title"
          maxLength={120}
          className={t.inputCls}
          style={t.input}
        />
        <select
          value={discipline}
          onChange={(e) => setDiscipline(e.target.value)}
          className={t.inputCls}
          style={{ ...t.input, appearance: "none", cursor: "pointer" }}
        >
          <option value="" disabled>Select a discipline…</option>
          {DISCIPLINES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was this project? (min 10 characters)"
          rows={3}
          maxLength={1200}
          className={`${t.inputCls} resize-none`}
          style={t.input}
        />

        {imagePreview && (
          <div style={{ width: "100%", maxHeight: 160, overflow: "hidden", borderRadius: 8, border: `1px solid ${t.cardBorder}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-80"
            style={{ border: `1px solid ${t.cardBorder}`, color: t.muted }}
          >
            {imagePreview ? "Change image" : "Add image"}
          </button>
          {imagePreview && (
            <button
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              className="text-xs hover:opacity-70 transition-opacity"
              style={{ color: t.muted }}
            >
              Remove
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </div>

        {error && (
          <p className="text-xs rounded-lg px-3 py-2" style={{ backgroundColor: "#3b0f0f", color: "#ff8a80" }}>
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleAdd}
          disabled={busy}
          className="self-start px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#00693E" }}
        >
          {busy ? "Adding…" : "Add past project"}
        </button>
      </div>
    </div>
  );
}

// ── Helper ──────────────────────────────────────────────────────────────────────
async function compressImage(file: File, maxDim = 1200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale  = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
        "image/jpeg",
        0.88,
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}
