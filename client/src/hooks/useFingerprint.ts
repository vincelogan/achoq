import { useState, useEffect } from "react";

/**
 * Gera e persiste um fingerprint anônimo no localStorage.
 * Usado para rastrear votos sem exigir login.
 */
export function useFingerprint(): string {
  const [fingerprint, setFingerprint] = useState<string>("");

  useEffect(() => {
    const STORAGE_KEY = "achoq_fp";
    let fp = localStorage.getItem(STORAGE_KEY);
    if (!fp) {
      // Gera um ID aleatório baseado em timestamp + random
      fp = `fp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(STORAGE_KEY, fp);
    }
    setFingerprint(fp);
  }, []);

  return fingerprint;
}
