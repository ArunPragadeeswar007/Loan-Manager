# Changelog

All notable changes to the **Loan Manager Pro** project will be documented in this file.

---

## [1.0.0] - 2026-06-05

### Initial Stable Release

This release establishes the baseline stable version of **Loan Manager Pro**, a modern, premium web application built using React, TypeScript, and Chakra UI, powered by Supabase. It enables users to securely authenticate, manage their user profiles, and catalog, track, and analyze loan portfolios with real-time runtime calculations.

---

### Key Features

#### 🛡️ Secure Google OAuth Authentication
- Integrated enterprise-grade authentication using **Supabase OAuth** with Google Sign-In.
- Safeguarded routes and secure token handling.
- Seamless automatic database sync creating a relational profile entry for new authenticated users.

#### 👤 Profile Management Dashboard
- Dedicated User Profile page supporting detail customization.
- Ability to view and update full name, synced email, contact number, and external avatar image URLs.
- Dynamic avatar display fallback generating initials in place of missing profile photos.

#### 💼 Loan Cataloging & Tracking (CRUD)
- Complete loan agreement lifecycle tracking: create, read, edit, and delete entries.
- Customizable metadata including:
  - Loan Type (Home, Car, Personal, Insurance, Business, Education, etc.).
  - Interest Type (Fixed vs. Floating) and Rate of Interest (ROI % Annually).
  - Flexible tenure terms.
  - Installment start dates and current statuses (Active, Pending, Paid).
- Smart validations ensuring clean database entries (e.g. positive amounts, non-negative interest rates, and unique loan numbers per user).

#### 🧮 Interactive Runtime Calculations
- Dynamically calculates paid principal and accrued interest at runtime based on the elapsed tenure.
- Smart utility converters integrated directly into the inputs:
  - Automatically translates total tenure months to readable year/month text (e.g., `26 months` to `2 years 2 months`).
  - Spells out numeric rupee values into words under the Indian numbering system (e.g., `500000` to `Five Lakh Rupees Only`).
- Displays live, aggregated portfolio totals on the dashboard dashboard cards.

#### 📱 Complete Responsive Layout Optimization
- Upgraded UI wrapper transitions adapting gracefully between Mobile, Tablet, Laptop, and Monitor screens.
- **Header & Mobile Drawer**: Hides the desktop sidebar on viewports `< 1024px`, replacing it with a sticky header and a sliding navigation menu drawer.
- **Loan Cards View**: Swaps the wide data grid table on smaller screens for a touch-friendly cards list, avoiding horizontal scrolling.
- **Button Stacks**: Reconfigures layout panels and form action buttons to stack vertically on mobile screens for thumb-friendly interaction.

---

### Technical Architecture
- **Front-end**: React 19, TypeScript, Chakra UI v3
- **Styling**: Emotion, Vanilla CSS variables, ambient gradients, and glassmorphic overlays
- **Backend / Database**: Supabase (PostgreSQL database schemas, OAuth authentication, Row-Level Security, Database policies)
- **Bundler / Tooling**: Vite 8, ESLint
