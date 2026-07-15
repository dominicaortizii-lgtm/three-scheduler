const cron = require("node-cron");
const fetch = require("node-fetch");

const EMAIL    = "https://three-email-agent-v2-production.up.railway.app";
const OUTREACH = "https://three-outreach-agent-production.up.railway.app";
const CALENDAR = "https://three-calendar-production.up.railway.app";
const BRIEFING  = "http://three-briefing-agent.railway.internal:8080";
const LINKEDIN  = "http://three-linkedin-agent.railway.internal:8080";
const INSTAGRAM = "http://three-instagram-agent.railway.internal:8080";
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

// Briefing: 7am ET (11 UTC), daily
cron.schedule("0 7 * * *", () => hit("briefing", BRIEFING, "/run-briefing", {}), { timezone: "America/New_York" });

// Email: scan inbox every 2 minutes (24/7 — always on)
cron.schedule("*/2 * * * *", () => hit("email", EMAIL, "/scan-inbox"));

// Outreach batch (deals): weekdays 9am-6pm ET (13-22 UTC)
cron.schedule("0 9-17 * * 1-5", () => hit("outreach-batch", OUTREACH, "/run-batch"), { timezone: "America/New_York" });

// Outreach table: weekdays 9am-6pm ET (13-22 UTC), every hour
cron.schedule("0 9-17 * * 1-5", () => hit("outreach-table", OUTREACH, "/run-outreach-table", { limit: 25 }), { timezone: "America/New_York" });

// Outreach queue: weekdays 9am-6pm ET, every hour at :30
cron.schedule("30 9-17 * * 1-5", () => hit("outreach-queue", OUTREACH, "/run-outreach-queue", { limit: 10 }), { timezone: "America/New_York" });

// LinkedIn + Instagram DMs: paused until Apollo.io integration (July 1)
// Need profile_url field populated — Apollo will provide this on enrichment

// Follow-ups: weekdays 10am ET (14 UTC)
cron.schedule("0 10 * * 1-5", () => hit("followups", OUTREACH, "/run-followups", {}), { timezone: "America/New_York" });

// Social posts: handled internally by three-social-agent (self-schedules 9am + 6pm ET)

// Calendar: check completed meetings every 30 minutes (24/7)
cron.schedule("*/30 * * * *", () => {
  hit("calendar", CALENDAR, "/check-completed-meetings");
  hit("calendar-hb", CALENDAR, "/check-completed-meetings-hb");
});

console.log("[scheduler] Online — email/2min | outreach 9am-6pm ET | followups 10am ET | social 9am+6pm ET | calendar/30min");
