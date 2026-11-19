# Changelog

Alle Versionen des Organizers. Format: `## [Version] – Datum`, danach Neu / Geändert / Behoben.
Ein Eintrag ist die Beschreibung des GitHub Releases.

## [1.4.0] – 2026-11-19

### Neu
- Aufgaben mit Zeitraum statt festem Tag: „irgendwann in dieser Woche“, „im Dezember“, „im 1. Quartal“, „im 2. Halbjahr“ oder „2027“. Im Formular unter „Fester Tag / Zeitraum“ Woche, Monat, Quartal, Halbjahr oder Jahr wählen. Quartale, Halbjahre und Jahre richten sich nach dem Kalender (z. B. 1. Quartal = Januar–März)
- Auch wiederkehrend: jede Woche, alle 2–4 Wochen, jeden Monat, alle 2 Monate, jedes (2.) Quartal, jedes Halbjahr, jedes (2.) Jahr. Der Zeitraum ist so lang wie der Abstand („alle 2 Wochen“ = 2 Wochen Zeit). Rotation zwischen Personen geht auch hier
- Eigener Bereich „Zeitraum“ unter Aufgaben, getrennt von „Geplant“, gruppiert nach „Diese Woche“, „November“, „4. Quartal“ usw.
- Heute-Ansicht: Abschnitt „Im Zeitraum“ mit allen laufenden Zeitraum-Aufgaben
- Nach dem Erledigen erscheint gleich der nächste Zeitraum. Bei Serien verfällt ein nicht erledigter Zeitraum, sobald der nächste beginnt; einmalige werden nach Ablauf als überfällig angezeigt
- „Diesmal auslassen“ und „Diesmal zuständig“ für einzelne Zeiträume

### Hinweise
- Zeitraum-Aufgaben stehen nicht im Kalender, haben keine Erinnerungen und zählen nicht in der täglichen Zusammenfassung
- Benachrichtigungen nennen den Zeitraum („Fenster putzen · Diese Woche“). Dafür im Daten-Repo `scripts/notify.mjs` aktualisieren

## [1.3.1] – 2026-11-19

### Geändert
- Neue Termine sind nicht mehr automatisch ganztägig: Ohne gewählte Uhrzeit (z. B. über „+“ oder die Monatsansicht) ist 10–11 Uhr vorbelegt, „Ganztägig“ lässt sich bei Bedarf anhaken

## [1.3.0] – 2026-11-19

### Geändert
- Erinnerungen nur noch zu den festen Uhrzeiten, die bei der Aufgabe bzw. dem Termin angekreuzt sind (1 Woche vorher 9 Uhr, Vortag 8/15 Uhr, am Tag 9/12/15/18/21 Uhr). Nichts angekreuzt = keine Erinnerung
- Entfernt: Auswahl „vor Beginn“ (Standard, zum Zeitpunkt, 5/15/30 Minuten, 1 Stunde, 1 Tag, am Morgen) im Formular und der Geräte-Standard unter Benachrichtigungen. Dort gibt es nur noch den Schalter „Erinnerungen“ an/aus. Dafür im Daten-Repo `scripts/notify.mjs` aktualisieren

## [1.2.0] – 2026-11-19

### Neu
- Erinnerungen zu festen Uhrzeiten, mehrere ankreuzbar: 1 Woche vorher (9 Uhr), Vortag 8 und 15 Uhr, am Tag selbst 9, 12, 15, 18 und 21 Uhr. Gilt für Aufgaben und Termine, zusätzlich zur Erinnerung vor Beginn
- Bei Aufgaben kommen feste Erinnerungen nur, solange die Aufgabe offen ist. Mehrere gleichzeitig fällige Erinnerungen zu einem Eintrag ergeben eine Nachricht. Dafür im Daten-Repo `scripts/notify.mjs` aktualisieren

## [1.1.0] – 2026-11-19

### Neu
- Erinnerung pro Aufgabe und Termin: Im Formular lässt sich „Erinnerung“ wählen (Standard, keine, zum Zeitpunkt, 5/15/30 Minuten, 1 Stunde oder 1 Tag vorher; ganztägig am Morgen oder am Vortag)
- Geräte-Standard unter Benachrichtigungen um „Zum Zeitpunkt“, „5 Minuten vorher“ und „1 Tag vorher“ erweitert

### Geändert
- Erinnerungen werden zwischen 6 und 23 Uhr alle 30 Minuten geprüft statt stündlich (etwa eine Viertelstunde genau). Nachts Fälliges kommt um 6 Uhr. Dafür im Daten-Repo `scripts/notify.mjs` und `.github/workflows/reminders.yml` aktualisieren

## [1.0.0] – 2026-11-19

### Neu
- Termine: Der Kalender enthält jetzt Termine und Aufgaben. Termine haben Titel, Ort, Notiz, Beginn und Ende (auch ganztägig und über mehrere Tage) und beteiligte Personen, mit Auswahl „Ganze Familie“
- Termine wiederholen sich wie Aufgaben (täglich, wöchentlich, monatlich …), beim Ändern „Nur diesen Termin“ oder „Ganze Serie“
- Unterscheidung im Kalender: Termine vollflächig in der Farbe der Person (mehrere Personen gestreift, alle = 👪 Familie), Aufgaben hell mit farbigem Rand und ☐/☑
- Tippen auf einen freien Platz oder auf „+“ fragt: Termin oder Aufgabe
- Heute-Ansicht: „Termine heute“ oben, „Meine“ zeigt nur Termine, bei denen ich dabei bin
- Suche findet auch Termine (Titel, Ort, Notiz)
- Push: Nachricht bei neuem oder geändertem Termin, bei dem ich dabei bin (neuer Schalter), Erinnerung vor Terminen, Termine in der täglichen Zusammenfassung

### Geändert
- Datenformat `schemaVersion` 2 (neuer Bereich `events`). Die Umstellung passiert automatisch beim ersten Öffnen; vorher legt die App eine Sicherung unter `backups/` im Daten-Repo an. Ältere App-Versionen zeigen die Daten danach nur noch zum Lesen.

## [0.6.0] – 2026-11-19

### Neu
- Push-Benachrichtigungen: Einstellungen → Benachrichtigungen → „Benachrichtigungen aktivieren“ (auf dem iPhone nur aus der Home-Bildschirm-App, mit Anleitung)
- Pro Gerät einstellbar: neue Aufgabe, mir zugewiesen (auch durch Rotation), erledigt, geändert/verschoben, neue Einkaufsartikel (gebündelt), nur meine Aufgaben, nur bestimmte Räume
- Erinnerung vor Fälligkeit (15 / 30 / 60 Minuten oder am Morgen), tägliche Zusammenfassung zur gewählten Uhrzeit, Ruhezeiten
- „Testbenachrichtigung senden“: kommt echt über GitHub, nach ca. 30–60 Sekunden
- Tipp auf eine Benachrichtigung öffnet die App direkt bei der Aufgabe
- Vorlage für das Daten-Repo (`data-repo-template/`): Workflows `notify-on-change` und `reminders` (stündlich) mit `scripts/notify.mjs`; abgelaufene Anmeldungen werden automatisch entfernt

### Geändert
- `scripts/notify.mjs` wird aus dem App-Code erzeugt (`npm run build:notify`) und nutzt dieselbe Wiederholungslogik; der Deploy prüft, dass die Datei aktuell ist

## [0.5.0] – 2026-11-19

### Neu
- Suche über alle Aufgaben (Lupe oben auf Heute, Kalender und Aufgaben): findet Titel, Beschreibung, Checklisten-Punkte und Raum; Groß-/Kleinschreibung und Umlaute sind egal
- Dark Mode: Einstellungen → Dieses Gerät → Darstellung „System / Hell / Dunkel“, auch für den Kalender
- Export der Daten als Datei (`organizer-backup-JJJJ-MM-TT.json`) unter Einstellungen → Daten
- Import einer Sicherung: „Zusammenführen“ (pro Eintrag gewinnt der neuere Stand) oder „Wiederherstellen“ (alles auf den Stand der Datei zurück)

### Geändert
- Offline: Die Statusanzeige zeigt „Offline · wartet“, solange Änderungen noch nicht übertragen sind; in den Einstellungen steht ein kurzer Hinweis
- Wiederholungen: Das Feld „Alle N …“ markiert beim Antippen die Zahl, sodass man sie direkt überschreiben kann

## [0.4.0] – 2026-11-19

### Neu
- Wiederkehrende Aufgaben: täglich, werktags, wöchentlich an bestimmten Tagen, alle N Tage/Wochen/Monate/Jahre, monatlich am selben Tag oder am n-ten bzw. letzten Wochentag, jährlich, optional mit Enddatum
- Modus „Nach Erledigung“: Der nächste Termin wird erst beim Abhaken berechnet (z. B. 14 Tage danach)
- Rotation: Die Zuständigkeit wechselt bei jedem Termin reihum
- Einzelne Termine abhaken, überspringen oder einer anderen Person zuweisen („Diesmal zuständig“)
- Beim Ändern von Datum/Uhrzeit oder Verschieben im Kalender: Frage „Nur diesen Termin“ oder „Ganze Serie“
- Kalender zeigt alle Termine einer Serie im sichtbaren Zeitraum; Serien sind mit ↻ markiert

### Geändert
- Heute und Aufgabenliste zeigen bei Serien nur den letzten verpassten Termin als überfällig, dazu heute, morgen und den nächsten offenen Termin

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
