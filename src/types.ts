export type Role = 'Administrador' | 'Codificador' | 'Consulta';

export interface AuthUser {
  id: string;
  name: string;
  login: string;
  email: string | null;
  role: Role;
  mustChangePassword: boolean;
  csrfToken?: string;
}

export interface Category {
  id: string;
  natureId: string;
  nature: string;
  natureCode: string;
  name: string;
  baseCode: string;
  descriptionFormat: string;
  characteristic1: string;
  characteristic2: string;
  codeFormula: string;
  requiredFields: string[];
  example: string;
  active: boolean;
}

export interface CodeInput {
  categoryId: string;
  attributes: Record<string, string>;
  description?: string;
  origin?: string;
  unit?: string;
  manufacturer?: string;
  model?: string;
  tag?: string;
  ncp?: string;
  project?: string;
  serialNumber?: string;
  notes?: string;
}
