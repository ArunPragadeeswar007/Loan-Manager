# Changelog

All notable changes to the **Loan Manager Pro** project will be documented in this file.

---

## [1.1.0] - 2026-06-10

### New Amortization Analytics, Expandable Popups & Visual Refinements

This release focuses on making your loan calculations easier to visualize and manage. We have introduced a dedicated loans listing dashboard, beautiful interactive graphs, a detailed month-by-month repayment table, and a fullscreen modal zoom to comfortably inspect your payments.

---

### New Features

#### 📊 My Loans Dashboard
- **All Loans in One Place**: A brand new dedicated dashboard listing all your loans in premium cards with custom colors.
- **Repayment Summary**: A portfolio bar showing the total outstanding amount you owe across all active loans.
- **Search & Filter**: Find loans instantly using search queries, status filter tags (Active, Pending, Paid), or sorting (by Amount or Tenure).

#### 📈 Interactive Charts & Financial Cards
- **Repayment Progress Ring**: An animated ring showing the exact percentage of the loan you have paid off.
- **Principal vs. Interest Split**: A donut chart showing how much of your total payments go toward principal vs. interest.
- **Interactive Amortization Graph**: A stacked bar chart showing the breakdown of principal and interest for each month of your loan.
- **Smart Insights**: Automatically computes outstanding balance, early closure savings, interest remaining, and projected payoff dates.

#### 🎛️ Chart/Table Toggle & Fullscreen Popup
- **Chart or Table View**: Switch between the visual bar graph and a detailed monthly grid view with a simple toggle button.
- **Fullscreen Popup Modal**: Open the amortization schedule in a large dialog popup with sticky headers for convenient tracking.
- **Current Month Highlight**: The active billing month is clearly highlighted in the chart (with a gold border) and in the table (with a highlighted row) to track where you stand.

---

### Bug Fixes & Adjustments

- **Fixed "Invisible Save Button"**: Resolved a mobile layout issue where the "Save/Update Loan" button was cut off or hidden, making it always visible at the bottom of the form.
- **Fixed "Database Error" when saving new loans**: Fixed an issue where manual signups occasionally failed to link user profiles, preventing new loans from being saved.
- **Clean Sidebar Layout**: Organized sidebar pages into a clean, simple order (Dashboard, Loans, Profile) and removed the redundant "What's New" menu button.
- **Layout & Sizing Fixes**: Fixed an issue where long-term amortization charts could stretch and break page sizing.

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
