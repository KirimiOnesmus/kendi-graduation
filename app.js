
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  listAll,
  getDownloadURL,
  getMetadata
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-storage.js";

import { firebaseConfig } from "./firebase-config.js";


let db = null;
let storage = null;

const firebaseIsConfigured =
  firebaseConfig &&
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId &&
  !firebaseConfig.apiKey.includes("YOUR_");

if (firebaseIsConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}


const EVENT = {
  title: "Joy-Frida Kendi's Graduation Celebration",
  
  start: new Date("2026-10-03T13:00:00+03:00"),
  end: new Date("2026-10-03T16:00:00+03:00"),
  location: "Membley Pavilion E23, Kenya",
  description: "Join us as we celebrate Joy-Frida Kendi's Pharmacy graduation from USIU-Africa."
};



const openingScreen = document.getElementById("opening-screen");
const openingGlow = document.getElementById("opening-glow");
const site = document.getElementById("site");
const envelope = document.getElementById("envelope");
const openButton = document.getElementById("open-invitation");
const nav = document.getElementById("nav");

(function spawnSparkles() {
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

openButton.addEventListener("click", () => {
  envelope.classList.add("open");
  openButton.disabled = true;
  openButton.textContent = "Opening…";

  setTimeout(() => {
    openingScreen.classList.add("opening-fade");
    site.classList.remove("site-hidden");
    site.classList.add("site-visible");
    nav.classList.remove("-translate-y-full");

    setTimeout(() => openingScreen.remove(), 950);
    startMusicIfAvailable();
  }, 1250);
});


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

document.getElementById("photos-grid").addEventListener("click", (event) => {
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

function closeLightbox() {
  lightbox.classList.add("hidden");
  lightbox.classList.remove("flex");
  document.body.style.overflow = "";
}

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});


/* 
   PARTY PHOTOS 
 */
const photosGrid = document.getElementById("photos-grid");
const photosState = document.getElementById("photos-state");

function setPhotosState(mode) {
  if (mode === "loading") {
    photosState.innerHTML = `<div class="spin-loader"></div><p class="text-sm">Loading party photos…</p>`;
    photosState.classList.remove("hidden");
  } else if (mode === "empty") {
    photosState.innerHTML = `
      <span class="material-symbols-outlined">photo_camera</span>
      <p class="text-sm">Party photos will appear here after the celebration.<br>Check back soon!</p>
    `;
    photosState.classList.remove("hidden");
  } else if (mode === "offline") {
    photosState.innerHTML = `
      <span class="material-symbols-outlined">cloud_off</span>
      <p class="text-sm">The photo gallery isn't connected yet — add your Firebase configuration in <strong>firebase-config.js</strong>.</p>
    `;
    photosState.classList.remove("hidden");
  } else {
    photosState.classList.add("hidden");
  }
}

function buildPhotoCard({ url, name }) {
  const card = document.createElement("div");
  card.className = "photo-card reveal";

  card.innerHTML = `
    <span class="tape"></span>
    <button class="photo-open" data-gallery="${url}" data-download="${url}" data-filename="${name}" aria-label="Open photo">
      <img src="${url}" alt="Graduation celebration photo" loading="lazy">
    </button>
    <button class="photo-download" type="button" aria-label="Download photo">
      <span class="material-symbols-outlined">download</span>
    </button>
  `;

  card.querySelector(".photo-download").addEventListener("click", () => downloadImage(url, name));

  return card;
}

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

async function loadGallery() {
  if (!storage) {
    setPhotosState("offline");
    return;
  }

  setPhotosState("loading");

  try {
    const galleryRef = ref(storage, "gallery");
    const result = await listAll(galleryRef);

    if (result.items.length === 0) {
      setPhotosState("empty");
      return;
    }

    const photos = await Promise.all(result.items.map(async (item) => {
      const [url, metadata] = await Promise.all([
        getDownloadURL(item),
        getMetadata(item).catch(() => null)
      ]);
      return {
        url,
        name: item.name,
        time: metadata?.timeCreated ? new Date(metadata.timeCreated).getTime() : 0
      };
    }));

    photos.sort((a, b) => b.time - a.time);

    const fragment = document.createDocumentFragment();
    photos.forEach(photo => fragment.appendChild(buildPhotoCard(photo)));
    photosGrid.appendChild(fragment);

    setPhotosState("none");
    observeReveals(photosGrid);
  } catch (error) {
    console.error("Could not load party photos:", error);
    setPhotosState("empty");
  }
}

loadGallery();


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

  const data = {
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    attendance: document.getElementById("attendance").value,
    guests: document.getElementById("guests").value,
    message: document.getElementById("message").value.trim(),
    submittedAt: serverTimestamp(),
    event: "Joy-Frida Kendi Graduation Celebration 2026"
  };

  if (!data.name || !data.phone) {
    rsvpStatus.textContent = "Please enter your name and phone number.";
    return;
  }

  if (!db) {
    rsvpStatus.innerHTML =
      "The RSVP form is designed and ready. Firebase is not connected yet — add your Firebase configuration in <strong>firebase-config.js</strong>.";
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
      rsvpStatus.textContent = "Thank you for letting us know — you'll be missed!";
      rsvpSubmit.disabled = false;
      rsvpSubmit.textContent = "Confirm Attendance";
    }
  } catch (error) {
    console.error(error);
    rsvpStatus.textContent =
      "We couldn't submit your RSVP. Please try again or use WhatsApp below.";
    rsvpSubmit.disabled = false;
    rsvpSubmit.textContent = "Confirm Attendance";
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
    "PRODID:-//Joy-Frida Kendi//Graduation Celebration//EN",
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
    "DESCRIPTION:Reminder — Joy-Frida's graduation celebration is tomorrow!",
    "TRIGGER:-P1D",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ];
  return lines.join("\r\n");
}

document.getElementById("google-calendar-link").addEventListener("click", (event) => {
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

document.getElementById("download-ics").addEventListener("click", downloadIcs);
document.getElementById("calendar-badge-trigger").addEventListener("click", downloadIcs);


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
      // Autoplay blocked — reveal the toggle so the guest can start it manually.
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
