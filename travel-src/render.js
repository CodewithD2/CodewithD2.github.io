// Optional: printable cards (needs Playwright). Renders each phrase as a 1080x1350 card PNG + a printable A4 PDF (4 cards per page).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'cards.json'), 'utf8'));
const outDir = path.join(__dirname, 'cards');
fs.mkdirSync(outDir, { recursive: true });

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function cardHTML(c, item, n, total) {
  return `
  <div class="card" style="--c:${c.color}">
    <div class="top"><span class="chip">${esc(c.cat)}</span><span class="num">${n} / ${total}</span></div>
    <div class="pic"><span class="${[...new Intl.Segmenter().segment(item.e)].length > 1 ? 'multi' : ''}">${item.e}</span></div>
    <div class="en" dir="ltr">${esc(item.en).replace(/-/g, '\u2011')}</div>
    <div class="pr"><span class="lbl">🔊 تتنطق:</span> ${esc(item.pr)}</div>
    <div class="ar">${esc(item.ar)}</div>${item.re ? `<div class="re"><div class="lbl">💬 ممكن تردّي:</div>${item.re.map(([en, pr]) => `<div class="opt"><b dir="ltr">${esc(en)}</b><span>${esc(pr)}</span></div>`).join('')}</div>` : ''}
  </div>`;
}

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Cairo', 'Noto Color Emoji', sans-serif; background: #fff; }
  .card { width: 1080px; height: 1350px; padding: 60px; direction: rtl;
    background: linear-gradient(180deg, color-mix(in srgb, var(--c) 14%, #fff) 0%, #fff 55%);
    border-top: 26px solid var(--c); display: flex; flex-direction: column; align-items: center; }
  .top { width: 100%; display: flex; justify-content: space-between; align-items: center; }
  .chip { background: var(--c); color: #fff; font-weight: 700; font-size: 40px; padding: 6px 36px; border-radius: 60px; }
  .num { color: #8a8f98; font-size: 32px; font-weight: 700; direction: ltr; }
  .pic { width: 460px; height: 460px; margin: 50px 0 40px; border-radius: 50%;
    background: #fff; box-shadow: 0 12px 40px color-mix(in srgb, var(--c) 30%, transparent);
    border: 10px solid color-mix(in srgb, var(--c) 35%, #fff);
    display: flex; align-items: center; justify-content: center; }
  .pic span { font-family: 'Noto Color Emoji'; font-size: 230px; line-height: 1; white-space: nowrap; }
  .pic span.multi { font-size: 150px; }
  .en { font-family: 'DejaVu Sans', sans-serif; font-weight: 700; font-size: 76px; line-height: 1.15;
    color: #1b1f27; text-align: center; max-width: 960px; }
  .pr { margin-top: 30px; font-size: 46px; font-weight: 700; color: var(--c); text-align: center;
    background: color-mix(in srgb, var(--c) 10%, #fff); border-radius: 24px; padding: 8px 34px; }
  .pr .lbl { color: #6b7280; font-weight: 400; font-size: 36px; }
  .re { margin-top: 18px; font-size: 38px; font-weight: 700; color: #fff; background: var(--c); border-radius: 22px; padding: 10px 40px 16px; text-align: center; width: 100%; line-height: 1.5; }
  .re .lbl { font-weight: 400; font-size: 30px; opacity: .85; }
  .re .opt { display: flex; justify-content: center; gap: 24px; align-items: baseline; }
  .re .opt b { font-family: 'DejaVu Sans', sans-serif; }
  .re .opt span { opacity: .9; font-size: 34px; }
  .ar { margin-top: auto; width: 100%; font-size: 66px; font-weight: 900; color: #1b1f27; text-align: center;
    border-top: 4px dashed color-mix(in srgb, var(--c) 40%, #fff); padding-top: 26px; }
`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  const all = [];
  data.forEach(c => c.items.forEach(item => all.push({ c, item })));
  let n = 0;
  for (const { c, item } of all) {
    n++;
    await page.setContent(`<html><head><style>${css}</style></head><body>${cardHTML(c, item, n, all.length)}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    // shrink the English line if it wraps beyond 2 lines
    await page.evaluate(() => {
      const el = document.querySelector('.en'); let s = 76;
      while (el.scrollHeight > 190 && s > 44) { s -= 4; el.style.fontSize = s + 'px'; }
      const ar = document.querySelector('.ar'); ar.style.whiteSpace = 'nowrap'; let a = 66;
      while (ar.scrollWidth > ar.clientWidth && a > 40) { a -= 2; ar.style.fontSize = a + 'px'; }
      if (ar.scrollWidth > ar.clientWidth) ar.style.whiteSpace = 'normal';
    });
    const name = String(n).padStart(2, '0') + '-' + item.en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';
    await page.screenshot({ path: path.join(outDir, name) });
  }

  // Printable PDF: 4 cards per A4 page, scaled down
  const pages = [];
  for (let i = 0; i < all.length; i += 4) pages.push(all.slice(i, i + 4));
  const pdfHTML = `<html><head><style>${css}
    @page { size: A4; margin: 8mm; }
    .sheet { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; page-break-after: always; }
    .cell { width: 95mm; height: 118.75mm; overflow: hidden; border: 1px dashed #bbb; border-radius: 4mm; }
    .cell .card { transform: scale(${(95 / 25.4 * 96 / 1080).toFixed(4)}); transform-origin: top left; }
  </style></head><body>${pages.map(p => `<div class="sheet">${p.map(({ c, item }) => `<div class="cell">${cardHTML(c, item, all.indexOf(all.find(a => a.item === item)) + 1, all.length)}</div>`).join('')}</div>`).join('')}</body></html>`;
  await page.setContent(pdfHTML);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: path.join(__dirname, 'travel-cards-print.pdf'), format: 'A4', printBackground: true });
  await browser.close();
  console.log('cards:', all.length);
})();
