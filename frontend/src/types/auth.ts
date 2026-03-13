import { type FetchUserAttributesOutput } from 'aws-amplify/auth';

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  givenName?: string;
  familyName?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  user: AppUser | null;
  isLoading: boolean;
  error: Error | string | null;
  userAttributes: FetchUserAttributesOutput | null;
}

export interface AppConfig {
  region: string;
  userPoolId: string;
  userPoolClientId: string;
  cognitoDomain: string;
  identityPoolId: string;
  siteRegion: string;
}

export type AuthAction =
  | { type: 'SET_INITIALIZED' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | string | null }
  | {
      type: 'LOGIN_SUCCESS';
      payload: { user: AppUser; userAttributes: FetchUserAttributesOutput };
    }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER_ATTRIBUTES'; payload: FetchUserAttributesOutput };

// Re-export types to ensure they're available
export type { FetchUserAttributesOutput };
