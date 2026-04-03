const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../monolith/src', process.argv[2]);
let content = fs.readFileSync(file, 'utf8');

const classesToAdd = "backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/20 active:scale-95 duration-200";

// Replace <button className="...">
content = content.replace(/<(motion\.)?button([^>]*?)className=["']([^"']*)["']([^>]*)>/g, (match, m1, p1, p2, p3) => {
    if (p2.includes("backdrop-blur-md")) return match;
    const tag = m1 ? `<${m1}button` : `<button`;
    return `${tag}${p1}className="${p2} ${classesToAdd}"${p3}>`;
});

// For buttons that use className={cn(...)} or dynamic expressions.
// There are generally several cases:
// 1. className={cn("string", ...)}
content = content.replace(/<(motion\.)?button([^>]*?)className=\{\s*cn\(\s*["']([^"']*)["']([^)]*)\)\s*\}([^>]*)>/g, (match, m1, p1, p2, p3, p4) => {
    if (p2.includes("backdrop-blur-md")) return match;
    const tag = m1 ? `<${m1}button` : `<button`;
    return `${tag}${p1}className={cn("${p2} ${classesToAdd}"${p3})}${p4}>`;
});

// 2. className={`string ...`}
content = content.replace(/<(motion\.)?button([^>]*?)className=\{\s*`([^`]*)`\s*\}([^>]*)>/g, (match, m1, p1, p2, p3) => {
    if (p2.includes("backdrop-blur-md")) return match;
    const tag = m1 ? `<${m1}button` : `<button`;
    return `${tag}${p1}className={\`${p2} ${classesToAdd}\`}${p3}>`;
});

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated buttons in EmailAnalysisPage.tsx');
