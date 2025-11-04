# Production Deployment Issues - CORS & API Configuration

## Problem Summary

The production frontend (https://familyapp-nvvp.onrender.com) is failing to connect to the backend with two critical issues:

### 1. Frontend Pointing to Localhost
**Error:** `Access to fetch at 'http://localhost:8000/api/v1/auth/signup' from origin 'https://familyapp-nvvp.onrender.com' has been blocked by CORS`

**Root Cause:** The frontend is hardcoded to use `http://localhost:8000` as the API base URL in production.

**Location:** `frontend/src/services/api.ts:6`
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

### 2. Backend CORS Not Configured for Production Domain
**Error:** `OPTIONS /api/v1/auth/signup HTTP/1.1" 400 Bad Request`

**Root Cause:** The backend CORS settings only allow `http://localhost:5173` by default.

**Location:** `backend/app/config.py:25`
```python
cors_origins: str = "http://localhost:5173"
```

## Solution

### Step 1: Configure Frontend Environment Variable

Create a `.env` file in the frontend directory (or configure in Render dashboard):

```env
VITE_API_URL=https://your-backend-url.onrender.com
```

**For Render Deployment:**
1. Go to your frontend service in Render dashboard
2. Navigate to "Environment" section
3. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-url.onrender.com` (replace with actual backend URL)

### Step 2: Configure Backend CORS Origins

Update the backend environment variable (in Render dashboard or `.env` file):

```env
CORS_ORIGINS=http://localhost:5173,https://familyapp-nvvp.onrender.com
```

**For Render Deployment:**
1. Go to your backend service in Render dashboard
2. Navigate to "Environment" section
3. Update the `CORS_ORIGINS` variable to include your production frontend URL:
   - Key: `CORS_ORIGINS`
   - Value: `http://localhost:5173,https://familyapp-nvvp.onrender.com`

### Step 3: Redeploy Both Services

After updating environment variables in Render:
1. Redeploy the backend service (it will pick up the new CORS settings)
2. Redeploy the frontend service (it will pick up the new API URL)

## Verification Steps

1. **Check Backend Health:**
   ```bash
   curl https://your-backend-url.onrender.com/health
   ```
   Should return: `{"status": "healthy", ...}`

2. **Check CORS Headers:**
   ```bash
   curl -I -X OPTIONS https://your-backend-url.onrender.com/api/v1/auth/signup \
     -H "Origin: https://familyapp-nvvp.onrender.com" \
     -H "Access-Control-Request-Method: POST"
   ```
   Should include: `Access-Control-Allow-Origin: https://familyapp-nvvp.onrender.com`

3. **Test Frontend:**
   - Open https://familyapp-nvvp.onrender.com
   - Open browser DevTools (F12) → Network tab
   - Try to register/login
   - Verify requests go to production backend URL (not localhost)

## Additional Recommendations

### 1. Create Frontend .env.example
Create `frontend/.env.example` for documentation:
```env
# API Configuration
VITE_API_URL=http://localhost:8000
```

### 2. Update Frontend README
Add deployment instructions to `frontend/README.md`:
```markdown
## Environment Variables

- `VITE_API_URL`: Backend API URL (default: http://localhost:8000)
  - Development: http://localhost:8000
  - Production: https://your-backend-url.onrender.com
```

### 3. Consider Dynamic CORS Configuration
For better security, you might want to restrict CORS in production:

```python
# backend/app/config.py
@property
def cors_origins_list(self) -> List[str]:
    """Parse CORS origins from comma-separated string."""
    origins = [origin.strip() for origin in self.cors_origins.split(",")]
    
    # In production, only allow specific domains
    if self.app_env == "production":
        # Filter out localhost origins
        origins = [o for o in origins if not o.startswith("http://localhost")]
    
    return origins
```

## Common Pitfalls to Avoid

1. **Don't commit .env files** - They contain secrets
2. **Always use HTTPS in production** - HTTP will cause mixed content errors
3. **Update both frontend and backend** - They must match
4. **Clear browser cache** - Old cached files may still use localhost
5. **Check Render logs** - Both services should show successful startup

## Current Configuration Status

- ✅ Backend CORS middleware configured in `backend/app/main.py:77-83`
- ✅ Frontend API service uses environment variable in `frontend/src/services/api.ts:6`
- ❌ Frontend `.env` not configured with production backend URL
- ❌ Backend CORS not configured to allow production frontend domain

## Next Steps

1. Get your backend URL from Render (e.g., `https://familyflow-backend-xyz.onrender.com`)
2. Add `VITE_API_URL` to frontend environment variables in Render
3. Add production frontend URL to `CORS_ORIGINS` in backend environment variables
4. Redeploy both services
5. Test registration/login functionality