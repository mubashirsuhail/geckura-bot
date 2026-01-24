require("dotenv").config();
const token = process.env.DISCORD_TOKEN;

// Check for any hidden characters
console.log("Raw token:", JSON.stringify(token));
console.log("Token length:", token.length);

// Check character codes
for (let i = 0; i < Math.min(10, token.length); i++) {
    console.log(`Char at position ${i}: "${token[i]}" (code: ${token.charCodeAt(i)})`);
}

// Try to decode the token
try {
    const decoded = Buffer.from(token.split(".")[0], "base64").toString();
    console.log("First part decoded:", decoded);
} catch (e) {
    console.error("Error decoding first part:", e.message);
}
