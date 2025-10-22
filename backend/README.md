# FamilyFlow Backend

FastAPI backend for the FamilyFlow household task management application.

## Prerequisites

- Python 3.13+
- MongoDB Atlas account with a cluster set up
- pip (Python package manager)

## Setup Instructions

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

Edit `.env` and set your values:

```env
APP_ENV=development
PORT=8000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/familyflow?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_EXPIRES_IN=604800
CORS_ORIGINS=http://localhost:5173
```

**Important:** 
- Replace `MONGODB_URI` with your actual MongoDB Atlas connection string
- Generate a secure `JWT_SECRET` (minimum 32 characters)
- Update `CORS_ORIGINS` to match your frontend URL

### 4. Run the Application

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Health Check: http://localhost:8000/healthz
- API Documentation: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc

## API Endpoints

### Health Check
- `GET /healthz` - Check API and database connectivity

### Base Path
All API endpoints are prefixed with `/api/v1` (to be implemented in future sprints)

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI application and routes
│   ├── config.py        # Configuration and environment variables
│   └── database.py      # MongoDB connection management
├── requirements.txt     # Python dependencies
├── .env.example        # Example environment variables
└── README.md           # This file
```

## Development

### Running Tests
Tests will be added in future sprints.

### Code Style
Follow PEP 8 guidelines for Python code.

## Sprint 0 Completion

✅ FastAPI skeleton with `/healthz` endpoint  
✅ MongoDB Atlas connection  
✅ Configuration management with environment variables  
✅ CORS enabled for frontend  
✅ Git repository initialized  

## Next Steps

- Sprint 1: Authentication (signup, login, logout)
- Sprint 2: Household and family member management
- Sprint 3: Task CRUD operations