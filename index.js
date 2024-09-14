const { Client, IntentsBitField, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json'); 

// Importer et exécuter le fichier deploy-commands.js
require('./deploy-commands.js'); 

const client = new Client({ intents: new IntentsBitField(53608447) });

client.commands = new Collection();

// Charger les commandes
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'commands', file));
    client.commands.set(command.data.name, command);
}

// Charger les événements
const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(path.join(__dirname, 'events', file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.once('ready', () => {
    console.log('Bot is online!');
});

client.login(config.token);
