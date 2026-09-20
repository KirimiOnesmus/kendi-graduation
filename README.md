
# Joy-Frida Kendi — Graduation Invitation

A premium digital graduation invitation built with:

- HTML
- Tailwind CSS
- Vanilla JavaScript
- Google Material Symbols (icon set)
- Firebase Firestore for RSVP data
- Firebase Storage for the party-photos gallery and music
- Firebase Hosting

## What's new in this redesign

- **Add to Calendar** — after a guest RSVPs "Yes", they get a circular
  "Add to Calendar" badge plus two buttons: a Google Calendar link and a
  downloadable `.ics` file. The `.ics` file includes a built-in reminder
  set for **one day before** the celebration (works in Apple Calendar,
  Outlook, and most calendar apps that support `.ics` reminders). Google
  Calendar's own link format doesn't accept a custom reminder time, so
  that path relies on the guest's default Google Calendar notification
  settings — the `.ics` download is the reliable way to guarantee the
  day-before nudge.
- **Party photos gallery** — `assets/` no longer holds hardcoded photo
  placeholders. The Gallery section now pulls images live from Firebase
  Storage's `gallery/` folder. Guests can only view and download; only
  you (the admin) can upload, via the Firebase Console or CLI.
- **Background music, low and unobtrusive** — the track fades in over
  ~2 seconds to a low default volume, no more abrupt or loud starts.
- **Mobile menu** — a proper slide-down menu now appears on small
  screens (the old design had no mobile navigation at all).
- **Google Material Symbols** replace every emoji icon throughout the
  site for a more polished, consistent look.
- **A note on the music track** — I can't embed the actual "Said" by
  Nasty C audio file here: I don't have a licensed copy of the song,
  and reproducing commercial music isn't something I can source or
  generate. The player is fully wired up and ready — just drop a
  licensed MP3 (the Nasty C track, or anything else you have the
  rights to use) at `assets/music.mp3` and it will play automatically.

## 1. Preview locally

Because Firebase browser modules work best from a web server, don't rely on
double-clicking index.html.

If Python is installed:

    python -m http.server 8000

Then open:

    http://localhost:8000

## 2. Connect Firebase

Create a Firebase project and register a Web App.

Copy the Firebase config into:

    firebase-config.js

Enable Cloud Firestore and Cloud Storage.

Then publish the included `firestore.rules` and `storage.rules`. 

## 3. Test RSVP

Submit the form with "Yes, I'll be there" selected. RSVP documents will
appear under:

    Firestore Database
      > rsvps

The public website can create RSVP records but cannot read them using the
included rules. On a successful "Yes" RSVP, the guest sees the
"Add to Calendar" panel described above.

## 4. Add WhatsApp number

Open:

    index.html

Find:

    https://wa.me/254700000000

Replace 254700000000 with the host's WhatsApp number, including country code
and without the + sign.

## 5. Add music

Place a **licensed** MP3 at:

    assets/music.mp3

The music control appears after the invitation is opened and fades in to a
low background volume automatically. Any track you have the rights to use
works — it doesn't have to be the Nasty C song.

## 6. Add party photos (admin only)

Guests can browse and download photos, but only you can add them:

1. Open the Firebase Console → Storage.
2. Create/open the `gallery` folder.
3. Upload the day's photos there (any image files).

The website automatically lists everything in `gallery/`, newest first, in
the Gallery section — no code changes needed. Until you upload anything,
guests see a friendly "photos coming soon" placeholder.

## 7. Google Maps

The current button searches for:

    Membley Pavilion E23 Kenya

Replace the link with the exact Google Maps place URL once the venue
location is confirmed.

## 8. Event date, time & calendar reminder

The event date/time and the Google Calendar / `.ics` generation all read
from one place — the `EVENT` object at the top of `app.js`:

    const EVENT = {
      title: "...",
      start: new Date("2026-10-03T13:00:00+03:00"),
      end:   new Date("2026-10-03T16:00:00+03:00"), // assumed 3-hour window
      location: "...",
      description: "..."
    };

If the actual end time differs from the assumed 1:00 PM–4:00 PM window,
update `EVENT.end` — everything else (countdown, calendar files, Google
Calendar link) updates automatically.

## 9. Deploy with Firebase Hosting

Install the Firebase CLI, log in, then from this folder run:

    firebase init hosting

Select the Firebase project and use the current folder as the public root.

Then:

    firebase deploy --only hosting

Firebase Hosting provides an HTTPS URL on a Firebase-managed domain and can
later be connected to a custom domain.

## Important

The Firebase web configuration is not a secret. Do not put a Firebase Admin
SDK/service-account key in this website. Public access is controlled through
Firestore and Storage Security Rules.
