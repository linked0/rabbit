
const fs = require('fs');
const path = require('path');

const indexContent = fs.readFileSync('index.html', 'utf8');

// Generic Header/Footer (simplified extraction)
const headerEndIndex = indexContent.indexOf('<div id="content">');
const footerStartIndex = indexContent.indexOf('<footer>');

const headPart = indexContent.substring(0, headerEndIndex + '<div id="content">'.length)
    .replace('href="images/', 'href="../images/') // Fix favicon
    .replace('href="https', 'HREF_HTTPS_PLACEHOLDER') // Protect absolute
    .replace('href="', 'href="../') // Shift relative
    .replace('HREF_HTTPS_PLACEHOLDER', 'href="https') // Restore absolute
    // Fix search input path? JS logic might break if we don't adjust but for static page it's ok.
    // The JS at bottom checks 'card', so it works.
    ;

const footerPart = indexContent.substring(footerStartIndex)
    .replace('href="https', 'HREF_HTTPS_PLACEHOLDER')
    .replace('href="', 'href="../')
    .replace('HREF_HTTPS_PLACEHOLDER', 'href="https');

const sectionRegex = /<div class="section">\s*<h2 class="section-title">(.*?)<\/h2>[\s\S]*?<div class="grid">([\s\S]*?)<\/div>\s*<\/div>/g;

let match;
const sections = [];

while ((match = sectionRegex.exec(indexContent)) !== null) {
    sections.push({
        title: match[1],
        content: match[0]
    });
}

const fileMap = {
    'Knowledge Base & Root': 'knowledge.html',
    'External Resources': 'external.html',
    'English Learning & Corrections': 'english.html',
    'Nostra - Core': 'nostra.html',
    'Designs & Visuals': 'designs.html',
    'Dev Logs': 'devlogs.html'
};

if (!fs.existsSync('sections')) {
    fs.mkdirSync('sections');
}

sections.forEach(section => {
    // Determine filename
    let filename = 'other.html';
    for (const [key, val] of Object.entries(fileMap)) {
        if (section.title.includes(key)) filename = val;
    }

    // Adjust links in content
    const adjustedContent = section.content
        .replace(/href="https/g, 'HREF_HTTPS_PLACEHOLDER')
        .replace(/href="/g, 'href="../')
        .replace(/HREF_HTTPS_PLACEHOLDER/g, 'href="https');

    // Create full HTML
    const fullHtml = `
${headPart}
    <div style="margin-bottom: 20px;">
        <a href="../index.html" style="color: var(--accent); text-decoration: none; font-weight: 500;">&larr; Back to Index</a>
    </div>

    ${adjustedContent}

    <!-- Add logic for empty state if needed, though search JS handles it -->
    <div id="no-results" class="empty-state">
        No matching files found.
    </div>

${footerPart}
`;

    fs.writeFileSync(path.join('sections', filename), fullHtml);
    console.log(`Created sections/${filename}`);
});
