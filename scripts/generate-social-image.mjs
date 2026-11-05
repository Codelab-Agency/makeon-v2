import fs from 'node:fs';
import sharp from 'sharp';

const logo = fs.readFileSync('public/images/makeon-logo.svg', 'utf8')
  .replace('<svg ', '<svg x="66" y="60" width="130" height="130" ');
const wordmark = '<g fill="none" stroke="#faf9f6" stroke-width="5.5" stroke-linejoin="miter" transform="translate(236 101) scale(.8)"><path d="M4 49V4h2l23 29L52 4h2v45M96 49l23-45h2l23 45M185 4v45m0-19 40-26m-23 15 26 30M307 4h-40v45h40m-40-23h37M438 49V4h2l39 45h2V4"/><ellipse cx="371" cy="26.5" rx="24" ry="23"/></g>';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#25231f"/><rect width="1200" height="8" fill="#b89a64"/>
${logo}${wordmark}
<text x="72" y="320" fill="#faf9f6" font-family="Georgia,serif" font-size="68">Pauza de cafea.</text>
<text x="72" y="405" fill="#faf9f6" font-family="Georgia,serif" font-size="68">Pauza de hidratare.</text>
<path d="M72 465h1056" stroke="#b89a64" stroke-opacity=".45"/>
<text x="72" y="533" fill="#d8d4ca" font-family="Arial,sans-serif" font-size="25">Cafea proaspăt prăjită · Espressoare · Apă filtrată</text>
<text x="72" y="576" fill="#b89a64" font-family="Arial,sans-serif" font-size="22">makeon.ro</text></svg>`;
await sharp(Buffer.from(svg)).png().toFile('public/images/makeon-social.png');
console.log('Created 1200 × 630 social preview.');
