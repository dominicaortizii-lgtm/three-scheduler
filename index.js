const cron = require("node-cron");
const fetch = require("node-fetch");

const EMAIL    = "https://three-email-agent-v2-production.up.railway.app";
const OUTREACH = "https://three-outreach-agent-production.up.railway.app";
const CALENDAR = "https://three-calendar-production.up.railway.app";

async function hit(name, url, path, body = {}) {
  try {
    const r = await fetch(url + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      timeout: 55000
    });
    console.log(`[${new Date().toISOString()}] ${name} ${path} → ${r.status}`);
  } catch(e) {
    console.error(`[${new Date().toISOString()}] ${name} ${path} FAILED: ${e.message}`);
  }
}

// Email: scan inbox every 2 minutes
cron.schedule("*/2 * * * *", () => hit("email", EMAIL, "/scan-inbox"));

// Outreach batch (deals): every 6 hours
cron.schedule("0 */6 * * *", () => hit("outreach", OUTREACH, "/run-batch"));

// Outreach table: weekdays 9am-5pm EST (2pm-10pm UTC), every hour
cron.schedule("0 14-22 * * 1-5", () => hit("outreach-table", OUTREACH, "/run-outreach-table", { limit: 25 }));

// Calendar: check completed meetings every 30 minutes
cron.schedule("*/30 * * * *", () => { hit("calendar", CALENDAR, "/check-completed-meetings"); hit("calendar-hb", CALENDAR, "/check-completed-meetings-hb"); });

console.log("[scheduler] Online — email/2min | outreach/6h | outreach-table/1h-weekdays | calendar/30min");
