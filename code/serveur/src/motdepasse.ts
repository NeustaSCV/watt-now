// Empreinte des mots de passe : scrypt avec un sel aléatoire par compte (aucun mot de passe en clair).

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const LONGUEUR = 64;

export function empreinteMotDePasse(motDePasse: string): { sel: string; empreinte: string } {
  const sel = randomBytes(16).toString("hex");
  const empreinte = scryptSync(motDePasse, sel, LONGUEUR).toString("hex");
  return { sel, empreinte };
}

export function verifierMotDePasse(motDePasse: string, sel: string, empreinte: string): boolean {
  const attendue = Buffer.from(empreinte, "hex");
  const calculee = scryptSync(motDePasse, sel, LONGUEUR);
  return attendue.length === calculee.length && timingSafeEqual(attendue, calculee);
}

export function nouveauJeton(): string {
  return randomBytes(32).toString("hex");
}
