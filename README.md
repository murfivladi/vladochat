# VladoChat

Demo di chat realtime con registrazione, gruppi e videochiamate.

Persistenza basata su file JSON e configurazione tramite variabili d'ambiente.

## Installazione

```bash
npm install
cp .env.example .env # configura PORT e DATA_FILE a piacere
npm start
```

Apri il browser su `http://localhost:3000`.

## Funzionalità

- Registrazione e login con email e password
- Chat di gruppo con storico dei messaggi salvato su file
- Videochiamate WebRTC tra utenti nella stessa stanza
- Lista utenti con messaggi privati

> Questa è una demo: non include un database o sicurezza avanzata ed è destinata solo a scopi di esempio.
