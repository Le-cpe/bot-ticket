const { EmbedBuilder, ActivityType } = require('discord.js');
const packageJson = require('../package.json'); // Assurez-vous que le chemin est correct

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        try {
            // Définir la présence du bot
            await client.user.setPresence({
                activities: [
                    {
                        name: `https://ecloudserv.fr`, // Afficher la version du bot
                        type: ActivityType.Watching, // Utiliser ActivityType.Watching pour "WATCHING"
                    },
                ],
                status: 'dnd', // Statut: do not disturb
            });

            // ID du salon où envoyer le message
            const channelId = '1165705590950072472'; // Remplacez par l'ID de votre salon
            const channel = client.channels.cache.get(channelId);

            if (!channel) {
                console.warn(`Le salon avec l'ID ${channelId} n'a pas été trouvé.`);
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('Bot démarré')
                .setDescription('Le bot vient de démarrer avec succès !')
                .setColor(0x00AE86);

            await channel.send({ embeds: [embed] });
            console.log('Message de démarrage envoyé dans le salon.');
        } catch (error) {
            console.error('Erreur lors de la configuration de la présence ou de l\'envoi du message de démarrage :', error);
        }
    },
};
