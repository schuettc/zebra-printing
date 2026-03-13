import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import './index.css';
import App from './App.tsx';

// Load configuration and initialize Amplify before rendering
async function initializeApp() {
  try {
    // Fetch configuration
    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.statusText}`);
    }

    const config = await response.json();

    // Configure Amplify
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: config.userPoolId,
          userPoolClientId: config.userPoolClientId,
          identityPoolId: config.identityPoolId,
          loginWith: {
            oauth: {
              domain: config.cognitoDomain,
              scopes: ['email', 'openid', 'profile'],
              redirectSignIn: [window.location.origin],
              redirectSignOut: [window.location.origin],
              responseType: 'code',
            },
          },
        },
      },
    });

    // Render app after successful configuration
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Display error message
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui;">
          <div style="text-align: center;">
            <h1>Configuration Error</h1>
            <p>Failed to load application configuration.</p>
            <p style="color: #666;">Please check the console for more details.</p>
          </div>
        </div>
      `;
    }
  }
}

// Initialize the app
initializeApp();
