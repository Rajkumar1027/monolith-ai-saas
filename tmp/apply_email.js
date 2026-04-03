const fs = require('fs');
const path = require('path');

const emailFile = path.join(__dirname, '../monolith/src/pages/EmailAnalysisPage.tsx');
let content = fs.readFileSync(emailFile, 'utf8');

// The user said: "className="...bg-white..."" for the button
// Replace it:
content = content.replace(
  /className="group relative flex items-center gap-3 px-[0-9]+ py-[0-9]+ bg-white text-black[^"]*"/,
  'className="backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 transition-all duration-200 rounded-full px-6 py-3 text-white disabled:opacity-30 disabled:cursor-not-allowed"'
);

// Find thread container padding to reduce
content = content.replace(/p-6 gap-4/g, 'p-3 gap-2');
// If "p-6 gap-4" isn't exactly that, maybe it's `p-6 space-y-4`? The user said 'p-6 gap-4'. Let's replace 'p-6 space-y-4' to 'p-3 gap-2' if the first fails.
if (!content.includes('p-3 gap-2')) {
    content = content.replace(/p-6 space-y-4/g, 'p-3 gap-2'); // line 1508 had space-y-4
    if (!content.includes('p-3 gap-2')) {
        // Try searching for p-6 in conversation thread
        content = content.replace(/bg-white\/5 p-6 border border-white\/10 space-y-4/, 'bg-white/5 p-3 gap-2 flex flex-col border border-white/10');
    }
}

// Dummy data replacement
// Replace initialEmails = [ ... ]; with const emails: any[] = [];
content = content.replace(/const initialEmails = \[([\s\S]*?)\];/m, 'const emails: any[] = [];');

// Replace emailList with emails
content = content.replace(/emailList/g, 'emails');
content = content.replace(/setEmailList/g, 'setEmails');
// Also change the useState initialization to use 'emails'
content = content.replace(/useState\(initialEmails\)/g, 'useState(emails)');

// Add empty state when emails array is empty. Insert this after the `<section className="space-y-8">` which holds the table mapping.
// Actually, let's insert it right above the `overflow-x-auto` table.
// Find: `<div className="overflow-x-auto">`
const insertPoint = `<div className="overflow-x-auto">`;
const emptyState = `{emails.length === 0 && (
  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center mb-8">
    <p className="text-white/60 text-lg">No active email stream.</p>
    <p className="text-white/40 text-sm mt-2">Connect your Gmail to begin analysis.</p>
  </div>
)}`;
content = content.replace(insertPoint, emptyState + '\n        ' + insertPoint);

// Update selectedEmail useState to prevent crash
content = content.replace(
  /const \[selectedEmail, setSelectedEmail\] = useState\(initialEmails\[[0-9]+\]\);/,
  `const [selectedEmail, setSelectedEmail] = useState<any>({
  id: 0,
  threadId: '',
  sender: 'System',
  subject: 'No Emails Found',
  time: '',
  sentiment: 'Neutral',
  content: 'Connect your Gmail to begin analysis.',
  read: true,
  labels: []
});`
);

fs.writeFileSync(emailFile, content, 'utf8');
console.log('EmailAnalysisPage successfully updated.');
