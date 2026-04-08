# Appointment Scheduling

A full-stack appointment scheduling system built with Laravel and React (Inertia.js). Businesses can register, add employees, define services, and let clients book appointments through a public booking page.

## Tech Stack

- **Backend:** PHP 8.3, Laravel 13
- **Frontend:** React 19, Inertia.js, Tailwind CSS
- **Database:** MySQL (or SQLite for local dev)
- **Build:** Vite
- **Exports:** Maatwebsite Excel

## Architecture

The backend follows a **Controller → Service → Repository** pattern with interface-driven design:

```
app/
├── Http/
│   ├── Controllers/        Thin controllers — delegate to services
│   └── Requests/           Custom Form Request validators
├── Services/
│   ├── Interfaces/         Service contracts
│   └── *.php               Business logic implementations
├── Repositories/
│   ├── Interfaces/         Repository contracts
│   └── *.php               Eloquent query implementations
├── Models/                 Eloquent models
└── Providers/
    └── RepositoryServiceProvider.php   Interface → implementation bindings
```

All interfaces are bound to their implementations in `RepositoryServiceProvider` and resolved automatically via constructor injection.

## Prerequisites

- PHP >= 8.3
- Composer
- Node.js >= 18
- MySQL (or use SQLite)

## Setup

```bash
git clone https://github.com/ArditLimani1/appointment-scheduling.git
cd appointment-scheduling

composer install
npm install

cp .env.example .env
php artisan key:generate
php artisan storage:link
```

Configure your database in `.env`:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=appointment_scheduling
DB_USERNAME=root
DB_PASSWORD=
```

Run migrations and seed demo data:

```bash
php artisan migrate
php artisan db:seed
```

Build frontend assets and start the dev server:

```bash
npm run dev
php artisan serve
```

The app will be available at `http://localhost:8000`.

## Demo Accounts

After seeding, the following accounts are available (password: `password`):

| Role     | Email                | Access                          |
|----------|----------------------|---------------------------------|
| Admin    | admin@stratos.com    | Full dashboard, employees, services, appointments, settings |
| Employee | john@stratos.com     | Schedule management, daily appointments |
| Employee | sarah@stratos.com    | Schedule management, daily appointments |
| Employee | marcus@stratos.com   | Schedule management, daily appointments |
| Employee | elena@stratos.com    | Schedule management, daily appointments |

## Public Booking

After seeding, a public booking page is available at `/book/stratos-barbershop` where clients can select a provider, service, date/time, and book an appointment without logging in.

## Key Features

- **Admin Dashboard** — overview of employees, services, upcoming appointments, and revenue
- **Employee Management** — CRUD with service assignment and active/inactive toggle
- **Service Catalog** — define services with duration, pricing, icons, and popularity flags
- **Schedule Builder** — per-employee weekly availability with break periods
- **Public Booking Flow** — multi-step wizard (provider → service → date/time → details)
- **Slot Calculation** — real-time availability based on schedules, breaks, existing bookings, and notice windows
- **Appointment Management** — filter, status transitions, and Excel export
- **Employee Portal** — daily view with status actions (confirm, check-in, complete, cancel)
