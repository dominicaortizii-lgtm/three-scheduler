const cron = require("node-cron");
const fetch = require("node-fetch");

const EMAIL    = "https://three-email-agent-v2-production.up.railway.app";
const OUTREACH = "https://three-outreach-agent-production.up.railway.app";
const CALENDAR = "https://three-calendar-production.up.railway.app";
const SOCIAL   = "https://three-social-agent-production.up.railway.app";

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

// Email: scan inbox every 2 minutes (24/7 — always on)
cron.schedule("*/2 * * * *", () => hit("email", EMAIL, "/scan-inbox"));

// Outreach batch (deals): weekdays 9am-6pm ET (13-22 UTC)
cron.schedule("0 13-22 * * 1-5", () => hit("outreach-batch", OUTREACH, "/run-batch"));

// Outreach table: weekdays 9am-6pm ET (13-22 UTC), every hour
cron.schedule("0 13-22 * * 1-5", () => hit("outreach-table", OUTREACH, "/run-outreach-table", { limit: 25 }));

// Outreach queue: weekdays 9am-6pm ET, every hour at :30
cron.schedule("30 13-22 * * 1-5", () => hit("outreach-queue", OUTREACH, "/run-outreach-queue", { limit: 10 }));

// Follow-ups: weekdays 10am ET (14 UTC)
cron.schedule("0 14 * * 1-5", () => hit("followups", OUTREACH, "/run-followups", {}));

// Social posts: 9am ET (13 UTC) + 6pm ET (22 UTC), weekdays
cron.schedule("0 13 * * 1-5", () => hit("social-morning", SOCIAL, "/post", {}));
cron.schedule("0 22 * * 1-5", () => hit("social-evening", SOCIAL, "/post", {}));

// Calendar: check completed meetings every 30 minutes (24/7)
cron.schedule("*/30 * * * *", () => {
  hit("calendar", CALENDAR, "/check-completed-meetings");
  hit("calendar-hb", CALENDAR, "/check-completed-meetings-hb");
});

console.log("[scheduler] Online — email/2min | outreach 9am-6pm ET | followups 10am ET | social 9am+6pm ET | calendar/30min");
