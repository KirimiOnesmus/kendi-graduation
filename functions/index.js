const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

// Fill these in before deploying: firebase deploy --only functions
const TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN";
const TELEGRAM_CHAT_ID = "YOUR_CHAT_ID";
const NOTIFY_EMAIL = "your@email.com";
const APPS_SCRIPT_URL = "";

const configured = (value) =>
  Boolean(value) && !String(value).includes("YOUR_") && value !== "your@email.com";

exports.onRsvpCreated = functions.firestore
  .document("rsvps/{docId}")
  .onCreate(async (snap) => {
    const d = snap.data();
    const attending = d.attendance === "yes";
    const guests = attending ? parseInt(d.guests, 10) : 0;

    await Promise.allSettled([
      configured(TELEGRAM_BOT_TOKEN) && configured(TELEGRAM_CHAT_ID)
        ? sendTelegram(d, attending, guests)
        : Promise.resolve(),
      configured(NOTIFY_EMAIL) ? sendEmail(d, attending, guests) : Promise.resolve(),
      APPS_SCRIPT_URL ? mirrorToSheets(d) : Promise.resolve()
    ]);
  });

async function sendTelegram(d, attending, guests) {
  const lines = [
    `${attending ? "✅" : "❌"} *New RSVP — ${esc(d.name)}*`,
    `📱 ${esc(d.phone)}`,
    attending ? `🎉 Attending — party of ${guests}` : "🙏 Cannot attend",
    d.message ? `💬 "${esc(d.message)}"` : null
  ].filter(Boolean).join("\n");

  await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: lines,
        parse_mode: "MarkdownV2"
      })
    }
  );
}

function esc(text = "") {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

async function sendEmail(d, attending, guests) {
  await admin.firestore().collection("mail").add({
    to: NOTIFY_EMAIL,
    message: {
      subject: `${attending ? "✅" : "❌"} RSVP — ${d.name} (${attending ? `party of ${guests}` : "not attending"})`,
      html: buildEmailHtml(d, attending, guests)
    }
  });
}

function buildEmailHtml(d, attending, guests) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <div style="background:#35105f;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
        <p style="color:#b18a38;font-size:11px;letter-spacing:.2em;text-transform:uppercase;margin:0 0 4px;">
          Graduation RSVP
        </p>
        <h2 style="color:#fff;margin:0;font-size:20px;">
          ${attending ? "✅" : "❌"} ${d.name}
        </h2>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px 0;color:#888;width:120px;">Phone</td>
          <td style="padding:10px 0;font-weight:600;">${d.phone}</td>
        </tr>
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px 0;color:#888;">Attending</td>
          <td style="padding:10px 0;font-weight:600;">${attending ? "Yes" : "No"}</td>
        </tr>
        ${attending ? `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px 0;color:#888;">Guest count</td>
          <td style="padding:10px 0;font-weight:600;">Party of ${guests}</td>
        </tr>` : ""}
        ${d.message ? `
        <tr>
          <td style="padding:10px 0;color:#888;vertical-align:top;">Message</td>
          <td style="padding:10px 0;font-style:italic;">"${d.message}"</td>
        </tr>` : ""}
      </table>
      <p style="margin-top:24px;font-size:12px;color:#aaa;text-align:center;">
        Dr. Joy-Frida Kendi Kirimi · Graduation Celebration · 3 Oct 2026
      </p>
    </div>
  `;
}

async function mirrorToSheets(d) {
  await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(d)
  });
}
