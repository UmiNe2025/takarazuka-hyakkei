/* QA capture script — full-page JA/EN/mobile screenshots + interaction checks.
   Run: node shoot.mjs  (requires: npm i playwright-core, Microsoft Edge installed) */
import { chromium } from "playwright-core";

const BASE = "http://127.0.0.1:8123/";
const errors = [];

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

await page.goto(BASE, { waitUntil: "networkidle" });
const revealAll = () => page.evaluate(() => {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
  document.getElementById("overture").classList.add("is-open");
});
await revealAll();
await page.waitForTimeout(1200);
await page.screenshot({ path: "full-ja.png", fullPage: true });

// interactions: map pin
await page.click('[data-spot="dahlia"]');
await page.waitForTimeout(300);
const cardTitle = await page.locator("#mc-title .ja").innerText();
console.log("map card after pin click:", cardTitle);
await page.locator("#map").screenshot({ path: "map-ja.png" });

// filter check
await page.fill("#views-search", "温泉");
await page.waitForTimeout(200);
const onsenCount = await page.locator("#views-grid .view-card:visible").count();
console.log("search '温泉' visible cards:", onsenCount);
await page.fill("#views-search", "");
await page.click('#views-filters .chip[data-cat="temple"]');
await page.waitForTimeout(200);
const templeCount = await page.locator("#views-grid .view-card:visible").count();
console.log("filter 'temple' visible cards:", templeCount);
await page.click('#views-filters .chip[data-cat="all"]');

// EN version
await page.click("#btn-en");
await page.waitForTimeout(600);
await revealAll();
await page.screenshot({ path: "full-en.png", fullPage: true });

// mobile JA
const mpage = await browser.newPage({ viewport: { width: 390, height: 844 } });
mpage.on("pageerror", (e) => errors.push("mobile pageerror: " + e.message));
await mpage.goto(BASE, { waitUntil: "networkidle" });
await mpage.evaluate(() => {
  localStorage.setItem("tkz-lang", "ja");
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
});
await mpage.reload({ waitUntil: "networkidle" });
await mpage.evaluate(() => {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
  document.getElementById("overture").classList.add("is-open");
});
await mpage.waitForTimeout(1000);
await mpage.screenshot({ path: "full-mobile.png", fullPage: true });

console.log("errors:", errors.length ? errors : "none");
await browser.close();
