# Changelog

Alle Versionen des Organizers. Format: `## [Version] – Datum`, danach Neu / Geändert / Behoben.
Ein Eintrag ist die Beschreibung des GitHub Releases.

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
