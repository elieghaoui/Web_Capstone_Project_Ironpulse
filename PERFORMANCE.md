# Performance

Measured with **Lighthouse** in Chrome DevTools (Incognito, mode *Navigation*, device *Desktop*) on the production build:
`npm run build` then `npm run preview` in `client/`, the preview address Vite prints (Home page), API running locally.

## Before

| Performance | Accessibility | Best Practices | SEO |
| :-: | :-: | :-: | :-: |
| 99 | 94 | 100 | 91 |

Screenshot: [docs/lighthouse-before.png](docs/lighthouse-before.png)

What Lighthouse flagged:

- **Accessibility:** "Background and foreground colors do not have a sufficient contrast ratio" on `a.btn.btn-primary` (*Join now*) and `a.btn.btn-primary.btn-lg` (*See plans*): white text on `#ff2e4d` is **3.65 : 1**, the minimum is **4.5 : 1**.
- **SEO:** "robots.txt is not valid — 21 errors". There was no `robots.txt`, so the server answered with `index.html`, which crawlers can't read.
- **Performance:** already high, but the whole app (every page) was in a single JavaScript file downloaded on the first visit.

## Fixes

| Problem | Fix | Where |
| --- | --- | --- |
| Low contrast on red buttons | New role token `--brand-strong: #d61f3b` used **only behind white text** (primary buttons, "Most popular" badge, selected chip, trainer initials). White on it is **5.1 : 1**. The bright `--brand` stays for headings, links and glow. | `client/src/styles/global.css` |
| Invalid robots.txt | Added `client/public/robots.txt` (`User-agent: *` / `Allow: /`). Vite copies `public/` into the build unchanged. | `client/public/robots.txt` |
| One big bundle | **Code splitting** with `React.lazy` + `<Suspense>`: every page except Home is loaded only when it is first opened; the existing `Loader` shows meanwhile. Home stays in the main bundle because every visitor lands on it. | `client/src/App.jsx` |
| Queries scanning whole collections | **Mongo indexes** on the fields we filter and sort by (see below). | `server/models/GymClass.js`, `server/models/Booking.js` |

### Code splitting: build output after the fix

```
dist/assets/index-D9M9srYU.js           271.35 kB │ gzip: 86.62 kB   ← main bundle (React, router, Navbar, Home, auth)
dist/assets/Dashboard-F5r5qATN.js         5.03 kB │ gzip:  1.85 kB
dist/assets/TrainerProfile-BoPP21hA.js    3.00 kB │ gzip:  1.46 kB
dist/assets/Classes-BMYHFdwF.js           2.71 kB │ gzip:  1.34 kB
dist/assets/Plans-BxpZn_ZT.js             2.23 kB │ gzip:  1.13 kB
dist/assets/Signup-BxuGVUhx.js            2.21 kB │ gzip:  0.94 kB
dist/assets/Login-BGlzR9YN.js             1.59 kB │ gzip:  0.80 kB
dist/assets/Trainers-D-V4LDOM.js          1.21 kB │ gzip:  0.59 kB
dist/assets/Admin-2-H5hKBr.js             0.70 kB │ gzip:  0.41 kB
dist/assets/utils-CcNYPq9l.js             0.56 kB │ gzip:  0.31 kB   ← shared by several pages
dist/assets/NotFound-BcIAvQut.js          0.42 kB │ gzip:  0.27 kB
dist/assets/useApi-DnT5kJF1.js            0.32 kB │ gzip:  0.24 kB   ← shared by several pages
```

About **19 kB** of page code is no longer part of the first download: a visitor who only views Home never downloads the Dashboard or Admin code. The gain is small today because most of the main bundle is React itself, and it grows as pages (for example the admin panel) get bigger.

### Indexes

| Collection | Index | Used by |
| --- | --- | --- |
| gymclasses | `{ startsAt: 1 }` | `GET /api/classes` (sorted by date) |
| gymclasses | `{ category: 1, startsAt: 1 }` | `GET /api/classes?category=Yoga` |
| bookings | `{ userId: 1, startsAt: 1 }` | a member's own bookings (sorted by date), plan-limit count for the 30-day period |
| bookings | `{ classId: 1, status: 1 }` | "spots left" on each class, "class full" check |

They are created by `npm run seed` (`syncIndexes()`).

## After

| Performance | Accessibility | Best Practices | SEO |
| :-: | :-: | :-: | :-: |
| 99 | **100** | 100 | **100** |

Screenshot: [docs/lighthouse-after.png](docs/lighthouse-after.png)

Accessibility 94 → 100 and SEO 91 → 100. Performance stays at 99: the Home page was already light, and the code-splitting gain shows in the build output above rather than in the score.
