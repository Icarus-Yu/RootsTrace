import api from './axios';
import type {
  ApiResult,
  DashboardData,
  Family,
  FamilyTree,
  KinshipPath,
  Member,
  MemberNode,
  PageResult,
  Relation,
  User,
} from '../types';

interface DashboardVO {
  totalMembers: number;
  maleCount: number;
  femaleCount: number;
  generationStats: { generation: number; count: number }[];
  lifespanStats?: {
    averageLifespan?: number;
    maxLifespan?: number;
    minLifespan?: number;
  };
  relationStats: { relationType: string; count: number }[];
}

const unwrap = async <T>(request: Promise<{ data: ApiResult<T> }>) => {
  const response = await request;
  if (response.data.code !== 200) {
    throw new Error(response.data.message || '请求失败');
  }
  return response.data.data;
};

const toDashboardData = (dashboard: DashboardVO): DashboardData => ({
  totalMembers: dashboard.totalMembers ?? 0,
  maleMembers: dashboard.maleCount ?? 0,
  femaleMembers: dashboard.femaleCount ?? 0,
  deceasedMembers: 0,
  averageLifespan: dashboard.lifespanStats?.averageLifespan ?? 0,
  generationDistribution: (dashboard.generationStats ?? []).map((item) => ({
    label: String(item.generation),
    value: item.count,
  })),
  relationDistribution: (dashboard.relationStats ?? []).map((item) => ({
    label: item.relationType,
    value: item.count,
  })),
});

export const authApi = {
  login: (payload: { account: string; password: string }) =>
    unwrap<{ token: string; user: User }>(api.post('/auth/login', payload)),
  register: (payload: { username: string; email: string; password: string }) =>
    unwrap<User>(api.post('/auth/register', payload)),
  me: () => unwrap<User>(api.get('/auth/me')),
};

export const familyApi = {
  list: () => unwrap<Family[]>(api.get('/families')),
  create: (payload: { name: string; surname?: string; compiledAt?: string }) =>
    unwrap<Family>(api.post('/families', payload)),
  update: (id: number, payload: { name: string; surname?: string; compiledAt?: string }) =>
    unwrap<Family>(api.put(`/families/${id}`, payload)),
  remove: (id: number) => unwrap<boolean>(api.delete(`/families/${id}`)),
  dashboard: async (id: number) => toDashboardData(await unwrap<DashboardVO>(api.get(`/families/${id}/dashboard`))),
  addCollaborator: (id: number, account: string) =>
    unwrap<boolean>(api.post(`/families/${id}/collaborators`, { account })),
};

export const memberApi = {
  list: (familyId: number, params?: { page?: number; size?: number; keyword?: string }) =>
    unwrap<PageResult<Member>>(api.get(`/members/family/${familyId}`, { params })),
  create: (payload: Omit<Member, 'id'>) => unwrap<Member>(api.post('/members', payload)),
  update: (id: number, payload: Omit<Member, 'id' | 'familyId'>) =>
    unwrap<Member>(api.put(`/members/${id}`, payload)),
  remove: (id: number) => unwrap<boolean>(api.delete(`/members/${id}`)),
};

export const relationApi = {
  list: (familyId: number) => unwrap<Relation[]>(api.get(`/relations/family/${familyId}`)),
  create: (payload: Omit<Relation, 'id'>) => unwrap<Relation>(api.post('/relations', payload)),
  remove: (id: number) => unwrap<boolean>(api.delete(`/relations/${id}`)),
};

export const queryApi = {
  ancestors: (memberId: number) => unwrap<MemberNode[]>(api.get(`/query/ancestors/${memberId}`)),
  descendants: (memberId: number, depth: number) =>
    unwrap<MemberNode[]>(api.get(`/query/descendants/${memberId}`, { params: { depth } })),
  kinship: (familyId: number, a: number, b: number) =>
    unwrap<KinshipPath>(api.get('/query/kinship', { params: { familyId, a, b } })),
  familyTree: (familyId: number, depth?: number) =>
    unwrap<FamilyTree>(api.get(`/query/family-tree/${familyId}`, { params: depth ? { depth } : undefined })),
};
