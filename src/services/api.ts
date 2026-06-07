/**
 * Тонкий клиент к PHP-бэкенду (/api/*).
 * Все запросы идут через Vite proxy в dev и напрямую в проде (same-origin).
 */

export interface TopicDto {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  unit: string | null;
  sort_order: number;
  has_city: boolean;
  has_age: boolean;
}

export interface PeriodDto {
  id: number;
  label: string;
  year_num: number;
  is_full_year: number;
  sort_order: number;
}

export interface CategoryDto {
  id: number;
  topic_id: number;
  name: string;
  unit: string | null;
  sort_order: number;
}

export interface CityDto {
  id: number;
  name: string;
  is_region_total: number;
  sort_order: number;
}

export interface AgeGroupDto {
  id: number;
  name: string;
  sort_order: number;
}

export interface MetadataResponse {
  topics: TopicDto[];
  periods: PeriodDto[];
  categories: CategoryDto[];
  cities: CityDto[];
  age_groups: AgeGroupDto[];
}

export interface DataRowDto {
  topic: string;
  period: string;
  year_num: number;
  category: string;
  category_unit: string | null;
  city: string | null;
  age_group: string | null;
  value: number;
  value_extra: number | null;
  note: string | null;
}

export interface DataResponse {
  rows: DataRowDto[];
  count: number;
}

export interface DataFilters {
  topicId: number;             // обязательно
  periodIds?: number[];
  categoryIds?: number[];
  cityIds?: number[];
  ageGroupIds?: number[];
}

export interface AuthState {
  authenticated: boolean;
  user?: { username: string };
}

export interface UploadResult {
  ok: boolean;
  inserted: number;
  updated: number;
  unchanged: number;
  skipped: number;
  warnings: string[];
  upload_id: number;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => ({})) : null;
  if (!res.ok) {
    const msg = (body && (body.error || body.message)) || `HTTP ${res.status}`;
    throw new ApiError(res.status, msg);
  }
  return body as T;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const api = {
  /** Список всех тем (и базовые справочники, если без параметра). */
  getMetadata: (topicId?: number) =>
    jsonFetch<MetadataResponse>(
      `/api/metadata.php${buildQuery({ topic_id: topicId })}`
    ),

  getData: (filters: DataFilters) => {
    const q: Record<string, string | undefined> = {
      topic_id: String(filters.topicId),
      period_id:    filters.periodIds?.join(','),
      category_id:  filters.categoryIds?.join(','),
      city_id:      filters.cityIds?.join(','),
      age_group_id: filters.ageGroupIds?.join(','),
    };
    return jsonFetch<DataResponse>(`/api/data.php${buildQuery(q)}`);
  },

  me: () => jsonFetch<AuthState>('/api/me.php'),

  login: (username: string, password: string) =>
    jsonFetch<{ ok: true; user: { username: string } }>('/api/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),

  logout: () =>
    jsonFetch<{ ok: true }>('/api/logout.php', { method: 'POST' }),

  uploadExcel: (file: File, topicId: number) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('topic_id', String(topicId));
    return jsonFetch<UploadResult>('/api/upload.php', {
      method: 'POST',
      body: fd,
    });
  },
};
