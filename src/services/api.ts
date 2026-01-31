import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:32769';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor to include Bearer token from Supabase session
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface TaleChoice {
  id: string;
  title: string | null;
  votes: number;
  previewText: string;
}

export interface TaleResponse {
  id: string;
  title: string | null;
  authorName: string | null;
  authorId: string | null;
  content: string;
  createdAt: string;
  isDeleted: boolean;
  votes: number;
  hasVoted: boolean;
  choices: TaleChoice[];
  totalChoices: number;
}

export const fetchTale = async (id: string): Promise<TaleResponse> => {
  const response = await api.get<TaleResponse>(`/Tales/${id}`);
  return response.data;
};

export interface GetTaleChoicesParams {
  taleId: string;
  page?: number;
  size?: number;
}

export interface PaginatedChoicesResponse {
  items: TaleChoice[];
  page: number;
  size: number;
  totalCount: number;
  hasNextPage: boolean;
}

export const getTaleChoices = async ({ taleId, page = 1, size = 10 }: GetTaleChoicesParams): Promise<PaginatedChoicesResponse> => {
  const response = await api.get<PaginatedChoicesResponse>(`/Tales/${taleId}/choices`, {
    params: { page, size },
  });
  return response.data;
};

export interface RootTale {
  id: string;
  preview: string;
  title: string | null;
  authorName: string | null;
  authorId: string | null;
  seriesVotes: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalCount: number;
  hasNextPage: boolean;
}

export type SortOption = 'votes' | 'recent';

export interface FetchRootsParams {
  page?: number;
  size?: number;
  sort?: SortOption;
}

export const fetchRoots = async ({ page = 1, size = 10, sort = 'votes' }: FetchRootsParams = {}): Promise<PaginatedResponse<RootTale>> => {
  const response = await api.get<PaginatedResponse<RootTale>>('/tales/roots', {
    params: { page, size, sort },
  });
  return response.data;
};

export interface CreateTaleRequest {
  content: string;
  parentTaleId: string | null;
  authorId: string;
  title: string | null;
}

export interface CreateTaleResponse {
  id: string;
  content: string;
}

export const createTale = async (request: CreateTaleRequest): Promise<CreateTaleResponse> => {
  const response = await api.post<CreateTaleResponse>('/Tales', {
    content: request.content,
    parentTaleId: request.parentTaleId,
    authorId: request.authorId,
    title: request.title,
  });
  return response.data;
};

export interface SubmitFeedbackRequest {
  email: string;
  message: string;
}

export const submitFeedback = async (email: string, message: string): Promise<void> => {
  await api.post('/api/feedback', { email, message });
};

export const voteForTale = async (taleId: string): Promise<void> => {
  await api.post(`/tales/${taleId}/vote`);
};

// Story Map types for the graph visualization
export type StoryMapNodeType = 'ROOT' | 'BRANCH' | 'LEAF';

export interface StoryMapNode {
  id: string;
  label: string;
  type: StoryMapNodeType;
  isDeleted: boolean;
}

export interface StoryMapEdge {
  sourceId: string;
  targetId: string;
  votes: number;
}

export interface StoryMapResponse {
  nodes: StoryMapNode[];
  edges: StoryMapEdge[];
}

export const getStoryMap = async (id: string): Promise<StoryMapResponse> => {
  const response = await api.get<StoryMapResponse>(`/Tales/${id}/map`);
  return response.data;
};

// Profile types
export interface TaleSummary {
  id: string;
  title: string | null;
  contentPreview: string;
  createdAt: string;
  votesReceived: number;
}

export interface UserProfile {
  username: string;
  totalTalesWritten: number;
  totalVotesReceived: number;
  myRoots: TaleSummary[];
  myBranches: TaleSummary[];
}

export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await api.get<UserProfile>('/api/Users/me');
  return response.data;
};

export interface UpdateTaleRequest {
  id: string;
  content: string;
  title?: string | null;
}

export const updateTale = async (request: UpdateTaleRequest): Promise<void> => {
  await api.put(`/api/tales/${request.id}`, {
    content: request.content,
    title: request.title,
  });
};

export interface DeleteTaleResult {
  success: boolean;
  hasBranches?: boolean;
  message?: string;
}

export const deleteTale = async (id: string): Promise<DeleteTaleResult> => {
  try {
    await api.delete(`/api/tales/${id}`);
    return { success: true };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      return { 
        success: false, 
        hasBranches: true, 
        message: 'This chapter has branches! You can only edit it.' 
      };
    }
    throw error;
  }
};

// Search types and API
export interface SearchResult {
  id: string;
  title: string | null;
  content: string;
  authorName: string | null;
  authorId: string;
  createdAt: string;
  choices: unknown[];
}

export const searchTales = async (query: string, limit: number = 10): Promise<SearchResult[]> => {
  const response = await api.get<SearchResult[]>('/Tales/search', {
    params: { query, limit },
  });
  return response.data;
};

// Notification types and API
export interface Notification {
  id: string;
  message: string;
  relatedTaleId: string;
  createdAt: string;
  isRead: boolean;
}

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get<Notification[]>('/api/notifications');
  return response.data;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await api.post(`/api/notifications/${id}/read`);
};
