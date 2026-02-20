# Guide för att köra boten på Replit

## Steg 1: Skapa ett nytt Replit-projekt
1. Gå till [Replit.com](https://replit.com)
2. Klicka på "Create Repl"
3. Välj "Import from GitHub" eller "Upload files"

## Steg 2: Ladda upp filerna
Ladda upp alla filer från detta projekt till Replit.

## Steg 3: Konfigurera miljövariabler (Secrets)
1. Klicka på "Tools" i vänstermenyn
2. Välj "Secrets"
3. Lägg till följande secrets:

**BOT_TOKEN**
- Value: Din Discord bot token

**ADMIN_ROLE_ID**
- Value: 1474512210813518018

**ADMIN_ROLE_ID_2**
- Value: 1474529891314696303

**ADMIN_ROLE_ID_3**
- Value: 1474532144058728511

**ADMIN_ROLE_ID_4**
- Value: 1474535792872263731

**ROLE_TO_GRANT_ID**
- Value: 1474512045998215440

**AUTO_ROLE_ON_JOIN**
- Value: 1474529308629537051

**TICKET_CHANNEL_ID**
- Value: 1474530799825977456

**TICKET_CATEGORY_ID**
- Value: 1474530798328614996

## Steg 4: Uppdatera bot.js för att använda miljövariabler
Filen kommer att uppdateras automatiskt för att läsa från Replit Secrets istället för config.yml.

## Steg 5: Installera dependencies
Replit installerar automatiskt dependencies från package.json när du startar projektet.

## Steg 6: Kör boten
Klicka på "Run" knappen högst upp. Boten kommer att starta och vara online så länge Replit-projektet är aktivt.

## Hålla boten online 24/7
För att hålla boten online hela tiden kan du:
1. Uppgradera till Replit Hacker plan (betald)
2. Använda en extern tjänst som UptimeRobot för att pinga din Repl regelbundet
