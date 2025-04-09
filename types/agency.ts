export interface AgencyInfo {
  id?: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  description: string;
}

export interface Milestone {
  date: string;
  description: string;
}

export interface AgencyHistory {
  id?: string;
  foundedDate: string;
  history: string;
  milestones: Milestone[];
}

export interface Collaborator {
  id: string;
  email: string;
  full_name: string | null;
  status: 'active' | 'pending';
}