const { PermissionsBitField, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');
const config = require('../config.json'); // Chemin vers config.json

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        const modRoles = config.modRoles;
        const notifyRoleId = config.notifyRoleId;
        const requiredRoleId = config.requiredRoleId;

        const hasModRole = (user) => {
            return user.roles.cache.some(role => modRoles.includes(role.id));
        };

        const hasRequiredRole = (user) => {
            return user.roles.cache.has(requiredRoleId);
        };

        if (interaction.isCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Erreur lors de l\'exécution de cette commande.', ephemeral: true });
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId === 'create_ticket') {
                const modPermissions = modRoles.map(roleId => ({
                    id: roleId,
                    allow: [
                        PermissionsBitField.Flags.SendMessages, 
                        PermissionsBitField.Flags.ReadMessageHistory, 
                        PermissionsBitField.Flags.ManageMessages,
                        PermissionsBitField.Flags.ViewChannel
                    ]
                }));

                const ticketChannel = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.username}`,
                    type: 0, 
                    parent: config.ticketCategoryId,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: interaction.user.id,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.SendMessages,
                                PermissionsBitField.Flags.ReadMessageHistory,
                            ],
                        },
                        ...modPermissions
                    ],
                });

                const notifyRole = interaction.guild.roles.cache.get(notifyRoleId);
                const notifyMessage = notifyRole ? `<@&${notifyRoleId}>` : 'Le rôle de notification';

                const embed = new EmbedBuilder()
                    .setTitle('Support Ticket')
                    .setDescription(`Bonjour ${interaction.user}, votre ticket a été créé.`)
                    .setColor(0x00AE86);

                const claimButton = new ButtonBuilder()
                    .setCustomId('claim_ticket')
                    .setLabel('Claim')
                    .setStyle(ButtonStyle.Primary);

                const closeButton = new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close')
                    .setStyle(ButtonStyle.Danger);

                const unclaimButton = new ButtonBuilder()
                    .setCustomId('unclaim_ticket')
                    .setLabel('Unclaim')
                    .setStyle(ButtonStyle.Secondary);

                const row = new ActionRowBuilder().addComponents(claimButton, closeButton, unclaimButton);

                await ticketChannel.send({ content: `${notifyMessage}`, embeds: [embed], components: [row] });
                await interaction.reply({ content: `Votre ticket a été créé : ${ticketChannel}`, ephemeral: true });
            }

            if (interaction.channel.name.startsWith('ticket-')) {
                if (!hasRequiredRole(interaction.member)) {
                    return interaction.reply({ content: 'Vous n\'avez pas la permission d\'utiliser ce bouton.', ephemeral: true });
                }

                if (interaction.customId === 'claim_ticket') {
                    const claimEmbed = new EmbedBuilder()
                        .setTitle('Ticket Réclamé')
                        .setDescription(`Ce ticket a été réclamé par ${interaction.user}.`)
                        .setColor(0x00AE86);

                    await interaction.reply({ content: 'Ce ticket a été réclamé.', ephemeral: true });
                    await interaction.channel.permissionOverwrites.edit(interaction.user.id, {
                        [PermissionsBitField.Flags.ViewChannel]: true,
                    });
                    await interaction.channel.send({ embeds: [claimEmbed] });
                } else if (interaction.customId === 'close_ticket') {
                    await interaction.reply({ content: 'Ce ticket a été fermé.', ephemeral: true });
                    await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
                        [PermissionsBitField.Flags.SendMessages]: false,
                    });

                    const closeEmbed = new EmbedBuilder()
                        .setTitle('Fermeture du Ticket')
                        .setDescription('Ce ticket est maintenant fermé. Vous pouvez rouvrir, supprimer ou obtenir un transcript.')
                        .setColor(0xFF0000);

                    const reopenButton = new ButtonBuilder()
                        .setCustomId('reopen_ticket')
                        .setLabel('Rouvrir')
                        .setStyle(ButtonStyle.Primary);

                    const deleteButton = new ButtonBuilder()
                        .setCustomId('delete_ticket')
                        .setLabel('Supprimer')
                        .setStyle(ButtonStyle.Danger);

                    const transcriptButton = new ButtonBuilder()
                        .setCustomId('transcript_ticket')
                        .setLabel('Transcript')
                        .setStyle(ButtonStyle.Secondary);

                    const row = new ActionRowBuilder().addComponents(reopenButton, deleteButton, transcriptButton);

                    await interaction.channel.send({ embeds: [closeEmbed], components: [row] });
                } else if (interaction.customId === 'unclaim_ticket') {
                    const unclaimEmbed = new EmbedBuilder()
                        .setTitle('Ticket Non Réclamé')
                        .setDescription(`Ce ticket a été désigné comme non réclamé par ${interaction.user}.`)
                        .setColor(0xFFA500);

                    await interaction.reply({ content: 'Ce ticket a été désigné comme non réclamé.', ephemeral: true });
                    await interaction.channel.send({ embeds: [unclaimEmbed] });
                } else if (interaction.customId === 'reopen_ticket') {
                    await interaction.reply({ content: 'Le ticket sera rouvert.', ephemeral: true });
                    await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
                        [PermissionsBitField.Flags.SendMessages]: true,
                    });

                    const message = await interaction.channel.messages.fetch(interaction.message.id);
                    await message.delete();
                } else if (interaction.customId === 'delete_ticket') {
                    await interaction.reply({ content: 'Le ticket sera supprimé.', ephemeral: true });

                    const message = await interaction.channel.messages.fetch(interaction.message.id);
                    await message.delete();
                    await interaction.channel.delete();
                } else if (interaction.customId === 'transcript_ticket') {
                    const transcriptChannel = interaction.guild.channels.cache.get(config.transcriptChannelId);

                    if (!transcriptChannel) {
                        return interaction.reply({ content: 'Le salon pour envoyer le transcript n\'a pas été trouvé.', ephemeral: true });
                    }

                    const attachment = await discordTranscripts.createTranscript(interaction.channel);
                    await transcriptChannel.send({ files: [attachment] });
                    await interaction.reply({ content: 'Le transcript a été envoyé.', ephemeral: true });
                }
            }
        }
    },
};
