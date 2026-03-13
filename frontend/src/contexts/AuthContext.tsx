import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from 'react';
import {
  signIn,
  signOut,
  getCurrentUser,
  fetchUserAttributes,
  fetchAuthSession,
  signUp,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
} from 'aws-amplify/auth';
import type { SignInOutput, SignUpOutput } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import type { AuthState, AuthAction, AppUser } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<SignInOutput>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<SignUpOutput>;
  confirmSignup: (email: string, code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (
    email: string,
    code: string,
    newPassword: string
  ) => Promise<void>;
  getSession: () => Promise<void>;
  refreshUserAttributes: () => Promise<void>;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isInitialized: false,
  user: null,
  isLoading: false,
  error: null,
  userAttributes: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: true };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        userAttributes: action.payload.userAttributes,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        userAttributes: null,
      };
    case 'UPDATE_USER_ATTRIBUTES':
      return { ...state, userAttributes: action.payload };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const checkAuthState = async () => {
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      const appUser: AppUser = {
        id: user.userId,
        email: attributes.email || '',
        name: attributes.name,
        givenName: attributes.given_name,
        familyName: attributes.family_name,
      };

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: appUser, userAttributes: attributes },
      });
    } catch {
      // User is not authenticated
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await checkAuthState();
      } catch (err) {
        void err;
        dispatch({ type: 'SET_ERROR', payload: err as Error });
      } finally {
        dispatch({ type: 'SET_INITIALIZED' });
      }
    };

    initializeAuth();
  }, []);

  // Listen for auth events
  useEffect(() => {
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          checkAuthState();
          break;
        case 'signedOut':
          dispatch({ type: 'LOGOUT' });
          break;
        case 'tokenRefresh':
          break;
        case 'tokenRefresh_failure':
          dispatch({ type: 'LOGOUT' });
          break;
      }
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const result = await signIn({ username: email, password });

      if (result.isSignedIn) {
        await checkAuthState();
      }

      return result;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const logout = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await signOut();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });

      // Return the result so the component can check if confirmation is needed
      return result;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const confirmSignup = useCallback(async (email: string, code: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await confirmSignUp({ username: email, confirmationCode: code });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await resetPassword({ username: email });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const confirmForgotPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        await confirmResetPassword({
          username: email,
          confirmationCode: code,
          newPassword,
        });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error as Error });
        throw error;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    []
  );

  const getSession = useCallback(async () => {
    try {
      await fetchAuthSession();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
      throw error;
    }
  }, []);

  const refreshUserAttributes = useCallback(async () => {
    try {
      const attributes = await fetchUserAttributes();
      dispatch({ type: 'UPDATE_USER_ATTRIBUTES', payload: attributes });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    signup,
    confirmSignup,
    forgotPassword,
    confirmForgotPassword,
    getSession,
    refreshUserAttributes,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
