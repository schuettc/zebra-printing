import { useState } from 'react';
import { SignIn } from './SignIn';
import { SignUp } from './SignUp';
import { VerifyEmail } from './VerifyEmail';

type AuthView = 'signin' | 'signup' | 'verify' | 'forgot-password';

export function AuthWrapper() {
  const [currentView, setCurrentView] = useState<AuthView>('signin');
  const [verificationEmail, setVerificationEmail] = useState('');

  const handleVerificationNeeded = (email: string) => {
    setVerificationEmail(email);
    setCurrentView('verify');
  };

  const handleVerified = () => {
    setCurrentView('signin');
    setVerificationEmail('');
  };

  switch (currentView) {
    case 'signin':
      return (
        <SignIn
          onSignUpClick={() => setCurrentView('signup')}
          onForgotPasswordClick={() => setCurrentView('forgot-password')}
        />
      );
    case 'signup':
      return (
        <SignUp
          onSignInClick={() => setCurrentView('signin')}
          onVerificationNeeded={handleVerificationNeeded}
        />
      );
    case 'verify':
      return (
        <VerifyEmail
          email={verificationEmail}
          onVerified={handleVerified}
          onBackToSignUp={() => setCurrentView('signup')}
        />
      );
    case 'forgot-password':
      // TODO: Implement forgot password flow
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p>Forgot password flow coming soon...</p>
            <button
              onClick={() => setCurrentView('signin')}
              className="mt-4 text-indigo-600 hover:text-indigo-500"
            >
              Back to sign in
            </button>
          </div>
        </div>
      );
  }
}
