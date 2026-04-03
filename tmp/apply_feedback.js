const fs = require('fs');
const path = require('path');

const fbFile = path.join(__dirname, '../monolith/src/pages/FeedbackAnalysisPage.tsx');
let fbContent = fs.readFileSync(fbFile, 'utf8');

// Replace mockFeed with feedItems
fbContent = fbContent.replace(/const mockFeed = \[([\s\S]*?)\];/g, 'const feedItems: any[] = [];');

// Rename state feedbackItems to feedItems
fbContent = fbContent.replace(/feedbackItems/g, 'feedItems');
fbContent = fbContent.replace(/setFeedbackItems/g, 'setFeedItems');
// Since `mockFeed` is changed to `feedItems`, we might also need to find where `setFeedItems(mockFeed)` was:
fbContent = fbContent.replace(/setFeedItems\(mockFeed\)/g, 'setFeedItems(feedItems)');

// Add empty state for Recent Feed
// Where is Recent Feed rendered? I'll look for `feedItems.map` or `Recent Feed`
if (fbContent.includes('Recent Feed')) {
    // Find the container below 'Recent Feed'
    // Likely `<div className="space-y-4">` or `<div className="space-y-0">` below the h3
    // E.g. <h3 ...>Recent Feed</h3> ... <div className="..."> {feedItems.map...
    const recentFeedRegex = /(<h3[^>]*>[\s\S]*?Recent Feed[\s\S]*?<\/h3>\s*<div[^>]*>)\s*\{feedItems\.map/m;
    if (recentFeedRegex.test(fbContent)) {
        fbContent = fbContent.replace(
            recentFeedRegex,
            `$1\n            {feedItems.length === 0 && (
  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center mt-4 mb-4">
    <p className="text-white/60">Awaiting Data Stream.</p>
    <p className="text-white/40 text-sm mt-1">Upload a CSV to view insights.</p>
  </div>
)}\n            {feedItems.map`
        );
    } else {
        // Fallback: search for feedItems.map
        fbContent = fbContent.replace(
            /\{feedItems\.map/,
            `{feedItems.length === 0 && (
  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center mb-6">
    <p className="text-white/60">Awaiting Data Stream.</p>
    <p className="text-white/40 text-sm mt-1">Upload a CSV to view insights.</p>
  </div>
)}\n            {feedItems.map`
        );
    }
} else {
    // If "Recent Feed" text doesn't exist, search for feedItems.map
    fbContent = fbContent.replace(
        /\{feedItems\.map/,
        `{feedItems.length === 0 && (
  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 text-center mb-6">
    <p className="text-white/60">Awaiting Data Stream.</p>
    <p className="text-white/40 text-sm mt-1">Upload a CSV to view insights.</p>
  </div>
)}\n            {feedItems.map`
    );
}

fs.writeFileSync(fbFile, fbContent, 'utf8');
console.log('FeedbackAnalysisPage successfully updated.');
