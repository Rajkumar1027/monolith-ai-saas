const fs = require('fs');
const path = require('path');

const emailFile = path.join(__dirname, '../monolith/src/pages/EmailAnalysisPage.tsx');
let emailContent = fs.readFileSync(emailFile, 'utf8');

const generateBtnRegex = /<motion\.button[^>]*>[\s\S]*?(?:GENERATE|Generate)[^<]*<\/motion\.button>/gi;
const match = emailContent.match(generateBtnRegex);
console.log("Generate Button Matches:");
console.log(match);

const threadPaddingRegex = /className="[^"]*p-6 gap-4[^"]*"/g;
const paddingMatch = emailContent.match(threadPaddingRegex);
console.log("\nThread Padding Matches:");
console.log(paddingMatch);

console.log("\nDummy Array text excerpt:");
console.log(emailContent.substring(0, 500));
