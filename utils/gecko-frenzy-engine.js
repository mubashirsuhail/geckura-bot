const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserData, saveUserData } = require('./chat2earn-handler');

// Path for storing game history
const historyPath = path.join(__dirname, '..', 'data', 'gecko-frenzy-history.json');

// In-memory active frenzies map
const activeFrenzies = new Map();

// Helper to load history
function loadHistory() {
    try {
        if (fs.existsSync(historyPath)) {
            return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading frenzy history:', e);
    }
    return { completed: [] };
}

// Helper to save history
function saveHistoryRecord(record) {
    try {
        const history = loadHistory();
        history.completed = history.completed || [];
        history.completed.push(record);
        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    } catch (e) {
        console.error('Error saving frenzy history:', e);
    }
}

// Random event engine library
const GECKO_EVENTS = [
    // --- COMEDY EVENTS ---
    {
        name: '🏋️ GECKO GYM',
        category: 'Comedy',
        execute: (aliveGeckos) => {
            const geckos = [...aliveGeckos].sort(() => 0.5 - Math.random());
            const hero = geckos[0];
            const victim = geckos.length > 1 ? geckos[1] : null;

            let log = `The Geckos hit the gym to flex their scales!\n\n` +
                `🦎 **${hero.name}** lifted 3x its body weight in mealworms!\n`;

            if (victim) {
                log += `🦎 **${victim.name}** lifted absolutely nothing.\n` +
                    `💀 **${victim.name}** has been eliminated by lack of gains!`;
                return { log, eliminated: [victim] };
            }
            return { log, eliminated: [] };
        }
    },
    {
        name: '🪰 FLY BUFFET',
        category: 'Comedy',
        execute: (aliveGeckos) => {
            const geckos = [...aliveGeckos].sort(() => 0.5 - Math.random());
            const g1 = geckos[0];
            const g2 = geckos.length > 1 ? geckos[1] : null;

            let log = `A giant golden fly appears in the center of the arena!\n\n` +
                `🦎 **${g1.name}**: *"MINE!"*\n`;
            if (g2) {
                log += `🦎 **${g2.name}**: *"ALSO MINE!"*\n💥 **CHAOS ERUPTS!**\n` +
                    `🦎 **${g1.name}** snaps the fly out of mid-air!\n` +
                    `💀 **${g2.name}** choked on the fly dust and was eliminated!`;
                return { log, eliminated: [g2] };
            }
            return { log: log + `🦎 **${g1.name}** enjoys a delicious solo feast!`, eliminated: [] };
        }
    },
    {
        name: '🧱 WALL TEST',
        category: 'Comedy',
        execute: (aliveGeckos) => {
            const geckos = [...aliveGeckos].sort(() => 0.5 - Math.random());
            const g1 = geckos[0];
            const g2 = geckos.length > 1 ? geckos[1] : null;
            const victim = geckos.length > 2 ? geckos[2] : g2;

            let log = `Every Gecko must climb the slippery glass wall!\n\n` +
                `🦎 **${g1.name}**: 🧗 CLIMBING LIKE A PRO...\n`;
            if (g2 && g2 !== victim) {
                log += `🦎 **${g2.name}**: 🧗 STICKING TO THE WALL...\n`;
            }
            if (victim) {
                log += `🦎 **${victim.name}**: *"I forgot I am a gecko!"*\n` +
                    `💀 **${victim.name}** lost grip and fell into the abyss!`;
                return { log, eliminated: [victim] };
            }
            return { log, eliminated: [] };
        }
    },
    {
        name: '🦎 TAIL CHECK',
        category: 'Comedy',
        execute: (aliveGeckos) => {
            const geckos = [...aliveGeckos].sort(() => 0.5 - Math.random());
            const angry = geckos[0];
            const victim = geckos.length > 1 ? geckos[1] : null;

            let log = `Someone pulled the wrong Gecko's tail in the dark!\n\n` +
                `⚠️ **${angry.name}** HAS ENTERED **ANGRY GECKO MODE**!\n` +
                `Nobody is safe!\n`;
            if (victim) {
                log += `💥 **${angry.name}** tail-whipped **${victim.name}** right out of the arena!\n` +
                    `💀 **${victim.name}** was eliminated!`;
                return { log, eliminated: [victim] };
            }
            return { log, eliminated: [] };
        }
    },
    {
        name: '💤 GECKO NAP TIME',
        category: 'Comedy',
        execute: (aliveGeckos) => {
            const geckos = [...aliveGeckos].sort(() => 0.5 - Math.random());
            const sleeper = geckos[0];
            let log = `A warm heat lamp turns on above the arena.\n\n` +
                `🦎 **${sleeper.name}** fell fast asleep under the heat lamp!\n`;
            if (aliveGeckos.length > 2) {
                const victim = geckos[1];
                log += `🦎 **${victim.name}** tripped over the sleeping gecko and rolled out!\n` +
                    `💀 **${victim.name}** was eliminated!`;
                return { log, eliminated: [victim] };
            }
            return { log: log + `Everyone takes a cozy 5-second power nap.`, eliminated: [] };
        }
    },
    {
        name: '🎤 GECKO KARAOKE',
        category: 'Comedy',
        execute: (aliveGeckos) => {
            const geckos = [...aliveGeckos].sort(() => 0.5 - Math.random());
            const singer = geckos[0];
            const victim = geckos.length > 1 ? geckos[1] : null;

            let log = `🦎 **${singer.name}** grabs a cricket microphone and starts singing high-pitch chirp solos!\n`;
            if (victim) {
                log += `🎶 The vocals were so terrible that **${victim.name}** covered its ears and jumped out of the ring!\n` +
                    `💀 **${victim.name}** was eliminated!`;
                return { log, eliminated: [victim] };
            }
            return { log: log + `The audience chirps along in harmony!`, eliminated: [] };
        }
    },

    // --- COMPETITION EVENTS ---
    {
        name: '🧱 HIGH STAKES WALL CLIMB',
        category: 'Competition',
        execute: (aliveGeckos) => {
            const geckos = [...aliveGeckos].sort(() => 0.5 - Math.random());
            const winner = geckos[0];
            const victim = geckos.length > 1 ? geckos[geckos.length - 1] : null;

            let log = `⚡ **SPEED RACE UP THE SMOOTH GLASS TOWER!**\n\n` +
                `🦎 **${winner.name}** sprinted to the top with suction cup feet!\n`;
            if (victim && victim !== winner) {
                log += `🦎 **${victim.name}** slipped on a drop of water!\n` +
                    `💀 **${victim.name}** slid down to elimination!`;
                return { log, eliminated: [victim] };
            }
            return { log, eliminated: [] };
        }
    },
    {
        name: '💨 SPEED DASH & GECKO DODGE',
        category: 'Competition',
        execute: (aliveGeckos) => {
            const geckos = [...aliveGeckos].sort(() => 0.5 - Math.random());
            const victim = geckos[0];
            let log = `🌧️ Giant raindrops start falling from the sky!\n\n` +
                `The Geckos scramble for cover under leaves and rocks!\n`;
            if (aliveGeckos.length > 1) {
                log += `💦 A massive raindrop landed directly on **${victim.name}**!\n` +
                    `💀 **${victim.name}** got washed away and eliminated!`;
                return { log, eliminated: [victim] };
            }
            return { log: log + `All remaining Geckos dodge the raindrops safely!`, eliminated: [] };
        }
    },

    // --- CHAOS EVENTS ---
    {
        name: '🔥 THE FLOOR IS LAVA',
        category: 'Chaos',
        execute: (aliveGeckos) => {
            const geckos = [...aliveGeckos].sort(() => 0.5 - Math.random());
            let log = `🚨 **THE FLOOR IS LAVA!**\n\n` +
                `All Geckos jump to ceiling light fixtures!\n`;
            if (aliveGeckos.length > 1) {
                const victim = geckos[0];
                log += `🔥 **${victim.name}** misjudged the distance and touched the floor!\n` +
                    `💀 **${victim.name}** was crispy eliminated!`;
                return { log, eliminated: [victim] };
            }
            return { log: log + `All Geckos cling tightly to the ceiling!`, eliminated: [] };
        }
    },
    {
        name: '⚠️ GECKO STAMPEDE',
        category: 'Chaos',
        execute: (aliveGeckos) => {
            const geckos = [...aliveGeckos].sort(() => 0.5 - Math.random());
            let log = `⚡ A swarm of robo-crickets stampedes through the arena!\n\n`;
            if (aliveGeckos.length > 2 && Math.random() < 0.5) {
                const v1 = geckos[0];
                const v2 = geckos[1];
                log += `💥 Double elimination! **${v1.name}** and **${v2.name}** were swept away by the stampede!\n` +
                    `💀 Both have been eliminated!`;
                return { log, eliminated: [v1, v2] };
            } else if (aliveGeckos.length > 1) {
                const v = geckos[0];
                log += `💥 **${v.name}** got trampled by the wild crickets!\n` +
                    `💀 **${v.name}** was eliminated!`;
                return { log, eliminated: [v] };
            }
            return { log: log + `The Geckos jump over the crickets like total ninjas!`, eliminated: [] };
        }
    }
];

class FrenzyManager {
    createFrenzy({ guildId, channelId, creatorId, requiredRole, joinTimeMinutes, rewardToken, rewardAmount, maxPlayers }) {
        const frenzyId = `frenzy_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        const frenzy = {
            id: frenzyId,
            guildId,
            channelId,
            creatorId,
            requiredRole: requiredRole || null,
            joinTimeMinutes: joinTimeMinutes || 3,
            rewardToken: rewardToken || '$GAURA',
            rewardAmount: rewardAmount || 1000,
            maxPlayers: maxPlayers || 20,
            status: 'JOINING',
            startTime: Date.now(),
            endTime: Date.now() + (joinTimeMinutes || 3) * 60 * 1000,
            players: [], // { discordId, username, geckoNum, name, alive, hasRevived }
            eliminated: [],
            reviveCount: 0,
            maxRevives: Math.min(3, Math.max(1, Math.floor((maxPlayers || 20) * 0.15))),
            winner: null,
            messageId: null,
            timer: null
        };

        activeFrenzies.set(frenzyId, frenzy);
        return frenzy;
    }

    getFrenzy(frenzyId) {
        return activeFrenzies.get(frenzyId);
    }

    addPlayer(frenzyId, user, guildMember) {
        const frenzy = activeFrenzies.get(frenzyId);
        if (!frenzy) return { success: false, reason: 'Frenzy not found.' };

        if (frenzy.status !== 'JOINING') {
            return { success: false, reason: '🔒 This Frenzy has already started.' };
        }

        if (frenzy.players.some(p => p.discordId === user.id)) {
            return { success: false, reason: '🦎 You\'re already in this Frenzy!' };
        }

        if (frenzy.players.length >= frenzy.maxPlayers) {
            return { success: false, reason: '⚠️ This Frenzy has reached maximum player capacity!' };
        }

        // Required Role Check
        if (frenzy.requiredRole && guildMember) {
            const hasRole = guildMember.roles.cache.some(r => r.id === frenzy.requiredRole.id || r.name === frenzy.requiredRole.name);
            if (!hasRole) {
                return { success: false, reason: `❌ You need the required **${frenzy.requiredRole.name}** role to join this Frenzy.` };
            }
        }

        const playerName = user.globalName || user.username;
        const geckoName = playerName;

        const playerObj = {
            discordId: user.id,
            username: user.tag || user.username,
            geckoNum: geckoIndex,
            name: playerName,
            alive: true
        };

        frenzy.players.push(playerObj);

        return {
            success: true,
            geckoName,
            playerCount: frenzy.players.length,
            maxPlayers: frenzy.maxPlayers
        };
    }

    buildLobbyEmbed(frenzy) {
        const remainingSeconds = Math.max(0, Math.floor((frenzy.endTime - Date.now()) / 1000));
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        const embed = new EmbedBuilder()
            .setTitle('🦎 GECKO FRENZY — MULTIPLAYER BATTLE')
            .setColor(0x00FF99)
            .setDescription(
                '⚔️ **A new Gecko Frenzy is forming!**\n\n' +
                'Click the **🦎 JOIN FRENZY** button below to grab your Gecko Identity and enter the battle arena!'
            )
            .addFields(
                { name: '👥 Players', value: `\`${frenzy.players.length} / ${frenzy.maxPlayers}\``, inline: true },
                { name: '🎭 Required Role', value: frenzy.requiredRole ? `<@&${frenzy.requiredRole.id}>` : '`Everyone`', inline: true },
                { name: '⏱️ Joining Closes In', value: `\`${timeStr}\``, inline: true },
                { name: '💰 REWARD POOL', value: `**${frenzy.rewardAmount.toLocaleString()} ${frenzy.rewardToken}**`, inline: false }
            )
            .setFooter({ text: 'Think you\'re the last Gecko standing? Join now!' })
            .setTimestamp();

        return embed;
    }

    buildLobbyButtons(frenzy) {
        const joinButton = new ButtonBuilder()
            .setCustomId(`gecko_frenzy_join_${frenzy.id}`)
            .setLabel('🦎 JOIN FRENZY')
            .setStyle(ButtonStyle.Success)
            .setDisabled(frenzy.status !== 'JOINING' || frenzy.players.length >= frenzy.maxPlayers);

        return new ActionRowBuilder().addComponents(joinButton);
    }

    async startFrenzyLoop(client, frenzyId) {
        const frenzy = activeFrenzies.get(frenzyId);
        if (!frenzy) return;

        frenzy.status = 'ACTIVE';

        const channel = await client.channels.fetch(frenzy.channelId).catch(() => null);
        if (!channel) return;

        // Check player count
        if (frenzy.players.length < 2) {
            frenzy.status = 'CANCELLED';
            const cancelEmbed = new EmbedBuilder()
                .setTitle('🦎 GECKO FRENZY CANCELLED')
                .setColor(0xFF0000)
                .setDescription('⚠️ Not enough Geckos joined the Frenzy (Minimum 2 players required). The Frenzy has been cancelled.')
                .setTimestamp();

            if (frenzy.messageId) {
                try {
                    const msg = await channel.messages.fetch(frenzy.messageId);
                    await msg.edit({ embeds: [cancelEmbed], components: [] });
                } catch (e) {}
            }
            activeFrenzies.delete(frenzyId);
            return;
        }

        // Lock Lobby Message
        const lockEmbed = new EmbedBuilder()
            .setTitle('🦎 GECKO FRENZY')
            .setColor(0x9D4EDD)
            .setDescription(
                `🔒 **JOINING CLOSED**\n\n` +
                `**${frenzy.players.length} GECKOS HAVE ENTERED THE ARENA.**\n\n` +
                `⚔️ **LET THE FRENZY BEGIN!**`
            )
            .addFields(
                { name: '💰 REWARD POOL', value: `**${frenzy.rewardAmount.toLocaleString()} ${frenzy.rewardToken}**`, inline: false }
            )
            .setTimestamp();

        if (frenzy.messageId) {
            try {
                const msg = await channel.messages.fetch(frenzy.messageId);
                const disabledButtons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('disabled_frenzy_btn')
                        .setLabel('🔒 FRENZY IN PROGRESS')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );
                await msg.edit({ embeds: [lockEmbed], components: [disabledButtons] });
            } catch (e) {}
        }

        let roundNum = 1;

        // Run game rounds until 1 winner remains
        const gameInterval = setInterval(async () => {
            const aliveGeckos = frenzy.players.filter(p => p.alive);

            // Winner Condition
            if (aliveGeckos.length <= 1) {
                clearInterval(gameInterval);
                const winner = aliveGeckos.length === 1 ? aliveGeckos[0] : frenzy.players[0];
                frenzy.winner = winner;
                frenzy.status = 'COMPLETED';

                // Credit token reward automatically to winner's internal bot balance
                const userData = getUserData(winner.discordId);
                userData.tokens = (userData.tokens || 0) + frenzy.rewardAmount;
                userData.totalTokensEarned = (userData.totalTokensEarned || 0) + frenzy.rewardAmount;
                saveUserData(winner.discordId, userData);

                // Attempt On-Chain Payout if Winner Has Linked Solana Wallet & Active ATA (1+ Tokens)
                const winnerUserData = getUserData(winner.discordId);
                let proofText = '';

                if (!winnerUserData || !winnerUserData.solanaWallet) {
                    proofText = `\n\n💡 **REWARD SAVED IN BALANCE**\nYour **${frenzy.rewardAmount} ${frenzy.rewardToken}** is saved in your bot balance!\nLink your wallet (\`/wallet set <address>\`) & run \`/withdraw\` anytime to claim on-chain.`;
                } else {
                    try {
                        const { sendTokenReward } = require('./solana-payout');
                        const payoutResult = await sendTokenReward(
                            winnerUserData.solanaWallet,
                            frenzy.rewardAmount,
                            process.env.GECKURA_TOKEN_MINT
                        );

                        if (payoutResult.success && payoutResult.explorerUrl) {
                            // Deduct from balance since it was paid out directly on-chain
                            const uData = getUserData(winner.discordId);
                            uData.tokens = Math.max(0, (uData.tokens || 0) - frenzy.rewardAmount);
                            uData.totalWithdrawn = (uData.totalWithdrawn || 0) + frenzy.rewardAmount;
                            saveUserData(winner.discordId, uData);

                            proofText = `\n\n🔗 **ON-CHAIN SOLSCAN PROOF**\n[View Transaction on Solscan](${payoutResult.explorerUrl})\n\`${payoutResult.txSignature}\``;
                        } else if (payoutResult.error === 'NO_ATA_FOUND' || payoutResult.error === 'INSUFFICIENT_ATA_BALANCE') {
                            proofText = `\n\n💡 **REWARD SAVED IN BALANCE (ATA Required)**\nYour **${frenzy.rewardAmount} ${frenzy.rewardToken}** is saved in your balance!\nOnce you hold 1+ tokens & active ATA, run \`/withdraw\` anytime to claim.`;
                        }
                    } catch (payoutErr) {
                        console.error('On-chain payout attempt error:', payoutErr);
                    }
                }

                // Final Winner Embed
                const winnerEmbed = new EmbedBuilder()
                    .setTitle('👑 GECKO FRENZY COMPLETE')
                    .setColor(0xFFD700)
                    .setDescription(
                        `━━━━━━━━━━━━━━━━━━━━\n\n` +
                        `🏆 **WINNER**\n` +
                        `🦎 **${winner.name}** (<@${winner.discordId}>)\n\n` +
                        `🔥 **LAST GECKO STANDING**\n\n` +
                        `💰 **REWARD PAID**\n` +
                        `**${frenzy.rewardAmount.toLocaleString()} ${frenzy.rewardToken}**` +
                        `${proofText}\n\n` +
                        `━━━━━━━━━━━━━━━━━━━━\n` +
                        `Congrats, Gecko!`
                    )
                    .setFooter({ text: 'Geckura Gecko Frenzy — Verified Solana On-Chain Payouts!', iconURL: client.user?.displayAvatarURL() })
                    .setTimestamp();

                await channel.send({ embeds: [winnerEmbed] });

                // Save game history record
                saveHistoryRecord({
                    frenzyId: frenzy.id,
                    creatorId: frenzy.creatorId,
                    startTime: frenzy.startTime,
                    endTime: Date.now(),
                    playersCount: frenzy.players.length,
                    rewardToken: frenzy.rewardToken,
                    rewardAmount: frenzy.rewardAmount,
                    winner: {
                        discordId: winner.discordId,
                        username: winner.username,
                        geckoName: winner.name,
                        wallet: winnerUserData ? winnerUserData.solanaWallet : null
                    },
                    status: 'COMPLETED'
                });

                activeFrenzies.delete(frenzyId);
                return;
            }

            // Pick random event
            const randomEvent = GECKO_EVENTS[Math.floor(Math.random() * GECKO_EVENTS.length)];
            const outcome = randomEvent.execute(aliveGeckos);

            // Process eliminations with 5% Revive / Second Life mechanic
            const actualEliminated = [];
            const revivedPlayers = [];

            if (outcome.eliminated && outcome.eliminated.length > 0) {
                outcome.eliminated.forEach(vict => {
                    const target = frenzy.players.find(p => p.discordId === vict.discordId);
                    if (target) {
                        // 15% Chance to trigger Revive / Second Life (up to maxRevives per game, e.g. 1-2 players in a 10-player lobby)
                        const rollRevive = !target.hasRevived && (frenzy.reviveCount < frenzy.maxRevives) && (Math.random() < 0.15);

                        if (rollRevive) {
                            frenzy.reviveCount++;
                            target.hasRevived = true;
                            target.alive = true;
                            revivedPlayers.push(target);
                        } else {
                            target.alive = false;
                            actualEliminated.push(target);
                            if (!frenzy.eliminated.some(p => p.discordId === target.discordId)) {
                                frenzy.eliminated.push(target);
                            }
                        }
                    }
                });
            }

            let roundLog = outcome.log;
            if (revivedPlayers.length > 0) {
                revivedPlayers.forEach(rev => {
                    roundLog += `\n\n✨ **SECOND LIFE TRIGGERED (5% CHANCE)!**\n` +
                        `🦎 **${rev.name}** (<@${rev.discordId}>) regrew its tail, cheated death, and survived elimination!`;
                });
            }

            const currentAliveCount = frenzy.players.filter(p => p.alive).length;

            // Header prefix based on stage
            const isFinalStage = currentAliveCount <= 3;
            const stageHeader = isFinalStage ? `🔥 **FINAL FRENZY (ROUND ${roundNum})**` : `⚔️ **ROUND ${roundNum}**`;

            const roundEmbed = new EmbedBuilder()
                .setTitle(`${stageHeader} — ${randomEvent.name}`)
                .setColor(revivedPlayers.length > 0 ? 0xFFD700 : (isFinalStage ? 0xFF4500 : 0x00FF99))
                .setDescription(roundLog)
                .addFields(
                    { name: '👥 Remaining Geckos', value: `\`${currentAliveCount} / ${frenzy.players.length}\``, inline: true }
                );

            if (revivedPlayers.length > 0) {
                roundEmbed.addFields({
                    name: '💖 Miracle Revive',
                    value: revivedPlayers.map(r => `✨ **${r.name}** survived via 5% Second Life!`).join('\n'),
                    inline: true
                });
            }

            roundEmbed.setTimestamp();

            await channel.send({ embeds: [roundEmbed] });
            roundNum++;

        }, 6000); // 6-second delay between rounds for viewer suspense
    }
}

const frenzyManager = new FrenzyManager();

module.exports = {
    frenzyManager,
    activeFrenzies
};
