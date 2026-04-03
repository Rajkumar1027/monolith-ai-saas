const fs = require('fs');
const path = require('path');

const emailFile = path.join(__dirname, '../monolith/src/pages/EmailAnalysisPage.tsx');
let emailContent = fs.readFileSync(emailFile, 'utf8');

const match = emailContent.match(/<motion\.button[^>]*>[\s\S]*?(?:GENERATE|Generate)[^<]*<\/motion\.button>/gi);
const paddingMatch = emailContent.match(/className="[^"]*p-6 gap-4[^"]*"/g);

const result = { match, paddingMatch };
fs.writeFileSync(path.join(__dirname, 'analyze_result.json'), JSON.stringify(result, null, 2));
