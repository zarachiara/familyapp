import { OnboardingTask } from '@/types/onboarding';

export const defaultOnboardingTasks: OnboardingTask[] = [
  // Kitchen Domain - Daily
  {
    id: 'task-kitchen-1',
    name: 'Cooking Dinner',
    category: 'daily',
    domain: 'kitchen',
    estimatedMinutes: 45,
    defaultPoints: 25,
  },
  {
    id: 'task-kitchen-2',
    name: 'Washing Dishes',
    category: 'daily',
    domain: 'kitchen',
    estimatedMinutes: 20,
    defaultPoints: 15,
  },
  {
    id: 'task-kitchen-3',
    name: 'Packing Lunches',
    category: 'daily',
    domain: 'kitchen',
    estimatedMinutes: 15,
    defaultPoints: 10,
  },
  {
    id: 'task-kitchen-4',
    name: 'Cooking Breakfast',
    category: 'daily',
    domain: 'kitchen',
    estimatedMinutes: 20,
    defaultPoints: 15,
  },
  {
    id: 'task-kitchen-5',
    name: 'Wiping Counters',
    category: 'daily',
    domain: 'kitchen',
    estimatedMinutes: 10,
    defaultPoints: 8,
  },
  {
    id: 'task-kitchen-6',
    name: 'Deep Kitchen Clean',
    category: 'monthly',
    domain: 'kitchen',
    estimatedMinutes: 120,
    defaultPoints: 50,
  },
  {
    id: 'task-kitchen-7',
    name: 'Organizing Pantry',
    category: 'monthly',
    domain: 'kitchen',
    estimatedMinutes: 60,
    defaultPoints: 30,
  },

  // Maintenance Domain
  {
    id: 'task-maintenance-1',
    name: 'Laundry (wash, dry, fold)',
    category: 'weekly',
    domain: 'maintenance',
    estimatedMinutes: 120,
    defaultPoints: 35,
  },
  {
    id: 'task-maintenance-2',
    name: 'Changing Bed Sheets',
    category: 'weekly',
    domain: 'maintenance',
    estimatedMinutes: 30,
    defaultPoints: 15,
  },
  {
    id: 'task-maintenance-3',
    name: 'Taking Out Trash',
    category: 'daily',
    domain: 'maintenance',
    estimatedMinutes: 5,
    defaultPoints: 5,
  },
  {
    id: 'task-maintenance-4',
    name: 'Organizing Closets',
    category: 'monthly',
    domain: 'maintenance',
    estimatedMinutes: 90,
    defaultPoints: 40,
  },
  {
    id: 'task-maintenance-5',
    name: 'Car Maintenance',
    category: 'monthly',
    domain: 'maintenance',
    estimatedMinutes: 45,
    defaultPoints: 25,
  },
  {
    id: 'task-maintenance-6',
    name: 'Decluttering & Donations',
    category: 'monthly',
    domain: 'maintenance',
    estimatedMinutes: 90,
    defaultPoints: 35,
  },

  // Care Domain
  {
    id: 'task-care-1',
    name: 'Pet Care (feeding, walking)',
    category: 'daily',
    domain: 'care',
    estimatedMinutes: 30,
    defaultPoints: 20,
  },
  {
    id: 'task-care-2',
    name: 'Plant Watering',
    category: 'weekly',
    domain: 'care',
    estimatedMinutes: 15,
    defaultPoints: 10,
  },
  {
    id: 'task-care-3',
    name: 'Kid Homework Help',
    category: 'daily',
    domain: 'care',
    estimatedMinutes: 30,
    defaultPoints: 20,
  },
  {
    id: 'task-care-4',
    name: 'Bedtime Routine',
    category: 'daily',
    domain: 'care',
    estimatedMinutes: 30,
    defaultPoints: 15,
  },
  {
    id: 'task-care-5',
    name: 'Doctor Appointments',
    category: 'monthly',
    domain: 'care',
    estimatedMinutes: 120,
    defaultPoints: 40,
  },

  // Planning Domain
  {
    id: 'task-planning-1',
    name: 'Meal Planning',
    category: 'weekly',
    domain: 'planning',
    estimatedMinutes: 30,
    defaultPoints: 20,
  },
  {
    id: 'task-planning-2',
    name: 'Grocery Shopping',
    category: 'weekly',
    domain: 'planning',
    estimatedMinutes: 90,
    defaultPoints: 40,
  },
  {
    id: 'task-planning-3',
    name: 'Bill Payment & Budgeting',
    category: 'monthly',
    domain: 'planning',
    estimatedMinutes: 60,
    defaultPoints: 30,
  },
  {
    id: 'task-planning-4',
    name: 'Making Grocery List',
    category: 'weekly',
    domain: 'planning',
    estimatedMinutes: 15,
    defaultPoints: 10,
  },
  {
    id: 'task-planning-5',
    name: 'Scheduling Family Events',
    category: 'monthly',
    domain: 'planning',
    estimatedMinutes: 30,
    defaultPoints: 20,
  },

  // Cleaning Domain
  {
    id: 'task-cleaning-1',
    name: 'Vacuuming',
    category: 'weekly',
    domain: 'cleaning',
    estimatedMinutes: 45,
    defaultPoints: 25,
  },
  {
    id: 'task-cleaning-2',
    name: 'Bathroom Cleaning',
    category: 'weekly',
    domain: 'cleaning',
    estimatedMinutes: 60,
    defaultPoints: 30,
  },
  {
    id: 'task-cleaning-3',
    name: 'Mopping Floors',
    category: 'weekly',
    domain: 'cleaning',
    estimatedMinutes: 40,
    defaultPoints: 25,
  },
  {
    id: 'task-cleaning-4',
    name: 'Tidying Living Room',
    category: 'daily',
    domain: 'cleaning',
    estimatedMinutes: 15,
    defaultPoints: 10,
  },
  {
    id: 'task-cleaning-5',
    name: 'Making Beds',
    category: 'daily',
    domain: 'cleaning',
    estimatedMinutes: 10,
    defaultPoints: 10,
  },
  {
    id: 'task-cleaning-6',
    name: 'Window Cleaning',
    category: 'monthly',
    domain: 'cleaning',
    estimatedMinutes: 60,
    defaultPoints: 30,
  },
  {
    id: 'task-cleaning-7',
    name: 'Dusting',
    category: 'weekly',
    domain: 'cleaning',
    estimatedMinutes: 30,
    defaultPoints: 15,
  },

  // Outdoor Domain
  {
    id: 'task-outdoor-1',
    name: 'Yard Work',
    category: 'weekly',
    domain: 'outdoor',
    estimatedMinutes: 60,
    defaultPoints: 30,
  },
  {
    id: 'task-outdoor-2',
    name: 'Mowing Lawn',
    category: 'weekly',
    domain: 'outdoor',
    estimatedMinutes: 45,
    defaultPoints: 25,
  },
  {
    id: 'task-outdoor-3',
    name: 'Watering Garden',
    category: 'daily',
    domain: 'outdoor',
    estimatedMinutes: 15,
    defaultPoints: 10,
  },
  {
    id: 'task-outdoor-4',
    name: 'Garage Organization',
    category: 'monthly',
    domain: 'outdoor',
    estimatedMinutes: 90,
    defaultPoints: 35,
  },
  {
    id: 'task-outdoor-5',
    name: 'Taking Out Recycling',
    category: 'weekly',
    domain: 'outdoor',
    estimatedMinutes: 10,
    defaultPoints: 8,
  },
];

// Helper function to get tasks by domain
export const getTasksByDomain = (domain: OnboardingTask['domain']): OnboardingTask[] => {
  return defaultOnboardingTasks.filter(task => task.domain === domain);
};

// Helper function to sample tasks for balanced rounds (max 10 tasks to avoid user fatigue)
export const sampleTasksForRounds = (maxTasks: number = 10): OnboardingTask[] => {
  const domains: OnboardingTask['domain'][] = ['kitchen', 'maintenance', 'care', 'planning', 'cleaning', 'outdoor'];
  const sampledTasks: OnboardingTask[] = [];
  
  // Calculate tasks per domain to reach maxTasks while ensuring each domain is represented
  const tasksPerDomain = Math.max(1, Math.floor(maxTasks / domains.length));
  const remainder = maxTasks % domains.length;

  domains.forEach((domain, index) => {
    const domainTasks = getTasksByDomain(domain);
    // Shuffle and take tasks
    const shuffled = [...domainTasks].sort(() => Math.random() - 0.5);
    // Give extra task to first domains if there's a remainder
    const numToTake = tasksPerDomain + (index < remainder ? 1 : 0);
    sampledTasks.push(...shuffled.slice(0, Math.min(numToTake, domainTasks.length)));
  });

  // Shuffle the final list to mix domains
  return sampledTasks.sort(() => Math.random() - 0.5).slice(0, maxTasks);
};

// Helper to create balanced rounds (mix of domains)
export const createBalancedRounds = (sampledTasks: OnboardingTask[], tasksPerRound: number = 4): OnboardingTask[][] => {
  const rounds: OnboardingTask[][] = [];
  const tasksByDomain = new Map<string, OnboardingTask[]>();

  // Group sampled tasks by domain
  sampledTasks.forEach(task => {
    if (!tasksByDomain.has(task.domain)) {
      tasksByDomain.set(task.domain, []);
    }
    tasksByDomain.get(task.domain)!.push(task);
  });

  // Create rounds with one task from each domain
  const domains = Array.from(tasksByDomain.keys());
  const maxRounds = Math.max(...Array.from(tasksByDomain.values()).map(tasks => tasks.length));

  for (let i = 0; i < maxRounds; i++) {
    const round: OnboardingTask[] = [];
    domains.forEach(domain => {
      const domainTasks = tasksByDomain.get(domain)!;
      if (i < domainTasks.length) {
        round.push(domainTasks[i]);
      }
    });
    if (round.length > 0) {
      rounds.push(round);
    }
  }

  return rounds;
};