// La page d'administration en production (2026-10-16) : sous /admin, rien sans connexion ; identifiant, mot de passe
// et code à usage unique ; cookie protégé ; blocage après 5 échecs ; un code ne sert pas deux fois ; session qui
// expire ; déconnexion ; l'adresse transmise par Traefik. Et l'adresse des joueurs du jeu derrière Traefik.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, rmSync } from "node:fs";
import { request, type IncomingMessage } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ECHECS_PAR_ADRESSE, INACTIVITE_MAX, cookieSession, jetonDe } from "./admin-connexion.ts";
import { demarrerAdminWeb, habiller } from "./admin-web.ts";
import { adresseClient } from "./adresse-client.ts";
import { Base } from "./base.ts";
import { rendreSilencieux } from "./journal.ts";
import { codeTotp, nouveauSecretTotp, pasTotp } from "./totp.ts";

rendreSilencieux(true);
const dossierTests = join(dirname(fileURLToPath(import.meta.url)), "..", "donnees", "tests-admin-connexion");
const HOTE = "jeu.example.org";

interface Reponse {
  statut: number;
  html: string;
  entetes: IncomingMessage["headers"];
}

/** Une requête comme la ferait le navigateur derrière Traefik : le nom du site, l'origine, le cookie. */
function requete(port: number, methode: string, chemin: string, options: { corps?: string; cookie?: string; origine?: string } = {}): Promise<Reponse> {
  return new Promise((resolve, reject) => {
    const r = request(
      {
        host: "127.0.0.1",
        port,
        method: methode,
        path: chemin,
        headers: {
          Host: HOTE,
          ...(options.corps !== undefined ? { "Content-Type": "application/x-www-form-urlencoded", Origin: options.origine ?? `https://${HOTE}` } : {}),
          ...(options.cookie ? { Cookie: options.cookie } : {}),
        },
      },
      (res) => {
        let html = "";
        res.setEncoding("utf8");
        res.on("data", (d: string) => (html += d));
        res.on("end", () => resolve({ statut: res.statusCode ?? 0, html, entetes: res.headers }));
      },
    );
    r.on("error", reject);
    if (options.corps !== undefined) r.write(options.corps);
    r.end();
  });
}

function formulaire(champs: Record<string, string>): string {
  return new URLSearchParams(champs).toString();
}

/** Le cookie posé par une réponse, tel que le navigateur le renverrait (« watt_admin=… »). */
function cookieDe(r: Reponse): string {
  const pose = r.entetes["set-cookie"]?.[0] ?? "";
  return pose.split(";")[0]!;
}

test("habiller : les adresses passent sous /admin, le sous-titre change", () => {
  const html = `<header><span>réseau local seulement · sans mot de passe</span></header><a href="/joueur/3">x</a><form action="/joueur/3/supprimer"></form><a href="https://ailleurs.fr/">y</a>`;
  const h = habiller(html, "/admin", "<span>connecté</span>");
  assert.match(h, /href="\/admin\/joueur\/3"/);
  assert.match(h, /action="\/admin\/joueur\/3\/supprimer"/);
  assert.match(h, /href="https:\/\/ailleurs\.fr\/"/, "un lien complet ne bouge pas");
  assert.match(h, /<span>connecté<\/span>/);
  assert.equal(habiller(html, "", "<span>réseau local seulement · sans mot de passe</span>"), html, "sans chemin (le Pi), rien ne change");
});

test("le cookie : HttpOnly, SameSite=Strict, Secure en production, limité au chemin ; l'effacer", () => {
  assert.equal(cookieSession("abc", "/admin", true), "watt_admin=abc; Path=/admin; Max-Age=28800; HttpOnly; SameSite=Strict; Secure");
  assert.equal(cookieSession(null, "/admin", true), "watt_admin=; Path=/admin; Max-Age=0; HttpOnly; SameSite=Strict; Secure");
  assert.equal(jetonDe({ headers: { cookie: "autre=1; watt_admin=xyz; encore=2" } } as IncomingMessage), "xyz");
  assert.equal(jetonDe({ headers: {} } as IncomingMessage), undefined);
});

test("l'adresse du joueur : la prise sans proxy ; la dernière de X-Forwarded-For derrière Traefik", () => {
  const req = (xff?: string) => ({ headers: xff ? { "x-forwarded-for": xff } : {}, socket: { remoteAddress: "172.18.0.2" } }) as unknown as IncomingMessage;
  assert.equal(adresseClient(req("1.2.3.4"), false), "172.18.0.2", "sans proxy, on ignore l'en-tête (il peut être inventé)");
  assert.equal(adresseClient(req("6.6.6.6, 81.2.3.4"), true), "81.2.3.4", "la dernière, celle que Traefik ajoute");
  assert.equal(adresseClient(req(), true), "172.18.0.2");
});

test("La page d'administration en production : connexion obligatoire sous /admin", async () => {
  mkdirSync(dossierTests, { recursive: true });
  const cheminBase = join(dossierTests, `connexion-${process.pid}.sqlite`);
  rmSync(cheminBase, { force: true });
  const base = new Base(cheminBase);
  const nadia = base.creerCompte("Nadia", "enclume42", "charbonniers");
  let maintenant = 1_800_000_000_000;
  let adresse = "81.2.3.4";
  const monde = { connectes: () => [], deconnecter: () => false };
  const admin = await demarrerAdminWeb({
    port: 0,
    hote: "127.0.0.1",
    base,
    monde,
    adresseDe: () => adresse,
    connexion: { prefixe: "/admin", cookieSecurise: true, horloge: () => maintenant },
  });
  const p = admin.port;
  try {
    // ---- Sans compte : la page de connexion dit comment le créer ----
    assert.match((await requete(p, "GET", "/admin/connexion")).html, /admin-prod\.sh/);

    const secret = nouveauSecretTotp();
    base.definirAdminWeb("godfather", "un mot de passe long", secret);
    const code = (decalage = 0) => codeTotp(secret, pasTotp(maintenant) + decalage);

    // ---- Rien sans session : redirection vers la connexion, aucune donnée ----
    for (const chemin of ["/admin", "/admin/", `/admin/joueur/${nadia.id}`]) {
      const r = await requete(p, "GET", chemin);
      assert.equal(r.statut, 303, chemin);
      assert.equal(r.entetes.location, "/admin/connexion");
      assert.doesNotMatch(r.html, /Nadia/);
    }
    const supprimerSansSession = await requete(p, "POST", `/admin/joueur/${nadia.id}/supprimer`, { corps: formulaire({ pseudo: "Nadia" }) });
    assert.equal(supprimerSansSession.statut, 403);
    assert.ok(base.ficheCompte(nadia.id), "rien n'est supprimé sans session");
    assert.equal((await requete(p, "GET", "/joueur/1")).statut, 404, "hors de /admin : rien");

    // ---- La page de connexion ----
    const page = await requete(p, "GET", "/admin/connexion");
    assert.equal(page.statut, 200);
    assert.match(page.html, /action="\/admin\/connexion"/);
    assert.match(page.html, /autocomplete="one-time-code"/);
    assert.match(page.html, /connexion requise/);
    assert.doesNotMatch(page.html, /sans mot de passe/);

    // ---- Mauvais mot de passe, mauvais code, mauvais identifiant : même réponse ----
    for (const champs of [
      { identifiant: "godfather", motDePasse: "faux", code: code() },
      { identifiant: "godfather", motDePasse: "un mot de passe long", code: "000000" },
      { identifiant: "god", motDePasse: "un mot de passe long", code: code() },
    ]) {
      const r = await requete(p, "POST", "/admin/connexion", { corps: formulaire(champs) });
      assert.equal(r.statut, 401);
      assert.match(r.html, /Identifiant, mot de passe ou code incorrect/);
      assert.equal(r.entetes["set-cookie"], undefined);
    }

    // ---- Un formulaire venu d'un autre site : refusé ----
    const ailleurs = await requete(p, "POST", "/admin/connexion", {
      corps: formulaire({ identifiant: "godfather", motDePasse: "un mot de passe long", code: code() }),
      origine: "https://pirate.example",
    });
    assert.equal(ailleurs.statut, 403);

    // ---- La bonne connexion : cookie protégé, retour à la liste ----
    const ok = await requete(p, "POST", "/admin/connexion", { corps: formulaire({ identifiant: "godfather", motDePasse: "un mot de passe long", code: code() }) });
    assert.equal(ok.statut, 303);
    assert.equal(ok.entetes.location, "/admin/");
    const pose = ok.entetes["set-cookie"]![0]!;
    for (const attribut of ["HttpOnly", "SameSite=Strict", "Secure", "Path=/admin"]) assert.ok(pose.includes(attribut), attribut);
    const cookie = cookieDe(ok);
    const liste = await requete(p, "GET", "/admin/", { cookie });
    assert.equal(liste.statut, 200);
    assert.match(liste.html, /Nadia/);
    assert.match(liste.html, new RegExp(`href="/admin/joueur/${nadia.id}"`), "les liens restent sous /admin");
    assert.match(liste.html, /action="\/admin\/deconnexion"/, "le bouton pour se déconnecter");
    assert.equal((await requete(p, "GET", `/admin/joueur/${nadia.id}`, { cookie })).statut, 200);

    // ---- Le même code ne sert pas deux fois (une seconde connexion dans la même demi-minute) ----
    const rejoue = await requete(p, "POST", "/admin/connexion", { corps: formulaire({ identifiant: "godfather", motDePasse: "un mot de passe long", code: code() }) });
    assert.equal(rejoue.statut, 401);

    // ---- La session expire après 30 minutes sans rien faire ; une activité la prolonge ----
    maintenant += INACTIVITE_MAX - 60_000;
    assert.equal((await requete(p, "GET", "/admin/", { cookie })).statut, 200, "29 minutes : encore là, et prolongée");
    maintenant += INACTIVITE_MAX - 60_000;
    assert.equal((await requete(p, "GET", "/admin/", { cookie })).statut, 200, "encore 29 minutes après la dernière visite");
    maintenant += INACTIVITE_MAX + 1;
    assert.equal((await requete(p, "GET", "/admin/", { cookie })).statut, 303, "plus de 30 minutes : expirée");

    // ---- Se reconnecter, puis se déconnecter : le cookie ne vaut plus rien ----
    maintenant += 60_000;
    const encore = await requete(p, "POST", "/admin/connexion", { corps: formulaire({ identifiant: "godfather", motDePasse: "un mot de passe long", code: code() }) });
    assert.equal(encore.statut, 303);
    const cookie2 = cookieDe(encore);
    const sortie = await requete(p, "POST", "/admin/deconnexion", { corps: "", cookie: cookie2 });
    assert.equal(sortie.statut, 303);
    assert.match(sortie.entetes["set-cookie"]![0]!, /Max-Age=0/);
    assert.equal((await requete(p, "GET", "/admin/", { cookie: cookie2 })).statut, 303);

    // ---- 5 échecs depuis une adresse : bloquée, même avec le bon code ; une autre adresse passe ----
    maintenant += 60_000;
    adresse = "6.6.6.6";
    for (let i = 0; i < ECHECS_PAR_ADRESSE; i++) {
      assert.equal((await requete(p, "POST", "/admin/connexion", { corps: formulaire({ identifiant: "godfather", motDePasse: "essai", code: "123456" }) })).statut, 401);
    }
    const bloquee = await requete(p, "POST", "/admin/connexion", { corps: formulaire({ identifiant: "godfather", motDePasse: "un mot de passe long", code: code() }) });
    assert.equal(bloquee.statut, 429);
    assert.match(bloquee.html, /Trop d&#39;essais/);
    adresse = "81.2.3.4";
    assert.equal((await requete(p, "POST", "/admin/connexion", { corps: formulaire({ identifiant: "godfather", motDePasse: "un mot de passe long", code: code() }) })).statut, 303);
  } finally {
    await admin.fermer();
    base.fermer();
    rmSync(dossierTests, { recursive: true, force: true });
  }
});
