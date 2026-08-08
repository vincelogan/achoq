import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

/**
 * Hash de senha com scrypt (builtin do Node, sem dependência nova — o script
 * de build do Amplify mantém uma lista fechada de pacotes copiados para o
 * runtime da Lambda; scrypt evita mexer nela). Parâmetros N=16384/r=8/p=1
 * (mínimo recomendado pela OWASP), 64 bytes de chave derivada, salt de 16
 * bytes. Formato salvo: "scrypt:N:r:p:saltHex:hashHex".
 */
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, , , , saltHex, hashHex] = parts;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derivedKey = await scrypt(password, salt, expected.length);
    return timingSafeEqual(derivedKey, expected);
  } catch {
    return false;
  }
}

/**
 * Regras mínimas de senha — sem depender de infra extra (sem checagem contra
 * vazamentos conhecidos), apenas o suficiente para barrar senhas triviais.
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (password.length > 128) return "Senha muito longa.";
  return null;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  // Checagem simples, propositalmente permissiva (não é o lugar para regex
  // perfeito de RFC 5322) — a confirmação real de posse do e-mail fica para
  // quando houver infra de envio (SES) configurada.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "E-mail inválido.";
  if (trimmed.length > 320) return "E-mail muito longo.";
  return null;
}
