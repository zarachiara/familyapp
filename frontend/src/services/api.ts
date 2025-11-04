/**
 * API Service Layer
 * Handles all backend API communication with offline support and error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.detail || 'API request failed',
        response.status,
        data.code
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Network errors (offline, timeout, etc.)
    if (error instanceof TypeError || error.message.includes('fetch')) {
      throw new NetworkError();
    }
    
    throw new APIError('Unknown error occurred');
  }
}

// ============================================================================
// TASKS API
// ============================================================================

export interface TaskCreateDTO {
  title: string;
  description: string;
  assignee_id: string;
  due_date: string;
  status: 'todo' | 'in-progress' | 'done';
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  room: string;
  points: number;
  estimated_minutes: number;
}

export interface TaskUpdateDTO {
  title?: string;
  description?: string;
  assignee_id?: string;
  due_date?: string;
  status?: 'todo' | 'in-progress' | 'done';
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  room?: string;
  points?: number;
  estimated_minutes?: number;
}

export interface TaskResponseDTO {
  id: string;
  household_id: string;
  title: string;
  description: string;
  assignee_id: string;
  due_date: string;
  status: 'todo' | 'in-progress' | 'done';
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  room: string;
  points: number;
  estimated_minutes: number;
  created_by: string;
  created_at: string;
  completed_at?: string;
}

export const tasksAPI = {
  getAll: async (filters?: {
    status?: string;
    assignee_id?: string;
    room?: string;
  }): Promise<TaskResponseDTO[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.assignee_id) params.append('assignee_id', filters.assignee_id);
    if (filters?.room) params.append('room', filters.room);
    
    const query = params.toString();
    return apiRequest<TaskResponseDTO[]>(
      `/api/v1/tasks${query ? `?${query}` : ''}`
    );
  },

  getById: async (taskId: string): Promise<TaskResponseDTO> => {
    return apiRequest<TaskResponseDTO>(`/api/v1/tasks/${taskId}`);
  },

  create: async (task: TaskCreateDTO): Promise<TaskResponseDTO> => {
    return apiRequest<TaskResponseDTO>('/api/v1/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  update: async (taskId: string, updates: TaskUpdateDTO): Promise<TaskResponseDTO> => {
    return apiRequest<TaskResponseDTO>(`/api/v1/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (taskId: string): Promise<void> => {
    return apiRequest<void>(`/api/v1/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// EQUILIBRIUM API
// ============================================================================

export interface MemberCapacityDTO {
  member_id: string;
  member_name: string;
  workload_level: number;
  energy_level: number;
  emotional_capacity: number;
}

export interface EquilibriumCreateDTO {
  assignments: Record<string, string[]>;
  fairness_score: number;
  capacities: MemberCapacityDTO[];
  description?: string;
  is_active?: boolean;
}

export interface EquilibriumResponseDTO {
  id: string;
  household_id: string;
  assignments: Record<string, string[]>;
  fairness_score: number;
  capacities: MemberCapacityDTO[];
  description?: string;
  is_active: boolean;
  timestamp: string;
  created_by: string;
}

export const equilibriumAPI = {
  create: async (data: EquilibriumCreateDTO): Promise<EquilibriumResponseDTO> => {
    return apiRequest<EquilibriumResponseDTO>('/api/v1/equilibrium', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getActive: async (): Promise<EquilibriumResponseDTO> => {
    return apiRequest<EquilibriumResponseDTO>('/api/v1/equilibrium/active');
  },

  getHistory: async (limit: number = 10): Promise<EquilibriumResponseDTO[]> => {
    return apiRequest<EquilibriumResponseDTO[]>(
      `/api/v1/equilibrium/history?limit=${limit}`
    );
  },

  getById: async (equilibriumId: string): Promise<EquilibriumResponseDTO> => {
    return apiRequest<EquilibriumResponseDTO>(`/api/v1/equilibrium/${equilibriumId}`);
  },

  restore: async (equilibriumId: string): Promise<EquilibriumResponseDTO> => {
    return apiRequest<EquilibriumResponseDTO>(
      `/api/v1/equilibrium/${equilibriumId}/restore`,
      { method: 'POST' }
    );
  },

  delete: async (equilibriumId: string): Promise<void> => {
    return apiRequest<void>(`/api/v1/equilibrium/${equilibriumId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// TEMPLATES API
// ============================================================================

export interface TemplateTaskDTO {
  title: string;
  description: string;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  room: string;
  points: number;
  estimated_minutes: number;
}

export interface TemplateCreateDTO {
  name: string;
  category: string;
  description: string;
  tasks: TemplateTaskDTO[];
  is_custom: boolean;
}

export interface TemplateResponseDTO {
  id: string;
  household_id?: string;
  name: string;
  category: string;
  description: string;
  tasks: TemplateTaskDTO[];
  is_custom: boolean;
  created_by?: string;
  created_at: string;
}

export interface TemplateApplyDTO {
  assignments: Record<number, string>;
  start_date: string;
}

export const templatesAPI = {
  getAll: async (): Promise<TemplateResponseDTO[]> => {
    return apiRequest<TemplateResponseDTO[]>('/api/v1/templates');
  },

  getById: async (templateId: string): Promise<TemplateResponseDTO> => {
    return apiRequest<TemplateResponseDTO>(`/api/v1/templates/${templateId}`);
  },

  create: async (template: TemplateCreateDTO): Promise<TemplateResponseDTO> => {
    return apiRequest<TemplateResponseDTO>('/api/v1/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  },

  apply: async (templateId: string, data: TemplateApplyDTO): Promise<{ message: string; task_ids: string[] }> => {
    return apiRequest<{ message: string; task_ids: string[] }>(
      `/api/v1/templates/${templateId}/apply`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  delete: async (templateId: string): Promise<void> => {
    return apiRequest<void>(`/api/v1/templates/${templateId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// NOTES API
// ============================================================================

export interface NoteCreateDTO {
  from_id: string;
  to_id: string;
  message: string;
}

export interface NoteResponseDTO {
  id: string;
  household_id: string;
  from_id: string;
  to_id: string;
  message: string;
  created_at: string;
}

export const notesAPI = {
  getAll: async (filters?: {
    limit?: number;
    to?: string;
    from?: string;
  }): Promise<NoteResponseDTO[]> => {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.to) params.append('to', filters.to);
    if (filters?.from) params.append('from', filters.from);
    
    const query = params.toString();
    return apiRequest<NoteResponseDTO[]>(
      `/api/v1/notes${query ? `?${query}` : ''}`
    );
  },

  create: async (note: NoteCreateDTO): Promise<NoteResponseDTO> => {
    return apiRequest<NoteResponseDTO>('/api/v1/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    });
  },

  delete: async (noteId: string): Promise<void> => {
    return apiRequest<void>(`/api/v1/notes/${noteId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// BADGES API
// ============================================================================

export interface BadgeResponseDTO {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  earned_by: string[];
  created_at: string;
}

export const badgesAPI = {
  getAll: async (): Promise<BadgeResponseDTO[]> => {
    return apiRequest<BadgeResponseDTO[]>('/api/v1/badges');
  },

  getForMember: async (memberId: string): Promise<BadgeResponseDTO[]> => {
    return apiRequest<BadgeResponseDTO[]>(`/api/v1/badges/member/${memberId}`);
  },

  award: async (badgeId: string, memberId: string): Promise<BadgeResponseDTO> => {
    return apiRequest<BadgeResponseDTO>(
      `/api/v1/badges/${badgeId}/award/${memberId}`,
      { method: 'POST' }
    );
  },
};