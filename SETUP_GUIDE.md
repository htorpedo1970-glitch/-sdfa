# Guide för Bot-installation

## Nödvändiga Bot-behörigheter

När du bjuder in botten till din server, se till att den har dessa behörigheter:

1. **Hantera kanaler** - För att skapa biljettkanaler
2. **Hantera roller** - För att tilldela roller till användare
3. **Skicka meddelanden** - För att skicka meddelanden i kanaler
4. **Bädda in länkar** - För att skicka embeds
5. **Läs meddelandehistorik** - För att läsa meddelanden

## Viktigt: Rollhierarki

Discord använder rollhierarki för att bestämma vad en bot kan göra. Botten kan endast tilldela roller som är UNDER dess egen högsta roll.

### Hur man fixar "Saknar behörigheter"-felet:

1. Gå till **Serverinställningar** > **Roller**
2. Hitta din bots roll (har vanligtvis samma namn som botten)
3. **Dra den ÖVER** rollen du vill att botten ska tilldela
4. Se till att bottens roll har "Hantera roller"-behörighet aktiverad

### Exempel på rollordning (uppifrån och ner):
```
1. Admin (din adminroll)
2. Bot-roll (din bots roll) ← Måste vara här eller högre
3. Medlemsroll (rollen att ge) ← Måste vara under bottens roll
4. @everyone
```

## Konfigurationssteg

1. Kopiera `config.example.yml` till `config.yml`
2. Fyll i de nödvändiga ID:na:
   - `bot.token` - Din bot-token från Discord Developer Portal
   - `roles.admin_role_id` - Roll-ID:t som kan godkänna/neka biljetter
   - `roles.role_to_grant_id` - Roll-ID:t att ge när det godkänns

3. Kör botten: `npm start`
4. I Discord, kör `/setup` för att skapa biljettsystemet
5. Testa genom att klicka på "Skapa Biljett"

## Hämta Roll/Kanal-ID:n

1. Aktivera utvecklarläge: Discord-inställningar > Avancerat > Utvecklarläge
2. Högerklicka på valfri roll/kanal och välj "Kopiera ID"

## Felsökning

### "Saknar behörigheter" vid godkännande av biljetter
- Se till att bottens roll är ÖVER rollen den försöker tilldela
- Verifiera att botten har "Hantera roller"-behörighet

### "Saknar behörigheter" vid skapande av kanaler
- Se till att botten har "Hantera kanaler"-behörighet

### Slash-kommandon visas inte
- Vänta några minuter för att Discord ska registrera dem
- Försök att kicka och bjuda in botten igen med rätt behörigheter
