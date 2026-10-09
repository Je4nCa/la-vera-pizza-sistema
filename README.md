<div align="center">

# 🍕 La Vera Pizza — Real-Time POS

**A custom point-of-sale for a Costa Rican pizzeria: cash register, tables and kitchen working in sync, in real time.**

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)

</div>

---

## Overview

La Vera Pizza needed the register, the dining room and the kitchen to stop relying on paper tickets.
This system replaces them with a web POS where every sale reaches the kitchen screen instantly and the
owner gets live numbers for the day.

It is used daily by the restaurant's staff and is built, designed and maintained by me end to end — including
the brand's visual identity.

## Features

| Area | What it does |
|---|---|
| **New sale** | Pizzas by size, half-and-half (charged at the pricier flavor), discounts, customer and table assignment, split bills |
| **Payments** | Cash, card and SINPE Móvil; printable customer and kitchen tickets for thermal printers |
| **Kitchen display** | Live order queue that moves *received → preparing → in the oven → delivered*, with a sound alert for new orders |
| **Tables** | Occupy and release tables and see how long each one has been in use |
| **Dashboard** | Today's sales, revenue, VAT, monthly total, sales by hour, best-selling products, per-cashier stats |
| **Reports & closing** | Date-range reports with charts, per-cashier filters and shift cash-register closing |
| **Catalog & customers** | Products with per-size pricing and categories; customer directory |
| **Customer screen** | Photo carousel for a second, customer-facing display |
| **Access control** | Google sign-in with an email allow-list and a cashier picker per shift |

## Architecture

```
React (Vite) ──► Zustand stores (cart, cashier, UI)
     │
     └─► Repositories ──► Firestore (real-time listeners)
                              ▲
     Kitchen display ─────────┘  same collections, live updates
```

- **Repository pattern** over Firestore, scoped to a single restaurant (`household`) id.
- **Real-time hooks** (`useCollection`) keep every screen in sync without refreshes.
- **Persisted cart** so a sale survives a reload mid-order.
- Deployed to **GitHub Pages** by a GitHub Actions workflow on every push to `main`.

## Getting started

```bash
npm install
cp .env.example .env     # add your Firebase web config, restaurant id and allowed emails
npm run dev              # http://localhost:5173
npm run build            # type-check + production build
```

| Variable | Purpose |
|---|---|
| `VITE_FIREBASE_*` | Firebase web app configuration |
| `VITE_HOUSEHOLD_ID` | Restaurant id every collection is scoped to |
| `VITE_ALLOWED_EMAILS` | Comma-separated Google accounts allowed to sign in |

## Project structure

```
src/
├── pages/          one file per screen (NuevaVenta, PantallaCocina, Dashboard, Reportes…)
├── components/     layout, sidebar, toasts and UI primitives
├── repositories/   Firestore data access, one repository per collection
├── store/          Zustand stores (cart, cashier, UI)
├── hooks/          real-time Firestore hooks
└── lib/            Firebase setup, order numbering, sounds, images, demo data
POSLaVeraPizza.html legacy single-file prototype (v2.0, localStorage)
```

## Author

**Jean Carlo Villamonte Murillo** — Software Developer · Costa Rica
[Portfolio](https://je4nca.github.io/personal-portfolio/) · [LinkedIn](https://www.linkedin.com/in/jcvillamonte) · [montevostudio.com](https://montevostudio.com)
