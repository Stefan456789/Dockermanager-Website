export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  ports: ContainerPort[];
  created: string;
  tty: boolean;
  openStdin: boolean;
}

export interface ContainerPort {
  privatePort: number;
  publicPort?: number;
  type: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
