# 🚀 Servers Running

## Backend Server
- **Status**: ✅ Running
- **Port**: 8000
- **URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/healthz

### Available Endpoints:
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user (protected)

## Frontend Server
- **Status**: ✅ Running
- **Port**: 5173 (default Vite port)
- **URL**: http://localhost:5173

---

## ⚠️ Important Configuration

### Backend Configuration Required

The backend server needs a valid MongoDB Atlas connection. Update [`backend/.env`](backend/.env):

```env
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/familyflow?retryWrites=true&w=majority
JWT_SECRET=your-secure-random-string-at-least-32-characters-long
```

**Steps to get MongoDB Atlas URI:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster (if you don't have one)
3. Create a database user
4. Get your connection string
5. Replace `<username>`, `<password>`, and `<cluster>` in the URI

### Frontend Configuration

The frontend currently uses localStorage for data. To connect it to the backend:

1. Update API base URL in frontend code
2. Implement authentication flow
3. Add JWT token management
4. Update data fetching to use backend APIs

---

## 🧪 Testing the Backend

### Test Signup (using curl):
```bash
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "household_name": "Test Household"
  }'
```

### Test Login:
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Protected Endpoint:
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

Or use the interactive API docs at http://localhost:8000/docs

---

## 📋 Next Development Steps

### Immediate:
1. ✅ Sprint 0 - Environment setup (COMPLETE)
2. ✅ Sprint 1 - Authentication (COMPLETE)
3. ⏳ Configure MongoDB Atlas connection
4. ⏳ Test authentication endpoints

### Upcoming Sprints:
- **Sprint 2**: Household management endpoints
- **Sprint 3**: Task CRUD operations
- **Sprint 4**: Task status updates and completion
- **Sprint 5**: Fairness dashboard
- **Sprint 6**: Templates management
- **Sprint 7**: Appreciation notes and badges

### Frontend Integration:
- Connect frontend to backend APIs
- Implement JWT token storage and management
- Update all data operations to use backend
- Test end-to-end flows

---

## 📚 Documentation

- [`backend/README.md`](backend/README.md) - Backend setup guide
- [`backend/SPRINT_STATUS.md`](backend/SPRINT_STATUS.md) - Sprint progress tracker
- [`Backend-dev-plan.md`](Backend-dev-plan.md) - Complete development plan
- [`frontend/README.md`](frontend/README.md) - Frontend documentation

---

## 🛑 Stopping Servers

To stop the servers, press `Ctrl+C` in each terminal window.