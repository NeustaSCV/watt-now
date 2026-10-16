// Le code à usage unique de la page d'administration en production (TOTP, RFC 6238 ; décision du porteur du
// 2026-10-16) : six chiffres qui changent toutes les 30 secondes, calculés par une application d'authentification
// (Google Authenticator, Aegis, 1Password…) à partir d'un secret partagé une seule fois, au moment de créer le compte.
// HMAC-SHA1, comme toutes ces applications l'attendent par défaut. Sans dépendance : node:crypto suffit.

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** La durée d'un code, en secondes. */
export const PAS_TOTP = 30;
const CHIFFRES = 6;
/** On accepte le code d'avant et celui d'après (une horloge de téléphone qui dérive d'une demi-minute). */
const TOLERANCE = 1;

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Le secret, en base 32 (ce que l'application demande comme « clé de configuration »). */
export function encoderBase32(octets: Buffer): string {
  let bits = 0;
  let valeur = 0;
  let sortie = "";
  for (const octet of octets) {
    valeur = (valeur << 8) | octet;
    bits += 8;
    while (bits >= 5) {
      sortie += BASE32[(valeur >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) sortie += BASE32[(valeur << (5 - bits)) & 31];
  return sortie;
}

/** Le contraire ; les espaces, les tirets et la casse ne comptent pas. Null si un caractère n'est pas du base 32. */
export function decoderBase32(texte: string): Buffer | null {
  const propre = texte.toUpperCase().replace(/[\s-]/g, "").replace(/=+$/, "");
  let bits = 0;
  let valeur = 0;
  const octets: number[] = [];
  for (const c of propre) {
    const i = BASE32.indexOf(c);
    if (i < 0) return null;
    valeur = ((valeur << 5) | i) & 0xffff;
    bits += 5;
    if (bits >= 8) {
      octets.push((valeur >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(octets);
}

/** Un secret neuf : 20 octets (160 bits, la taille recommandée par la RFC 4226), en base 32. */
export function nouveauSecretTotp(): string {
  return encoderBase32(randomBytes(20));
}

/** Le numéro du pas de 30 secondes à un instant donné. */
export function pasTotp(instantMs: number): number {
  return Math.floor(instantMs / 1000 / PAS_TOTP);
}

/** Le code à six chiffres d'un pas (RFC 4226 §5.3, troncature dynamique). */
export function codeTotp(secret: string, pas: number): string {
  const cle = decoderBase32(secret);
  if (!cle || cle.length === 0) throw new Error("Secret TOTP illisible.");
  const compteur = Buffer.alloc(8);
  compteur.writeBigUInt64BE(BigInt(pas));
  const hmac = createHmac("sha1", cle).update(compteur).digest();
  const decalage = hmac[hmac.length - 1]! & 0x0f;
  const nombre = hmac.readUInt32BE(decalage) & 0x7fffffff;
  return String(nombre % 10 ** CHIFFRES).padStart(CHIFFRES, "0");
}

/**
 * Le code tapé est-il bon ? Rend le pas qu'il désigne (à retenir pour refuser qu'on le rejoue), ou null.
 * `dernierPasUtilise` : un code déjà accepté (ou plus ancien) est refusé, même s'il est encore dans la fenêtre.
 */
export function verifierTotp(secret: string, saisi: string, instantMs: number, dernierPasUtilise = -1): number | null {
  const code = saisi.replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return null;
  const actuel = pasTotp(instantMs);
  for (let ecart = -TOLERANCE; ecart <= TOLERANCE; ecart++) {
    const pas = actuel + ecart;
    if (pas <= dernierPasUtilise) continue;
    if (timingSafeEqual(Buffer.from(codeTotp(secret, pas)), Buffer.from(code))) return pas;
  }
  return null;
}

/** Le lien « otpauth:// » que comprennent les applications (à coller, ou à transformer en QR code ailleurs). */
export function lienOtpauth(identifiant: string, secret: string, emetteur = "Watt Now"): string {
  const etiquette = encodeURIComponent(`${emetteur}:${identifiant}`);
  return `otpauth://totp/${etiquette}?secret=${secret}&issuer=${encodeURIComponent(emetteur)}&algorithm=SHA1&digits=${CHIFFRES}&period=${PAS_TOTP}`;
}
