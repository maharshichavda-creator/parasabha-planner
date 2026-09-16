# Parasabha Planner

A full‑stack web app for managing the **weekly Parasabha schedule**: which Mandal
(local satsang group) hosts a Parasabha on which weekday, and which Sant Mandal
(Swami/Swamis) leads it. Seeded from the original `Parasabha_Planner.xlsx` schedule.

## Tech stack

| Layer     | Technology                                              |
|-----------|----------------------------------------------------------|
| Frontend  | Angular 22 (standalone components) + Angular Material    |
| Backend   | Spring Boot 3.5 (Java 21), Spring Data JPA, Bean Validation |
| Database  | PostgreSQL                                                |

## Project structure

```
parasabha-planner/
├── backend/    Spring Boot REST API (Maven, mvnw wrapper included)
├── frontend/   Angular app (Angular CLI, npm)
└── docker-compose.yml   Optional local PostgreSQL container
```

## Data model

- **Mandal** – a local group/venue (`name`, `pr` flag for priority/"PR" mandals).
- **Swami** – a Sant who can lead a Parasabha (`name`).
- **ScheduleEntry** – the recurring template: a `Weekday`
  (`MONDAY`…`SATURDAY`, plus `PRS` for the special group not tied to one day)
  + a `Mandal`. This does **not** carry a default Swami — it only defines which
  Mandal meets on which weekday, every week.
- **SwamiVisit** – a planned visit of one or more `Swami`s to a `ScheduleEntry`
  on one specific calendar date. This is what actually drives which Swami(s)
  show up in the weekly view for a given week. A slot with no `SwamiVisit` for
  the displayed week shows blank — nothing is assumed or carried over from
  other weeks.

On first startup (only if the schedule table is empty) the backend seeds the
database with the Mandal/Weekday template and Swami roster from
`Parasabha_Planner.xlsx` — see
[`ScheduleDataSeeder`](backend/src/main/java/com/parasabha/planner/seed/ScheduleDataSeeder.java).
No Swami visits are seeded; those start blank until planned.

## Prerequisites

- JDK 21+
- Node.js 20+ and npm
- A PostgreSQL 14+ server (local install **or** Docker)

## 1. Database setup

**Option A — use your own local PostgreSQL** (what this project is configured for
by default): create a database and point the backend at it via env vars (see
below). By default the backend expects:
- host `localhost`, port `1522` (adjust `DB_PORT` if yours is on `5432`)
- database `parasabha_planner`
- user `postgres` / password (set via `DB_PASSWORD`)

```powershell
# create the database once, e.g. with psql or any GUI client
createdb -h localhost -p 1522 -U postgres parasabha_planner
```

**Option B — Docker Compose** (spins up Postgres on port 5432 with
db/user/password all `parasabha`):

```powershell
docker compose up -d
```

If you use Option B, override the connection env vars when running the backend
(`DB_PORT=5432`, `DB_USERNAME=parasabha`, `DB_PASSWORD=parasabha`).

Connection settings can be overridden with environment variables (see
[`application.properties`](backend/src/main/resources/application.properties)):
`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `SERVER_PORT`.

## 2. Run the backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The API starts on **http://localhost:8080**. Key endpoints:

| Method | Path                          | Description                                   |
|--------|-------------------------------|-------------------------------------------------|
| GET    | `/api/schedule/weekly?weekStart=YYYY-MM-DD` | Weekly grid for the week containing that date (defaults to the current week), with Swamis populated only where planned |
| GET    | `/api/schedule`               | Flat list of recurring schedule entries (Mandal + Weekday, no Swamis) |
| POST   | `/api/schedule`                | Create an entry `{ weekday, mandalId }`         |
| PUT    | `/api/schedule/{id}`           | Update an entry                                 |
| DELETE | `/api/schedule/{id}`           | Delete an entry (and any planned visits for it)  |
| GET    | `/api/swami-visits?weekStart=YYYY-MM-DD` | Planned visits for the week containing that date |
| POST   | `/api/swami-visits`            | Plan/update a visit `{ scheduleEntryId, visitDate, swamiIds[] }` (upserts by entry+date) |
| PUT    | `/api/swami-visits/{id}`       | Update a planned visit                          |
| DELETE | `/api/swami-visits/{id}`       | Clear a planned visit (slot goes back to blank) |
| GET/POST/PUT/DELETE | `/api/mandals`, `/api/mandals/{id}` | Mandal CRUD |
| GET/POST/PUT/DELETE | `/api/swamis`, `/api/swamis/{id}`   | Swami CRUD  |

## 3. Run the frontend

```powershell
cd frontend
npm install   # first time only
npm start     # ng serve, http://localhost:4200
```

The app talks to the API at `http://localhost:8080/api` in development
(see [`environment.ts`](frontend/src/environments/environment.ts)).

### Pages

- **Weekly Schedule** (`/weekly`) – read‑only weekly grid, grouped Mon→Sat + PRS,
  with Previous/Next/Today navigation showing the calendar date range for the
  displayed week. Swamis only appear for slots explicitly planned for that week.
- **Manage Schedule** (`/schedule-entries`) – CRUD for the recurring Mandal +
  Weekday template.
- **Plan Swami Visits** (`/plan-visits`) – pick a week (same Previous/Next/Today
  navigation) and assign which Swami(s), if any, visit each Mandal that week.
  Clearing a plan returns the slot to blank for that week.
- **Mandals** (`/mandals`) – CRUD for Mandals (with PR flag).
- **Sant Mandal** (`/swamis`) – CRUD for Swamis.

## Building for production

```powershell
# backend
cd backend
.\mvnw.cmd clean package
java -jar target\planner-0.0.1-SNAPSHOT.jar

# frontend
cd frontend
npm run build
# serve dist/frontend/browser with any static file server / reverse proxy to the API
```
