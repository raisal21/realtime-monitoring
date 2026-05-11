export type Role = "driller" | "geologist" | "data-scientist";

export interface StoredAuth {
  authenticated: boolean;
  operatorName: string;
  role: Role;
}
