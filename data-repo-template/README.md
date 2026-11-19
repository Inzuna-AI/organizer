# organizer-data

Daten des Haushalts-Organizers. **Wird von der App verwaltet, bitte nicht von Hand bearbeiten.**

| Datei | Inhalt |
|---|---|
| `data.json` | Alle Daten (Aufgaben, Räume, Personen, Einkaufszettel, Geräte) |
| `notify-state.json` | Bereits verschickte Erinnerungen (legt der Workflow an) |
| `backups/` | Sicherungen vor Datenmigrationen (legt die App an) |
| `scripts/notify.mjs` | Versand der Push-Benachrichtigungen. Automatisch erzeugt im Code-Repo (`npm run build:notify`), nicht bearbeiten |
| `.github/workflows/` | `notify-on-change.yml` (bei jeder Änderung) und `reminders.yml` (stündlich) |

## Einrichtung der Push-Benachrichtigungen (einmalig)

1. VAPID-Schlüssel erzeugen: `npx web-push generate-vapid-keys`
2. In **diesem** Repo unter *Settings → Secrets and variables → Actions → Secrets* anlegen:
   - `VAPID_PUBLIC_KEY`: der Public Key
   - `VAPID_PRIVATE_KEY`: der Private Key (geheim!)
   - `VAPID_SUBJECT`: z. B. `mailto:deine@adresse.de`
3. Im Code-Repo `organizer` unter *Settings → Secrets and variables → Actions → Variables* die Variable
   `VITE_VAPID_PUBLIC_KEY` mit dem **Public Key** anlegen und die App neu deployen.
4. In der App: *Einstellungen → Benachrichtigungen → Aktivieren*, dann „Testbenachrichtigung senden“.

Auf dem iPhone funktioniert Push nur, wenn die App zum Home-Bildschirm hinzugefügt wurde (ab iOS 16.4).

## Hinweise

- Die Workflows schreiben keine Aufgabeninhalte ins Log, nur Anzahlen.
- Abgelaufene Push-Anmeldungen (HTTP 404/410) werden automatisch aus `data.json` entfernt.
- Verbrauch: ca. 720 Actions-Minuten im Monat für die stündlichen Erinnerungen plus ca. 1 Minute pro
  gespeicherter Änderung. Private Repos haben 2.000 Minuten frei (GitHub → Settings → Billing).
