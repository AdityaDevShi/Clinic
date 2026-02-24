const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/app/**/page.tsx');
for (let file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Remove imports
    content = content.replace(/import Header from ['"]@\/components\/layout\/Header['"];?\n?/g, '');
    content = content.replace(/import Footer from ['"]@\/components\/layout\/Footer['"];?\n?/g, '');

    // Remove components
    content = content.replace(/[ \t]*<Header \/>\n?/g, '');
    content = content.replace(/[ \t]*<Footer \/>\n?/g, '');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Updated: ' + file);
    }
}
