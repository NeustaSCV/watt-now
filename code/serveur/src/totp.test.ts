// Le code à usage unique (RFC 6238) : les valeurs de référence de la RFC, la tolérance d'un pas, le refus de rejouer.

import { test } from "node:test";
import assert from "node:assert/strict";
import { codeTotp, decoderBase32, encoderBase32, lienOtpauth, nouveauSecretTotp, pasTotp, verifierTotp } from "./totp.ts";

// Le secret de la RFC 6238 (annexe B) : « 12345678901234567890 » en ASCII.
const SECRET_RFC = encoderBase32(Buffer.from("12345678901234567890"));

test("base 32 : aller-retour, et le secret de la RFC", () => {
  assert.equal(SECRET_RFC, "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  assert.equal(decoderBase32("gezd gnbv-gy3t qojq gezd gnbv gy3t qojq")!.toString(), "12345678901234567890");
  assert.equal(decoderBase32("GEZ1"), null, "1 n'est pas du base 32");
  const s = nouveauSecretTotp();
  assert.match(s, /^[A-Z2-7]{32}$/);
  assert.equal(decoderBase32(s)!.length, 20);
});

test("les codes de référence de la RFC 6238 (SHA-1, les 6 derniers chiffres)", () => {
  for (const [secondes, attendu] of [
    [59, "287082"],
    [1111111109, "081804"],
    [1111111111, "050471"],
    [1234567890, "005924"],
    [2000000000, "279037"],
  ] as const) {
    assert.equal(codeTotp(SECRET_RFC, pasTotp(secondes * 1000)), attendu, `T = ${secondes}`);
  }
});

test("vérifier : le pas d'avant et d'après passent, pas plus ; un code déjà servi est refusé", () => {
  const instant = 1234567890_000;
  const pas = pasTotp(instant);
  assert.equal(verifierTotp(SECRET_RFC, "005924", instant), pas);
  assert.equal(verifierTotp(SECRET_RFC, "005 924", instant), pas, "les espaces ne comptent pas");
  assert.equal(verifierTotp(SECRET_RFC, codeTotp(SECRET_RFC, pas - 1), instant), pas - 1);
  assert.equal(verifierTotp(SECRET_RFC, codeTotp(SECRET_RFC, pas + 1), instant), pas + 1);
  assert.equal(verifierTotp(SECRET_RFC, codeTotp(SECRET_RFC, pas - 2), instant), null, "trop vieux");
  assert.equal(verifierTotp(SECRET_RFC, "005924", instant, pas), null, "déjà utilisé");
  assert.equal(verifierTotp(SECRET_RFC, "12345", instant), null);
  assert.equal(verifierTotp(SECRET_RFC, "abcdef", instant), null);
});

test("le lien otpauth porte le nom, le secret et les réglages", () => {
  assert.equal(
    lienOtpauth("godfather", "ABCD"),
    "otpauth://totp/Watt%20Now%3Agodfather?secret=ABCD&issuer=Watt%20Now&algorithm=SHA1&digits=6&period=30",
  );
});
