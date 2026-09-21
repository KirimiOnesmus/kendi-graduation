'use strict';

require('dotenv').config();

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

admin.initializeApp();

function env(name) {
  return String(process.env[name] || '').trim();
}

function required(name) {
  const value = env(name);
  return value && !value.startsWith('YOUR_') ? value : '';
}

exports.onRsvpCreated = onDocumentCreated('rsvps/{docId}', async (event) => {
  const d = event.data.data();
  const attending = d.attendance === 'yes';
  const guests = attending ? parseInt(d.guests, 10) : 0;

  const jobs = [
    ['telegram', sendTelegram(d, attending, guests)],
    ['email', sendEmail(d, attending, guests)],
    ['sheets', mirrorToSheets(d, attending, guests)]
  ];

  const results = await Promise.allSettled(jobs.map((job) => job[1]));
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`${jobs[index][0]} failed:`, result.reason);
    }
  });
});

async function sendTelegram(d, attending, guests) {
  const token = required('TELEGRAM_BOT_TOKEN');
  const chatId = required('TELEGRAM_CHAT_ID');
  if (!token || !chatId) {
    throw new Error('Telegram skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing in functions/.env');
  }

  const lines = [
    `${attending ? '✅' : '❌'} *New RSVP — ${esc(d.name)}*`,
    `📱 ${esc(d.phone)}`,
    attending ? `🎉 Attending — party of ${guests}` : '🙏 Cannot attend',
    d.message ? `💬 "${esc(d.message)}"` : null
  ].filter(Boolean).join('\n');

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: lines,
      parse_mode: 'MarkdownV2'
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram HTTP ${res.status}: ${body}`);
  }
}

function esc(text = '') {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

async function sendEmail(d, attending, guests) {
  const user = required('GMAIL_USER');
  const pass = required('GMAIL_APP_PASSWORD').replace(/\s/g, '');
  const to = required('NOTIFY_EMAIL') || user;

  if (!user || !pass) {
    throw new Error('Email skipped: set GMAIL_USER and GMAIL_APP_PASSWORD in functions/.env (Gmail App Password, not your normal password)');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });

  await transporter.sendMail({
    from: `"Kendi Graduation RSVP" <${user}>`,
    to,
    subject: `${attending ? '✅' : '❌'} RSVP — ${d.name} (${attending ? `party of ${guests}` : 'not attending'})`,
    html: buildEmailHtml(d, attending, guests)
  });
}

function buildEmailHtml(d, attending, guests) {
  const safe = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <div style="background:#35105f;border-radius:12px;padding:20px 24px;margin-bottom:20px;">
        <p style="color:#b18a38;font-size:11px;letter-spacing:.2em;text-transform:uppercase;margin:0 0 4px;">
          Graduation RSVP
        </p>
        <h2 style="color:#fff;margin:0;font-size:20px;">
          ${attending ? '✅' : '❌'} ${safe(d.name)}
        </h2>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px 0;color:#888;width:120px;">Phone</td>
          <td style="padding:10px 0;font-weight:600;">${safe(d.phone)}</td>
        </tr>
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px 0;color:#888;">Attending</td>
          <td style="padding:10px 0;font-weight:600;">${attending ? 'Yes' : 'No'}</td>
        </tr>
        ${attending ? `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px 0;color:#888;">Guest count</td>
          <td style="padding:10px 0;font-weight:600;">Party of ${safe(guests)}</td>
        </tr>` : ''}
        ${d.message ? `
        <tr>
          <td style="padding:10px 0;color:#888;vertical-align:top;">Message</td>
          <td style="padding:10px 0;font-style:italic;">"${safe(d.message)}"</td>
        </tr>` : ''}
      </table>
      <p style="margin-top:24px;font-size:12px;color:#aaa;text-align:center;">
        Dr. Joy-Frida Kendi Kirimi · Graduation Celebration · 3 Oct 2026
      </p>
    </div>
  `;
}

async function mirrorToSheets(d, attending, guests) {
  const url = required('APPS_SCRIPT_URL');
  if (!url) {
    throw new Error('Sheets skipped: APPS_SCRIPT_URL missing in functions/.env (use the Apps Script web app /exec URL, not the spreadsheet link)');
  }
  if (!url.includes('script.google.com')) {
    throw new Error('Sheets skipped: APPS_SCRIPT_URL must look like https://script.google.com/macros/s/.../exec');
  }

  const payload = {
    name: d.name,
    phone: d.phone,
    attendance: d.attendance,
    guests: attending ? String(guests) : '0',
    message: d.message || '',
    submittedAt: new Date().toISOString()
  };

  await postKeepingBody(url, payload);
}

async function postKeepingBody(url, payload) {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'manual'
  };

  let res = await fetch(url, options);
  const location = res.headers.get('location');
  if (location && (res.status === 301 || res.status === 302 || res.status === 303 || res.status === 307 || res.status === 308)) {
    res = await fetch(location, options);
  }

  if (!res.ok && res.status !== 302) {
    const body = await res.text();
    throw new Error(`Sheets HTTP ${res.status}: ${body}`);
  }
}
