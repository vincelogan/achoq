import { useState } from "react";

const STORAGE_KEY = "achoq_fp";

function readOrCreateFingerprint(): string {
  if (typeof window === "undefined") return "";
  try {
    let fp = localStorage.getItem(STORAGE_KEY);
    if (!fp) {
      // Gera um ID aleatório baseado em timestamp + random
      fp = `fp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(STORAGE_KEY, fp);
    }
    return fp;
  } catch {
    // localStorage indisponível (modo privado restrito etc.)
    return "";
  }
}

/**
 * Gera e persiste um fingerprint anônimo no localStorage.
 * Usado para rastrear votos sem exigir login. Leitura síncrona (lazy init)
 * para não atrasar queries que dependem do fingerprint no primeiro render.
 */
export function useFingerprint(): string {
  const [fingerprint] = useState(readOrCreateFingerprint);
  return fingerprint;
}
