require("dotenv").config();
console.log("DISCORD_TOKEN:", process.env.DISCORD_TOKEN);
console.log("Token length:", process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.length : "undefined");