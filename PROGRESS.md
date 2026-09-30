# Delivery Platform — Final Report

**Date:** 2026-09-30  
**Scope:** Full audit and repair of all four axes (Accounts, Shipments, Assignment & Tracking, Admin & Stats)  
**Result:** All phases pass. 66/66 automated tests. Angular build clean. Full end-to-end demo verified live.

---

## How to Run the Project

### Prerequisites
- Java 17+
- Node.js 20+ / npm
- Docker Desktop (for PostgreSQL + Redis)

### 1. Start infrastructure
```bash
cd delivery-platform
docker compose up -d
```
This starts:
- PostgreSQL on `localhost:5432` (db: `delivery_db`, user: `postgres`, pass: `rou`)
- Redis on `localhost:6379`

### 2. Start the backend
```bash
cd backend
./mvnw spring-boot:run
```
Runs on **http://localhost:8081**

On first start with an empty database, the `DataInitializer` seeds:
- Admin: `admin@vandirect.com` — password printed to console (set `ADMIN_PASSWORD` env var for a fixed password)
- Demo driver: `driver@vandirect.com` / `driver123`
- Demo customer: `customer@vandirect.com` / `customer123`

To set a fixed admin password:
```bash
ADMIN_PASSWORD=Admin@1234 ./mvnw spring-boot:run
```

### 3. Start the frontend
```bash
cd frontend
npm install
npm start
```
Runs on **http://localhost:4200**

### 4. Run backend tests
```bash
cd backend
./mvnw test
# Expected: Tests run: 66, Failures: 0, Errors: 0
```

### 5. Clean restart from scratch
```bash
docker compose down -v   # destroys all data
docker compose up -d
ADMIN_PASSWORD=Admin@1234 ./mvnw spring-boot:run   # seeds fresh data
```

---

## Root Causes of the Original Breakage

The project was built axis-by-axis. Each axis added new code on top without fully testing integration with earlier axes. Five categories of breakage accumulated:

### 1. Missing Spring Bean — Backend Crashed at Startup (Critical)
`DriverLocationService` and `DriverLocationWebSocketHandler` both injected `tools.jackson.databind.json.JsonMapper` by constructor, but no `@Bean` of that type was registered. The application context failed to start entirely. **Nothing could work** until this was fixed.  
**Fix:** Added `@Bean JsonMapper jsonMapper()` to `RedisConfig`.

### 2. Angular Build Error — Frontend Dead (Critical)
`AdminChartsComponent` referenced `shipmentChartData`, `shipmentChartOptions`, `revenueChartData`, `revenueChartOptions` in its template but these properties were never defined on the class. Also imported `NgChartsModule` which doesn't exist in ng2-charts v11 (it uses `BaseChartDirective` + `provideCharts()`).  
**Fix:** Added all chart data/options properties, imported `BaseChartDirective`, added `provideCharts(withDefaultRegisterables())` to `app.config.ts`.

### 3. Redis Required at Runtime — Scheduler Crashed Every 5 Seconds
`DriverLocationService.getLocation()` threw `IllegalStateException` when Redis was unreachable. The assignment scheduler called this on every tick for every AVAILABLE driver. The scheduler thread died with an uncaught exception every 5 seconds. As a side-effect, creating a shipment also crashed because `autoAssign()` propagated the Redis exception.  
**Fix:** Changed `getLocation()` to log a WARN and return `Optional.empty()`. Wrapped the entire scheduler tick in a try-catch. Made `createShipment` treat autoAssign failure as non-fatal.

### 4. Stats Queries Broken — Charts Showed Wrong Data
- `countDeliveredToday()` counted all delivered shipments ever, not just today's
- `countShipmentsByDateRange` / `sumRevenueByDateRange` grouped by full timestamp instead of by date — every row formed its own group
- `CAST(s.createdAt AS date)` in JPQL returned `java.sql.Date` but code cast it to `java.time.LocalDate`
- `averageDeliveryTimeMinutes()` was a stub returning null
- `averageDeliveryTimeByServiceTier()` was a stub returning empty list
- Delivery-times endpoint cast `row[0]` to `Enum<?>` but native SQL returns `String`

### 5. Business Logic Gaps — Flow Broken Across Axes
- `approveDriver()` didn't create a `DriverStatus` row → approved drivers were invisible to the assignment system
- `assignDriver()` (admin manual path) didn't set `offerExpiresAt` → drivers could skip accept and go straight to PICKED_UP
- `suspendUser()` had no guard → admin account could be suspended
- `GET /api/users` had no authentication → anyone could dump all users with passwords
- `User.passwordHash` serialized to JSON in every user response

---

## All Files Changed and Why

### Backend

| File | Why changed |
|------|-------------|
| `config/RedisConfig.java` | Added `@Bean JsonMapper` — was missing, caused startup crash |
| `config/DataInitializer.java` | Seed `DriverStatus(AVAILABLE)` for seeded driver; inject `DriverStatusRepository` |
| `model/User.java` | Added `@JsonIgnore` on `passwordHash` — was leaking hashed passwords in all API responses |
| `service/UserService.java` | `approveDriver` now creates `DriverStatus(OFFLINE)` row; `suspendUser` guards against admin suspension; added `DriverStatusRepository` constructor injection |
| `service/ShipmentService.java` | `assignDriver` now sets `offerExpiresAt`; `updateStatus` PICKED_UP guard checks `offerExpiresAt != null`; `offerTimeoutSeconds` injected as `@Value` field |
| `service/AssignmentService.java` | Scheduler tick wrapped in try-catch; `decline()` sets `OFFLINE` not `UNAVAILABLE` |
| `service/DriverLocationService.java` | `getLocation()` returns `Optional.empty()` on Redis failure instead of throwing; removed stale import |
| `service/NotificationService.java` | Driver notified when shipment assigned (DRIVER_ASSIGNED status) |
| `controller/ShipmentController.java` | `autoAssign` wrapped in try-catch so shipment creation always succeeds; added SLF4J logger |
| `controller/AdminController.java` | `stats/shipments` and `stats/revenue` wrapped in try-catch; `toLocalDate()` helper handles both `java.sql.Date` and `java.time.LocalDate`; `getDeliveryTimeStats` casts `row[0]` via `.toString()` not `Enum.name()`; added `ResponseEntity` return types |
| `controller/UserController.java` | Added `@PreAuthorize("hasRole('ADMIN')")` to `GET /api/users` |
| `repository/ShipmentRepository.java` | Fixed `countDeliveredToday` to accept date parameter; fixed `CAST` grouping; added `ORDER BY` to stats queries |
| `repository/DeliveryEventRepository.java` | Replaced null/empty stubs with real native SQL queries for average delivery times |
| `pom.xml` | Replaced non-existent `spring-boot-starter-*-test` artifacts with `spring-boot-starter-test` + `spring-security-test` |

### Frontend

| File | Why changed |
|------|-------------|
| `app.config.ts` | Added `provideCharts(withDefaultRegisterables())` for ng2-charts v11 |
| `pages/admin/charts/charts.component.ts` | Added `BaseChartDirective` import, defined all `ChartData`/`ChartOptions` properties, wired `loadChartData()` to update them |
| `pages/admin/charts/charts.component.html` | Fixed `?.overallAverageMinutes.toFixed()` → `?.overallAverageMinutes?.toFixed()` |
| `components/layout/layout.html` | Admin nav now includes: Users, Shipments, Pending Drivers, All Drivers, Live Map, Stats |

---

## Spec Checklist

### Axis 1 — Accounts (FR1–FR4)
| Requirement | Status |
|-------------|--------|
| POST /api/auth/register (CUSTOMER, ACTIVE, auto-login JWT) | ✅ |
| POST /api/auth/register-driver (DRIVER, PENDING_APPROVAL, vehicleType, licenseNumber) | ✅ |
| POST /api/auth/login (JWT, SUSPENDED blocked, PENDING blocked with message) | ✅ |
| Password reset: request + confirm, 1-hour token, single-use `usedAt` | ✅ |
| Admin seeded at startup, no public admin registration | ✅ |
| GET /api/admin/drivers/pending | ✅ |
| PUT /api/admin/drivers/{id}/approve (creates DriverStatus row) | ✅ |
| PUT /api/admin/drivers/{id}/suspend (any non-admin user) | ✅ |
| Role-based access enforced (CUSTOMER / DRIVER / ADMIN) | ✅ |
| Angular: sign-up, become-a-driver, login, password-reset, under-review screen | ✅ |
| Angular: admin pending-drivers list with Approve button | ✅ |
| Angular: route guards per role, JWT interceptor | ✅ |

### Axis 2 — Shipments (FR5–FR8)
| Requirement | Status |
|-------------|--------|
| POST /api/shipments (pickup, recipient, service tier, ≥1 parcel, rejects 0) | ✅ |
| Parcel add/list/remove (removal only before confirmation) | ✅ |
| Tracking number generated and unique | ✅ |
| Price = distance + weights/sizes + service tier (PriceCalculator) | ✅ |
| Status flow: BOOKED→DRIVER_ASSIGNED→PICKED_UP→DELIVERED; CANCELLED from BOOKED/DRIVER_ASSIGNED only | ✅ |
| GET /api/shipments/track/{tn} public (no login) | ✅ |
| GET /api/customers/{id}/shipments (own only) | ✅ |
| PUT /api/shipments/{id}/cancel | ✅ |
| PUT /api/shipments/{id}/status (driver/admin only) | ✅ |
| Notifications on each status change | ✅ |
| Mock SMS/payment behind interface (LoggingSmsService, LoggingPaymentService) | ✅ |
| Angular: booking form with "Add another package", price estimate, history, tracking | ✅ |

### Axis 3 — Assignment & Live Tracking (FR9–FR12)
| Requirement | Status |
|-------------|--------|
| DriverStatus (AVAILABLE/ON_DELIVERY/OFFLINE) created for each approved driver | ✅ |
| PUT /api/drivers/{id}/availability | ✅ |
| POST /api/shipments/{id}/assign: nearest ACTIVE+AVAILABLE driver by distance | ✅ |
| PUT /api/shipments/{id}/accept | ✅ |
| PUT /api/shipments/{id}/reassign (auto-reassign on timeout) | ✅ |
| Timeout configurable: `assignment.offer-timeout-seconds` (default 30) | ✅ |
| On accept: assignedDriverId set, DRIVER_ASSIGNED, driver ON_DELIVERY, DeliveryEvents written | ✅ |
| On delivery: DELIVERED (deliveredAt set), driver AVAILABLE | ✅ |
| POST /api/drivers/{id}/location stores in Redis, broadcasts over WebSocket | ✅ |
| GET /api/shipments/{id}/driverlocation reads from Redis | ✅ |
| WebSocket /ws with JWT auth on handshake | ✅ |
| Angular: driver dashboard (availability toggle, accept, GPS push ~5s, PICKED_UP/DELIVERED) | ✅ |
| Angular: customer live map (Leaflet, moving marker) | ✅ |

### Axis 4 — Admin & Stats (FR13–FR16)
| Requirement | Status |
|-------------|--------|
| GET /api/admin/shipments/live (active + driver locations) | ✅ |
| GET /api/admin/stats/shipments?range=week | ✅ |
| GET /api/admin/stats/revenue?range=month | ✅ |
| GET /api/admin/stats/delivery-times | ✅ |
| Aggregate queries on Shipment + DeliveryEvent, no new entities | ✅ |
| Driver activate/suspend from admin UI | ✅ |
| Angular admin dashboard with live map + charts | ✅ |
| ADMIN role only access | ✅ |

### Security
| Requirement | Status |
|-------------|--------|
| passwordHash never in JSON responses (@JsonIgnore) | ✅ |
| GET /api/users requires ADMIN | ✅ |
| JWT secret from env var, not hardcoded | ✅ |
| CORS restricted to localhost:4200 | ✅ |

---

## Ambiguity Decisions

| Ambiguity | Decision |
|-----------|----------|
| Driver accept timeout: 20s vs 30s in spec | **30 seconds** — configurable via `assignment.offer-timeout-seconds` in `application.properties` |
| "ACTIVE drivers with status AVAILABLE" | Filters on `User.status == ACTIVE` **AND** `DriverStatus.status == AVAILABLE` — both conditions required |
| PUT /api/admin/drivers/{id}/suspend for customers too | `UserService.suspendUser()` works for any non-admin user; `AdminController` path says `/drivers/{id}/suspend` but the endpoint accepts any user ID |
| Optional ML features | Out of scope — not implemented |
| Admin password on first run | Generated randomly and logged to console if `ADMIN_PASSWORD` env var is not set |
| Redis unavailability | Backend starts and all non-location endpoints work; live tracking degrades gracefully with WARN logs |

---

## Test Coverage

| Test class | Tests | What it covers |
|------------|-------|----------------|
| `BackendApplicationTests` | 1 | Spring context loads |
| `AdminControllerTest` | 15 | Admin endpoints, role access |
| `SecurityMockMvcTest` | 19 | Auth endpoints, JWT, CORS, role guards |
| `AssignmentAndDriverStatusServiceTest` | 10 | Assignment flow, driver status transitions |
| `ParcelServiceTest` | 4 | Add/delete parcels, last-parcel protection |
| `PasswordResetServiceTest` | 3 | Expired/used/valid reset token |
| `PriceCalculatorTest` | 2 | Price formula for parcels |
| `ShipmentServiceTest` | 12 | Status machine, driver assignment guards |
| **Total** | **66** | **All pass** |

---

## Live Demo Results (Phase 5 run — 2026-09-30)

```
[1]  Admin login: ADMIN
     Stats BEFORE: total=23 today=5 revenue=261.70 drivers=7
[2]  Amina registered: role=CUSTOMER status=ACTIVE
[3]  Karim registered: status=PENDING_APPROVAL vehicleType=CAR
[4]  Karim pre-approval login blocked: HTTP 401
[5]  Admin approved Karim: status=ACTIVE DriverStatus=OFFLINE
[6]  Karim login: role=DRIVER | Set AVAILABLE
[7]  Amina booked: TRK-866769 parcels=2 price=$42.79 status=BOOKED
[8]  Public tracking (no auth): BOOKED parcels=2
[9]  Admin assigned Karim: status=DRIVER_ASSIGNED offerExpiresAt=SET
[10] PICKED_UP before accept blocked: HTTP 409
[11] Karim accepted: offerExpiresAt=cleared DriverStatus=ON_DELIVERY Event=ACCEPTED
[12] PICKED_UP: status=PICKED_UP Event=PICKED_UP
[13] DELIVERED: deliveredAt=set DriverStatus=AVAILABLE Event=DELIVERED
[14] Event trail: ASSIGNED->ACCEPTED->PICKED_UP->DELIVERED
[15] Stats AFTER: total=24 (+1) today=6 (+1) revenue=304.49 (+42.79)
[16] Amina notifications: 3 unread (DRIVER_ASSIGNED | PICKED_UP | DELIVERED)
[17] Live shipments: delivered shipment correctly removed
[18] Delivery times: overall=1.45min EXPRESS=0.02min STANDARD=2.89min
```

All 18 checks passed.
