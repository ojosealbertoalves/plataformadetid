const { chromium } = require("playwright");
const path = require("path");

const SHOT_DIR = "C:\\Users\\alves\\AppData\\Local\\Temp\\claude\\C--Users-alves-OneDrive-PROJETOS-plataforma-de-tid\\eaada6cf-2386-4f82-b1be-9d06c1d225b6\\scratchpad";
const BASE = "http://localhost:3000";

function shotPath(name) {
  return path.join(SHOT_DIR, `${name}.png`);
}

async function login(page, login, password) {
  await page.goto(`${BASE}/login`);
  await page.fill("#login", login);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 15000 });
}

async function logout(page) {
  await page.click('button:has-text("Sair")');
  await page.waitForURL(/login/, { timeout: 15000 });
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });

  console.log("1) Login as MKT...");
  await login(page, "MKT", "mudar123");
  await page.screenshot({ path: shotPath("01-dashboard-mkt"), fullPage: true });

  console.log("2) Go to new TID form...");
  await page.goto(`${BASE}/tids/new`);
  await page.waitForSelector("text=Nova TID");

  console.log("3) Select destino...");
  await page.click('button:has-text("Selecione o destino")');
  await page.click("text=COM — Comercial");

  console.log("4) Fill mes referencia...");
  await page.fill('input[type="month"]', "2026-08");

  async function fillByLabel(labelText, value) {
    const label = page.locator(`label:has-text("${labelText}")`).first();
    const container = label.locator("xpath=..");
    const input = container.locator("input, textarea");
    await input.fill(value);
  }

  await fillByLabel("Item", "Combustível caminhão");
  await fillByLabel("Fornecedor", "Posto XYZ");
  await fillByLabel("Doc Fiscal", "NF-12345");
  await fillByLabel("Valor NF", "500");
  await fillByLabel("Valor TID", "500");

  console.log("6) Select Obra UAU...");
  await page.click('button:has-text("Selecione a obra")');
  await page.click("text=194 — Porto Araras I");

  await page.screenshot({ path: shotPath("03-new-tid-filled"), fullPage: true });

  console.log("7) Submit...");
  await page.click('button:has-text("Enviar TID")');
  await page.waitForURL(/\/tids\/[a-z0-9]+$/i, { timeout: 15000 });
  await page.screenshot({ path: shotPath("04-tid-detail"), fullPage: true });

  const tidUrl = page.url();
  console.log("Created TID at", tidUrl);

  console.log("8) Logout, login as COM...");
  await logout(page);
  await login(page, "COM", "mudar123");
  await page.goto(`${BASE}/inbox`);
  await page.waitForSelector("text=Caixa de Entrada");
  await page.screenshot({ path: shotPath("05-inbox-com"), fullPage: true });

  console.log("9) Approve first pending TID...");
  await page.click('button:has-text("Aprovar")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: shotPath("06-inbox-after-approve"), fullPage: true });

  console.log("10) Logout, login as admin...");
  await logout(page);
  await login(page, "admin", "mudar123");
  await page.waitForURL(/admin\/summary/, { timeout: 15000 });
  await page.screenshot({ path: shotPath("07-admin-summary"), fullPage: true });

  console.log("11) Click a non-zero cell for drilldown...");
  const cells = page.locator("td.cursor-pointer");
  const count = await cells.count();
  let clicked = false;
  for (let i = 0; i < count; i++) {
    const text = await cells.nth(i).innerText();
    if (text.trim() !== "—") {
      await cells.nth(i).click();
      clicked = true;
      break;
    }
  }
  if (clicked) {
    await page.waitForTimeout(1000);
    await page.screenshot({ path: shotPath("08-admin-drilldown"), fullPage: true });
  } else {
    console.log("No non-zero cell found to click");
  }

  console.log("12) Check audit page...");
  await page.goto(`${BASE}/admin/audit`);
  await page.waitForSelector("text=Auditoria");
  await page.screenshot({ path: shotPath("09-admin-audit"), fullPage: true });

  console.log("13) Check assistant page (should show not-configured)...");
  await page.goto(`${BASE}/admin/assistant`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: shotPath("10-admin-assistant"), fullPage: true });

  console.log("\n=== Console/page errors ===");
  console.log(errors.length ? errors.join("\n") : "(none)");

  await browser.close();
})().catch(async (err) => {
  console.error("SMOKE TEST FAILED:", err);
  process.exit(1);
});
