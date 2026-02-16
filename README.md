Savannah Fitness Exchange SaaS

A modern gym management system built with React, Supabase, and Tailwind CSS.

## 🚀 Features

- 🔐 Supabase Authentication (Role-Based Login)
- 👥 Member Management
- 💳 Payment Tracking & Revenue Monitoring
- 📅 Attendance System (Daily Check-ins)
- 📊 Reports Dashboard
- 🧾 Membership Plans Management
- 🔄 Automated Membership Renewal Logic
- 🎨 Branded Black, Orange & White UI
- 📱 Mobile Responsive Design

---

## 🛠 Tech Stack

Frontend:
- React (Vite)
- Tailwind CSS
- React Router

Backend:
- Supabase (Auth + Database)

Database:
- PostgreSQL (via Supabase)

---

## 🗂 Database Schema

Main tables:
- profiles (linked to auth.users)
- membership_plans
- memberships
- payments
- attendance

---

## 🔐 Authentication & Roles

Roles supported:
- admin
- staff
- member

Profiles table references `auth.users` for secure login handling.


