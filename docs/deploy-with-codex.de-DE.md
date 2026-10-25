# Life Ledger mit Codex bereitstellen oder aktualisieren

[English](deploy-with-codex.md) · [简体中文](deploy-with-codex.zh-CN.md) · **Deutsch**

Der folgende Prompt eignet sich sowohl für eine neue Installation als auch für die Aktualisierung einer bestehenden Bereitstellung mit Worker, D1, R2 oder Google OAuth. Kopiere den gesamten Text in eine Codex-Sitzung, die Terminal und Browser verwenden kann. Du kannst Codex auch nur die Repository-URL geben und um die vollständige Bereitstellung bitten; die `AGENTS.md` im Repository führt den Agenten zu dieser Anleitung zurück.

Notwendige Entscheidungen des Kontoinhabers werden nicht umgangen: Anmeldung bei Cloudflare oder Google, Zustimmung zum nutzungsabhängigen R2-Abonnement, Googles Warnung vor einer nicht verifizierten App sowie das Löschen oder Ersetzen von Daten müssen persönlich bestätigt werden. Schreibgeschützte Bestandsaufnahme, Tests, zerstörungsfreie Migrationen, Bereitstellung und Prüfung sollen ansonsten ohne wiederholte Rückfragen fortgesetzt werden.

```text
Stelle mein eigenes Life Ledger aus diesem Repository bereit oder aktualisiere es:
https://github.com/zubin-li/life-ledger-deep-review

Ziel ist die vollständige Cloudflare-Version: Worker, D1, Workers AI, Cloudflare Access, private R2-Fotos, Schnellaufnahme und optional ein schreibgeschützter Google Calendar. Prüfe zuerst, ob es sich um eine neue Installation oder ein Upgrade handelt. Verwende vorhandene Ressourcen wieder; erstelle keine Duplikate, leere keine Datenbank, ersetze keine persönlichen Einträge und veröffentliche keine Beispieldaten.

Arbeite in fünf getrennten Prüfschritten.

1. Bestandsaufnahme: Lies README, docs/self-hosting.md, PRIVACY.md, CHANGELOG.md, wrangler.jsonc, package.json und die Migrationen. Hole den aktuellen main-Stand, notiere den exakten Commit und führe npm ci sowie npm test aus. Prüfe vorhandene Worker- oder Pages-URLs, stabile Deployment-ID, D1 und Migrationen, R2-Bucket, AI-Bindung, Access und die Namen der Secrets, ohne Secret-Werte auszugeben. Bewahre lokale Änderungen und kontospezifische Konfiguration außerhalb von Upstream-Commits auf.

2. Cloud-Ressourcen: Entscheide anhand des Kontos, ob der Cloudflare-Bereitstellungsweg des Repositories oder die CLI geeignet ist. Vor der ersten vollständigen Bereitstellung müssen D1 und R2 angelegt oder gebunden sein. Verwende eine vorhandene Datenbank, ein bestehendes R2-Abonnement und den Bucket life-ledger-deep-review-photos wieder. Falls R2 noch nicht aktiviert ist, erkläre den derzeit bei 0 $ beginnenden Checkout, die enthaltenen Monatskontingente, die automatische Abrechnung bei Mehrverbrauch und dass die 8-GB-/Operationsgrenzen der App kein hartes Ausgabenlimit des Anbieters sind. Warte auf die Zustimmung des Kontoinhabers. Halte den Standard-Bucket privat. Übertrage keine Konto-, Datenbank- oder Secret-Werte in das öffentliche Repository.

3. Bereitstellen und schützen: Führe nur noch ausstehende, zerstörungsfreie D1-Migrationen aus. Stelle danach Worker und statische Assets mit vorhandenen DB-, AI- und PHOTOS-Bindungen bereit. Erlaube in Cloudflare Access nur bestätigte E-Mail-Adressen des Eigentümers und setze TEAM_DOMAIN sowie POLICY_AUD korrekt. Prüfe die Produktions-URL, /deployment-mode.js, angemeldetes Speichern über /api/state einschließlich Aktualisieren der Seite, Schnellaufnahme, privaten Foto-Upload/-Abruf und Timeline mit fiktivem Testmaterial, PWA sowie Sicherung und Wiederherstellung. Ändere den Produktcode nicht nur zur Anpassung an ein Konto. Beginne Google erst, wenn diese Prüfungen bestanden sind.

4. Google Calendar, nur wenn ausgewählt: Verwende ein vorhandenes Google-Cloud-Projekt und einen bestehenden OAuth-Webclient wieder. Aktiviere die Calendar API und fordere ausschließlich calendar.calendarlist.readonly sowie calendar.events.readonly an. Die autorisierte Redirect-URI des Google-Clients und das Cloudflare-Secret GOOGLE_CALENDAR_REDIRECT_URI müssen exakt https://<produktionsdomain>/api/calendar/callback entsprechen. Prüfe die Namen GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, CALENDAR_TOKEN_KEY und GOOGLE_CALENDAR_REDIRECT_URI, ohne ihre Werte anzuzeigen. Fehlt CALENDAR_TOKEN_KEY, erzeuge 32 zufällige Bytes als URL-sicheres Base64 und speichere den Wert ausschließlich als Cloudflare-Secret. Starte nach der Bereitstellung eine neue Verbindung aus der Produktions-App; verwende keinen alten OAuth-Link.

OAuth muss im selben Tab abgeschlossen werden. Life Ledger navigiert diesen Tab zu Google. Erscheint die Warnung „Google hasn't verified this app“, wählt der Kontoinhaber persönlich Advanced, Go to Life Ledger und Continue und wartet, bis derselbe Tab automatisch zu /?calendar=connected&view=today zurückkehrt. Wechsle nicht zu einem älteren App-Tab. Der OAuth-State läuft nach zehn Minuten ab; starte dann erneut aus Life Ledger.

Eine mündliche Aussage „fertig“ ist kein Nachweis. Prüfe die zurückgekehrte URL, /api/calendar/status mit configured:true und connected:true sowie mindestens einem Konto, mindestens eine Zeile in D1 calendar_connections, lesbare Kalender und Ereignisse sowie die Verbindung nach einem Reload. Prüfe bei Fehlern zunächst Callback, Worker-Logs, Redirect-URI und State, bevor neue Zugangsdaten erstellt werden.

5. Abnahme: Melde nur mit Nachweisen Erfolg. Der Abschlussbericht muss Produktions-URL, GitHub-Commit, Testergebnis, D1-Migrationsstatus, Access-Status, R2-Bucket und -Bindung, Workers AI/Schnellaufnahme, Calendar-Status, PWA-Status, stabile Deployment-ID und Rücksetzpunkt enthalten.

Pausiere nur für Anmeldung, dauerhafte Autorisierung, R2-Abonnement, Google-Sicherheitswarnung oder zerstörerische Datenänderungen. Fahre ansonsten selbstständig fort. Wenn zwei evidenzbasierte Versuche keinen Fortschritt bringen, nenne den exakten Blocker, statt weitere Ressourcen zu erstellen.
```

## Erfolgskriterium

Eine erreichbare Webseite allein bedeutet keine vollständige Bereitstellung. Cloud-Synchronisierung, private R2-Bindung und Schnellaufnahme müssen funktionieren. Wenn Google Calendar gewählt wurde, müssen außerdem der Rücksprung im selben Tab sowie API und D1 die Verbindung bestätigen.
