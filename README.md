# Organizer

Gemeinsamer Haushalts-Organizer für zwei Personen als Web-App (PWA). Kein Login; die Daten liegen als `data.json` in einem privaten GitHub-Repository.

Details zu Aufbau, Datenmodell und Phasen: [CLAUDE.md](CLAUDE.md) · Versionen: [CHANGELOG.md](CHANGELOG.md)

## Lokal entwickeln und testen

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
npm run dev        # Entwicklungsserver, auch im WLAN erreichbar
npm test           # Unit-Tests
npm run lint       # Lint inkl. Importregeln zwischen Features
npm run build      # Produktions-Build nach dist/
npm run preview    # Produktions-Build lokal ansehen (mit Service Worker)
```

Die App läuft unter `http://localhost:5173/organizer/` (Dev) bzw. `http://localhost:4173/organizer/` (Preview).
Vite zeigt zusätzlich eine `Network`-Adresse an, die man auf dem Handy im selben WLAN öffnen kann.

Hinweis: Über die WLAN-Adresse (HTTP) funktionieren Oberfläche und Sync. „Zum Homescreen hinzufügen“ als echte App, Offline-Cache und Push gehen nur über HTTPS, also nach dem Deploy auf GitHub Pages.

## Einmalige Einrichtung

### 1. Repositories
- `organizer` (öffentlich): dieser Code
- `organizer-data` (privat): leer anlegen; die App legt `data.json` selbst an

### 2. Token anlegen (Fine-grained Personal Access Token)
1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → *Generate new token*
2. Repository access: **Only select repositories** → `organizer-data`
3. Permissions → Repository permissions → **Contents: Read and write** (sonst nichts)
4. Token kopieren und in der App im Einrichtungsbildschirm einfügen, auf jedem Gerät einmal

Der Token wird nur im Browser des Geräts gespeichert (localStorage), nie im Code oder Repository.

### 3. GitHub Pages
Im Repo `organizer`: Settings → Pages → Source: **GitHub Actions**. Danach stellt jeder Push auf `main` die App unter `https://<benutzer>.github.io/organizer/` online.

## Release (Version archivieren)
1. Version in `package.json` erhöhen
2. Eintrag in `CHANGELOG.md` ergänzen
3. Tag setzen und pushen: `git tag v0.1.0 && git push origin v0.1.0`

Der Workflow **Release** baut, testet und legt ein GitHub Release mit `organizer-vX.Y.Z.zip` an.

## Rollback
GitHub → Actions → **Rollback** → *Run workflow* → Version eingeben (z. B. `v0.1.0`).
Diese Version geht online; `main` bleibt unverändert. Der nächste Push auf `main` stellt wieder die aktuelle Version online.
