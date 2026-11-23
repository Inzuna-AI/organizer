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
  "schemaVersion": 2,
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
  "events": [
    {
      "id": "…",
      "title": "Zahnarzt",
      "location": "Praxis Dr. Weber",
      "note": "",
      "startAt": "2026-11-20T15:00",
      "endAt": "2026-11-20T16:00",
      "allDay": false,
      "personIds": ["…"],
      "recurrenceRule": null,
      "exceptions": [ { "date": "2026-11-27", "movedTo": "2026-11-27T17:00", "skipped": false } ]
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
- `events` (Termine, ab `schemaVersion` 2): `startAt` mit Uhrzeit oder ganztägig `JJJJ-MM-TT`. `endAt` mit Uhrzeit (auch an einem späteren Tag) bzw. bei ganztägigen der letzte Tag inklusive; `null` = 60 Minuten bzw. ein Tag. `personIds` leer oder alle Personen = „Familie“. Ausnahmen einer Serie stehen direkt im Termin (`exceptions`, Schlüssel = ursprüngliches Datum), nicht in `occurrences`.
- `devices[].notify.newEvent`: Nachricht bei neuem oder geändertem Termin, bei dem die Person dabei ist.
- `tasks[].reminderTimes` / `events[].reminderTimes` (optional, seit v1.2.0): Erinnerungen zu festen Uhrzeiten als `"<Tage relativ>@HH:MM"`, z. B. `"-7@09:00"`, `"-1@15:00"`, `"0@21:00"`. Fehlt = keine Erinnerung.
- Bei Zeitraum-Aufgaben (seit v1.7.0) enthält `reminderTimes` stattdessen `"start@09:00"` und/oder `"end@09:00"` (zum Start bzw. kurz vor Ablauf). Ältere notify-Versionen ignorieren diese Codes.
- `notes` (Notizen, seit v1.8.0, kein Schema-Wechsel): `title`, `text`, `checklist` (wie bei Aufgaben), `color` (Hex oder `null`), `pinned`. Die Sammlung fehlt in älteren Dateien; `normalizeData` ergänzt `[]`, ältere App-Versionen lassen sie unverändert stehen.
- `devices[].notify.newNote` (optional, seit v1.8.0): Nachricht bei neuer Notiz der anderen Person. Fehlt = an.
- `recipes` und `meals` (Essensplaner, seit v1.9.0, kein Schema-Wechsel, fehlen in älteren Dateien; `normalizeData` ergänzt `[]`):
  - `recipes[]`: `title`, `ingredients` (`[{ id, name, quantity }]`, Menge als Text), `note`, `link`, `speed` und `effort` (`1` | `2` | `3` | `null` = schnell/leicht … dauert/aufwendig), `side` (Sättigungsbeilage) und `kind` (Fleisch, Fisch, vegetarisch …) als Text oder `null`, `favorite`, optional `soon` (Merkliste „Bald mal wieder“: ISO-Zeitpunkt des Merkens, fehlt/`null` = nicht gemerkt).
  - `meals[]`: nur Mittagessen. `id` deterministisch `mittag:<JJJJ-MM-TT>`, `date`, `recipeId` (oder `null`) bzw. Freitext `text`, `note`. „Nichts geplant“ = Tombstone.
- `shoppingItems[].later` (optional, seit v1.7.0): `true` = liegt unter „Nächster Einkauf“. Fehlt/`false` = aktuelle Liste.
- `tasks[].period` (optional, seit v1.4.0): `week` | `month` | `quarter` | `half` | `year` = Aufgabe mit Zeitraum statt festem Tag. `startAt` ist dann der erste Tag des Zeitraums (ganztägig), eine Serie hat `FREQ=WEEKLY;BYDAY=MO` bzw. `FREQ=MONTHLY;INTERVAL=<Monate>`. Fehlt/`null` = fester Tag.
- `devices[].notify.dueReminder`: Erinnerungen auf diesem Gerät an/aus. `dueReminderMinutesBefore` wird seit v1.3.0 nicht mehr verwendet. `quietHours` kann `null` sein (keine Ruhezeiten).
- `devices[].testRequestedAt` (optional): Ändert sich der Wert, schickt `notify-on-change` eine Testbenachrichtigung an dieses Gerät.
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
- Erinnerungen an/aus (die Uhrzeiten werden pro Aufgabe/Termin angekreuzt)
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

**`reminders.yml`** (Trigger: `schedule`, alle 30 Minuten von 6 bis 23 Uhr, plus `workflow_dispatch`)
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
- Grobe Rechnung: Erinnerungen alle 30 Minuten (Cron `7,37 4-22 * * *` UTC) ≈ 1.150 Minuten im Monat, dazu ca. 1 Minute pro gebündelter Änderung. Für zwei Personen reicht das gut.
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
│   │   ├── events/                # Termine: Formular, Personen, Serien (/termine/neu, /termine/:id)
│   │   ├── rooms/                 # Räume verwalten, Farbauswahl
│   │   ├── shopping/              # Einkaufszettel: Listen, Artikel, Vorschläge
│   │   ├── meals/                 # Essensplaner: Wochenplan (Mittagessen), Gerichte-Datenbank, Zutaten einkaufen (/essen …)
│   │   ├── notes/                 # Notizen: Kachel-Übersicht, Editor mit Autospeichern (/notizen, /notizen/:id)
│   │   ├── search/                # Suche über Aufgaben, Termine, Notizen (/suche)
│   │   ├── persons/               # Personen verwalten
│   │   ├── notifications/         # Push aktivieren, Einstellungen pro Gerät, Test
│   │   └── settings/              # Einstellungen, Dark Mode, Sync-Status
│   ├── components/
│   │   ├── ui/                    # Button, Modal, Badge, ColorPicker, ChecklistEditor, RecurrenceEditor, FabChoice …
│   │   └── layout/                # BottomNav, Header, FAB („+“-Button), SyncIndicator
│   ├── store/                     # Nur Zusammenbau: verbindet die Feature-Stores mit dem Sync (+ initialData.ts)
│   ├── lib/
│   │   ├── github.ts              # GitHub-API: lesen (ETag), schreiben (SHA), Base64/UTF-8
│   │   ├── sync.ts                # Polling, Debounce, Warteschlange, Retry
│   │   ├── merge.ts               # Zusammenführen lokal/remote (+ merge.test.ts)
│   │   ├── recurrence.ts          # RRULE, Rotation (+ recurrence.test.ts)
│   │   ├── events.ts              # Termine: Dauer, Serien auflösen, Verschieben, Familie (+ events.test.ts)
│   │   ├── holidays.ts            # Gesetzliche Feiertage (Bremen), nur berechnet (+ holidays.test.ts)
│   │   ├── periods.ts             # Zeitraum-Aufgaben: Woche bis Jahr, laufender/nächster Zeitraum (+ periods.test.ts)
│   │   ├── migrations.ts          # schemaVersion-Migrationen
│   │   ├── storage.ts             # localStorage: Token, Gerät, Cache
│   │   ├── text.ts                # normalize/matches für Suche und Filter (ohne Umlaute, ß → ss)
│   │   ├── sha1.ts                # Git-Blob-SHA aus dem Dateiinhalt (spart einen API-Abruf, läuft auch ohne HTTPS)
│   │   ├── records.ts             # uuid, touch (updatedAt/updatedBy), tombstone, alive
│   │   ├── theme.ts               # Dark Mode: Klasse .dark am <html>, System/Hell/Dunkel
│   │   ├── backup.ts              # Export/Import von data.json (+ backup.test.ts)
│   │   ├── push.ts                # Subscription anlegen/entfernen, Berechtigung
│   │   └── dates.ts               # Datumshelfer (deutsch, Europe/Berlin)
│   ├── sw.ts                      # Service Worker: Offline-Cache, push, notificationclick
│   ├── notify/                    # Benachrichtigungslogik für Node (changes, reminders, time, common + notify.test.ts); nur @/lib und @/types
│   ├── types/data.ts              # Gesamttyp von data.json, setzt sich aus den Feature-Typen zusammen
│   └── styles/index.css           # Tailwind-Einstieg
├── data-repo-template/            # Vorlage für das Daten-Repo (ohne Daten, ohne Secrets)
│   ├── .github/workflows/
│   │   ├── notify-on-change.yml
│   │   └── reminders.yml
│   ├── scripts/notify.mjs         # ERZEUGT mit `npm run build:notify`, nicht von Hand bearbeiten
│   ├── package.json               # Abhängigkeit: nur web-push (rrule ist im Bundle)
│   └── README.md
├── notify/main.ts                 # Node-Einstieg von notify.mjs: data.json lesen, git show HEAD~1, web-push senden
├── scripts/build-notify.mjs       # esbuild: src/notify + notify/main.ts → data-repo-template/scripts/notify.mjs
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

Die Erinnerungslogik in `scripts/notify.mjs` muss dieselben Wiederholungsregeln verwenden wie `src/lib/recurrence.ts`. Deshalb wird `notify.mjs` aus dem App-Code gebaut (`npm run build:notify`) und mit ins Code-Repo committet; der Deploy-Workflow bricht ab, wenn die Datei nicht aktuell ist. Nach Änderungen an `src/notify`, `src/lib/recurrence.ts` o. Ä. die neue Datei ins Daten-Repo kopieren.

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

Hinweise zur Umsetzung: Kürzel-Badges erscheinen in Woche und Tag; in der Monatsansicht ist dafür zu wenig Platz (dort „Farbe nach Person“ nutzen). Kalenderzeiten sind lokale Gerätezeit; `startAt` wird ohne Zeitzone als lokale Wandzeit gespeichert. Long-Press-Verzögerung 350 ms, Raster 15 Minuten. Ansicht und Farbmodus merkt sich das Gerät (`loadPref`). `tasksToEvents` löst Serien für den sichtbaren Zeitraum (`datesSet`) in einzelne Termine auf.

### Phase 4: Wiederholungen (`v0.4.0`, abgeschlossen am 19.11.2026)
- [x] Wiederholungs-Editor mit den Mustern oben
- [x] „Nur dieser Termin / ganze Serie“ beim Bearbeiten und Verschieben
- [x] `after_completion`-Modus
- [x] Rotation zwischen Personen

Hinweise zur Umsetzung:
- Die gesamte Logik liegt rein in `lib/recurrence.ts` (rrule.js, „schwebend“ in UTC gerechnet, damit Sommerzeit nichts verschiebt). `notify.mjs` (Phase 6) soll sie übernehmen. Achtung: In Node ist `rrule` CommonJS, dort `import pkg from 'rrule'; const { RRule } = pkg`.
- `recurrenceRule` ist die RRULE ohne DTSTART; der Serienstart ist `startAt`. Ende als `UNTIL=JJJJMMTTT235959Z`. „Monatlich am 15.“ hat kein BYDAY (Tag kommt aus `startAt`), „am 3./letzten Freitag“ hat `BYDAY=3FR` bzw. `-1FR`.
- `after_completion` speichert nur Rhythmus und Intervall (z. B. `FREQ=DAILY;INTERVAL=14`). `startAt` ist der aktuelle Termin; beim Abhaken entsteht eine erledigte Occurrence, und `startAt` wird Erledigungsdatum + Intervall.
- Occurrence-IDs sind deterministisch `<taskId>:<JJJJ-MM-TT>` (ursprüngliches Datum), damit beide Geräte denselben Datensatz anlegen. Kein `schemaVersion`-Wechsel nötig.
- „Nur diesen Termin“ ändert nur Datum/Uhrzeit (`movedTo`) und Person (`assigneeId`). Titel, Raum, Checkliste usw. gelten immer für die Serie. „Diesmal zuständig“ steht auf der Termin-Seite und gilt ohne Rückfrage nur für den Termin. „Ganze Serie“ verschiebt Serienstart und Wochentage um denselben Abstand.
- Ändern sich Serienstart oder Regel, werden offene Ausnahmen (verschoben, übersprungen, eigene Person) verworfen; erledigte Termine bleiben als Verlauf.
- Listen (Heute, Geplant, Erledigt) zeigen pro Serie: den letzten verpassten Termin als überfällig (ältere verfallen still), alle Termine von heute und morgen, den nächsten offenen und alle erledigten (`listInstances`). Termine haben Links `/aufgaben/<id>?datum=<ursprüngliches Datum>`.
- Rotation: fester Rhythmus nach Position des Termins in der Serie, `after_completion` nach Anzahl erledigter Termine.
- Im Kalender lassen sich Serien-Termine nicht in der Länge ändern (Dauer gilt für die Serie).

### Phase 5: Komfort (`v0.5.0`, abgeschlossen am 19.11.2026)
- [x] Suche über alle Aufgaben
- [x] Dark Mode
- [x] Offline-Nutzung mit Warteschlange (siehe Synchronisation)
- [x] Export/Import von `data.json` als zusätzliches Backup

Hinweise zur Umsetzung:
- Suche: Feature `search`, Route `/suche?q=…` (Begriff in der URL, damit er nach „Zurück“ bleibt). Lupe im Header auf Heute, Kalender, Aufgaben. Normalisierung: Kleinbuchstaben, ohne Diakritika, ß → ss; alle Wörter müssen vorkommen. Pro Aufgabe ein Treffer (nächster offener Termin, sonst zuletzt erledigter).
- Dark Mode: `lib/theme.ts` setzt `.dark` am `<html>` (Pref `theme`: system/light/dark); ein Inline-Skript in `index.html` setzt die Klasse schon vor dem Laden. Umsetzung per **Token-Umdeutung** in `styles/index.css`: Unter `.dark` stehen `--color-white` und die `slate`-Skala für dunkle Flächen/helle Schrift, dazu wenige Overrides (`text-white`, `text-brand-700`, `text-red-*`). Neue Komponenten brauchen also meist kein `dark:`. Ausnahmen (Toast, Banner) nutzen `dark:` direkt; Overlays `bg-black/…` statt `bg-slate-900/…`. Kalenderfarben in `calendar.css`.
- Offline: Die Warteschlange ist der `dirty`-Cache des SyncEngine. Anzeige „Offline · wartet“, wenn offline und dirty. Der Service Worker cacht alle JS-Dateien vor, auch den Kalender-Chunk.
- Export/Import: `lib/backup.ts`. „Zusammenführen“ = `mergeData`, „Wiederherstellen“ = Datensätze der Datei mit neuem `updatedAt` übernehmen, alles andere als Tombstone löschen. `devices` bleiben bei beidem unverändert. Zu neue `schemaVersion` wird abgelehnt, ältere migriert.

### Phase 6: Push-Benachrichtigungen (`v0.6.0`, abgeschlossen am 19.11.2026)
- [x] VAPID-Setup und eigener Service Worker (`src/sw.ts`)
- [x] „Benachrichtigungen aktivieren“ inklusive iOS-Homescreen-Hinweis
- [x] Einstellungsseite pro Gerät (siehe Push-Benachrichtigungen)
- [x] `data-repo-template/` mit `notify-on-change.yml`, `reminders.yml` und `notify.mjs`
- [x] Testbenachrichtigung
- [x] Abgelaufene Subscriptions aufräumen

Hinweise zur Umsetzung:
- Feature `notifications`, Route `/einstellungen/benachrichtigungen`. Die id des eigenen `devices`-Eintrags merkt sich das Gerät (Pref `pushDeviceId`). Beim Start gleicht `notificationActions.refresh()` Person, Gerätename und eine erneuerte Subscription ab, ohne nach Berechtigung zu fragen.
- `lib/push.ts`: `pushSupport()` liefert `dev` (kein Service Worker unter `npm run dev`), `no-key`, `ios-not-installed`, `unsupported` oder `ok`. Push geht nur über HTTPS oder localhost, nicht über `http://` im WLAN.
- Testbenachrichtigung: Die App setzt `devices[].testRequestedAt`; `notify-on-change` schickt dann einen echten Push an genau dieses Gerät (auch in Ruhezeiten).
- Die Logik liegt in `src/notify/` (läuft in Node, nur `@/lib` und `@/types`, per ESLint erzwungen) mit Tests; `notify/main.ts` ist der Node-Einstieg. `npm run build:notify` bündelt alles samt rrule nach `data-repo-template/scripts/notify.mjs`. Das Daten-Repo braucht nur `web-push`.
- Änderungen: Neue, zugewiesene (inkl. Rotation), erledigte, geänderte/verschobene Aufgaben und neue/wieder geöffnete Einkaufsartikel; Häkchen in Checklisten lösen nichts aus. Pro Gerät und Commit wird zu einer Nachricht gebündelt. Nie an Geräte der Person in `updatedBy`.
- Erinnerungen: siehe Abschnitt „Erinnerungen zu festen Uhrzeiten“. Die Zusammenfassung kommt im ersten Lauf ab der gewählten Uhrzeit (Fenster 3 h). Verschicktes steht in `notify-state.json` (3 Tage).
- In Ruhezeiten wird nichts verschickt und auch nichts als verschickt gemerkt.
- HTTP 404/410 beim Senden: Gerät wird als Tombstone mit `pushSubscription: null` gespeichert (Commit mit `[skip ci]`).
- Fehlen die VAPID-Secrets, überspringen die Workflows mit einem Hinweis, statt fehlzuschlagen.
- VAPID-Schlüssel liegen lokal in `.env.vapid` (beide) und `.env.local` (öffentlicher, für lokale Builds), beide von Git ausgeschlossen. Das Daten-Repo heißt auf GitHub inzwischen `Organizer-Data` (Groß-/Kleinschreibung ist der API egal).

### Termine im Kalender (`v1.0.0`, abgeschlossen am 19.11.2026)
- [x] Eigener Bereich `events` (schemaVersion 2, automatische Migration mit Sicherung)
- [x] Termine mit Ort, Notiz, ganztägig/mehrtägig, Personen („Ganze Familie“), Wiederholung
- [x] Sichtbarer Unterschied im Kalender: Termin vollflächig, Aufgabe hell mit ☐/☑
- [x] Heute-Ansicht („Termine heute“), Suche, Push (neu/geändert, Erinnerung, Zusammenfassung)

Hinweise zur Umsetzung:
- Feature `events`, Routen `/termine/neu?datum=&uhrzeit=` und `/termine/:id?datum=<ursprüngliches Datum>`; „Zurück“ führt zum Kalender. Reine Logik in `lib/events.ts` (nutzt `lib/recurrence` über einen Adapter, Ausnahmen als Pseudo-Occurrences).
- Darstellung: eine Person = ihre Farbe; mehrere (nicht alle) = Streifen (`eventBackground`, im `EventContent` als Fläche hinter dem Text); alle oder keine = Familie (`FAMILY_COLOR`, 👪). Aufgaben: Hintergrund Raum-/Personenfarbe mit Alpha `2e`, Klasse `cal-task` (linker Rand 4 px). Der Umschalter „Farbe nach Raum/Person“ gilt nur für Aufgaben.
- „Nur diesen Termin“ verschiebt nur den Beginn (`exceptions[].movedTo`), die Länge gilt für die Serie. „Ganze Serie“ (`shiftSeries`) verschiebt Start, Wochentage und übernimmt eine neue Länge. Geänderter Serienstart/Regel verwirft Ausnahmen. Wechsel ganztägig ↔ Uhrzeit setzt die Standardlänge. Neue Termine sind nie vorab ganztägig (seit v1.3.1): ohne Uhrzeit vorbelegt mit `DEFAULT_EVENT_TIME` 10:00.
- Freier Platz im Kalender und „+“ (Kalender, Heute) fragen per `FabChoice`/`ChoiceDialog` „Termin oder Aufgabe“. `RecurrenceEditor` liegt jetzt in `components/ui` (Props `canRotate?`, `allowAfterCompletion`).
- Push: `newEvent`/`changedEvent` nur an Personen, die beteiligt sind (leer = alle), Raumfilter gilt nicht. Erinnerungen nutzen die `dueReminder`-Einstellungen, Schlüssel `r|<gerät>|ev:<id>|<start>`. `notify` verträgt Daten ohne `events` (Schema 1).
- Alte Caches werden beim Start im Speicher migriert (`upgradeCache`, ETag verworfen), damit der nächste Sync das Repo sichert und migriert.

### Erinnerungen zu festen Uhrzeiten (`v1.1.0`–`v1.3.0`, abgeschlossen am 19.11.2026)
- [x] Pro Aufgabe und Termin mehrere feste Zeitpunkte ankreuzbar: 1 Woche vorher 9 Uhr, Vortag 8/15 Uhr, am Tag 9/12/15/18/21 Uhr. Nichts angekreuzt = keine Erinnerung
- [x] Unter Benachrichtigungen nur noch der Schalter „Erinnerungen“ an/aus pro Gerät
- [x] Erinnerungen alle 30 Minuten von 6 bis 23 Uhr

Hinweise zur Umsetzung:
- v1.1.0 hatte eine Auswahl „vor Beginn“ (`reminderMin`) und einen Geräte-Standard (`dueReminderMinutesBefore`); seit v1.3.0 entfernt bzw. ignoriert. Alte Werte dürfen in `data.json` stehen bleiben.
- Auswahl `FIXED_REMINDERS`, `parseFixedReminder`, `normalizeFixedReminders` (sortiert, leer = Feld entfällt) in `lib/reminders.ts` (App und notify); Ankreuz-Chips in `components/ui/ReminderField.tsx`. Gilt für alle Beteiligten mit eingeschalteten Erinnerungen.
- `reminderTimes` ist optional, kein Schema-Wechsel; Änderungen daran lösen keine „geändert“-Nachricht aus (nicht in `WATCHED`).
- `fixedReminderWindow`: von 15 Min. vor bis 30 Min. nach der Uhrzeit, auch nach Beginn (bei Aufgaben nur offene). Schlüssel `<Erinnerungs-Schlüssel>|<code>`. Kandidaten werden 7 Tage voraus betrachtet (`MAX_DAYS_BEFORE`). Mehrere gleichzeitig fällige Erinnerungen eines Eintrags = eine Zeile, alle Schlüssel werden gemerkt.
- Vor 6 Uhr Berliner Zeit verschickt `reminderRun` nichts (auch bei manuellem Start) und merkt nichts. Der Cron `7,37 4-22 * * *` (UTC) deckt Sommer- und Winterzeit ab.

### Aufgaben mit Zeitraum (`v1.4.0`, abgeschlossen am 19.11.2026)
- [x] Zeitraum statt festem Tag: Woche, Monat, Quartal, Halbjahr, Jahr (Quartal/Halbjahr/Jahr am Kalender ausgerichtet)
- [x] Wiederkehrend mit Rotation; Zeitraum so lang wie der Abstand („alle 2 Wochen“ = 2 Wochen Zeit)
- [x] Eigener Bereich „Zeitraum“ unter Aufgaben (`/aufgaben?ansicht=zeitraum`), Abschnitt „Im Zeitraum“ in Heute

Hinweise zur Umsetzung:
- Logik rein in `lib/periods.ts` (App und notify). Speicherung über die normale Serienlogik von `lib/recurrence.ts`: Occurrence-Schlüssel ist der erste Tag des Zeitraums. `periodInterval` rechnet die RRULE-Monate in Zeiträume um (Quartal = 3).
- Listen (`periodInstances`): der laufende Zeitraum; ist er erledigt/ausgelassen oder hat die Serie noch nicht begonnen, zusätzlich der nächste offene; dazu alle erledigten. Verpasste Serien-Zeiträume verfallen still, einmalige gelten nach Ablauf als überfällig.
- Nicht im Kalender, keine Erinnerungen (`ReminderField` ausgeblendet), nicht in der täglichen Zusammenfassung (`slotsBetween`/`overdueSlots` überspringen sie). Benachrichtigungen nennen den Zeitraum („· Diese Woche“); `period` ist in `WATCHED`. Rotation nach Position des Zeitraums in der Serie.
- Formular: Umschalter „Fester Tag / Zeitraum“ (`PeriodField`), „Neu“ mit `?zeitraum=1` startet im Zeitraum-Modus. Auswahl: 8 Wochen, 12 Monate, 6 Quartale, 4 Halbjahre, 3 Jahre ab heute. Kein „Nur diesen Termin“; pro Zeitraum gibt es „Diesmal auslassen“ und „Diesmal zuständig“.

### Komfort (`v1.5.0`, abgeschlossen am 20.11.2026)
- [x] Heute: alle Abschnitte einklappbar (Pref `todayCollapsed`, Baustein `components/ui/CollapsibleSection.tsx`)
- [x] Serien-Termin-Seite: „‹ Vorheriger / Nächster ›“ (`neighborDates` in `lib/recurrence.ts`, überspringt ausgelassene; after_completion: erledigte + aktueller), damit versehentlich Abgehaktes wieder geöffnet werden kann
- [x] Kalender: Inbox standardmäßig eingeklappt (Pref `calendarInboxOpen`)
- [x] Raum-Symbol 🧘 (Selfcare)
- [x] `v1.6.0`: Reihenfolge der Abschnitte in Heute einstellbar („⇅ Reihenfolge anpassen“, Bottom-Sheet mit ↑/↓, Pref `todayOrder`). Logik in `features/today/utils.ts` (`normalizeOrder` ergänzt neue Abschnitte an ihrer Standardposition)

### Nächster Einkauf und Zeitraum-Erinnerungen (`v1.7.0`, abgeschlossen am 21.11.2026)
- [x] Einkauf: Bereich „Nächster Einkauf“ pro Liste (zwischen offen und Erledigt, einklappbar, Pref `shoppingLaterOpen`)
- [x] Wischen nach rechts = zurückstellen (Toast mit „Rückgängig“), ↑ am Artikel bzw. „Alle in die Liste holen“ = zurückholen
- [x] Schalter „Für den nächsten Einkauf“ am Eingabefeld (Pref `shoppingAddLater`)
- [x] Zeitraum-Aufgaben: Erinnerung zum Start und kurz vor Ablauf (9 Uhr), neue Aufgaben mit beiden

Hinweise zur Umsetzung:
- Einkauf: `splitItems` liefert `{open, later, checked}`; `nextOpenSortOrder(items, listId, later)` zählt getrennt. `planAdd`: gleicher Name unter „Nächster Einkauf“ wird zurückgeholt (bzw. `exists`, wenn ebenfalls für später). `suggest` bevorzugt zurückgestellte (`later: true`, `reopenId`); Auswählen holt sie immer auf die aktuelle Liste. Store: `setLater`, `allNow`, `add(..., later)`. Abhaken/Haken entfernen setzt `later: false`.
- Push: Zurückgestellte und direkt für später angelegte Artikel lösen nichts aus; Zurückholen zählt als neuer Artikel.
- Zeitraum-Erinnerungen: Logik in `lib/periods.ts` (`PERIOD_REMINDERS`, `parsePeriodReminder`, `normalizePeriodReminders`, `periodReminderDate`, `activePeriod`, `daysLeft`). Start = erster Tag (Jahr: 2. Januar). Ende = Woche Freitag, Monat Ende − 6, Quartal Ende − 13, Halbjahr/Jahr erster Tag des letzten Monats; nur wenn offen. In `notify/reminders.ts` als `myPeriodTasks` (Fenster −15/+30 Min., Schlüssel `r|<gerät>|<task>|<von>|<code>`), an die aktuell zuständige Person (Rotation). Formular: `PeriodReminderField`. Bestehende Zeitraum-Aufgaben haben erst nach Bearbeiten Erinnerungen.

### Notizen und Feiertage (`v1.8.0`)
- [x] Notizen: eigener Punkt in der unteren Leiste, Zettel mit Titel, Text, optionalen Punkten zum Abhaken, Farbe, Anheften
- [x] Notizen in der Suche und als Push („Neue Notiz“, abschaltbar)
- [x] Gesetzliche Feiertage (Bremen) plus Adventssonntage, Heiligabend, Silvester im Kalender als eigener Feiertags-Hintergrund, Hinweis in Heute
- [x] Kalender: überlappende Einträge nebeneinander (`slotEventOverlap={false}`)

Hinweise zur Umsetzung:
- Notizen: Feature `notes`. `/notizen/neu` und `/notizen/:id` laufen über **eine** Route, damit der Editor beim ersten Speichern nicht neu startet. Entwurf lokal, nach 400 ms in den Store (`noteActions.save` ändert nur bei echten Unterschieden `updatedAt`). Die Notiz entsteht erst mit dem ersten Inhalt, leer verlassen = Tombstone. Sortierung: angeheftete oben, sonst zuletzt geändert. Farbe als Tönung (`<hex>24`) mit farbigem Rand. Löschen → Übersicht mit „Rückgängig“ (über `location.state`).
- `ChecklistEditor` liegt jetzt in `components/ui` (Aufgaben und Notizen).
- Push: `newNote` in `notify/changes.ts`, nur neu angelegte Notizen mit Inhalt (Titel, sonst erste Zeile, sonst erster Punkt). Link `#/notizen/<id>`, mehrere = `#/notizen`.
- Feiertage: `lib/holidays.ts` (Ostern nach Gauß, Region `HB`: bundesweite + Reformationstag ab 2017; dazu auf Wunsch 1.–4. Advent (`fourthAdvent` = Sonntag am/vor 24.12.), Heiligabend, Silvester). Gleicher Tag = ein Eintrag, Namen mit „ · “ verbunden (z. B. „4. Advent · Heiligabend“). Im Kalender als ganztägige Hintergrund-Einträge (`display: 'background'`, Klasse `cal-holiday`, `extendedProps.kind = 'holiday'`): Name im Ganztags-Bereich bzw. Monatsfeld, in den Stunden nur leicht getönt, Tageszahl im Kopf in Bernstein. In der Wochenansicht auf dem Handy wird der Name auf zwei Zeilen gekürzt.
- Heute: Hinweis über den Abschnitten, wenn heute oder morgen Feiertag ist (kein eigener, sortierbarer Abschnitt).

### Essensplaner (`v1.9.0`)
- [x] Eigener Punkt „Essen“ in der unteren Leiste: Wochenplan (nur Mittagessen) und Gerichte-Datenbank
- [x] Gerichte mit Zutaten (Menge als Text), Zubereitung/Notiz, Link, Bewertung Zeit und Aufwand (3 Stufen), Art und Sättigungsbeilage (Vorgaben + eigene), Favorit
- [x] Filter nach Art, Beilage, Zeit, Aufwand und Favoriten, Suche über Name und Zutaten
- [x] „🎲 Was essen wir?“: Zufallsvorschlag aus den gefilterten Gerichten
- [x] Merkliste „🔖 Bald mal wieder“ für Gerichte ohne festen Tag
- [x] „Zutaten einkaufen“: Zutaten der Woche (bzw. ab heute) auf den Einkaufszettel
- [x] Abschnitt „Mittagessen“ in Heute (heute + morgen), Gerichte in der Suche

Hinweise zur Umsetzung:
- Feature `meals`. Routen: `/essen` (`?ansicht=gerichte`, `?woche=<Montag>`), `/essen/tag/:date` (Tag planen), `/essen/gerichte/:id` (auch `neu`, mit `?fuer=<Datum>` wird das neue Gericht gleich für den Tag geplant), `/essen/einkaufen?von=&bis=`. Zurück führt über `parentOf` nach `/essen`.
- Gericht-Formular: Name, darunter die Zutaten (je ein Feld für Zutat und Menge, unten steht immer eine leere Zeile bereit; Enter springt Zutat → Menge → nächste Zeile), dann Art, Beilage, Zeit, Aufwand, Notiz, Link.
- Ein Gericht antippen plant es sofort und geht zurück; Freitext mit Schnellwahl („Reste“, „Essen gehen“ …). „Verschieben“ auf einen Tag, an dem schon etwas steht, tauscht beide Tage.
- Art/Beilage: `DEFAULT_KINDS`/`DEFAULT_SIDES` plus alle in Gerichten verwendeten eigenen Werte (`categoryOptions`), Vergleich ohne Groß-/Kleinschreibung und Umlaute. Symbole über `kindIcon`.
- Merkliste: 🔖 an jedem Gericht (`recipeActions.toggleSoon`), Checkbox im Formular, Filter 🔖. Im Wochenplan oben als Chips, beim Tag-Planen ganz oben (solange kein Filter gesetzt ist). `mealActions.set` mit einem gemerkten Gericht setzt `soon: null`. Reihenfolge: zuerst Gemerktes zuerst (`soonList`).
- Zufall (`pickRandom`): bevorzugt Gerichte, die mindestens 14 Tage nicht gegessen und nicht schon geplant sind; sonst alle, ohne den gerade gezeigten Vorschlag.
- Zutaten einkaufen: `collectIngredients` fasst gleiche Namen zusammen, Mengen mit „ + “. Was schon offen auf der Liste steht, ist abgewählt. Hinzufügen über `shoppingActions.add` (holt Abgehaktes zurück, keine Dubletten), optional „Für den nächsten Einkauf“. Gewählte Liste: Pref `mealsShoppingList`; Filter der Gerichte-Ansicht: Pref `mealsFilter`.
- Heute: neuer sortierbarer Abschnitt `meal`, nur sichtbar, wenn es Gerichte oder Planungen für heute/morgen gibt.
- Keine Push-Benachrichtigungen; `notify.mjs` kennt die neuen Sammlungen nur in `COLLECTIONS`.

### Später / optional
- **App-Badge** (Zahl am Homescreen-Symbol) für fällige Aufgaben, ohne Zeitraum-Aufgaben. Besprochen am 20.11.2026, zurückgestellt. Idee: `navigator.setAppBadge` in der App bei Änderungen, im Service Worker aus der Push-Payload (Zahl pro Person von `notify.mjs`). iPhone ab iOS 16.4 (Homescreen + Push-Berechtigung, keine stillen Pushes); Samsung/Chrome zeigt nur die Zahl ungelesener Benachrichtigungen. Offen: Termine mitzählen? Nur meine oder alle? Schalter pro Gerät
- Sync mit Google- oder Apple-Kalender (z. B. als ICS-Export)
- Statistiken (erledigte Aufgaben pro Person/Raum)

## UI-Grundsätze
- **Mobile first**: Die Hauptnutzung ist auf dem Handy, Desktop ist ein Bonus.
- Untere Navigationsleiste: Heute · Kalender · Aufgaben · Einkauf · Essen · Notizen
- Einstellungen: Zahnrad ganz rechts in der Kopfleiste, neben „Aktualisieren“ (seit v1.8.1)
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
