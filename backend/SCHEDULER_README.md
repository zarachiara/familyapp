# Persistent Scheduler System

## Overview

The FamilyFlow backend includes a robust persistent scheduler system that can execute tasks at regular intervals (e.g., every 30 days) and maintains its schedule even when the server restarts. The system uses MongoDB for persistence and APScheduler for task execution.

## Architecture

### Components

1. **Database Models** (`app/models/scheduled_task.py`)
   - Defines the structure for scheduled tasks in MongoDB
   - Tracks task metadata, execution history, and next run times

2. **CRUD Operations** (`app/crud/scheduled_task.py`)
   - Database operations for creating, reading, updating, and deleting scheduled tasks
   - Functions to mark tasks as executed and calculate next run times

3. **Scheduler Service** (`app/services/scheduler.py`)
   - `PersistentScheduler` class that manages task scheduling
   - Automatically loads tasks from database on startup
   - Executes overdue tasks immediately after restart
   - Reschedules tasks for future execution

4. **Task Handlers** (`app/services/task_handlers.py`)
   - Defines the actual work to be performed by each task type
   - Includes handlers for: data backup, cleanup, export, and health checks

5. **API Endpoints** (`app/routers/scheduler.py`)
   - RESTful API for managing scheduled tasks
   - Endpoints for creating, listing, updating, enabling/disabling, and deleting tasks

## How It Works

### Persistence Across Restarts

1. **Task Storage**: All scheduled tasks are stored in MongoDB with their configuration and next run time
2. **Startup Recovery**: When the server starts, the scheduler:
   - Loads all enabled tasks from the database
   - Checks for overdue tasks (tasks that should have run while the server was down)
   - Executes overdue tasks immediately
   - Schedules all tasks for their next run time

3. **Execution Tracking**: After each task execution:
   - The `last_run` timestamp is updated
   - The `next_run` time is calculated based on the interval
   - Execution metadata (status, duration, results) is stored
   - The task is automatically rescheduled

### Task Types

The system supports multiple task types, each with its own handler:

- **`data_backup`**: Backs up data and stores backup metadata
- **`data_cleanup`**: Removes old logs and temporary data
- **`data_export`**: Exports data to external formats
- **`health_check`**: Performs system health checks

## Usage

### Creating a Scheduled Task

#### Via API

```bash
POST /api/scheduler/tasks
Content-Type: application/json

{
  "task_name": "Monthly Data Backup",
  "task_type": "data_backup",
  "interval_days": 30,
  "enabled": true
}
```

#### Programmatically

```python
from app.services import get_scheduler

scheduler = get_scheduler()
task_id = await scheduler.add_task(
    task_name="Monthly Data Backup",
    task_type="data_backup",
    interval_days=30,
    enabled=True,
    metadata={"description": "Automatic monthly backup"}
)
```

### Managing Tasks

#### List All Tasks

```bash
GET /api/scheduler/tasks
```

#### Get Task Details

```bash
GET /api/scheduler/tasks/{task_id}
```

#### Enable/Disable Task

```bash
POST /api/scheduler/tasks/{task_id}/enable
POST /api/scheduler/tasks/{task_id}/disable
```

#### Update Task

```bash
PATCH /api/scheduler/tasks/{task_id}
Content-Type: application/json

{
  "interval_days": 60,
  "enabled": true
}
```

#### Delete Task

```bash
DELETE /api/scheduler/tasks/{task_id}
```

### Checking Scheduler Status

```bash
GET /api/scheduler/status
```

Returns:
```json
{
  "running": true,
  "initialized": true,
  "registered_handlers": ["data_backup", "data_cleanup", "data_export", "health_check"],
  "scheduled_jobs": 1,
  "jobs": [
    {
      "id": "task_507f1f77bcf86cd799439011",
      "name": "Monthly Data Backup",
      "next_run": "2025-11-27T20:36:20.458Z"
    }
  ]
}
```

## Creating Custom Task Handlers

To create a new task type:

1. **Define the handler function** in `app/services/task_handlers.py`:

```python
async def my_custom_handler(task_id: str, task_name: str) -> dict:
    """
    Handler for custom task.
    
    Args:
        task_id: The scheduled task ID
        task_name: The name of the task
        
    Returns:
        Dictionary with execution results
    """
    logger.info(f"Starting custom task: {task_name}")
    
    try:
        # Your custom logic here
        result = perform_custom_work()
        
        return {
            "status": "success",
            "result": result
        }
    except Exception as e:
        logger.error(f"Custom task failed: {e}", exc_info=True)
        raise
```

2. **Register the handler** in `TASK_HANDLERS` dictionary:

```python
TASK_HANDLERS = {
    "data_backup": data_backup_handler,
    "data_cleanup": data_cleanup_handler,
    "data_export": data_export_handler,
    "health_check": health_check_handler,
    "my_custom_task": my_custom_handler,  # Add your handler
}
```

3. **Create a task** with your new task type:

```python
await scheduler.add_task(
    task_name="My Custom Task",
    task_type="my_custom_task",
    interval_days=30,
    enabled=True
)
```

## Database Schema

### scheduled_tasks Collection

```javascript
{
  "_id": ObjectId("..."),
  "task_name": "Monthly Data Backup",
  "task_type": "data_backup",
  "interval_days": 30,
  "enabled": true,
  "last_run": ISODate("2025-10-28T20:36:20.458Z"),
  "next_run": ISODate("2025-11-27T20:36:20.458Z"),
  "created_at": ISODate("2025-10-28T20:36:20.458Z"),
  "updated_at": ISODate("2025-10-28T20:36:20.458Z"),
  "metadata": {
    "last_execution_time": 1.23,
    "last_execution_status": "success",
    "last_execution_result": {...}
  }
}
```

## Configuration

The scheduler is automatically initialized when the FastAPI application starts. No additional configuration is required beyond setting up MongoDB connection in your `.env` file:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/familyflow
```

## Monitoring

### Health Check Endpoint

The main application includes a health check endpoint that reports scheduler status:

```bash
GET /health
```

Returns:
```json
{
  "status": "healthy",
  "database": "connected",
  "scheduler": {
    "running": true,
    "initialized": true,
    "registered_handlers": [...],
    "scheduled_jobs": 1,
    "jobs": [...]
  }
}
```

### Logs

The scheduler logs all important events:
- Task execution start/completion
- Execution errors
- Task scheduling/rescheduling
- Startup recovery of overdue tasks

Check your application logs for scheduler activity:

```bash
# Example log output
2025-10-28 20:36:20 - app.services.scheduler - INFO - Initializing persistent scheduler...
2025-10-28 20:36:20 - app.services.scheduler - INFO - Found 1 enabled tasks in database
2025-10-28 20:36:20 - app.services.scheduler - INFO - Scheduled task 'Monthly Data Backup' for 2025-11-27 20:36:20
2025-10-28 20:36:20 - app.services.scheduler - INFO - Persistent scheduler initialized successfully
```

## Testing

To test the scheduler persistence:

1. **Start the server**:
   ```bash
   cd backend
   python -m app.main
   ```

2. **Create a test task** with a short interval (e.g., 1 day):
   ```bash
   curl -X POST http://localhost:8000/api/scheduler/tasks \
     -H "Content-Type: application/json" \
     -d '{
       "task_name": "Test Task",
       "task_type": "health_check",
       "interval_days": 1,
       "enabled": true
     }'
   ```

3. **Check the task is scheduled**:
   ```bash
   curl http://localhost:8000/api/scheduler/status
   ```

4. **Restart the server** (Ctrl+C and restart)

5. **Verify the task is still scheduled**:
   ```bash
   curl http://localhost:8000/api/scheduler/status
   ```

The task should still be present with the same next run time, demonstrating persistence across restarts.

## Troubleshooting

### Task Not Executing

1. Check if the task is enabled:
   ```bash
   GET /api/scheduler/tasks/{task_id}
   ```

2. Verify the next_run time hasn't passed
3. Check application logs for errors
4. Ensure the task handler is registered

### Scheduler Not Starting

1. Verify MongoDB connection is working
2. Check for errors in startup logs
3. Ensure APScheduler is installed: `pip install apscheduler==3.10.4`

### Tasks Not Persisting After Restart

1. Verify MongoDB is storing tasks correctly:
   ```bash
   # In MongoDB shell
   db.scheduled_tasks.find()
   ```

2. Check that the scheduler initialization completes successfully in logs
3. Ensure the database connection is established before scheduler initialization

## Best Practices

1. **Use Descriptive Task Names**: Make it easy to identify tasks in logs and API responses
2. **Set Appropriate Intervals**: Consider your data volume and system resources
3. **Monitor Execution Times**: Check the `last_execution_time` in metadata to ensure tasks complete in reasonable time
4. **Handle Errors Gracefully**: Task handlers should catch and log errors without crashing the scheduler
5. **Test Before Production**: Create test tasks with short intervals to verify behavior
6. **Regular Monitoring**: Check scheduler status and logs regularly to ensure tasks are executing as expected

## Future Enhancements

Potential improvements to consider:

- Task dependencies (run task B after task A completes)
- Retry logic for failed tasks
- Email/webhook notifications on task completion or failure
- Task execution history dashboard
- Cron-style scheduling (specific times/days)
- Task priority levels
- Concurrent task execution limits