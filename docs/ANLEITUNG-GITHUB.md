# Anleitung: GitHub einrichten für den Organizer

Diese Anleitung führt dich Schritt für Schritt durch alles, was auf GitHub einmalig nötig ist.
Du musst **keine Dateien von Hand hochladen**: Den Code schicke ich (Claude) per Git direkt von diesem PC aus zu GitHub. Du legst nur die beiden Repositories an und erzeugst einen Token.

> **Was ist was?**
> - **GitHub** ist eine Webseite, auf der Code und Dateien gespeichert werden.
> - Ein **Repository** („Repo“) ist ein Ordner auf GitHub.
> - Wir brauchen zwei davon:
>   - `organizer` (**öffentlich**): der Code der App. GitHub stellt daraus die App ins Internet.
>   - `organizer-data` (**privat**): eure Daten (Aufgaben, Einkaufszettel …). Nur ihr habt Zugriff.
> - Ein **Token** ist eine Art Passwort nur für die App. Er erlaubt ihr, `organizer-data` zu lesen und zu schreiben, sonst nichts.

Die Anleitung hat zwei Teile:
- **Teil A (jetzt):** Daten-Repo und Token, damit du die lokale Testversion mit echtem Sync ausprobieren kannst.
- **Teil B (nach deiner Freigabe):** Code-Repo anlegen, App online stellen und auf den Handys installieren.

---

## Teil A: Für den lokalen Test

### Schritt 1: GitHub-Konto

Falls du schon ein Konto hast, weiter mit Schritt 2.

1. Öffne https://github.com/signup
2. E-Mail, Passwort und **Benutzername** wählen. Der Benutzername steht später in der Adresse der App (`https://<benutzername>.github.io/organizer/`), also am besten etwas Kurzes ohne Sonderzeichen.
3. E-Mail bestätigen. Den kostenlosen Plan („Free“) wählen.

**Merke dir deinen Benutzernamen**, du brauchst ihn gleich in der App.
Du findest ihn jederzeit oben rechts auf GitHub, wenn du auf dein Profilbild klickst.

### Schritt 2: Daten-Repo `organizer-data` anlegen (privat)

1. Öffne https://github.com/new
2. Ausfüllen:
   | Feld | Eintrag |
   |---|---|
   | **Owner** | dein Benutzername (ist schon ausgewählt) |
   | **Repository name** | `organizer-data` |
   | **Description** | optional, z. B. „Daten für den Organizer“ |
   | Sichtbarkeit | **Private** ⚠️ wichtig! |
   | **Add a README file** | **einschalten** (Haken setzen bzw. auf „On“) |
   | .gitignore / License | leer lassen („None“) |
3. Unten auf **Create repository** klicken.

Fertig. Die Datei `data.json` legt die App später selbst an. Du musst hier nichts hochladen.

### Schritt 3: Token anlegen

1. Öffne https://github.com/settings/personal-access-tokens/new
   (Oder: Profilbild oben rechts → **Settings** → ganz unten links **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**)
2. Ausfüllen:
   | Feld | Eintrag |
   |---|---|
   | **Token name** | `Organizer` |
   | **Resource owner** | dein Benutzername |
   | **Expiration** | **Custom** → ein Datum in einem Jahr (Maximum). Vor Ablauf schickt GitHub eine E-Mail, dann erzeugst du einfach einen neuen. |
   | **Repository access** | **Only select repositories** → im Auswahlfeld `organizer-data` wählen |
3. Bei **Permissions** auf **Add permissions** bzw. **Repository permissions** klicken und **Contents** suchen. Dort **Read and write** wählen.
   - „Metadata: Read-only“ wird automatisch mit ausgewählt, das ist richtig.
   - **Sonst nichts** auswählen.
4. Unten auf **Generate token** klicken, dann bestätigen.
5. Der Token wird **nur einmal** angezeigt (beginnt mit `github_pat_…`). Mit dem Kopier-Symbol daneben kopieren.

> 🔒 **Umgang mit dem Token**
> - Nicht in Chats, E-Mails an Dritte oder öffentliche Notizen kopieren, auch nicht in den Chat mit Claude.
> - Gut aufbewahren, z. B. in einem Passwort-Manager. Du brauchst ihn auf jedem Gerät einmal (PC, dein Handy, Lenas Handy).
> - Falls er verloren geht oder du unsicher bist: auf derselben Seite löschen („Delete“) und einen neuen erzeugen.

### Schritt 4: Testversion einrichten

1. Öffne am PC http://localhost:5173/organizer/ (die Testversion muss laufen; Claude startet sie für dich).
2. Eintragen:
   - **GitHub-Benutzername:** dein Benutzername aus Schritt 1
   - **Name des Daten-Repos:** `organizer-data` (steht schon drin)
   - **Token:** einfügen
3. **Verbindung testen** → Namen eintragen (z. B. „Lena“ und deinen) → **Anlegen**
4. **Das bin ich** wählen, Gerätenamen prüfen → **Fertig**

Kontrolle: Auf GitHub in `organizer-data` liegt jetzt eine Datei `data.json`. Oben in der App steht „Synchronisiert“.

**Auf dem Handy testen (optional):** Handy ins selbe WLAN, im Browser `http://192.168.178.42:5173/organizer/` öffnen und genauso einrichten. Fragt Windows am PC nach der Firewall, „Zugriff zulassen“ wählen.

Wenn alles passt, sag Claude Bescheid („Phase 1 ist freigegeben“). Dann geht es mit Teil B weiter.

---

## Teil B: App online stellen (nach der Freigabe)

### Schritt 5: Code-Repo `organizer` anlegen (öffentlich)

1. Öffne https://github.com/new
2. Ausfüllen:
   | Feld | Eintrag |
   |---|---|
   | **Repository name** | `organizer`, genau so und **klein geschrieben**. Die Adresse der App unterscheidet Groß- und Kleinschreibung, mit `Organizer` bleibt die App weiß. |
   | Sichtbarkeit | **Public** |
   | **Add a README file** | **ausschalten** ⚠️ wichtig: Das Repo muss leer sein |
   | .gitignore / License | „None“ |
3. **Create repository** klicken. Die Seite mit den vielen Befehlen kannst du ignorieren.

### Schritt 6: GitHub Pages einschalten

1. Im Repo `organizer` oben auf **Settings** (Zahnrad) klicken.
2. Links im Menü **Pages** wählen.
3. Bei **Build and deployment** → **Source**: **GitHub Actions** auswählen.

Mehr ist hier nicht nötig.

### Schritt 7: Claude lädt den Code hoch

Sag Claude: „Repo ist angelegt, mein Benutzername ist …“.
Claude verbindet den Projektordner mit GitHub und lädt den Code hoch.

Beim ersten Mal öffnet sich ein Fenster **„Connect to GitHub“** (Git Credential Manager):
1. **Sign in with your browser** klicken.
2. Im Browser bei GitHub anmelden und **Authorize git-ecosystem** bestätigen.
3. Fertig. Das Fenster merkt sich die Anmeldung, das ist nur einmal nötig.

Danach läuft auf GitHub automatisch der Workflow „Deploy“. Du kannst zusehen: Repo `organizer` → Reiter **Actions**. Nach 1–2 Minuten ist er grün ✅.

Die App ist dann erreichbar unter:
**`https://<dein-benutzername>.github.io/organizer/`**

### Schritt 8: App auf den Handys installieren

Auf jedem Handy einmal die Adresse von oben öffnen und einrichten wie in Schritt 4 (Token einfügen, „Das bin ich“ wählen).

**Samsung / Android (Chrome):**
1. Adresse in **Chrome** öffnen.
2. Menü **⋮** oben rechts → **App installieren** oder **Zum Startbildschirm hinzufügen**.

**Samsung Internet:**
1. Menü **≡** unten rechts → **Seite hinzufügen zu** → **Startbildschirm**.

**iPhone (Safari):**
1. Adresse in **Safari** öffnen (nicht in Chrome).
2. Unten auf **Teilen** (Quadrat mit Pfeil nach oben) tippen.
3. **Zum Home-Bildschirm** wählen → **Hinzufügen**.
4. Die App ab jetzt immer über das neue Symbol auf dem Home-Bildschirm öffnen. Sie hat dort einen eigenen Speicher, also dort einrichten.

**Den Token aufs Handy bringen:** z. B. aus dem Passwort-Manager kopieren oder dir selbst über einen sicheren Weg schicken und die Nachricht danach löschen.

### Schritt 9: Release `v0.1.0`

Darum kümmert sich Claude. Auf GitHub erscheint danach im Repo `organizer` rechts unter **Releases** die Version `v0.1.0` mit einer ZIP-Datei. Das ist euer Archiv.

---

## Wenn etwas nicht klappt

| Meldung in der App | Lösung |
|---|---|
| „Der Token ist ungültig oder abgelaufen.“ | Token neu kopieren (ohne Leerzeichen) oder neuen Token erzeugen (Schritt 3). |
| „Repository nicht gefunden …“ | Benutzername richtig geschrieben? Repo heißt genau `organizer-data`? Beim Token unter „Repository access“ das Repo ausgewählt? |
| „Zugriff verweigert …“ | Beim Token fehlt „Contents: Read and write“. Token bearbeiten oder neu erzeugen. |
| „Offline“ | Keine Internetverbindung. Änderungen gehen nicht verloren und werden später gespeichert. |
| App-Adresse zeigt „404“ | Schritt 6 (Pages auf „GitHub Actions“) prüfen und unter **Actions** nachsehen, ob „Deploy“ grün ist. |

## Später nützlich

- **Token erneuern:** neuen Token erzeugen (Schritt 3), dann in der App unter **Einstellungen → Verbindung ändern** einfügen. Auf jedem Gerät.
- **Alte Version zurückholen:** Repo `organizer` → **Actions** → **Rollback** → **Run workflow** → Version eingeben, z. B. `v0.1.0`. Das geht auch vom Handy.
- **Verbrauch im Blick:** GitHub → Settings → **Billing**. Für euch zwei reicht das kostenlose Kontingent.
