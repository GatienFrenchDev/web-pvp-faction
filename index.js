const { Client, MessageEmbed, Intents } = require('discord.js')
const path = require('path')
const { REST } = require('@discordjs/rest')
const { SlashCommandBuilder } = require('@discordjs/builders')
const { Routes } = require('discord-api-types/v9')
const express = require('express')
const { writeFile, write, readFileSync } = require('fs')
require('dotenv').config()
const equipe = require('./db/equipe.json')
const points = require('./db/points.json')
const https = require('https')

const app = express()
const servweb = express()

servweb.listen(17000, () => {
    console.log('[*] - Serveur Web lancé !')
})

servweb.use(express.urlencoded({ extended: true }))
servweb.use(express.json())

servweb.use('/', express.static(path.join(__dirname, '/public/')))

const client = new Client({ intents: [Intents.FLAGS.GUILDS] })

const commands = [
    {
        name: 'wiki',
        description: 'Renvoie le lien du wiki du serv MC'
    },
    {
        name: 'leaderboard',
        description: 'Renvoie le leaderboard du serv Faction'
    }
]

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN)

async function register() {
    try {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
            body: commands,
        });

    } catch (error) {
        console.error(error)
    }
}


client.on('ready', () => {
    register()
    client.user.setPresence({
        activities:
            [{
                type: 'PLAYING',
                name: 'play.boko.ml'
            }],
        status: 'online'
    })
})

client.on('interactionCreate', interaction => {
    if (!interaction.isCommand()) return
    if (interaction.commandName == 'wiki') {
        interaction.reply("[📘] | **Wiki**\n\nLien du wiki : https://wiki.boko.ml")
    }
    if (interaction.commandName == 'leaderboard') {
        let sortable = []
        for (const joueur in points) {
            sortable.push([joueur, points[joueur]])
        }
        sortable.sort((a, b) => {
            return b[1] - a[1]
        })

        let description = "Version en ligne : https://leaderboard.boko.ml\n\n"
        const emojis = {
            "Rouge": ":red_square:",
            "Bleu": ":blue_square:",
            "Vert": ":green_square:",
            "Jaune": ":yellow_square:"
        }
        for (i = 0; i < sortable.length; i++) {
            if (sortable[i][1] == 1) {
                description += `${emojis[equipe[sortable[i][0]]]} **${sortable[i][0]}** a déjà fait \`${sortable[i][1]} kill\`\n`
            }
            else {
                description += `${emojis[equipe[sortable[i][0]]]} **${sortable[i][0]}** a déjà fait \`${sortable[i][1]} kills\`\n`
            }

        }

        interaction.reply({
            embeds: [
                {
                    "type": "rich",
                    "title": `Leaderboard PVP Faction`,
                    "description": description,
                    "color": 0x00FFFF,
                    "footer": {
                        "text": `play.boko.ml`
                    }

                }
            ]
        })
    }
})

const couleur_faction = {
    BLUE: 'Bleu',
    GREEN: 'Vert',
    RED: 'Rouge',
    YELLOW: 'Jaune',
}


app.listen(25566, () => {
    console.log('[*] - Bot Discord lancé !')
})

servweb.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/index.html'))
})


servweb.get('/api/v1/points', (req, res) => {
    let response = {}
    for (const [key, value] of Object.entries(points)) {
        response[key] = {
            "kills": value,
            "equipe": equipe[key]
        }
    }
    res.send(response)
})

app.get('/api/v1/connection', (req, res) => {
    console.log('[*] - Nouvelle connexion au serveur Minecraft')
    const username = req.query.content
    const message = new MessageEmbed()
        .setColor('GREEN')
        .setTitle('[+] | Nouvelle connexion')
        .setThumbnail('https://mc-heads.net/avatar/' + username + '.png')
        .setDescription(`**${username}** s'est connecté sur le serveur !`)
    client.channels.cache.get('954729243265355786').send({ embeds: [message] })
    res.statusCode = 200
    if (equipe[username] == undefined) {
        res.send('pas_equipe')
    }
    else {
        res.send(equipe[username])
    }
})

app.get('/api/v1/join_faction', (req, res) => {
    const block = req.query.content.split('|')[0]
    const player = req.query.content.split('|')[1]
    const message = new MessageEmbed()
        .setColor('FUCHSIA')
        .setTitle('[⚔️] | Nouveau membre')
        .setThumbnail('https://mc-heads.net/avatar/' + player + '.png')
        .setDescription(`**${player}** a rejoint la faction des ${couleur_faction[block]} !`)
    client.channels.cache.get('954729243265355786').send({ embeds: [message] })
    equipe[player] = couleur_faction[block]
    writeFile('db/equipe.json', JSON.stringify(equipe), () => { console.log('[*] - Ajout d\'un joueur à une faction...') })
    res.statusCode = 200
    res.send(equipe[player])
})

app.get('/api/v1/demarrage', (req, res) => {
    client.channels.cache.get('955104345152712815').setName('Serv MC → [ON]')
    console.log('[*] - Serveur MC démarré !')
    const message = new MessageEmbed()
        .setColor('RED')
        .setTitle('[⚡] | Serveur UP')
        .setDescription(`Le serveur Minecraft est **allumé** !\nVersion du serveur : 1.14.4\nIP du serveur : **play.boko.ml**`)
    client.channels.cache.get('954729243265355786').send({ embeds: [message] })
    res.statusCode = 200
    res.send('OK!')
})

app.get('/api/v1/eteindre', (req, res) => {
    client.channels.cache.get('955104345152712815').setName('Serv MC → [OFF]')
    console.log('[*] - Serveur MC éteint !')
    const message = new MessageEmbed()
        .setColor('RED')
        .setTitle('[❌] | Serveur DOWN')
        .setDescription(`Le serveur Minecraft est **éteint** !`)
    client.channels.cache.get('954729243265355786').send({ embeds: [message] })
    res.statusCode = 200
    res.send('OK!')
})

app.get('/api/v1/mort', (req, res) => {
    const message = new MessageEmbed()
        .setColor('RED')
        .setTitle('[💀] | Mort')
        .setDescription(`**${req.query.content}** a été tué par **${req.query.tueur}** !`)
    client.channels.cache.get('954729243265355786').send({ embeds: [message] })
    points[req.query.tueur] = points[req.query.tueur] + 1 || 1
    writeFile('db/points.json', JSON.stringify(points), () => { console.log(`[*] - Ajout d\'un point à ${req.query.tueur}...`) })
    res.statusCode = 200
    res.send('OK!')
})

client.login(process.env.TOKEN)