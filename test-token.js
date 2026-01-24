require("dotenv").config();
const token = process.env.DISCORD_TOKEN;

// Discord tokens have a specific format
// They should start with "M" (for MFA) or "N" (for non-MFA)
// And contain specific patterns

console.log("Token:", token);
console.log("Token starts with M:", token.startsWith("M"));
console.log("Token starts with N:", token.startsWith("N"));

// Check if the token contains the expected number of dots
const parts = token.split(".");
console.log("Token parts:", parts.length);
console.log("Part 1 length:", parts[0] ? parts[0].length : "undefined");
console.log("Part 2 length:", parts[1] ? parts[1].length : "undefined");
console.log("Part 3 length:", parts[2] ? parts[2].length : "undefined");
