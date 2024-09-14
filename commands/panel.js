const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('Create a ticket panel'),

    async execute(interaction) {
        // Vérifier si l'utilisateur a la permission d'administrateur
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: 'Vous devez être administrateur pour utiliser cette commande.',
                ephemeral: true,
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('Support Tickets')
            .setDescription('Click the button below to create a support ticket!')
            .setColor(0x00AE86);

        const ticketButton = new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Create Ticket')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(ticketButton);

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
