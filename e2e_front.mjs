import { chromium } from "playwright";

const BASE = process.env.E2E_BASE ?? "http://localhost:5173";
const failures = [];
const results = [];

async function step(name, fn) {
  try {
    await fn();
    results.push(`[OK ] ${name}`);
  } catch (e) {
    failures.push(`${name} :: ${e.message.split("\n")[0]}`);
    results.push(`[FAIL] ${name} :: ${e.message.split("\n")[0]}`);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage();
const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));

await step("open app", () => page.goto(BASE, { waitUntil: "networkidle" }));
await step("redirect to /login when unauth", async () => {
  await page.waitForURL("**/login", { timeout: 5000 });
});

// Login as superadmin
await step("login form visible", () => page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 }));
await step("fill login", async () => {
  const emailInput = await page.$('input[type="email"], input[name="email"]');
  await emailInput.fill("superadmin@caspex.local");
  const passInput = await page.$('input[type="password"]');
  await passInput.fill("ChangeMeSuperAdmin_123");
  await Promise.all([
    page.waitForURL((u) => u.pathname === "/" || u.pathname.startsWith("/dashboard"), { timeout: 10000 }),
    page.click('button[type="submit"]'),
  ]);
});

// Dashboard
await step("dashboard renders", async () => {
  await page.waitForSelector("text=Dashboard", { timeout: 5000 });
});

// Orders
await step("navigate to /orders", () => page.click('a[href="/orders"]'));
await step("orders page renders", async () => {
  await page.waitForURL("**/orders", { timeout: 5000 });
  await page.waitForSelector("text=Orders", { timeout: 8000 });
});

// Map
await step("navigate to /map", () => page.click('a[href="/map"]'));
await step("map page renders", async () => {
  await page.waitForURL("**/map", { timeout: 5000 });
  await page.waitForSelector(".leaflet-container", { timeout: 8000 });
});

// Devices
await step("navigate to /devices", () => page.click('a[href="/devices"]'));
await step("devices page renders", async () => {
  await page.waitForURL("**/devices", { timeout: 5000 });
  await page.waitForSelector("text=Devices", { timeout: 8000 });
});
await step("device card or empty state shown", async () => {
  await page.waitForFunction(() => {
    const body = document.body.innerText;
    return body.includes("Devices") && (body.includes("Add device") || body.includes("No devices yet"));
  }, { timeout: 8000 });
});

// Alerts
await step("navigate to /alerts", () => page.click('a[href="/alerts"]'));
await step("alerts page renders", async () => {
  await page.waitForURL("**/alerts", { timeout: 5000 });
  await page.waitForSelector("text=Alerts", { timeout: 8000 });
});
await step("alerts tab content", async () => {
  await page.waitForFunction(() => document.body.innerText.includes("Rules"), { timeout: 8000 });
});

// Predictions
await step("navigate to /predictions", () => page.click('a[href="/predictions"]'));
await step("predictions page renders", async () => {
  await page.waitForURL("**/predictions", { timeout: 5000 });
  await page.waitForSelector("text=Predictions", { timeout: 8000 });
});

// Admin
await step("navigate to /admin", () => page.click('a[href="/admin"]'));
await step("admin page renders (users tab)", async () => {
  await page.waitForURL("**/admin", { timeout: 5000 });
  await page.waitForFunction(() => document.body.innerText.includes("Users"), { timeout: 8000 });
});
await step("admin carriers tab", async () => {
  await page.click('button:has-text("Carriers")');
  await page.waitForFunction(() => document.body.innerText.includes("Approve"), { timeout: 8000 });
});

await browser.close();

console.log("\n=== FRONTEND BROWSER E2E ===");
results.forEach((r) => console.log(r));
console.log("console errors:", consoleErrors.length);
consoleErrors.slice(0, 5).forEach((e) => console.log("  !", e.slice(0, 160)));
console.log(`\nFAILURES: ${failures.length}`);
if (failures.length) process.exit(1);