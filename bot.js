const fs = require('fs');
const yaml = require('js-yaml');
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, REST, Routes } = require('discord.js');

// Load config - support both local config.yml and Replit environment variables
let config;
if (process.env.BOT_TOKEN) {
  // Running on Replit - use environment variables
  config = {
    bot: {
      token: process.env.BOT_TOKEN
    },
    roles: {
      admin_role_id: process.env.ADMIN_ROLE_ID,
      admin_role_id_2: process.env.ADMIN_ROLE_ID_2,
      admin_role_id_3: process.env.ADMIN_ROLE_ID_3,
      admin_role_id_4: process.env.ADMIN_ROLE_ID_4,
      role_to_grant_id: process.env.ROLE_TO_GRANT_ID,
      auto_role_on_join: process.env.AUTO_ROLE_ON_JOIN
    },
    channels: {
      ticket_channel_id: process.env.TICKET_CHANNEL_ID,
      ticket_category_id: process.env.TICKET_CATEGORY_ID
    }
  };
} else {
  // Running locally - use config.yml
  config = yaml.load(fs.readFileSync('./config.yml', 'utf8'));
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

const activeTickets = new Map();

// Define slash commands
const commands = [
  {
    name: 'setup',
    description: 'Konfigurera biljettsystemet (Endast admin)',
  },
  {
    name: 'ticket',
    description: 'Öppna en rollförfrågan',
  }
];

client.once('clientReady', async () => {
  console.log(`Inloggad som ${client.user.tag}`);
  
  // Register slash commands
  const rest = new REST({ version: '10' }).setToken(config.bot.token);
  
  try {
    console.log('Registrerar slash-kommandon...');
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    console.log('Slash-kommandon registrerade framgångsrikt!');
  } catch (error) {
    console.error('Fel vid registrering av slash-kommandon:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'setup') {
      // Check if user has admin permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: 'Du behöver administratörsbehörighet för att använda detta kommando.', ephemeral: true });
      }

      await interaction.deferReply();

      try {
        // Create ticket category
        const ticketCategory = await interaction.guild.channels.create({
          name: 'Biljetter',
          type: 4, // Category
        });

        // Create the ticket channel
        const ticketChannel = await interaction.guild.channels.create({
          name: 'skapa-biljett',
          type: 0, // Text channel
          parent: ticketCategory.id,
          topic: 'Klicka på knappen nedan för att skapa en rollförfrågan',
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
              deny: [PermissionFlagsBits.SendMessages]
            }
          ]
        });

        // Update config with new channel and category IDs
        config.channels.ticket_channel_id = ticketChannel.id;
        config.channels.ticket_category_id = ticketCategory.id;
        fs.writeFileSync('./config.yml', yaml.dump(config), 'utf8');

        // Create embed with button
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('🎫 Rollförfrågningssystem')
          .setDescription('Klicka på knappen nedan för att skapa en privat biljett och begära en roll.\n\nEn privat kanal kommer att skapas där du kan diskutera med admins.')
          .setFooter({ text: 'Endast du och admins kan se din biljett' });

        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('open_ticket')
              .setLabel('Skapa Biljett')
              .setEmoji('🎫')
              .setStyle(ButtonStyle.Primary)
          );

        await ticketChannel.send({ embeds: [embed], components: [row] });

        interaction.editReply({ content: `✅ Biljettsystemet har konfigurerats framgångsrikt!\n📁 Kategori: ${ticketCategory}\n📝 Kanal: ${ticketChannel}` });
      } catch (error) {
        console.error('Fel vid konfigurering av biljettkanal:', error);
        interaction.editReply({ content: '❌ Misslyckades med att konfigurera biljettkanal. Se till att jag har nödvändiga behörigheter.' });
      }
      return;
    }

    if (interaction.commandName === 'ticket') {
      const ticketCategoryId = config.channels.ticket_category_id;
      
      if (!ticketCategoryId) {
        return interaction.reply({ content: 'Biljettsystemet är inte konfigurerat. Be en admin att köra `/setup` först.', ephemeral: true });
      }

      // Check if user already has an active ticket
      if (activeTickets.has(interaction.user.id)) {
        const existingChannelId = activeTickets.get(interaction.user.id);
        return interaction.reply({ content: `Du har redan en aktiv biljett: <#${existingChannelId}>`, ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        const adminRoleId = config.roles.admin_role_id;
        
        // Fetch the admin role to ensure it's cached
        const adminRole = await interaction.guild.roles.fetch(adminRoleId);
        if (!adminRole) {
          return interaction.editReply({ content: '❌ Admin-rollen hittades inte. Kontrollera config.yml.' });
        }

        // Create private ticket channel
        const ticketChannel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: 0, // Text channel
          parent: ticketCategoryId,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel]
            },
            {
              id: interaction.user.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            },
            {
              id: adminRole.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            }
          ]
        });

        activeTickets.set(interaction.user.id, ticketChannel.id);

        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('🎫 Rollförfrågningsbiljett')
          .setDescription(`Välkommen ${interaction.user}!\n\nDu har begärt en roll. En admin kommer att granska din förfrågan inom kort.\n\nVänligen vänta på svar.`)
          .addFields(
            { name: 'Användare', value: `${interaction.user.tag}`, inline: true },
            { name: 'Användar-ID', value: interaction.user.id, inline: true },
            { name: 'Status', value: '⏳ Väntar', inline: true }
          )
          .setTimestamp();

        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`approve_${interaction.user.id}`)
              .setLabel('Godkänn')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`deny_${interaction.user.id}`)
              .setLabel('Neka')
              .setStyle(ButtonStyle.Danger)
          );

        await ticketChannel.send({ content: `${interaction.user} <@&${adminRoleId}>`, embeds: [embed], components: [row] });

        interaction.editReply({ content: `✅ Din biljett har skapats: ${ticketChannel}` });
      } catch (error) {
        console.error('Fel vid skapande av biljett:', error);
        interaction.editReply({ content: '❌ Misslyckades med att skapa biljett. Försök igen senare.' });
      }
      return;
    }
  }

  // Handle buttons
  if (!interaction.isButton()) return;

  // Handle "Open Ticket" button
  if (interaction.customId === 'open_ticket') {
    const ticketCategoryId = config.channels.ticket_category_id;
    
    if (!ticketCategoryId) {
      return interaction.reply({ content: 'Biljettsystemet är inte konfigurerat.', ephemeral: true });
    }

    // Check if user already has an active ticket
    if (activeTickets.has(interaction.user.id)) {
      const existingChannelId = activeTickets.get(interaction.user.id);
      return interaction.reply({ content: `Du har redan en aktiv biljett: <#${existingChannelId}>`, ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const adminRoleId = config.roles.admin_role_id;
      
      // Fetch the admin role to ensure it's cached
      const adminRole = await interaction.guild.roles.fetch(adminRoleId);
      if (!adminRole) {
        return interaction.editReply({ content: '❌ Admin-rollen hittades inte. Kontrollera config.yml.' });
      }

      // Create private ticket channel
      const ticketChannel = await interaction.guild.channels.create({
        name: `biljett-${interaction.user.username}`,
        type: 0, // Text channel
        parent: ticketCategoryId,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          },
          {
            id: adminRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          }
        ]
      });

      activeTickets.set(interaction.user.id, ticketChannel.id);

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎫 Rollförfrågningsbiljett')
        .setDescription(`Välkommen ${interaction.user}!\n\nHär kan du skriva varför du vill bli medlem i gänget.\n\nVänligen vänta på svar.`)
        .addFields(
          { name: 'Användare', value: `${interaction.user.tag}`, inline: true },
          { name: 'Användar-ID', value: interaction.user.id, inline: true },
          { name: 'Status', value: '⏳ Väntar', inline: true }
        )
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`approve_${interaction.user.id}`)
            .setLabel('Godkänn')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`deny_${interaction.user.id}`)
            .setLabel('Neka')
            .setStyle(ButtonStyle.Danger)
        );

      await ticketChannel.send({ content: `${interaction.user} <@&${adminRoleId}>`, embeds: [embed], components: [row] });

      interaction.editReply({ content: `✅ Din biljett har skapats: ${ticketChannel}` });
    } catch (error) {
      console.error('Fel vid skapande av biljett:', error);
      interaction.editReply({ content: '❌ Misslyckades med att skapa biljett. Försök igen senare.' });
    }
    return;
  }

  // Handle approve/deny buttons
  const adminRoleId = config.roles.admin_role_id;
  const adminRoleId2 = config.roles.admin_role_id_2;
  const adminRoleId3 = config.roles.admin_role_id_3;
  const adminRoleId4 = config.roles.admin_role_id_4;
  const roleToGrantId = config.roles.role_to_grant_id;

  // Check if user has admin role
  if (!interaction.member.roles.cache.has(adminRoleId) && !interaction.member.roles.cache.has(adminRoleId2) && !interaction.member.roles.cache.has(adminRoleId3) && !interaction.member.roles.cache.has(adminRoleId4)) {
    return interaction.reply({ content: 'Du har inte behörighet att använda denna knapp.', ephemeral: true });
  }

  const [action, userId] = interaction.customId.split('_');
  
  try {
    const user = await client.users.fetch(userId);
    const member = await interaction.guild.members.fetch(userId);

    if (action === 'approve') {
      const role = interaction.guild.roles.cache.get(roleToGrantId);
      
      if (!role) {
        return interaction.reply({ content: 'Roll hittades inte!', ephemeral: true });
      }

      // Check if bot can manage this role
      const botMember = interaction.guild.members.me;
      if (botMember.roles.highest.position <= role.position) {
        return interaction.reply({ 
          content: `❌ Jag kan inte tilldela denna roll eftersom min högsta roll inte är över målrollen.\n\n**Lösning:** Flytta min roll över "${role.name}" i Serverinställningar > Roller.`, 
          ephemeral: true 
        });
      }

      try {
        await member.roles.add(role);
      } catch (error) {
        console.error('Fel vid tillägg av roll:', error);
        return interaction.reply({ 
          content: `❌ Misslyckades med att lägga till roll. Se till att jag har "Hantera roller"-behörighet och att min roll är över "${role.name}".`, 
          ephemeral: true 
        });
      }

      const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor('#00ff00')
        .setFields(
          { name: 'Användare', value: `${user.tag}`, inline: true },
          { name: 'Användar-ID', value: userId, inline: true },
          { name: 'Status', value: '✅ Godkänd', inline: true },
          { name: 'Godkänd av', value: `${interaction.user.tag}`, inline: false }
        );

      await interaction.update({ embeds: [updatedEmbed], components: [] });

      await interaction.channel.send(`✅ ${user} har godkänts och fått rollen!\n\nDenna biljett stängs om 5 sekunder...`);

      // Auto-close ticket after 5 seconds
      setTimeout(async () => {
        try {
          await interaction.channel.delete();
          activeTickets.delete(userId);
        } catch (error) {
          console.error('Fel vid automatisk stängning av biljett:', error);
        }
      }, 5000);

    } else if (action === 'deny') {
      const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor('#ff0000')
        .setFields(
          { name: 'Användare', value: `${user.tag}`, inline: true },
          { name: 'Användar-ID', value: userId, inline: true },
          { name: 'Status', value: '❌ Nekad', inline: true },
          { name: 'Nekad av', value: `${interaction.user.tag}`, inline: false }
        );

      await interaction.update({ embeds: [updatedEmbed], components: [] });

      await interaction.channel.send(`❌ ${user}s förfrågan har nekats.\n\nDenna biljett stängs om 5 sekunder...`);

      // Auto-close ticket after 5 seconds
      setTimeout(async () => {
        try {
          await interaction.channel.delete();
          activeTickets.delete(userId);
        } catch (error) {
          console.error('Fel vid automatisk stängning av biljett:', error);
        }
      }, 5000);
    }
  } catch (error) {
    console.error('Fel vid bearbetning av biljett:', error);
    interaction.reply({ content: 'Ett fel uppstod vid bearbetning av biljetten.', ephemeral: true });
  }
});

client.login(config.bot.token);
