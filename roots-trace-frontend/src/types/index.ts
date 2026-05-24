export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
}

export interface User {
  id: number;
  username: string;
  email?: string;
}

export interface Family {
  id: number;
  name: string;
  surname?: string;
  compiledAt?: string;
  ownerId: number;
  createdAt?: string;
}

export interface Member {
  id: number;
  familyId: number;
  name: string;
  gender: 'M' | 'F';
  birthYear?: number;
  deathYear?: number;
  bio?: string;
  generation: number;
}

export interface Relation {
  id: number;
  familyId: number;
  fromMemberId: number;
  toMemberId: number;
  relationType: RelationType;
}

export type RelationType =
  | 'PARENT_SON'
  | 'PARENT_DAUGHTER'
  | 'MOTHER_SON'
  | 'MOTHER_DAUGHTER'
  | 'SPOUSE';

export interface MemberNode {
  id: number;
  name: string;
  gender: 'M' | 'F';
  birthYear?: number;
  deathYear?: number;
  bio?: string;
  generation?: number;
  parentId?: number;
  depth?: number;
}

export interface KinshipPath {
  fromMemberId?: number;
  toMemberId?: number;
  relationType?: RelationType;
  pathEdges?: string[];
}

export interface DashboardStatItem {
  label: string;
  value: number;
}

export interface DashboardData {
  totalMembers: number;
  maleMembers: number;
  femaleMembers: number;
  deceasedMembers: number;
  averageLifespan: number;
  generationDistribution: DashboardStatItem[];
  relationDistribution: DashboardStatItem[];
}
