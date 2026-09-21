
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

let db = null;

(async function connectFirebase() {
  try {
    const { firebaseConfig } = await import("./firebase-config.js");
    const firebaseIsConfigured =
      firebaseConfig &&
      firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.appId &&
      !String(firebaseConfig.apiKey).includes("YOUR_");

    if (!firebaseIsConfigured) return;

    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
})();


const GALLERY_ALBUM_LINK = "https://photos.app.goo.gl/REPLACE_ME";
const galleryAlbumLink = document.getElementById("gallery-album-link");
if (galleryAlbumLink) {
  if (GALLERY_ALBUM_LINK.includes("REPLACE_ME")) {
    galleryAlbumLink.hidden = true;
  } else {
    galleryAlbumLink.href = GALLERY_ALBUM_LINK;
  }
}


const EVENT = {
  title: "Dr. Joy-Frida Kendi Kirimi's Graduation Celebration",
  start: new Date("2026-10-03T13:00:00+03:00"),
  end: new Date("2026-10-03T16:00:00+03:00"),
  location: "Membley Pavilion E23, Kenya",
  description: "Join us as we celebrate Dr. Joy-Frida Kendi Kirimi's Pharmacy graduation from USIU-Africa."
};



const openingGlow = document.getElementById("opening-glow");

(function spawnSparkles() {
  if (!openingGlow) return;
  const count = 16;
  for (let i = 0; i < count; i++) {
    const dot = document.createElement("span");
    dot.className = "sparkle";
    dot.style.left = `${Math.random() * 100}%`;
    dot.style.animationDuration = `${5 + Math.random() * 4}s`;
    dot.style.animationDelay = `${Math.random() * 6}s`;
    openingGlow.appendChild(dot);
  }
})();


/*
   MOBILE MENU
 */
const menuToggle = document.getElementById("menu-toggle");
const menuIcon = document.getElementById("menu-icon");
const mobileNav = document.getElementById("mobile-nav");

function closeMobileNav() {
  mobileNav.classList.remove("open");
  mobileNav.setAttribute("aria-hidden", "true");
  menuToggle.setAttribute("aria-expanded", "false");
  menuIcon.textContent = "menu";
}

menuToggle.addEventListener("click", () => {
  const isOpen = mobileNav.classList.toggle("open");
  mobileNav.setAttribute("aria-hidden", String(!isOpen));
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuIcon.textContent = isOpen ? "close" : "menu";
});

mobileNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", closeMobileNav);
});


/* 
   COUNTDOWN
*/
const eventDate = EVENT.start.getTime();

function updateCountdown() {
  const distance = eventDate - Date.now();

  if (distance <= 0) {
    document.getElementById("countdown-grid").innerHTML = `
      <div class="col-span-full py-8 text-center">
        <span class="material-symbols-outlined icon-fill" style="font-size:3rem;">celebration</span>
        <p class="mt-4 font-display text-4xl">Today is the celebration!</p>
      </div>
    `;
    return;
  }

  const days = Math.floor(distance / 86400000);
  const hours = Math.floor((distance / 3600000) % 24);
  const minutes = Math.floor((distance / 60000) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  document.getElementById("days").textContent = String(days).padStart(2, "0");
  document.getElementById("hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
setInterval(updateCountdown, 1000);


/* 
   SCROLL REVEAL
  */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

function observeReveals(root = document) {
  root.querySelectorAll(".reveal:not(.visible), .reveal-up:not(.visible)").forEach(el => {
    revealObserver.observe(el);
  });
}

observeReveals();


/* 
   LIGHTBOX (delegated so it works for dynamically loaded photos)
    */
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxClose = document.getElementById("lightbox-close");
const lightboxDownload = document.getElementById("lightbox-download");

document.getElementById("photos-grid")?.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

document.getElementById("photos-grid")?.addEventListener("dragstart", (event) => {
  event.preventDefault();
});

function closeLightbox() {
  lightbox.classList.add("hidden");
  lightbox.classList.remove("flex");
  document.body.style.overflow = "";
}

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-gallery]");
  if (!trigger) return;

  const imagePath = trigger.dataset.gallery;
  if (!imagePath) return;

  lightboxImage.src = imagePath;
  lightboxDownload.href = trigger.dataset.download || imagePath;
  lightboxDownload.setAttribute("download", trigger.dataset.filename || "");
  lightbox.classList.remove("hidden");
  lightbox.classList.add("flex");
  document.body.style.overflow = "hidden";
});
lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});


async function downloadImage(url, filename) {
  try {
    const response = await fetch(url, { mode: "cors" });
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename || "photo.jpg";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.warn("Direct download blocked, opening photo in a new tab instead.", error);
    window.open(url, "_blank", "noopener");
  }
}

document.querySelectorAll("[data-download-file]").forEach((button) => {
  button.addEventListener("click", () => {
    downloadImage(button.dataset.downloadFile, button.dataset.filename || "invitation.jpg");
  });
});


function drawMemoryPath() {
  const map = document.querySelector(".memory-map");
  const svg = document.getElementById("memory-path");
  if (!map || !svg) return;

  const width = map.clientWidth;
  const height = map.clientHeight;
  if (width < 40 || height < 40) return;

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));

  const mapBox = map.getBoundingClientRect();
  const pointFor = (selector) => {
    const host = map.querySelector(selector);
    if (!host) return null;
    const node = host.matches("[data-node]") ? host : host.querySelector("[data-node]");
    const el = node || host;
    const box = el.getBoundingClientRect();
    return {
      x: box.left - mapBox.left + box.width / 2,
      y: box.top - mapBox.top + box.height / 2
    };
  };

  const curve = (from, to, sway) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = -dy / dist;
    const ny = dx / dist;
    const bulge = dist * 0.38 * sway;
    const c1x = from.x + dx * 0.28 + nx * bulge;
    const c1y = from.y + dy * 0.18 + ny * bulge;
    const c2x = from.x + dx * 0.72 - nx * bulge * 0.7;
    const c2y = from.y + dy * 0.82 - ny * bulge * 0.7;
    return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
  };

  const links = [
    [".m1", ".m2", 1],
    [".m1", ".m3", -1],
    [".m3", ".m4", 1],
    [".m4", ".m5", -1],
    [".m5", ".next-memory", 1]
  ];

  svg.innerHTML = links.map(([start, end, sway], index) => {
    const a = pointFor(start);
    const b = pointFor(end);
    if (!a || !b) return "";
    const bend = index % 2 === 0 ? sway : -sway;
    return `<path d="${curve(a, b, bend)}" />`;
  }).join("");
}

const memoryMap = document.querySelector(".memory-map");
if (memoryMap) {
  const redraw = () => requestAnimationFrame(drawMemoryPath);
  window.addEventListener("resize", redraw);
  window.addEventListener("load", redraw);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
  Array.from(memoryMap.querySelectorAll("img")).forEach((img) => {
    if (!img.complete) img.addEventListener("load", redraw, { once: true });
  });
  redraw();
}


/*
   RSVP FORM
 */
const rsvpForm = document.getElementById("rsvp-form");
const rsvpStatus = document.getElementById("rsvp-status");
const rsvpSubmit = document.getElementById("rsvp-submit");
const rsvpSuccess = document.getElementById("rsvp-success");
const successName = document.getElementById("success-name");

rsvpForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const attendance = rsvpForm.querySelector('input[name="attendance"]:checked')?.value;
  const guests = rsvpForm.querySelector('input[name="guests"]:checked')?.value || "1";

  const data = {
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    attendance,
    guests: attendance === "no" ? "0" : guests,
    message: document.getElementById("message").value.trim(),
    submittedAt: serverTimestamp(),
    event: "Dr. Joy-Frida Kendi Kirimi Graduation Celebration 2026"
  };

  if (!data.name || !data.phone) {
    rsvpStatus.textContent = "Please enter your name and phone number.";
    return;
  }

  if (!data.attendance) {
    rsvpStatus.textContent = "Please tell us whether you can join.";
    return;
  }

  if (!db) {
    rsvpStatus.innerHTML =
      "The RSVP form is designed and ready. Firebase is not connected yet add your Firebase configuration in <strong>firebase-config.js</strong>.";
    return;
  }

  try {
    rsvpSubmit.disabled = true;
    rsvpSubmit.textContent = "Sending…";
    rsvpStatus.textContent = "";

    await addDoc(collection(db, "rsvps"), data);

    if (data.attendance === "yes") {
      showRsvpSuccess(data.name);
    } else {
      rsvpForm.reset();
      rsvpStatus.textContent = "Thank you for letting us know, you'll be missed!";
      rsvpSubmit.disabled = false;
      rsvpSubmit.textContent = "Send RSVP";
    }
  } catch (error) {
    console.error(error);
    rsvpStatus.textContent =
      "We couldn't submit your RSVP. Please try again or use WhatsApp below.";
    rsvpSubmit.disabled = false;
    rsvpSubmit.textContent = "Send RSVP";
  }
});

function showRsvpSuccess(name) {
  rsvpForm.classList.add("hidden");
  successName.textContent = name ? `, ${name.split(" ")[0]}` : "";
  rsvpSuccess.classList.remove("hidden");
  observeReveals(rsvpSuccess);
  document.getElementById("google-calendar-link").href = buildGoogleCalendarUrl();

  try {
    localStorage.setItem("kendiRsvpYes", "1");
    localStorage.setItem("kendiRsvpName", name || "");
  } catch (error) {
    /* localStorage unavailable — calendar buttons still work this session */
  }
}


(function restoreReturningGuest() {
  let alreadyRsvpd = false;
  let savedName = "";
  try {
    alreadyRsvpd = localStorage.getItem("kendiRsvpYes") === "1";
    savedName = localStorage.getItem("kendiRsvpName") || "";
  } catch (error) {
    return;
  }
  if (alreadyRsvpd) {
    showRsvpSuccess(savedName);
    rsvpStatus.textContent = "";
  }
})();


/* 
   ADD TO CALENDAR
   */
function toUtcStamp(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function buildGoogleCalendarUrl() {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: EVENT.title,
    dates: `${toUtcStamp(EVENT.start)}/${toUtcStamp(EVENT.end)}`,
    details: EVENT.description,
    location: EVENT.location
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildIcsFile() {
  const uid = `kendi-graduation-${Date.now()}@kendi.invite`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dr. Joy-Frida Kendi Kirimi//Graduation Celebration//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(EVENT.start)}`,
    `DTEND:${toUtcStamp(EVENT.end)}`,
    `SUMMARY:${EVENT.title}`,
    `DESCRIPTION:${EVENT.description}`,
    `LOCATION:${EVENT.location}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder — Dr. Joy's graduation celebration is tomorrow!",
    "TRIGGER:-P1D",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ];
  return lines.join("\r\n");
}

document.getElementById("google-calendar-link")?.addEventListener("click", (event) => {
  event.currentTarget.href = buildGoogleCalendarUrl();
});

function downloadIcs() {
  const blob = new Blob([buildIcsFile()], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "joy-frida-graduation.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const googleCalendarUrl = buildGoogleCalendarUrl();
document.querySelectorAll("[data-google-calendar]").forEach((link) => {
  link.href = googleCalendarUrl;
});
document.querySelectorAll("[data-download-ics]").forEach((button) => {
  button.addEventListener("click", downloadIcs);
});
document.getElementById("calendar-badge-trigger")?.addEventListener("click", downloadIcs);


document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.getAttribute("data-copy");
    const action = button.querySelector(".copy-action");
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      const input = document.createElement("textarea");
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    button.classList.add("copied");
    if (action) action.textContent = "Copied";
    setTimeout(() => {
      button.classList.remove("copied");
      if (action) action.textContent = "Copy";
    }, 1800);
  });
});

const guestFieldset = document.getElementById("guest-fieldset");
rsvpForm?.querySelectorAll('input[name="attendance"]').forEach((input) => {
  input.addEventListener("change", () => {
    if (!guestFieldset) return;
    guestFieldset.hidden = input.value === "no" && input.checked;
  });
});


/* 
   BACKGROUND MUSIC  */
const musicToggle = document.getElementById("music-toggle");
const musicIcon = document.getElementById("music-icon");
const TARGET_VOLUME = 0.16;
let audio = null;
let fadeInterval = null;

function fadeTo(target, durationMs = 2200) {
  if (!audio) return;
  clearInterval(fadeInterval);
  const steps = 30;
  const stepTime = durationMs / steps;
  const startVolume = audio.volume;
  const delta = (target - startVolume) / steps;
  let step = 0;

  fadeInterval = setInterval(() => {
    step++;
    audio.volume = Math.min(1, Math.max(0, startVolume + delta * step));
    if (step >= steps) clearInterval(fadeInterval);
  }, stepTime);
}

function startMusicIfAvailable() {
  if (!audio) {
    audio = new Audio("assets/music.mp3");
    audio.loop = true;
    audio.volume = 0;

    audio.addEventListener("error", () => {
      musicToggle.classList.add("hidden");
    });
  }

  audio.play()
    .then(() => {
      fadeTo(TARGET_VOLUME);
      musicToggle.classList.remove("hidden");
      musicToggle.classList.add("flex", "playing");
      musicIcon.textContent = "music_note";
    })
    .catch(() => {

      musicToggle.classList.remove("hidden");
      musicToggle.classList.add("flex");
    });
}

musicToggle.addEventListener("click", async () => {
  if (!audio) {
    startMusicIfAvailable();
    return;
  }

  if (audio.paused) {
    audio.volume = 0;
    await audio.play();
    fadeTo(TARGET_VOLUME);
    musicToggle.classList.add("playing");
    musicIcon.textContent = "music_note";
  } else {
    clearInterval(fadeInterval);
    audio.pause();
    musicToggle.classList.remove("playing");
    musicIcon.textContent = "volume_off";
  }
});

window.addEventListener("invitation-opened", startMusicIfAvailable);
if (window.__invitationOpened) startMusicIfAvailable();
