# Backend Development Plan - FamilyFlow

## 1️⃣ Executive Summary

**What Will Be Built:**
- FastAPI backend (Python 3.13, async) for FamilyFlow household task management application
- MongoDB Atlas database using Motor driver and Pydantic v2 models
- RESTful API at `/api/v1/*` supporting all frontend features
- JWT-based authentication for household members
- Real-time task management, fairness tracking, and gamification features

**Why:**
- Replace frontend localStorage with persistent cloud database
- Enable multi-device synchronization for family members
- Provide secure authentication and data isolation per household
- Support real-time collaboration on shared task board

**Constraints:**
- FastAPI with Python 3.13 runtime
- MongoDB Atlas only (no local instance)
- No Docker containers
- Manual testing required after every task via frontend UI
- Single Git branch `main` only
- Background tasks synchronous by default (use `BackgroundTasks` only if strictly necessary)

**Sprint Structure:**
- **S0:** Environment setup and frontend connection
- **S1:** Authentication (signup, login, logout)
- **S2:** Household and family member management
- **S3:** Task CRUD operations
- **S4:** Task status updates and completion
- **S5:** Fairness dashboard data aggregation
- **S6:** Templates management
- **S7:** Appreciation notes and badges

---

## 2️⃣ In-Scope & Success Criteria

**In-Scope Features:**
- User authentication (signup, login, logout, JWT tokens)
- Household creation and member invitation
- Task CRUD (create, read, update, delete)
- Task status transitions (todo → in-progress → done)
- Task assignment and reassignment
- Recurring task patterns (daily, weekly, monthly)
- Fairness metrics calculation (points, time, task count per member)
- Task templates (pre-built and custom)
- Appreciation notes between family members
- Badge system for achievements
- Points and leaderboard tracking

**Success Criteria:**
- All frontend features functional end-to-end with backend
- All task-level manual tests pass via UI
- Each sprint's code pushed to `main` after verification
- Frontend successfully connects to backend APIs
- Data persists in MongoDB Atlas across sessions
- Multi-user households can collaborate in real-time

---

## 3️⃣ API Design

**Base Path:** `/api/v1`

**Error Envelope:** `{ "error": "message" }`

### Authentication Endpoints

**POST /api/v1/auth/signup**
- Purpose: Register new user and create household
- Request: `{ "email": "string", "password": "string", "name": "string", "householdName": "string" }`
- Response: `{ "user": {...}, "household": {...}, "token": "jwt" }`
- Validation: Email format, password min 8 chars, unique email

**POST /api/v1/auth/login**
- Purpose: Authenticate user and return JWT
- Request: `{ "email": "string", "password": "string" }`
- Response: `{ "user": {...}, "household": {...}, "token": "jwt" }`
- Validation: Valid credentials

**POST /api/v1/auth/logout**
- Purpose: Invalidate session (client-side token removal)
- Request: None (token in header)
- Response: `{ "message": "Logged out successfully" }`

**GET /api/v1/auth/me**
- Purpose: Get current user profile
- Request: None (token in header)
- Response: `{ "user": {...}, "household": {...} }`

### Household Endpoints

**GET /api/v1/households/me**
- Purpose: Get current user's household with all members
- Response: `{ "id": "string", "name": "string", "managerId": "string", "members": [...] }`

**PUT /api/v1/households/me**
- Purpose: Update household name
- Request: `{ "name": "string" }`
- Response: Updated household object

**POST /api/v1/households/me/members**
- Purpose: Add member to household
- Request: `{ "name": "string", "role": "manager|member|child", "avatar": "string", "color": "string" }`
- Response: Updated household with new member

**DELETE /api/v1/households/me/members/{memberId}**
- Purpose: Remove member from household
- Response: `{ "message": "Member removed" }`

### Task Endpoints

**GET /api/v1/tasks**
- Purpose: Get all tasks for current household
- Query params: `status`, `assigneeId`, `room` (optional filters)
- Response: `{ "tasks": [...] }`

**POST /api/v1/tasks**
- Purpose: Create new task
- Request: `{ "title": "string", "description": "string", "assigneeId": "string", "dueDate": "ISO8601", "recurrence": "none|daily|weekly|monthly", "room": "string", "points": number, "estimatedMinutes": number }`
- Response: Created task object

**GET /api/v1/tasks/{taskId}**
- Purpose: Get single task details
- Response: Task object

**PUT /api/v1/tasks/{taskId}**
- Purpose: Update task (any field including status)
- Request: Partial task object
- Response: Updated task object
- Note: Status change to "done" triggers point award

**DELETE /api/v1/tasks/{taskId}**
- Purpose: Delete task
- Response: `{ "message": "Task deleted" }`

### Fairness Endpoints

**GET /api/v1/fairness/stats**
- Purpose: Get fairness metrics for household
- Response: `{ "members": [{ "memberId": "string", "name": "string", "taskCount": number, "completedCount": number, "points": number, "hours": number }], "rooms": [...] }`

### Template Endpoints

**GET /api/v1/templates**
- Purpose: Get all templates (pre-built + custom for household)
- Response: `{ "templates": [...] }`

**POST /api/v1/templates**
- Purpose: Create custom template
- Request: `{ "name": "string", "category": "string", "description": "string", "tasks": [...] }`
- Response: Created template object

**DELETE /api/v1/templates/{templateId}**
- Purpose: Delete custom template (only if isCustom=true)
- Response: `{ "message": "Template deleted" }`

**POST /api/v1/templates/{templateId}/apply**
- Purpose: Create tasks from template
- Request: `{ "assignments": { "taskIndex": "memberId" }, "startDate": "ISO8601" }`
- Response: `{ "tasks": [...] }` (created tasks)

### Appreciation & Badges Endpoints

**GET /api/v1/notes**
- Purpose: Get appreciation notes for household
- Response: `{ "notes": [...] }`

**POST /api/v1/notes**
- Purpose: Send appreciation note
- Request: `{ "toId": "string", "message": "string" }`
- Response: Created note object

**GET /api/v1/badges**
- Purpose: Get all badges and earned status
- Response: `{ "badges": [...] }`

---

## 4️⃣ Data Model (MongoDB Atlas)

### Collection: `users`
- `_id`: ObjectId (auto)
- `email`: string (required, unique, indexed)
- `password_hash`: string (required, Argon2)
- `name`: string (required)
- `household_id`: ObjectId (required, ref households)
- `created_at`: datetime (required)

**Example:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "zara@example.com",
  "password_hash": "$argon2id$v=19$m=65536...",
  "name": "Zara",
  "household_id": "507f1f77bcf86cd799439012",
  "created_at": "2025-01-15T10:30:00Z"
}
```

### Collection: `households`
- `_id`: ObjectId (auto)
- `name`: string (required)
- `manager_id`: ObjectId (required, ref users)
- `members`: array of embedded documents (required)
  - `id`: string (required, unique within household)
  - `name`: string (required)
  - `role`: string (required, enum: manager|member|child)
  - `avatar`: string (required)
  - `color`: string (required)
  - `points`: int (default 0)
  - `tasks_completed`: int (default 0)
- `created_at`: datetime (required)

**Example:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "The Clark Family",
  "manager_id": "507f1f77bcf86cd799439011",
  "members": [
    {
      "id": "member-1",
      "name": "Zara",
      "role": "manager",
      "avatar": "👩‍💼",
      "color": "#8B5CF6",
      "points": 450,
      "tasks_completed": 23
    }
  ],
  "created_at": "2025-01-15T10:30:00Z"
}
```

### Collection: `tasks`
- `_id`: ObjectId (auto)
- `household_id`: ObjectId (required, indexed, ref households)
- `title`: string (required)
- `description`: string (default "")
- `assignee_id`: string (required, member id from household.members)
- `due_date`: datetime (required)
- `status`: string (required, enum: todo|in-progress|done)
- `recurrence`: string (required, enum: none|daily|weekly|monthly)
- `room`: string (default "General")
- `points`: int (required)
- `estimated_minutes`: int (required)
- `created_by`: string (required, member id)
- `created_at`: datetime (required)
- `completed_at`: datetime (optional)

**Example:**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "household_id": "507f1f77bcf86cd799439012",
  "title": "Laundry",
  "description": "Wash, dry, and fold all laundry",
  "assignee_id": "member-2",
  "due_date": "2025-01-20T10:00:00Z",
  "status": "todo",
  "recurrence": "weekly",
  "room": "Laundry Room",
  "points": 30,
  "estimated_minutes": 90,
  "created_by": "member-1",
  "created_at": "2025-01-15T10:30:00Z"
}
```

### Collection: `templates`
- `_id`: ObjectId (auto)
- `name`: string (required)
- `category`: string (required)
- `description`: string (required)
- `is_custom`: bool (required)
- `household_id`: ObjectId (optional, only for custom templates)
- `created_by`: string (optional, member id for custom templates)
- `tasks`: array of embedded documents (required)
  - `title`: string
  - `description`: string
  - `recurrence`: string
  - `room`: string
  - `points`: int
  - `estimated_minutes`: int

**Example:**
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "name": "Travel Prep",
  "category": "Travel",
  "description": "Complete checklist for family travel",
  "is_custom": false,
  "tasks": [
    {
      "title": "Pack Suitcases",
      "description": "Pack clothes and essentials",
      "recurrence": "none",
      "room": "Bedroom",
      "points": 30,
      "estimated_minutes": 120
    }
  ]
}
```

### Collection: `appreciation_notes`
- `_id`: ObjectId (auto)
- `household_id`: ObjectId (required, indexed, ref households)
- `from_id`: string (required, member id)
- `to_id`: string (required, member id)
- `message`: string (required)
- `created_at`: datetime (required)

**Example:**
```json
{
  "_id": "507f1f77bcf86cd799439015",
  "household_id": "507f1f77bcf86cd799439012",
  "from_id": "member-1",
  "to_id": "member-2",
  "message": "Thanks for doing the laundry!",
  "created_at": "2025-01-15T14:30:00Z"
}
```

### Collection: `badges`
- `_id`: ObjectId (auto)
- `name`: string (required)
- `description`: string (required)
- `icon`: string (required)
- `threshold`: int (required)
- `earned_by`: array of objects (household_id + member_id pairs)
  - `household_id`: ObjectId
  - `member_id`: string

**Example:**
```json
{
  "_id": "507f1f77bcf86cd799439016",
  "name": "Task Master",
  "description": "Complete 10 tasks",
  "icon": "🏆",
  "threshold": 10,
  "earned_by": [
    {
      "household_id": "507f1f77bcf86cd799439012",
      "member_id": "member-1"
    }
  ]
}
```

---

## 5️⃣ Frontend Audit & Feature Map

### `/onboarding` - Onboarding Flow
- **Purpose:** 6-step household setup wizard
- **Data Needed:** Household name, member list, task list, ratings, assignments
- **Backend Endpoints:**
  - `POST /api/v1/auth/signup` - Create user and household
  - `POST /api/v1/households/me/members` - Add members
  - `POST /api/v1/tasks` (bulk) - Create initial tasks
- **Auth:** None (signup flow)

### `/` - Dashboard
- **Purpose:** Overview of household stats, leaderboard, upcoming tasks, appreciation notes
- **Data Needed:** All tasks, household members with points, recent notes
- **Backend Endpoints:**
  - `GET /api/v1/auth/me` - Current user and household
  - `GET /api/v1/tasks` - All tasks
  - `GET /api/v1/notes` - Recent notes
- **Auth:** Required (JWT)

### `/tasks` - Task Board
- **Purpose:** Kanban board with create, update, delete, drag-and-drop status changes
- **Data Needed:** All tasks, household members
- **Backend Endpoints:**
  - `GET /api/v1/tasks` - List all tasks
  - `POST /api/v1/tasks` - Create task
  - `PUT /api/v1/tasks/{taskId}` - Update task (including status)
  - `DELETE /api/v1/tasks/{taskId}` - Delete task
- **Auth:** Required (JWT)

### `/fairness` - Fairness Dashboard
- **Purpose:** Charts showing task distribution, points, time investment by member and room
- **Data Needed:** Aggregated stats per member, task counts, points, hours
- **Backend Endpoints:**
  - `GET /api/v1/fairness/stats` - Pre-calculated fairness metrics
- **Auth:** Required (JWT)

### `/templates` - Templates Library
- **Purpose:** Browse and apply pre-built or custom task templates
- **Data Needed:** All templates (system + household custom)
- **Backend Endpoints:**
  - `GET /api/v1/templates` - List templates
  - `POST /api/v1/templates` - Create custom template
  - `POST /api/v1/templates/{templateId}/apply` - Apply template
  - `DELETE /api/v1/templates/{templateId}` - Delete custom template
- **Auth:** Required (JWT)

### `/family` - Family Members
- **Purpose:** View member profiles, points, badges, send appreciation
- **Data Needed:** Household members, badges, appreciation notes
- **Backend Endpoints:**
  - `GET /api/v1/households/me` - Household with members
  - `GET /api/v1/badges` - All badges
  - `POST /api/v1/notes` - Send appreciation
  - `GET /api/v1/notes` - View notes
- **Auth:** Required (JWT)

### `/settings` - Settings
- **Purpose:** Update household name, manage members
- **Data Needed:** Household info, members
- **Backend Endpoints:**
  - `PUT /api/v1/households/me` - Update household
  - `POST /api/v1/households/me/members` - Add member
  - `DELETE /api/v1/households/me/members/{memberId}` - Remove member
- **Auth:** Required (JWT)

---

## 6️⃣ Configuration & ENV Vars

**Core Environment Variables:**
- `APP_ENV` - Environment (development, production)
- `PORT` - HTTP port (default: 8000)
- `MONGODB_URI` - MongoDB Atlas connection string (required)
- `JWT_SECRET` - Token signing key (required, min 32 chars)
- `JWT_EXPIRES_IN` - Seconds before JWT expiry (default: 604800 = 7 days)
- `CORS_ORIGINS` - Allowed frontend URL(s) (comma-separated, default: http://localhost:5173)

**Example `.env` file:**
```
APP_ENV=development
PORT=8000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/familyflow?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_EXPIRES_IN=604800
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 7️⃣ Background Work

**Not Required for MVP**

All operations are synchronous request-response. No background jobs needed.

Future considerations (post-MVP):
- Recurring task generation (could use scheduled job)
- Reminder notifications (would need external service)

---

## 8️⃣ Integrations

**Not Required for MVP**

Frontend currently has no external integrations implemented. All features use local state.

Future considerations (post-MVP):
- Google Calendar sync
- Apple Calendar sync
- Alexa voice commands
- SMS reminders

---

## 9️⃣ Testing Strategy (Manual via Frontend)

**Validation Method:** All testing performed through frontend UI

**Test Requirements:**
- Every task includes Manual Test Step (exact UI action + expected result)
- Every task includes User Test Prompt (copy-paste instruction)
- After all tasks in sprint pass → commit and push to `main`
- If any test fails → fix and retest before pushing

**Test Flow:**
1. Start backend server
2. Start frontend dev server
3. Perform Manual Test Step via UI
4. Verify expected result
5. If pass → proceed to next task
6. If fail → debug, fix, restart backend, retest
7. After all sprint tasks pass → `git add .`, `git commit`, `git push origin main`

---

## 🔟 Dynamic Sprint Plan & Backlog

---

## 🧱 S0 – Environment Setup & Frontend Connection

**Objectives:**
- Create FastAPI skeleton with `/api/v1` base path and `/healthz` endpoint
- Connect to MongoDB Atlas using `MONGODB_URI`
- `/healthz` performs DB ping and returns JSON status
- Enable CORS for frontend
- Replace dummy API URLs in frontend with real backend URLs
- Initialize Git at root, set default branch to `main`, push to GitHub
- Create single `.gitignore` at root (ignore `__pycache__`, `.env`, `*.pyc`, `venv/`, `.venv/`)

**User Stories:**
- As a developer, I need a working FastAPI server so I can build endpoints
- As a developer, I need MongoDB Atlas connection so I can persist data
- As a developer, I need CORS enabled so frontend can call backend
- As a developer, I need Git initialized so I can version control code

**Tasks:**

1. **Create FastAPI project structure**
   - Create `backend/` directory (already exists)
   - Create `backend/app/` directory for application code
   - Create `backend/app/__init__.py`
   - Create `backend/app/main.py` with FastAPI app instance
   - Create `backend/app/config.py` for environment variables
   - Create `backend/requirements.txt` with: `fastapi`, `uvicorn[standard]`, `motor`, `pydantic`, `pydantic-settings`, `python-jose[cryptography]`, `passlib[argon2]`, `python-multipart`
   - Manual Test Step: Run `pip install -r requirements.txt` → all packages install successfully
   - User Test Prompt: "Install dependencies with `pip install -r requirements.txt` and confirm no errors."

2. **Implement configuration management**
   - In `config.py`, create `Settings` class using `pydantic-settings`
   - Load env vars: `APP_ENV`, `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGINS`
   - Validate required vars on startup
   - Manual Test Step: Create `.env` file with vars → backend starts without errors
   - User Test Prompt: "Create `.env` file with MongoDB URI and JWT secret, then start backend with `uvicorn app.main:app --reload`. Confirm it starts on port 8000."

3. **Setup MongoDB Atlas connection**
   - Create `backend/app/database.py`
   - Initialize Motor async client with `MONGODB_URI`
   - Create database instance (`familyflow`)
   - Create `get_database()` helper function
   - Manual Test Step: Start backend → logs show "Connected to MongoDB"
   - User Test Prompt: "Start backend and check logs for MongoDB connection success message."

4. **Implement `/healthz` endpoint**
   - In `main.py`, create `GET /healthz` route
   - Perform MongoDB ping operation
   - Return `{ "status": "ok", "database": "connected" }` if successful
   - Return `{ "status": "error", "database": "disconnected" }` if failed
   - Manual Test Step: Open browser to `http://localhost:8000/healthz` → see `{"status":"ok","database":"connected"}`
   - User Test Prompt: "Visit http://localhost:8000/healthz in browser and confirm JSON response shows database connected."

5. **Enable CORS for frontend**
   - In `main.py`, add `CORSMiddleware`
   - Use `CORS_ORIGINS` from config
   - Allow credentials, all methods, all headers
   - Manual Test Step: Start frontend → Network tab shows no CORS errors
   - User Test Prompt: "Start frontend dev server and open browser DevTools Network tab. Confirm no CORS errors when making requests."

6. **Initialize Git repository**
   - Run `git init` at project root (if not already initialized)
   - Create `.gitignore` at root with: `__pycache__/`, `*.pyc`, `.env`, `venv/`, `.venv/`, `node_modules/`, `.DS_Store`
   - Set default branch to `main`: `git branch -M main`
   - Create initial commit: `git add .`, `git commit -m "Initial backend setup"`
   - Manual Test Step: Run `git status` → shows clean working tree
   - User Test Prompt: "Run `git status` and confirm working tree is clean with no untracked sensitive files."

7. **Push to GitHub**
   - Create GitHub repository (if not exists)
   - Add remote: `git remote add origin <repo-url>`
   - Push: `git push -u origin main`
   - Manual Test Step: Visit GitHub repo → see initial commit
   - User Test Prompt: "Visit your GitHub repository and confirm the initial commit is visible."

**Definition of Done:**
- Backend runs locally on port 8000
- `/healthz` returns 200 OK with DB connection status
- MongoDB Atlas connection successful
- CORS enabled for frontend origin
- Git initialized with `main` branch
- Code pushed to GitHub

**Post-Sprint:**
- Commit all changes: `git add .`, `git commit -m "S0: Environment setup complete"`
- Push to main: `git push origin main`

---

## 🧩 S1 – Basic Auth (Signup / Login / Logout)

**Objectives:**
- Implement JWT-based signup, login, and logout
- Store users in MongoDB with hashed passwords (Argon2)
- Protect one backend route + one frontend page

**User Stories:**
- As a new user, I can sign up with email/password so I can create my household
- As a returning user, I can log in so I can access my household data
- As a logged-in user, I can log out so my session ends

**Endpoints:**
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

**Tasks:**

1. **Create user model and database operations**
   - Create `backend/app/models/user.py` with Pydantic model
   - Fields: `email`, `password_hash`, `name`, `household_id`, `created_at`
   - Create `backend/app/crud/user.py` with async functions:
     - `create_user(db, email, password_hash, name, household_id)`
     - `get_user_by_email(db, email)`
     - `get_user_by_id(db, user_id)`
   - Manual Test Step: None (internal function)
   - User Test Prompt: "This is an internal function - no UI test needed."

2. **Implement password hashing utilities**
   - Create `backend/app/utils/security.py`
   - Function `hash_password(password: str) -> str` using Argon2
   - Function `verify_password(plain: str, hashed: str) -> bool`
   - Manual Test Step: None (internal function)
   - User Test Prompt: "This is an internal function - no UI test needed."

3. **Implement JWT token utilities**
   - In `utils/security.py`, add:
     - `create_access_token(data: dict) -> str` - creates JWT with expiry
     - `decode_access_token(token: str) -> dict` - validates and decodes JWT
   - Use `JWT_SECRET` and `JWT_EXPIRES_IN` from config
   - Manual Test Step: None (internal function)
   - User Test Prompt: "This is an internal function - no UI test needed."

4. **Create authentication dependency**
   - Create `backend/app/dependencies/auth.py`
   - Function `get_current_user(token: str = Depends(oauth2_scheme))` - extracts user from JWT
   - Raises 401 if token invalid or user not found
   - Manual Test Step: None (internal function)
   - User Test Prompt: "This is an internal function - no UI test needed."

5. **Implement signup endpoint**
   - Create `backend/app/routers/auth.py`
   - `POST /api/v1/auth/signup` endpoint
   - Request: `{ "email", "password", "name", "householdName" }`
   - Create user with hashed password
   - Create household with user as manager (see S2 for household model)
   - Return user, household, and JWT token
   - Manual Test Step: Open frontend onboarding → fill signup form → click "Start" → redirected to dashboard
   - User Test Prompt: "Go to frontend onboarding page, fill in email, password, name, and household name. Click 'Start' and confirm you're redirected to the dashboard."

6. **Implement login endpoint**
   - In `routers/auth.py`, add `POST /api/v1/auth/login`
   - Request: `{ "email", "password" }`
   - Verify password against hash
   - Return user, household, and JWT token
   - Manual Test Step: Log out → go to login page → enter credentials → click "Log In" → redirected to dashboard
   - User Test Prompt: "Log out, then go to login page. Enter your email and password, click 'Log In', and confirm you're redirected to the dashboard."

7. **Implement logout endpoint**
   - In `routers/auth.py`, add `POST /api/v1/auth/logout`
   - No server-side action needed (client clears token)
   - Return `{ "message": "Logged out successfully" }`
   - Manual Test Step: Click logout button → redirected to login page → try accessing dashboard → redirected back to login
   - User Test Prompt: "Click the logout button in the header. Confirm you're redirected to login page. Try accessing the dashboard URL directly and confirm you're redirected back to login."

8. **Implement /auth/me endpoint**
   - In `routers/auth.py`, add `GET /api/v1/auth/me`
   - Protected with `get_current_user` dependency
   - Return current user and household data
   - Manual Test Step: Refresh dashboard page → data loads correctly
   - User Test Prompt: "While logged in, refresh the dashboard page and confirm your household data loads correctly."

9. **Update frontend to use auth endpoints**
   - Update `frontend/src/contexts/AppContext.tsx` to call backend APIs
   - Store JWT token in localStorage
   - Add token to all API request headers: `Authorization: Bearer <token>`
   - Redirect to login if 401 response
   - Manual Test Step: Complete full auth flow (signup → logout → login) → all work correctly
   - User Test Prompt: "Test the complete flow: sign up a new account, log out, then log back in. Confirm all steps work without errors."

**Definition of Done:**
- Users can sign up via frontend onboarding
- Users can log in with email/password
- Users can log out and session ends
- JWT token stored and sent with requests
- Protected routes return 401 if not authenticated

**Post-Sprint:**
- Commit: `git add .`, `git commit -m "S1: Authentication complete"`
- Push: `git push origin main`

---

## 🧱 S2 – Household and Family Member Management

**Objectives:**
- Create household model and CRUD operations
- Support adding/removing family members
- Link users to households

**User Stories:**
- As a household manager, I can view my household and all members
- As a household manager, I can add new family members
- As a household manager, I can remove family members
- As a household manager, I can update household name

**Endpoints:**
- `GET /api/v1/households/me`
- `PUT /api/v1/households/me`
- `POST /api/v1/households/me/members`
- `DELETE /api/v1/households/me/members/{memberId}`

**Tasks:**

1. **Create household model**
   - Create `backend/app/models/household.py` with Pydantic model
   - Fields: `name`, `manager_id`, `members` (array of embedded docs), `created_at`
   - Member schema: `id`, `name`, `role`, `avatar`, `color`, `points`, `tasks_completed`
   - Manual Test Step: None (internal model)
   - User Test Prompt: "This is an internal model - no UI test needed."

2. **Create household CRUD operations**
   - Create `backend/app/crud/household.py` with async functions:
     - `create_household(db, name, manager_id, initial_member)`
     - `get_household_by_id(db, household_id)`
     - `update_household_name(db, household_id, name)`
     - `add_member(db, household_id, member)`
     - `remove_member(db, household_id, member_id)`
     - `update_member_points(db, household_id, member_id, points_delta, tasks_delta)`
   - Manual Test Step: None (internal function)
   - User Test Prompt: "This is an internal function - no UI test needed."

3. **Implement GET /api/v1/households/me endpoint**
   - Create `backend/app/routers/household.py`
   - `GET /api/v1/households/me` - protected route
   - Get current user's household with all members
   - Return household object
   - Manual Test Step: Open dashboard → household name and members display correctly
   - User Test Prompt: "Open the dashboard and confirm your household name and all family members are displayed correctly."

4. **Implement PUT /api/v1/households/me endpoint**
   - In `routers/household.py`, add `PUT /api/v1/households/me`
   - Request: `{ "name": "string" }`
   - Update household name
   - Return updated household
   - Manual Test Step: Go to Settings → change household name → save → name updates everywhere
   - User Test Prompt: "Go to Settings page, change your household name, click save, and confirm the new name appears in the header and dashboard."

5. **Implement POST /api/v1/households/me/members endpoint**
   - In `routers/household.py`, add `POST /api/v1/households/me/members`
   - Request: `{ "name", "role", "avatar", "color" }`
   - Generate unique member ID
   - Add member to household.members array
   - Return updated household
   - Manual Test Step: Go to Family page → click "Add Member" → fill form → save → new member appears in list
   - User Test Prompt: "Go to Family page, click 'Add Member', fill in name, role, avatar, and color, then save. Confirm the new member appears in the family list."

6. **Implement DELETE /api/v1/households/me/members/{memberId} endpoint**
   - In `routers/household.py`, add `DELETE /api/v1/households/me/members/{memberId}`
   - Remove member from household.members array
   - Return success message
   - Manual Test Step: Go to Family page → click delete on a member → confirm → member removed from list
   - User Test Prompt: "Go to Family page, click the delete button on a member, confirm the deletion, and verify the member is removed from the list."

7. **Update signup to create household with initial member**
   - Modify `POST /api/v1/auth/signup` to call `create_household`
   - Create household with user as first member (manager role)
   - Link user to household via `household_id`
   - Manual Test Step: Complete onboarding → household created with user as first member
   - User Test Prompt: "Complete the onboarding flow and confirm your household is created with you as the first member."

**Definition of Done:**
- Household data loads on dashboard
- Can view all family members
- Can add new members via UI
- Can remove members via UI
- Can update household name

**Post-Sprint:**
- Commit: `git add .`, `git commit -m "S2: Household management complete"`
- Push: `git push origin main`

---

## 🧱 S3 – Task CRUD Operations

**Objectives:**
- Implement task model and database operations
- Support creating, reading, updating, and deleting tasks
- Filter tasks by status, assignee, room

**User Stories:**
- As a family member, I can create new tasks with all details
- As a family member, I can view all household tasks
- As a family member, I can edit task details
- As a family member, I can delete tasks
- As a family member, I can filter tasks by status, assignee, or room

**Endpoints:**
- `GET /api/v1/tasks`
- `POST /api/v1/tasks`
- `GET /api/v1/tasks/{taskId}`
- `PUT /api/v1/tasks/{taskId}`
- `DELETE /api/v1/tasks/{taskId}`

**Tasks:**

1. **Create task model**
   - Create `backend/app/models/task.py` with Pydantic model
   - Fields: `household_id`, `title`, `description`, `assignee_id`, `due_date`, `status`, `recurrence`, `room`, `points`, `estimated_minutes`, `created_by`, `created_at`, `completed_at`
   - Manual Test Step: None (internal model)
   - User Test Prompt: "This is an internal model - no UI test needed."

2. **Create task CRUD operations**
   - Create `backend/app/crud/task.py` with async functions:
     - `create_task(db, household_id, task_data)`
     - `get_tasks_by_household(db, household_id, filters)`
     - `get_task_by_id(db, task_id, household_id)`
     - `update_task(db, task_id, household_id, updates)`
     - `delete_task(db, task_id, household_id)`
   - Manual Test Step: None (internal function)
   - User Test Prompt: "This is an internal function - no UI test needed."

3. **Implement POST /api/v1/tasks endpoint**
   - Create `backend/app/routers/task.py`
   - `POST /api/v1/tasks` - protected route
   - Request: `{ "title", "description", "assigneeId", "dueDate", "recurrence", "room", "points", "estimatedMinutes" }`
   - Create task in database
   - Return created task
   - Manual Test Step: Go to Tasks page → click "Create Task" → fill form → save → task appears on board
   - User Test Prompt: "Go to Tasks page, click 'Create Task', fill in all fields, and save. Confirm the new task appears on the task board."

4. **Implement GET /api/v1/tasks endpoint**
   - In `routers/task.py`, add `GET /api/v1/tasks`
   - Query params: `status`, `assigneeId`, `room` (optional filters)
   - Get all tasks for current user's household
   - Apply filters if provided
   - Return array of tasks
   - Manual Test Step: Refresh Tasks page → all tasks load and display correctly
   - User Test Prompt: "Refresh the Tasks page and confirm all your household's tasks are displayed correctly."

5. **Implement GET /api/v1/tasks/{taskId} endpoint**
   - In `routers/task.py`, add `GET /api/v1/tasks/{taskId}`
   - Get single task by ID
   - Verify task belongs to user's household
   - Return task object
   - Manual Test Step: Click on a task card → task details modal opens with correct data
   - User Test Prompt: "Click on any task card and confirm the task details modal opens with all correct information."

6. **Implement PUT /api/v1/tasks/{taskId} endpoint**
   - In `routers/task.py`, add `PUT /api/v1/tasks/{taskId}`
   - Request: Partial task object (any fields to update)
   - Update task in database
   - Return updated task
   - Manual Test Step: Click edit on a task → change title → save → title updates on board
   - User Test Prompt: "Click edit on a task, change the title, save, and confirm the updated title appears on the task board."

7. **Implement DELETE /api/v1/tasks/{taskId} endpoint**
   - In `routers/task.py`, add `DELETE /api/v1/tasks/{taskId}`
   - Delete task from database
   - Return success message
   - Manual Test Step: Click delete on a task → confirm → task removed from board
   - User Test Prompt: "Click delete on a task, confirm the deletion, and verify the task is removed from the board."

8. **Update frontend to use task endpoints**
   - Update `frontend/src/contexts/AppContext.tsx` to call backend task APIs
   - Replace localStorage operations with API calls
   - Handle loading states and errors
   - Manual Test Step: Create, edit, delete tasks → all operations work correctly
   - User Test Prompt: "Test creating, editing, and deleting tasks. Confirm all operations work correctly and data persists after page refresh."

**Definition of Done:**
- Can create tasks via frontend
- Can view all tasks on task board
- Can edit task details
- Can delete tasks
- Tasks persist in MongoDB
- Tasks load after page refresh

**Post-Sprint:**
- Commit: `git add .`, `git commit -m "S3: Task CRUD complete"`
- Push: `git push origin main`

---

## 🧱 S4 – Task Status Updates and Completion

**Objectives:**
- Support task status transitions (todo → in-progress → done)
- Award points when tasks are completed
- Update member stats (points, tasks_completed)
- Handle recurring task creation

**User Stories:**
- As a family member, I can change task status by dragging cards
- As a family member, I earn points when I complete a task
- As a family member, I see my points update in real-time
- As a family member, recurring tasks auto-create next instance when completed

**Tasks:**

1. **Implement task status update logic**
   - In `crud/task.py`, enhance `update_task` to handle status changes
   - When status changes to "done", set `completed_at` timestamp
   - Manual Test Step: None (internal function)
   - User Test Prompt: "This is an internal function - no UI test needed."

2. **Implement point award system**
   - In `routers/task.py`, modify `PUT /api/v1/tasks/{taskId}` endpoint
   - When status changes to "done", call `update_member_points` from household CRUD
   - Award task.points to assignee
   - Increment tasks_completed counter
   - Manual Test Step: Drag task to "Done" column → member's points increase on dashboard
   - User Test Prompt: "Drag a task to the 'Done' column and confirm the assigned member's points increase on the dashboard."

3. **Implement recurring task creation**
   - In `routers/task.py`, when task with recurrence is marked done:
     - Calculate next due date based on recurrence pattern (daily +1 day, weekly +7 days, monthly +30 days)
     - Create new task instance with same details but new due date and status "todo"
   - Manual Test Step: Complete a weekly recurring task → new instance appears with next week's due date
   - User Test Prompt: "Complete a task with weekly recurrence and confirm a new instance appears with next week's due date."

4. **Update frontend task board for drag-and-drop**
   - Ensure `TaskBoard` component calls `PUT /api/v1/tasks/{taskId}` with new status on drop
   - Update local state optimistically
   - Handle API errors and revert on failure
   - Manual Test Step: Drag task between columns → status updates immediately → persists after refresh
   - User Test Prompt: "Drag a task between columns (To Do → In Progress → Done), refresh the page, and confirm the status persists."

5. **Update dashboard to show real-time points**
   - Ensure dashboard fetches latest household data after task completion
   - Display updated points and tasks_completed for each member
   - Manual Test Step: Complete task → return to dashboard → see updated points and task count
   - User Test Prompt: "Complete a task, navigate to the dashboard, and confirm the member's points and completed task count are updated."

**Definition of Done:**
- Can drag tasks between status columns
- Points awarded automatically on task completion
- Member stats update in real-time
- Recurring tasks auto-create next instance
- All changes persist after page refresh

**Post-Sprint:**
- Commit: `git add .`, `git commit -m "S4: Task status and completion complete"`
- Push: `git push origin main`

---

## 🧱 S5 – Fairness Dashboard Data Aggregation

**Objectives:**
- Calculate fairness metrics per member
- Aggregate task counts, points, and time investment
- Group tasks by room/category
- Provide data for charts and visualizations

**User Stories:**
- As a household manager, I can view task distribution across family members
- As a household manager, I can see who has completed the most tasks
- As a household manager, I can see time investment per member
- As a household manager, I can see task distribution by room

**Endpoints:**
- `GET /api/v1/fairness/stats`

**Tasks:**

1. **Create fairness calculation utilities**
   - Create `backend/app/utils/fairness.py`
   - Function `calculate_member_stats(tasks, members)` - returns stats per member
   - Function `calculate_room_stats(tasks)` - returns stats per room
   - Manual Test Step: None (internal function)
   - User Test Prompt: "This is an internal function - no UI test needed."

2. **Implement GET /api/v1/fairness/stats endpoint**
   - Create `backend/app/routers/fairness.py`
   - `GET /api/v1/fairness/stats` - protected route
   - Get all tasks for household
   - Get household members
   - Calculate stats per member: `taskCount`, `completedCount`, `points`, `hours`
   - Calculate stats per room: `count`, `points`
   - Return `{ "members": [...], "rooms": [...] }`
   - Manual Test Step: Go to Fairness page → charts display with correct data
   - User Test Prompt: "Go to the Fairness page and confirm all charts display with accurate data for each family member and room."

3. **Update frontend Fairness page**
   - Update `frontend/src/pages/Fairness.tsx` to call `GET /api/v1/fairness/stats`
   - Replace local calculations with backend data
   - Display charts with fetched data
   - Manual Test Step: Complete tasks → go to Fairness page → see updated stats
   - User Test Prompt: "Complete a few tasks, then go to the Fairness page and confirm the statistics and charts reflect the completed tasks."

**Definition of Done:**
- Fairness page displays accurate member stats
- Charts show task distribution by member
- Charts show time investment by member
- Charts show task distribution by room
- Data updates after task completion

**Post-Sprint:**
- Commit: `git add .`, `git commit -m "S5: Fairness dashboard complete"`
- Push: `git push origin main`

---

## 🧱 S6 – Templates Management

**Objectives:**
- Store pre-built templates in database
- Support custom template creation
- Apply templates to create multiple tasks at once
- Delete custom templates

**User Stories:**
- As a household manager, I can browse pre-built task templates
- As a household manager, I can create custom templates
- As a household manager, I can apply templates to create tasks quickly
- As a household manager, I can delete my custom templates

**Endpoints:**
- `GET /api/v1/templates`
- `POST /api/v1/templates`
- `DELETE /api/v1/templates/{templateId}`
- `POST /api/v1/templates/{templateId}/apply`

**Tasks:**

1. **Create template model**
   - Create `backend/app/models/template.py` with Pydantic model
   - Fields: `name`, `category`, `description`, `is_custom`, `household_id`, `created_by`, `tasks` (array)
   - Manual Test Step: None (internal model)
   - User Test Prompt: "This is an internal model - no UI test needed."

2. **Seed pre-built templates**
   - Create `backend/app/utils/seed_templates.py`
   - Function to insert pre-built templates (Travel Prep, Back to School, Spring Cleaning) on first run
   - Call during app startup if templates collection is empty
   - Manual Test Step: Start backend → pre-built templates appear in Templates page
   - User Test Prompt: "Start the backend and go to the Templates page. Confirm pre-built templates (Travel Prep, Back to School, Spring Cleaning) are visible."

3. **Create template CRUD operations**
   - Create `backend/app/crud/template.py` with async functions:
     - `get_all_templates(db, household_id)` - returns pre-built + household custom
     - `create_template(db, household_id, template_data)`
     - `delete_template(db, template_id, household_id)` - only if is_custom=true
   - Manual Test Step: None (internal function)
   - User Test Prompt: "This is an internal function - no UI test needed."

4. **Implement GET /api/v1/templates endpoint**
   - Create `backend/app/routers/template.py`
   - `GET /api/v1/templates` - protected route
   - Get all pre-built templates + custom templates for user's household
   - Return array of templates
   - Manual Test Step: Go to Templates page → see pre-built and custom templates
   - User Test Prompt: "Go to the Templates page and confirm you see both pre-built templates and any custom templates you've created."

5. **Implement POST /api/v1/templates endpoint**
   - In `routers/template.py`, add `POST /api/v1/templates`
   - Request: `{ "name", "category", "description", "tasks": [...] }`
   - Create custom template with `is_custom=true` and `household_id`
   - Return created template
   - Manual Test Step: Click "Create Template" → fill form → save → template appears in list
   - User Test Prompt: "Click 'Create Template', fill in the form with name, category, description, and tasks, then save. Confirm the new template appears in your templates list."

6. **Implement DELETE /api/v1/templates/{templateId} endpoint**
   - In `routers/template.py`, add `DELETE /api/v1/templates/{templateId}`
   - Verify template is custom and belongs to user's household
   - Delete template
   - Return success message
   - Manual Test Step: Click delete on custom template → confirm → template removed
   - User Test Prompt: "Click delete on one of your custom templates, confirm the deletion, and verify it's removed from the list."

7. **Implement POST /api/v1/templates/{templateId}/apply endpoint**
   - In `routers/template.py`, add `POST /api/v1/templates/{templateId}/apply`
   - Request: `{ "assignments": { "0": "member-1", "1": "member-2" }, "startDate": "ISO8601" }`
   - Create tasks from template.tasks array
   - Assign each task based on assignments map
   - Set due dates relative to startDate
   - Return array of created tasks
   - Manual Test Step: Click "Apply Template" → assign tasks to members → set start date → save → tasks appear on board
   - User Test Prompt: "Click 'Apply Template' on a template, assign tasks to family members, set a start date, and save. Confirm all tasks from the template appear on the task board."

8. **Update frontend Templates page**
   - Update `frontend/src/pages/Templates.tsx` to call backend APIs
   - Replace mock data with API calls
   - Handle template application flow
   - Manual Test Step: Browse, create, apply, delete templates → all work correctly
   - User Test Prompt: "Test the full template workflow: browse templates, create a custom one, apply it to create tasks, then delete the custom template. Confirm all operations work correctly."

**Definition of Done:**
- Pre-built templates visible on Templates page
- Can create custom templates
- Can apply templates to create multiple tasks
- Can delete custom templates
- All operations persist in database

**Post-Sprint:**
- Commit: `git add .`, `git commit -m "S6: Templates management complete"`
- Push: `git push origin main`

---

## 🧱 S7 – Appreciation Notes and Badges

**Objectives:**
- Support sending appreciation notes between family members
- Display appreciation notes on dashboard and family page
- Track badge achievements
- Award badges based on task completion milestones

**User Stories:**
- As a family member, I can send appreciation notes to other members
- As a family member, I can view appreciation notes sent to me
- As a family member, I can see which badges I've earned
- As a family member, I earn badges automatically when I reach milestones

**Endpoints:**
- `GET /api/v1/notes`
- `POST /api/v1/notes`
- `GET /api/v1/badges`

**Tasks:**

1. **Create appreciation note model**
   - Create `backend/app/models/note.py` with Pydantic model
   - Fields: `household_id`, `from_id`, `to_id`, `message`, `created_at`
   - Manual Test Step: None (internal model)
   - User Test Prompt: "This is an internal model - no UI test needed."

2. **Create note CRUD operations**
   - Create `backend/app/crud/note.py` with async functions:
     - `create_note(db, household_id, from_id, to_id, message)`
     - `get_notes_by_household(db, household_id, limit)`
   - Manual Test Step: None (internal function)
   - User Test Prompt: "This is an internal function - no UI test needed."

3. **Implement POST /api/v1/notes endpoint**
   - Create `backend/app/routers/note.py`
   - `POST /api/v1/notes` - protected route
   - Request: `{ "toId", "message" }`
   - Create note in database
   - Return created note
   - Manual Test Step: Go to Family page → click "Send Appreciation" → write message → send → note appears
   - User Test Prompt: "Go to the Family page, click 'Send Appreciation' on a member, write a message, and send. Confirm the note appears in the appreciation section."

4. **Implement GET /api/v1/notes endpoint**
   - In `routers/note.py`, add `GET /api/v1/notes`
   - Get recent notes for household (limit 50)
   - Return array of notes
   - Manual Test Step: Go to Dashboard → see recent appreciation notes
   - User Test Prompt: "Go to the Dashboard and confirm recent appreciation notes are displayed in the appreciation section."

5. **Seed badge definitions**
   - Create `backend/app/utils/seed_badges.py`
   - Insert badge definitions (Task Master, Team Player, Consistency Champion, Early Bird) on first run
   - Call during app startup if badges collection is empty
   - Manual Test Step: Start backend → badges appear in Family page
   - User Test Prompt: "Start the backend and go to the Family page. Confirm badge definitions are visible."

6. **Create badge checking logic**
   - Create `backend/app/utils/badges.py`
   - Function `check_and_award_badges(db, household_id, member_id, tasks_completed)` - checks thresholds and awards badges
   - Called after task completion
   - Manual Test Step: None (internal function)
   - User Test Prompt: "This is an internal function - no UI test needed."

7. **Implement GET /api/v1/badges endpoint**
   - Create `backend/app/routers/badge.py`
   - `GET /api/v1/badges` - protected route
   - Get all badge definitions
   - Include earned status for current household members
   - Return array of badges
   - Manual Test Step: Go to Family page → see badges with earned status
   - User Test Prompt: "Go to the Family page and confirm badges are displayed with indicators showing which members have earned them."

8. **Integrate badge awarding with task completion**
   - In `routers/task.py`, after marking task done and awarding points:
     - Call `check_and_award_badges` to see if member earned new badges
     - Update badge.earned_by array if threshold reached
   - Manual Test Step: Complete 10th task → earn "Task Master" badge → badge appears on Family page
   - User Test Prompt: "Complete your 10th task and confirm you earn the 'Task Master' badge, which appears on the Family page."

9. **Update frontend to display notes and badges**
   - Update `frontend/src/pages/Dashboard.tsx` to fetch and display notes
   - Update `frontend/src/pages/Family.tsx` to fetch and display badges
   - Add UI for sending appreciation notes
   - Manual Test Step: Send note → complete tasks → earn badges → all display correctly
   - User Test Prompt: "Send an appreciation note, complete tasks to earn badges, and confirm everything displays correctly on the Dashboard and Family pages."

**Definition of Done:**
- Can send appreciation notes via UI
- Notes display on Dashboard and Family page
- Badges display with earned status
- Badges automatically awarded on milestones
- All data persists in database

**Post-Sprint:**
- Commit: `git add .`, `git commit -m "S7: Appreciation and badges complete"`
- Push: `git push origin main`

---

## ✅ FINAL CHECKLIST

After completing all sprints, verify:

- [ ] All frontend features work end-to-end with backend
- [ ] Data persists in MongoDB Atlas across sessions
- [ ] Authentication protects all routes correctly
- [ ] Multi-user households can collaborate
- [ ] All manual tests passed via frontend UI
- [ ] Code pushed to GitHub `main` branch
- [ ] No sensitive data (`.env`, passwords) in repository
- [ ] Backend runs on port 8000 with `/api/v1` base path
- [ ] CORS configured for frontend origin
- [ ] Error handling returns proper error envelopes

---

## 🎯 SUCCESS METRICS

**Technical:**
- Backend responds to all API calls within 500ms
- Database queries optimized with proper indexes
- JWT tokens expire after 7 days
- All passwords hashed with Argon2

**Functional:**
- Users can complete full onboarding flow
- Tasks can be created, updated, and completed
- Points and badges awarded correctly
- Fairness metrics calculate accurately
- Templates apply and create tasks correctly

**User Experience:**
- No CORS errors in browser console
- Loading states display during API calls
- Error messages clear and actionable
- Data syncs across devices for same household

---

**END OF BACKEND DEVELOPMENT PLAN**