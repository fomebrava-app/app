export type PlatformUser = {
  id: string;
  email: string;
  fullName: string | null;
  telefone: string | null;
  role: string;
  createdAt: string;
  tenantId: string | null;
  slug: string | null;
  handle: string | null;
};

export type SignupCodeInventory = {
  ready: boolean;
  available: number;
  used: number;
};

export type LandingAccessRequest = {
  id: string;
  nome: string;
  clube: string;
  cargo: string;
  cep: string;
  email: string;
  whatsapp: string;
  createdAt: string;
};

export type LandingAccessInbox = {
  ready: boolean;
  requests: LandingAccessRequest[];
};
