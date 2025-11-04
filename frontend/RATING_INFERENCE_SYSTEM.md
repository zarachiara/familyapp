# Rating Inference System

## Overview
To avoid user fatigue during onboarding, we limit task rating to a maximum of 10 tasks. The system then intelligently infers ratings for all remaining tasks based on the patterns observed in the rated tasks.

## How It Works

### 1. Task Sampling (Max 10 Tasks)
- **Location**: [`onboardingTasks.ts:sampleTasksForRounds()`](frontend/src/utils/onboardingTasks.ts:303)
- Samples up to 10 tasks ensuring representation from all 6 domains:
  - Kitchen
  - Maintenance
  - Care
  - Planning
  - Cleaning
  - Outdoor
- Tasks are distributed evenly across domains (1-2 tasks per domain)
- Final list is shuffled to mix domains for better user experience

### 2. User Rating Phase
- **Location**: [`Step3Rating.tsx`](frontend/src/components/onboarding/steps/Step3Rating.tsx)
- Each household member rates the 10 sampled tasks using a 1-5 scale:
  - 1 = 😫 Hate it
  - 2 = 😕 Dislike
  - 3 = 😐 Neutral
  - 4 = 🙂 Like
  - 5 = 😍 Love it

### 3. Inference Algorithm
- **Location**: [`useOnboardingState.ts:inferRatingsForUnratedTasks()`](frontend/src/hooks/useOnboardingState.ts:92)

For each unrated task, the system calculates an inferred rating using:

#### Domain-Based Inference (70% weight)
- Calculates average rating for all tasks in the same domain
- Example: If user rated Kitchen tasks as 4, 5, 4 → Kitchen domain average = 4.33

#### Category-Based Inference (30% weight)
- Calculates average rating for all tasks in the same category (daily/weekly/monthly)
- Example: If user rated daily tasks as 3, 4, 5 → Daily category average = 4.0

#### Combined Score
```
inferredRating = round(domainAverage * 0.7 + categoryAverage * 0.3)
```

#### Fallback Logic
- If both domain and category data exist: Use weighted average
- If only domain data exists: Use domain average
- If only category data exists: Use category average
- If neither exists: Default to 3 (neutral)

### 4. Task Assignment
- **Location**: [`taskAssignment.ts:calculateOptimalAssignments()`](frontend/src/utils/taskAssignment.ts:10)
- Uses both rated and inferred ratings to assign tasks
- Assignments based on inferred ratings are marked with `reason: 'inferred'`
- Algorithm prioritizes:
  1. Member preferences (highest ratings)
  2. Workload balance (equal distribution of time/points)
  3. Task variance (high-variance tasks assigned first)

## Benefits

1. **Reduced User Fatigue**: Only 10 tasks to rate instead of 40+
2. **Intelligent Inference**: Uses domain and category patterns for accurate predictions
3. **Fair Distribution**: Inference maintains preference patterns while balancing workload
4. **Transparency**: Inferred assignments are clearly marked in the UI

## Example Scenario

**Sampled Tasks Rated by User:**
- Cooking Dinner (Kitchen, Daily): 5 ⭐
- Washing Dishes (Kitchen, Daily): 4 ⭐
- Laundry (Maintenance, Weekly): 2 ⭐
- Vacuuming (Cleaning, Weekly): 3 ⭐
- Meal Planning (Planning, Weekly): 5 ⭐
- Grocery Shopping (Planning, Weekly): 4 ⭐
- Pet Care (Care, Daily): 5 ⭐
- Yard Work (Outdoor, Weekly): 2 ⭐
- Bathroom Cleaning (Cleaning, Weekly): 2 ⭐
- Making Beds (Cleaning, Daily): 3 ⭐

**Inferred Ratings:**
- "Cooking Breakfast" (Kitchen, Daily):
  - Domain (Kitchen): (5+4)/2 = 4.5
  - Category (Daily): (5+4+5+3)/4 = 4.25
  - Inferred: round(4.5 * 0.7 + 4.25 * 0.3) = **4 ⭐**

- "Deep Kitchen Clean" (Kitchen, Monthly):
  - Domain (Kitchen): 4.5
  - Category (Monthly): No data → use domain only
  - Inferred: **5 ⭐** (rounded from 4.5)

## Technical Implementation

### Key Files Modified
1. [`onboardingTasks.ts`](frontend/src/utils/onboardingTasks.ts) - Sampling logic
2. [`useOnboardingState.ts`](frontend/src/hooks/useOnboardingState.ts) - Inference algorithm
3. [`Step3Rating.tsx`](frontend/src/components/onboarding/steps/Step3Rating.tsx) - Rating UI
4. [`taskAssignment.ts`](frontend/src/utils/taskAssignment.ts) - Assignment logic

### Data Flow
```
1. User completes Step 2 (Task List)
   ↓
2. System samples 10 tasks from all domains
   ↓
3. Each member rates the 10 sampled tasks
   ↓
4. System infers ratings for remaining ~30 tasks
   ↓
5. Assignment algorithm uses all ratings (sampled + inferred)
   ↓
6. Tasks distributed fairly based on preferences