# Discord Biljettbot

En Discord-bot som låter användare öppna biljetter för rollförfrågningar. Admins kan godkänna eller neka dessa förfrågningar.

## Installation

1. Installera beroenden:
```
npm install
```

2. Skapa en `config.yml`-fil baserad på `config.example.yml`:
```
copy config.example.yml config.yml
```

3. Konfigurera din `config.yml`-fil:
   - `bot.token`: Din bot-token från Discord Developer Portal
   - `roles.admin_role_id`: Roll-ID:t som kan godkänna/neka biljetter
   - `roles.role_to_grant_id`: Roll-ID:t som kommer att ges vid godkännande

## Hämta ID:n

- Aktivera utvecklarläge i Discord (Inställningar > Avancerat > Utvecklarläge)
- Högerklicka på roller/kanaler och välj "Kopiera ID"

## Användning

1. Starta botten:
```
npm start
```

2. Kör `/setup` i valfri kanal (kräver administratörsbehörighet) för att skapa biljettsystemet
3. Användare klickar på "Skapa Biljett"-knappen eller använder `/ticket` för att öppna en privat biljettkanal
4. Admins kan diskutera med användaren och sedan klicka på Godkänn/Neka
5. Biljetten stängs automatiskt 5 sekunder efter godkännande/nekande

## Funktioner

- Enkel installation med `/setup`-kommando som skapar en biljettkategori och kanal
- Användare får sin egen privata biljettkanal när de begär en roll
- Endast användaren och admins kan se varje biljettkanal
- Admins kan godkänna/neka förfrågningar och diskutera med användare i den privata kanalen
- Biljetter stängs automatiskt 5 sekunder efter godkännande eller nekande
- Förhindrar dubbletter av biljetter från samma användare

## Kommandon

- `/setup` - Skapar biljettkategorin och kanalen (Endast admin)
- `/ticket` - Skapar en privat biljettkanal (alternativ till knappen)
