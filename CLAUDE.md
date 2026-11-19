# Projekt: Haushalts-Organizer (Web-App / PWA)

## Ziel
Ein gemeinsamer Organizer für einen Haushalt mit zwei Personen (Lena und ich). Er hat einen Kalender, planbare und wiederkehrende Aufgaben, Zuordnung zu Räumen und Personen sowie Drag and Drop. Die App läuft im Browser auf Android (Samsung, Chrome) und iPhone (Safari) und lässt sich als PWA auf den Homescreen legen.

## Grundprinzip: kein Login, Daten bei GitHub
- **Keine Benutzerkonten, kein Login.** Beide nutzen dieselben Daten.
- **Zwei Repositories:**
  - `organizer` (**öffentlich**): der Code. GitHub Pages stellt daraus die App online. Hier liegen keine Daten und keine Geheimnisse.
  - `organizer-data` (**privat**): nur die Daten, als eine Datei `data.json`.
- Die App liest und schreibt `data.json` über die **GitHub REST API (Contents API)**.
- Zugriff über einen **Fine-grained Personal Access Token**:
  - Nur für das Repository `organizer-data`
  - Berechtigung: *Contents: Read and write*, sonst nichts
  - Wird **einmal pro Gerät** im Einrichtungsbildschirm eingegeben und im `localStorage` gespeichert
  - Der Token steht **niemals** im Code, im Repository oder in einer Build-Variable.

## Tech-Stack
| Bereich | Wahl |
|---|---|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| State | Zustand (leichtgewichtig) |
| Kalender | FullCalendar 6 (6.1.x, Tag-, Wochen-, Monatsansicht, Drag and Drop; wird per `lazy` erst beim Öffnen geladen) |
| Wiederholungen | rrule.js (RFC-5545-RRULE) |
| Animation, Sortieren, Wischen | `motion` (Version 12, `motion/react`: Layout-Animation, `Reorder`, Drag) |
| Datenspeicher | `data.json` im privaten Repo, über die GitHub REST API |
| Lokaler Cache | localStorage (bzw. IndexedDB, falls die Daten zu groß werden) |
| Hosting | GitHub Pages, Deployment per GitHub Actions |
| PWA | vite-plugin-pwa im Modus `injectManifest` (eigener Service Worker `src/sw.ts`) |
| Push | Web Push (VAPID), versendet von GitHub Actions im Daten-Repo mit `web-push` |
| Tests | Vitest (vor allem für Sync/Merge und Wiederholungen) |

### Hinweise zum Hosting
- `base` in `vite.config.ts` auf `/organizer/` setzen.
- Für das Routing den `HashRouter` verwenden (GitHub Pages kennt keine SPA-Fallbacks).
- Einzige Build-Variable ist `VITE_VAPID_PUBLIC_KEY` (öffentlich, für Push, ab Phase 6). Geheimnisse gehören nie in den Build.

## Synchronisation
**Lesen**
- `GET /repos/{owner}/organizer-data/contents/data.json`
- Header `Accept: application/vnd.github.raw+json` (liefert die Rohdatei, auch über 1 MB)
- Den **ETag** merken und beim nächsten Abruf als `If-None-Match` senden. Bei `304` hat sich nichts geändert, und der Abruf zählt nicht gegen das Rate-Limit.
- Die **SHA** der Datei separat merken, sie wird zum Schreiben gebraucht.

**Schreiben**
- `PUT /repos/{owner}/organizer-data/contents/data.json` mit `content` (Base64), `sha` und `message`
- **UTF-8 korrekt nach Base64 kodieren**, wegen Umlauten (`TextEncoder`, nicht nur `btoa`)
- Änderungen ca. **2 Sekunden bündeln (Debounce)**, damit nicht jeder Klick ein eigener Commit wird
- Commit-Message z. B. `update von <Gerätename>`

**Wann synchronisiert wird**
- Beim Öffnen der App
- Wenn die App wieder in den Vordergrund kommt (`visibilitychange`)
- Alle **30 Sekunden**, solange die App sichtbar ist
- Manuell per „Aktualisieren“-Geste bzw. -Button

**Konflikte** (beide ändern gleichzeitig)
- Der PUT schlägt mit `409` oder `422` fehl, weil die SHA veraltet ist.
- Dann neu laden, **lokal und remote zusammenführen** und erneut schreiben (maximal 3 Versuche).
- Merge-Regel: pro Datensatz (anhand der `id`) gewinnt der neuere `updatedAt`. Gelöschte Datensätze bleiben als `deleted: true` erhalten (Tombstones), damit eine Löschung nicht durch einen alten Stand zurückkommt.
- Tombstones, die älter als 30 Tage sind, dürfen beim Speichern entfernt werden.

**Offline**
- Alle Änderungen gehen sofort in den lokalen Cache und eine Warteschlange.
- Sobald wieder Netz da ist, wird synchronisiert.
- Ein dezenter Status in der UI zeigt „Synchronisiert“, „Wird gespeichert…“ oder „Offline“.

## Datenmodell (`data.json`)
Jeder Datensatz hat `id` (UUID), `updatedAt` (ISO-Zeitstempel), `deleted` (bool) sowie `createdBy` und `updatedBy` (Person-ID). Über die beiden letzten Felder weiß der Benachrichtigungs-Workflow, wer etwas geändert hat, damit man nicht über die eigenen Änderungen benachrichtigt wird.

```json
{
  "schemaVersion": 1,
  "persons": [
    { "id": "…", "name": "Lena", "kuerzel": "LE", "color": "#…" }
  ],
  "rooms": [
    { "id": "…", "name": "Küche", "color": "#…", "icon": "🍳", "sortOrder": 1 }
  ],
  "tasks": [
    {
      "id": "…",
      "title": "Bad putzen",
      "description": "",
      "roomId": "…",
      "priority": "medium",
      "startAt": "2026-11-20T10:00",
      "allDay": false,
      "durationMin": 30,
      "status": "open",
      "completedAt": null,
      "assigneeIds": ["…", "…"],
      "recurrenceRule": "FREQ=WEEKLY;BYDAY=SA",
      "recurrenceMode": "fixed",
      "rotation": true,
      "checklist": [ { "id": "…", "title": "Spiegel", "done": false } ]
    }
  ],
  "occurrences": [
    {
      "id": "…",
      "taskId": "…",
      "originalDate": "2026-11-21",
      "movedTo": null,
      "status": "done",
      "completedAt": "…",
      "completedBy": "…",
      "assigneeId": null
    }
  ],
  "shoppingLists": [
    { "id": "…", "name": "Einkauf", "sortOrder": 1 }
  ],
  "shoppingItems": [
    {
      "id": "…",
      "listId": "…",
      "name": "Milch",
      "quantity": "2 l",
      "note": "",
      "checked": false,
      "checkedAt": null,
      "sortOrder": 3
    }
  ],
  "devices": [
    {
      "id": "…",
      "personId": "…",
      "name": "Lenas iPhone",
      "pushSubscription": { "endpoint": "…", "keys": { "p256dh": "…", "auth": "…" } },
      "notify": {
        "newTask": true,
        "assignedToMe": true,
        "completedByOther": false,
        "changedOrMoved": false,
        "newShoppingItem": false,
        "onlyMyTasks": false,
        "dueReminder": true,
        "dueReminderMinutesBefore": 60,
        "dailySummary": true,
        "dailySummaryTime": "07:30",
        "quietHours": { "from": "22:00", "to": "07:00" },
        "rooms": []
      }
    }
  ]
}
```

- `priority`: `low` | `medium` | `high`
- `recurrenceMode`: `fixed` = fester Rhythmus | `after_completion` = X Tage nach Erledigung
- Aufgaben ohne `startAt` liegen in der **Inbox**.
- Bei einer Änderung von `schemaVersion` wird beim Laden automatisch migriert (`src/lib/migrations.ts`).

## Personen und Geräte
- Personen sind einfache Einträge in `persons`, ohne Konto.
- Beim Einrichten wählt jedes Gerät einmal **„Das bin ich“**. Die Auswahl wird lokal gespeichert, nicht in `data.json`.
- Sie wird für „Meine Aufgaben“ und für `completedBy` verwendet.

## Einrichtungsbildschirm (erster Start pro Gerät)
1. GitHub-Benutzername bzw. Owner des Daten-Repos
2. Name des Daten-Repos (Standard: `organizer-data`)
3. Token einfügen
4. „Verbindung testen“: Ist `data.json` leer oder fehlt sie, wird sie mit Grundstruktur und Beispielräumen angelegt.
5. „Das bin ich“ auswählen
- Alle Angaben lassen sich später in den Einstellungen ändern. Dort gibt es auch „Token entfernen“.

## Wiederholungslogik
- Serien werden einmal mit RRULE gespeichert. Die einzelnen Termine berechnet der Client für den sichtbaren Zeitraum.
- Erledigte, verschobene oder übersprungene Instanzen landen in `occurrences`.
- Beim Bearbeiten oder Verschieben wird gefragt: **„Nur diesen Termin“** oder **„Ganze Serie“**.
- `after_completion`: Die nächste Instanz wird erst beim Abhaken berechnet (Erledigungsdatum + Intervall).
- **Rotation**: Bei jeder neuen Instanz ist die nächste Person in `assigneeIds` zuständig.
- Unterstützte Muster: täglich, wochentags, wöchentlich an bestimmten Tagen, alle N Wochen, monatlich (z. B. am 15. oder am letzten Freitag), jährlich.

## Einkaufszettel

### Verhalten
- Liste mit **Checkboxen**, gemeinsam für beide und synchronisiert wie alles andere
- **Offene Artikel stehen oben**, in ihrer manuellen Reihenfolge (`sortOrder`).
- **Beim Abhaken rutscht der Artikel ans Listenende** in einen ausgegrauten, durchgestrichenen Bereich „Erledigt“. Der zuletzt abgehakte steht dort oben (Sortierung nach `checkedAt`, absteigend).
- **Wird ein Haken entfernt**, wandert der Artikel zurück ans Ende der offenen Artikel.
- Die Bewegung ist kurz **animiert** (z. B. mit FLIP oder `framer-motion`), damit man sieht, wohin der Artikel geht.
- Der Bereich „Erledigt“ ist einklappbar.

### Bedienung
- Eingabefeld oben, mit Enter bzw. „Hinzufügen“ landet der Artikel sofort in der Liste. Das Feld bleibt fokussiert, damit man schnell mehrere eintippen kann.
- Optional Menge und Notiz, z. B. „2 l“ oder „die laktosefreie“
- **Vorschläge beim Tippen** aus bereits abgehakten Artikeln. Wählt man einen aus, wird er wieder offen gesetzt statt doppelt angelegt.
- Offene Artikel lassen sich per **Drag and Drop** sortieren, z. B. nach Weg durch den Laden.
- Wischen nach links löscht einen Artikel, mit „Rückgängig“-Hinweis.
- Button **„Erledigte entfernen“** (mit Bestätigung)
- Große Checkboxen und Touch-Ziele, damit man im Laden einhändig abhaken kann
- Mehrere Listen möglich (z. B. „Supermarkt“, „Drogerie“). Standardmäßig gibt es eine Liste „Einkauf“.

### Sync-Details
- Jeder Artikel ist ein eigener Datensatz und wird einzeln zusammengeführt (wie Aufgaben). So kann Lena im Laden abhaken, während du zu Hause etwas ergänzt.
- Abhaken ist sofort sichtbar (optimistisch) und wird im Hintergrund gespeichert.
- Wenn die Liste geöffnet ist, ruhig **häufiger synchronisieren** (z. B. alle 10 Sekunden), weil hier oft zu zweit gleichzeitig gearbeitet wird.

## Push-Benachrichtigungen

### Prinzip
Jede Änderung ist ein Commit auf `data.json` im Daten-Repo. Ein **GitHub-Actions-Workflow im Daten-Repo** reagiert darauf, vergleicht den alten mit dem neuen Stand und verschickt passende **Web-Push-Nachrichten** an die registrierten Geräte. Einen eigenen Server braucht es dafür nicht.

### Einstellbar pro Gerät (Einstellungen → Benachrichtigungen)
- Neue Aufgabe angelegt (von der anderen Person)
- Aufgabe wurde mir zugewiesen (auch durch Rotation)
- Aufgabe von der anderen Person erledigt
- Aufgabe geändert oder verschoben
- Neuer Artikel auf dem Einkaufszettel (gebündelt: „Lena hat 4 Artikel hinzugefügt“)
- Nur Aufgaben, die mir zugewiesen sind
- Nur bestimmte Räume (leer = alle)
- Erinnerung vor Fälligkeit (z. B. 15 / 30 / 60 Minuten oder am Morgen des Tages)
- Tägliche Zusammenfassung zu einer wählbaren Uhrzeit („Heute: 4 Aufgaben, 1 überfällig“)
- Ruhezeiten, in denen nichts verschickt wird
- Button „Testbenachrichtigung senden“

### Ablauf in der App
1. In den Einstellungen tippt man auf „Benachrichtigungen aktivieren“. Die Berechtigung muss **per Nutzer-Tipp** angefragt werden, sonst lehnt iOS sie ab.
2. `pushManager.subscribe()` mit dem **öffentlichen VAPID-Key** ausführen
3. Subscription und Einstellungen als Eintrag in `devices` speichern (normaler Sync)
4. Der Service Worker (`src/sw.ts`) reagiert auf `push` mit `showNotification`. Bei `notificationclick` öffnet er die App direkt bei der betroffenen Aufgabe.
- **iPhone:** Push funktioniert nur, wenn die App **zum Homescreen hinzugefügt** wurde (ab iOS 16.4). Die App erkennt das und zeigt sonst eine kurze Anleitung.
- **Samsung/Android:** Funktioniert in Chrome und Samsung Internet.

### Workflows im Daten-Repo
**`notify-on-change.yml`** (Trigger: `push` auf `data.json`)
- Den vorherigen und den aktuellen Stand von `data.json` laden (`git show HEAD~1:data.json`)
- Unterschiede ermitteln: neue, zugewiesene, erledigte und geänderte Aufgaben
- Änderungen an `devices` ignorieren
- Pro Gerät die Einstellungen anwenden. Nie an Geräte der Person senden, die die Änderung gemacht hat (`updatedBy`).
- Mehrere Änderungen eines Commits zu **einer** Nachricht zusammenfassen („Lena hat 3 neue Aufgaben angelegt“)
- Ruhezeiten beachten (Zeitzone Europe/Berlin)

**`reminders.yml`** (Trigger: `schedule`, z. B. stündlich, plus `workflow_dispatch`)
- Fällige Erinnerungen und tägliche Zusammenfassungen verschicken
- Bereits Verschicktes in `notify-state.json` merken, damit nichts doppelt kommt. Dieser Commit darf `notify-on-change` nicht auslösen (Pfadfilter auf `data.json`).
- Hinweis: Geplante Workflows können sich um einige Minuten verzögern. Erinnerungen sind also nicht minutengenau.

**Gemeinsam für beide**
- Skript in Node: `scripts/notify.mjs` mit dem Paket `web-push`
- `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY` und `VAPID_SUBJECT` (z. B. `mailto:…`) als **Secrets im Daten-Repo**
- Abgelaufene Subscriptions (HTTP 404/410) beim nächsten Lauf aus `devices` entfernen
- **Keine Aufgabeninhalte in die Workflow-Logs schreiben**

### Kosten und Limits
- Private Repos haben **2.000 kostenlose Actions-Minuten pro Monat**, jeder Lauf zählt als mindestens 1 Minute.
- Grobe Rechnung: stündliche Erinnerungen ≈ 720 Minuten im Monat, dazu ca. 1 Minute pro gebündelter Änderung. Für zwei Personen reicht das gut.
- Der Debounce beim Speichern (siehe Synchronisation) hält die Zahl der Läufe niedrig.
- Den Verbrauch unter GitHub → Settings → Billing im Blick behalten. Bei Bedarf die Erinnerungen seltener laufen lassen.

### Einrichtung (einmalig)
1. VAPID-Schlüssel erzeugen (`npx web-push generate-vapid-keys`)
2. Den Private Key und Subject als Secrets im Daten-Repo hinterlegen
3. Den Public Key als Repository-Variable `VITE_VAPID_PUBLIC_KEY` im Code-Repo hinterlegen. Er ist öffentlich und darf in den Build.
4. Die Inhalte von `data-repo-template/` ins Daten-Repo kopieren

## Versionen und Archiv
Funktionierende Versionen werden **nicht als Code-Kopien** im Repo archiviert, sondern über Git-Tags und GitHub Releases. Das Archiv ist die Release-Liste auf GitHub.

### Versionsnummern (Semantic Versioning)
- `MAJOR.MINOR.PATCH`, z. B. `1.4.2`
- **PATCH** (1.4.**2**): Fehlerbehebung
- **MINOR** (1.**4**.0): neues Feature oder spürbare Erweiterung
- **MAJOR** (**1**.0.0): große Umbauten, besonders Änderungen am Datenformat (`schemaVersion`)
- Bis zum Abschluss von Phase 6 gilt `0.x.y`. Jede abgeschlossene Phase ist ein MINOR-Schritt (Phase 1 = `0.1.0`, Phase 2 = `0.2.0` …).
- **Ausnahme Phase 2b (Einkaufszettel):** wird als `0.2.1` veröffentlicht (so entschieden), danach geht es mit Phase 3 = `0.3.0` weiter.

### Eine Version archivieren (Release)
1. Version in `package.json` erhöhen
2. Eintrag in `CHANGELOG.md` ergänzen (Datum, Version, was neu/geändert/behoben ist, auf Deutsch)
3. Git-Tag `vX.Y.Z` setzen und pushen
4. Der Workflow `release.yml` startet automatisch beim Tag. Er baut die App, legt ein **GitHub Release** an, nimmt den CHANGELOG-Eintrag als Beschreibung und hängt den fertigen Build als `organizer-vX.Y.Z.zip` an.
- Ein Release wird nur erstellt, wenn Build und Tests erfolgreich sind. Im Archiv landen also nur funktionierende Versionen.
- Die Versionsnummer wird in der App unter Einstellungen angezeigt.

### Zu einer alten Version zurückkehren (Rollback)
- Workflow `rollback.yml`, manuell startbar (`workflow_dispatch`) mit Eingabe `version` (z. B. `v0.3.0`)
- Er baut genau diesen Tag und stellt ihn auf GitHub Pages online. Der `main`-Branch bleibt unverändert.
- Der nächste normale Push auf `main` stellt wieder die aktuelle Version online.
- Starten lässt er sich auf GitHub unter Actions → „Rollback“ → „Run workflow“, das geht auch vom Handy.

### Schutz der Daten bei alten Versionen
- Kennt die App eine `schemaVersion` in `data.json` nicht (Daten sind neuer als die App), wechselt sie in einen **Nur-Lesen-Modus** mit Hinweis. So kann eine alte Version die Daten nicht beschädigen.
- **Vor jeder Migration** auf eine neue `schemaVersion` legt die App eine Sicherung im Daten-Repo an: `backups/data-schema<alt>-<JJJJ-MM-TT>.json`.
- Die komplette Datenhistorie steht zusätzlich in der Commit-Historie des Daten-Repos.

## Ordnerstruktur

### Code-Repo `organizer` (öffentlich)
```
organizer/
├── .github/workflows/
│   ├── deploy.yml                 # Bei Push auf main: Tests, Build, Deploy auf GitHub Pages
│   ├── release.yml                # Bei Tag vX.Y.Z: Release mit ZIP + Changelog anlegen
│   └── rollback.yml               # Manuell: eine archivierte Version online stellen
├── public/
│   └── icons/                     # PWA-Icons 192/512 px, apple-touch-icon
├── src/
│   ├── main.tsx                   # Einstiegspunkt
│   ├── App.tsx                    # Router + Layout
│   ├── features/                  # Ein Ordner pro Funktionsbereich
│   │   ├── setup/                 # Einrichtung: Token, Repo, „Das bin ich“
│   │   ├── today/                 # Heute-Ansicht
│   │   ├── tasks/                 # Aufgabenliste, Formular, Checklisten, Inbox
│   │   ├── calendar/              # FullCalendar-Ansichten, Drag and Drop
│   │   ├── rooms/                 # Räume verwalten, Farbauswahl
│   │   ├── shopping/              # Einkaufszettel: Listen, Artikel, Vorschläge
│   │   ├── persons/               # Personen verwalten
│   │   ├── notifications/         # Push aktivieren, Einstellungen pro Gerät, Test
│   │   └── settings/              # Einstellungen, Dark Mode, Sync-Status
│   ├── components/
│   │   ├── ui/                    # Button, Modal, Badge, ColorPicker …
│   │   └── layout/                # BottomNav, Header, FAB („+“-Button), SyncIndicator
│   ├── store/                     # Nur Zusammenbau: verbindet die Feature-Stores mit dem Sync (+ initialData.ts)
│   ├── lib/
│   │   ├── github.ts              # GitHub-API: lesen (ETag), schreiben (SHA), Base64/UTF-8
│   │   ├── sync.ts                # Polling, Debounce, Warteschlange, Retry
│   │   ├── merge.ts               # Zusammenführen lokal/remote (+ merge.test.ts)
│   │   ├── recurrence.ts          # RRULE, Rotation (+ recurrence.test.ts)
│   │   ├── migrations.ts          # schemaVersion-Migrationen
│   │   ├── storage.ts             # localStorage: Token, Gerät, Cache
│   │   ├── sha1.ts                # Git-Blob-SHA aus dem Dateiinhalt (spart einen API-Abruf, läuft auch ohne HTTPS)
│   │   ├── records.ts             # uuid, touch (updatedAt/updatedBy), tombstone, alive
│   │   ├── push.ts                # Subscription anlegen/entfernen, Berechtigung
│   │   └── dates.ts               # Datumshelfer (deutsch, Europe/Berlin)
│   ├── sw.ts                      # Service Worker: Offline-Cache, push, notificationclick
│   ├── types/data.ts              # Gesamttyp von data.json, setzt sich aus den Feature-Typen zusammen
│   └── styles/index.css           # Tailwind-Einstieg
├── data-repo-template/            # Vorlage für das Daten-Repo (ohne Daten, ohne Secrets)
│   ├── .github/workflows/
│   │   ├── notify-on-change.yml
│   │   └── reminders.yml
│   ├── scripts/notify.mjs
│   ├── package.json               # Abhängigkeit: web-push, rrule
│   └── README.md
├── .gitignore                     # u. a. node_modules, dist
├── CHANGELOG.md                   # Versionsgeschichte (Grundlage für die Releases)
├── CLAUDE.md                      # Diese Datei
├── README.md                      # Kurzanleitung: Setup, Token anlegen, Deploy, Rollback
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Daten-Repo `organizer-data` (privat)
```
organizer-data/
├── .github/workflows/
│   ├── notify-on-change.yml   # Push bei Änderungen
│   └── reminders.yml          # Erinnerungen + tägliche Zusammenfassung
├── scripts/notify.mjs         # Diff + Versand
├── package.json
├── data.json                  # Alle Daten (wird von der App angelegt und gepflegt)
├── notify-state.json          # Bereits verschickte Erinnerungen
├── backups/                   # Automatische Sicherungen vor Datenmigrationen
└── README.md                  # Hinweis: Wird von der App verwaltet, nicht von Hand bearbeiten
```

Die Erinnerungslogik in `scripts/notify.mjs` muss dieselben Wiederholungsregeln verwenden wie `src/lib/recurrence.ts`. Gleiche Bibliothek (rrule.js), gleiche Regeln, idealerweise mit gemeinsamen Testfällen.

### Aufbau eines Feature-Ordners
Jedes Feature ist in sich abgeschlossen. Beispiel:
```
src/features/shopping/
├── components/        # Nur für dieses Feature: ShoppingList, ShoppingItem, AddItemInput
├── store.ts           # Zustand-Slice: Daten + Aktionen dieses Features
├── types.ts           # Typen dieses Features (z. B. ShoppingItem, ShoppingList)
├── utils.ts           # Reine Logik, z. B. Sortierung „Erledigt nach unten“
├── utils.test.ts      # Tests zur Logik
├── routes.tsx         # Seite(n) des Features für den Router
└── index.ts           # Öffentliche Schnittstelle: das Einzige, was andere importieren dürfen
```
Nicht jedes Feature braucht jede Datei. Kleine Features dürfen schlanker sein.

### Regeln
- **Ein Feature = ein Ordner** unter `src/features/<bereich>/`. Alles, was nur dieses Feature braucht, liegt dort, auch Store-Teil, Typen und Tests.
- **Features importieren voneinander nur über `index.ts`**, nie aus Unterordnern eines anderen Features. Beispiel: `calendar` nutzt `import { useTasks } from '@/features/tasks'`.
- **Gemeinsames liegt außerhalb der Features**: `src/lib/` (Sync, GitHub, Datum, Wiederholungen), `src/components/` (allgemeine UI-Bausteine). Wird etwas von zwei oder mehr Features gebraucht, wandert es dorthin.
- **`src/lib/` und `src/components/` importieren nie aus `src/features/`.** Abhängigkeiten zeigen nur in eine Richtung.
- Der Import-Alias `@/` zeigt auf `src/`. Eine ESLint-Regel (`no-restricted-imports`) verhindert Importe aus fremden Feature-Unterordnern.
- Komponenten greifen **nur über den Store** auf Daten zu, nie direkt auf `github.ts`.
- **Änderungen an einem Feature** sollen nur dessen Ordner betreffen. Ausnahmen sind neue Datenfelder: Dann zusätzlich `types/data.ts` anpassen und bei Bedarf eine Migration in `lib/migrations.ts` (`schemaVersion` erhöhen) anlegen.
- **Neues Feature hinzufügen:** Ordner nach obigem Schema anlegen, Route registrieren, Datenbereich in `data.json` und `types/data.ts` ergänzen, eventuell einen Eintrag in der Navigation.
- Jede Änderung an Daten setzt `updatedAt` und `updatedBy`. Löschen setzt `deleted: true`.
- Der Token darf nie geloggt, angezeigt (außer maskiert) oder ins Repo geschrieben werden.

## Features nach Phasen

### Phase 1: Grundgerüst und Sync (`v0.1.0`, abgeschlossen am 19.11.2026)
- [x] Vite + React + TS + Tailwind aufsetzen, GitHub-Actions-Deploy auf Pages
- [x] PWA-Manifest + Icons, „Zum Homescreen hinzufügen“ funktioniert auf Android und iOS
- [x] Einrichtungsbildschirm (Token, Repo, „Das bin ich“)
- [x] `github.ts` + `sync.ts` + `merge.ts` inklusive Tests
- [x] Sync-Statusanzeige
- [x] `CHANGELOG.md`, `release.yml` und `rollback.yml`, Versionsanzeige in der App
- [x] Erstes Release `v0.1.0`

**Online:** https://inzuna-ai.github.io/organizer/ · Code-Repo `Inzuna-AI/organizer` (Name klein geschrieben, sonst stimmt `base` nicht)

### Phase 2: Aufgaben, Räume, Personen (`v0.2.0`, abgeschlossen am 19.11.2026)
- [x] Räume verwalten (Name, Farbe, Icon, Reihenfolge)
- [x] Personen verwalten (Name, Kürzel, Farbe)
- [x] Aufgaben anlegen und bearbeiten (Titel, Beschreibung, Raum, Priorität, Datum, Dauer)
- [x] Aufgaben einer oder mehreren Personen zuordnen
- [x] Checklisten/Unteraufgaben
- [x] **Inbox**: Aufgaben ohne Datum
- [x] **Heute-Ansicht** als Startseite (inkl. überfälliger Aufgaben)
- [x] Filter nach Raum, Person und Status, plus „Meine Aufgaben“

Hinweise zur Umsetzung: Räume und Personen werden unter Einstellungen → Verwalten gepflegt (`/einstellungen/raeume`, `/einstellungen/personen`). Status-Filter = Ansichten „Geplant / Inbox / Erledigt“ unter `/aufgaben?ansicht=…`. Kleine Bedien-Einstellungen pro Gerät (Filter, „Meine/Alle“) liegen über `loadPref`/`savePref` in `lib/storage.ts`.

### Phase 2b: Einkaufszettel (`v0.2.1`, abgeschlossen am 19.11.2026)
- [x] Liste mit Checkboxen, Hinzufügen per Eingabefeld
- [x] Abgehakte Artikel ans Listenende (mit Animation), Haken entfernen holt sie zurück
- [x] Bereich „Erledigt“ einklappbar, „Erledigte entfernen“
- [x] Vorschläge aus früheren Artikeln
- [x] Sortieren per Drag and Drop, Löschen per Wischen mit „Rückgängig“
- [x] Mehrere Listen

Hinweise zur Umsetzung: Vorschläge stammen auch aus bereits entfernten Artikeln (Tombstones, bis sie nach 30 Tagen bereinigt werden). Gibt es keine Liste, legt das erste Hinzufügen automatisch „Einkauf“ an. Während der Einkaufszettel offen ist, setzt die Seite das Polling über `setSyncInterval` auf 10 s.

### Phase 3: Kalender (`v0.3.0`, abgeschlossen am 19.11.2026)
- [x] Tag-, Wochen- und Monatsansicht (FullCalendar)
- [x] Einträge in der **Farbe des Raums**, Person als Kürzel-Badge am Eintrag
- [x] Umschalter: Farbe nach Raum oder nach Person
- [x] **Drag and Drop** zum Verschieben (Datum/Uhrzeit), auch aus der Inbox in den Kalender
- [x] Auf dem Handy: Long-Press zum Ziehen, große Touch-Ziele

Hinweise zur Umsetzung: Kürzel-Badges erscheinen in Woche und Tag; in der Monatsansicht ist dafür zu wenig Platz (dort „Farbe nach Person“ nutzen). Kalenderzeiten sind lokale Gerätezeit; `startAt` wird ohne Zeitzone als lokale Wandzeit gespeichert. Long-Press-Verzögerung 350 ms, Raster 15 Minuten. Ansicht und Farbmodus merkt sich das Gerät (`loadPref`). Wiederholungen (Phase 4) müssen im Kalender als einzelne Termine aus der RRULE berechnet werden; aktuell zeigt `tasksToEvents` nur einmalige Aufgaben.

### Phase 4: Wiederholungen
- [ ] Wiederholungs-Editor mit den Mustern oben
- [ ] „Nur dieser Termin / ganze Serie“ beim Bearbeiten und Verschieben
- [ ] `after_completion`-Modus
- [ ] Rotation zwischen Personen

### Phase 5: Komfort
- [ ] Suche über alle Aufgaben
- [ ] Dark Mode
- [ ] Offline-Nutzung mit Warteschlange (siehe Synchronisation)
- [ ] Export/Import von `data.json` als zusätzliches Backup

### Phase 6: Push-Benachrichtigungen
- [ ] VAPID-Setup und eigener Service Worker (`src/sw.ts`)
- [ ] „Benachrichtigungen aktivieren“ inklusive iOS-Homescreen-Hinweis
- [ ] Einstellungsseite pro Gerät (siehe Push-Benachrichtigungen)
- [ ] `data-repo-template/` mit `notify-on-change.yml`, `reminders.yml` und `notify.mjs`
- [ ] Testbenachrichtigung
- [ ] Abgelaufene Subscriptions aufräumen

### Später / optional
- Sync mit Google- oder Apple-Kalender (z. B. als ICS-Export)
- Statistiken (erledigte Aufgaben pro Person/Raum)

## UI-Grundsätze
- **Mobile first**: Die Hauptnutzung ist auf dem Handy, Desktop ist ein Bonus.
- Untere Navigationsleiste: Heute · Kalender · Aufgaben · Einkauf · Einstellungen
- Schnelles Anlegen über einen schwebenden „+“-Button
- Sprache der Oberfläche: **Deutsch**, Datumsformat TT.MM.JJJJ, Woche beginnt am Montag, Zeitzone Europe/Berlin
- Farben von Räumen müssen auf hellem und dunklem Hintergrund lesbar sein.
- Änderungen erscheinen sofort in der UI (optimistisch), der Sync läuft im Hintergrund.

## Arbeitsweise für Claude Code
- Phase für Phase vorgehen. Nach jeder Phase muss die App lauffähig und deployt sein, und es gibt ein Release (siehe Versionen und Archiv).
- **Der Code wird lokal gebaut** (Ordner `C:\Users\inzun\Desktop\Claude\Organizer`), nicht über claude.ai/code.
- **Erst lokal testen, dann GitHub:** Nach jeder Phase gibt es zuerst eine lokale Testversion (`npm run dev` bzw. `npm run build` + `npm run preview`, auch im WLAN fürs Handy erreichbar). Erst wenn der Nutzer sie freigegeben hat, wird nach GitHub gepusht, deployt und das Release erstellt. Vorher wird nichts gepusht.
- Bei Änderungswünschen zuerst prüfen, welches Feature betroffen ist, und möglichst nur dort ändern.
- Diese CLAUDE.md aktuell halten: Wenn sich Features, Datenmodell oder Struktur ändern, wird sie mit angepasst.
- Kleine, nachvollziehbare Commits
- Sync- und Merge-Logik sowie Wiederholungen mit Unit-Tests absichern
- Vor größeren Architekturentscheidungen kurz nachfragen
- Kein unnötiger Overhead: kein Redux, kein eigener Backend-Server
