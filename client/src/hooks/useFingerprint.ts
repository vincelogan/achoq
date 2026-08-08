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

/**
 * Sobrescreve o fingerprint local com o fingerprint canônico de uma conta
 * (chamado após login/cadastro — ver hooks/useAuth.ts). Só grava no
 * localStorage; componentes já montados precisam de um reload completo para
 * enxergar o novo valor (useFingerprint é um estado lazy de montagem única).
 */
export function setFingerprint(fingerprint: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, fingerprint);
  } catch {
    /* localStorage indisponível */
  }
}

/** Limpa o fingerprint local (usado no logout, para não seguir agindo com a identidade da conta que saiu). */
export function clearFingerprint(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* localStorage indisponível */
  }
}
