#!/usr/bin/env python3
"""Serveur local de la session musique : sert musique/ en lecture, et accepte l'enregistrement (PUT)
des fichiers produits par la page de production, UNIQUEMENT dans musique/production/.

Usage : python3 musique/outils/serveur.py   (puis http://127.0.0.1:8765)
N'écoute que sur 127.0.0.1 : rien n'est accessible depuis le réseau.
"""
import http.server, os, sys

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.normpath(os.path.join(ICI, '..'))
PRODUCTION = os.path.join(RACINE, 'production')
PORT = 8765


class Gestionnaire(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=RACINE, **k)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_PUT(self):
        chemin = os.path.normpath(os.path.join(RACINE, self.path.split('?')[0].lstrip('/')))
        chemin = os.path.realpath(chemin)
        if not chemin.startswith(os.path.realpath(PRODUCTION) + os.sep):
            self.send_error(403, 'Écriture permise seulement dans musique/production/')
            return
        n = int(self.headers.get('Content-Length', 0))
        if n > 200 * 1024 * 1024:
            self.send_error(413, 'Fichier trop gros')
            return
        os.makedirs(os.path.dirname(chemin), exist_ok=True)
        with open(chemin + '.part', 'wb') as f:
            restant = n
            while restant > 0:
                bloc = self.rfile.read(min(restant, 1 << 20))
                if not bloc:
                    break
                f.write(bloc)
                restant -= len(bloc)
        os.replace(chemin + '.part', chemin)
        self.send_response(201)
        self.end_headers()

    def log_message(self, fmt, *args):
        if self.command == 'PUT':
            sys.stderr.write('enregistré : %s\n' % self.path)


if __name__ == '__main__':
    os.makedirs(PRODUCTION, exist_ok=True)
    http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Gestionnaire).serve_forever()
