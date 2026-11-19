# Changelog

Alle Versionen des Organizers. Format: `## [Version] – Datum`, danach Neu / Geändert / Behoben.
Ein Eintrag ist die Beschreibung des GitHub Releases.

## [0.3.0] – 2026-11-19

### Neu
- Kalender mit Monats-, Wochen- und Tagesansicht (Woche beginnt am Montag)
- Einträge in der Farbe des Raums, mit Kürzel-Badges der zuständigen Personen (Woche und Tag)
- Umschalter „Farbe nach Raum / Person“
- Aufgaben per Drag and Drop verschieben (Datum und Uhrzeit, 15-Minuten-Raster); am unteren Rand ziehen ändert die Dauer
- Inbox-Leiste über dem Kalender: Aufgaben ohne Datum in den Kalender ziehen
- Auf dem Handy: Eintrag lange drücken, dann ziehen
- Freien Platz antippen legt eine Aufgabe mit diesem Datum und dieser Uhrzeit an; Eintrag antippen öffnet die Aufgabe
- Erledigte Aufgaben erscheinen blass und durchgestrichen
- Der Kalender wird erst beim Öffnen geladen, damit die App schnell startet

## [0.2.1] – 2026-11-19

### Neu
- Einkaufszettel mit großen Checkboxen, gemeinsam für beide und synchronisiert
- Artikel per Eingabefeld hinzufügen; das Feld bleibt fokussiert, Menge und Notiz optional
- Abgehakte Artikel rutschen animiert in den Bereich „Erledigt“ (zuletzt abgehakter oben), Haken entfernen holt sie ans Ende der offenen Artikel zurück
- Bereich „Erledigt“ einklappbar, „Erledigte entfernen“ mit Bestätigung
- Vorschläge beim Tippen aus früheren Artikeln; ein abgehakter Artikel wird wieder geöffnet statt doppelt angelegt
- Offene Artikel per Drag and Drop am Griff sortieren
- Wischen nach links löscht einen Artikel, mit „Rückgängig“
- Artikel antippen zum Bearbeiten (Name, Menge, Notiz)
- Mehrere Listen (z. B. „Supermarkt“, „Drogerie“): anlegen, umbenennen, löschen
- Solange der Einkaufszettel offen ist, wird alle 10 Sekunden synchronisiert

### Behoben
- Datum und Uhrzeit überlappen beim Anlegen einer Aufgabe auf dem Handy nicht mehr

## [0.2.0] – 2026-11-19

### Neu
- Aufgaben anlegen und bearbeiten: Titel, Beschreibung, Raum, Priorität, Datum, Uhrzeit, Dauer
- Aufgaben einer oder mehreren Personen zuordnen
- Checklisten (Unteraufgaben) mit Fortschrittsanzeige
- Inbox für Aufgaben ohne Datum
- Aufgabenliste mit den Ansichten Geplant, Inbox und Erledigt, gruppiert nach Tagen
- Filter nach Raum und Person sowie „Meine Aufgaben“
- Heute-Ansicht als Startseite: überfällige und heutige Aufgaben, heute erledigte, Inbox und Morgen auf einen Blick, Umschalter „Meine/Alle“
- Abhaken direkt in der Liste
- Räume verwalten (Name, Farbe, Icon, Reihenfolge)
- Personen verwalten (Name, Kürzel, Farbe)
- „+“-Button zum schnellen Anlegen

## [0.1.0] – 2026-11-19

### Neu
- Grundgerüst mit React, TypeScript, Vite und Tailwind CSS
- Als App installierbar (PWA) auf Android und iPhone, mit Offline-Cache für die App selbst
- Einrichtung pro Gerät: Daten-Repo, Token, „Das bin ich“ und Gerätename
- Legt `data.json` beim ersten Start mit Beispielräumen und der Einkaufsliste „Einkauf“ an
- Synchronisation mit dem privaten Daten-Repo: beim Öffnen, beim Zurückkehren in die App, alle 30 Sekunden und per Button
- Änderungen werden 2 Sekunden gebündelt gespeichert; bei gleichzeitigen Änderungen werden beide Stände zusammengeführt
- Offline-Warteschlange: Änderungen gehen nicht verloren und werden später gespeichert
- Sync-Status in der Kopfzeile („Synchronisiert“, „Wird gespeichert…“, „Offline“)
- Nur-Lesen-Modus, wenn die Daten von einer neueren App-Version stammen
- Einstellungen mit Sync-Status, Geräteangaben, Verbindung ändern, „Token entfernen“ und Versionsanzeige
- Workflows für Deploy, Release und Rollback
