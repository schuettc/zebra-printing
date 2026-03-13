import { PreSignUpTriggerEvent, Context, Callback } from 'aws-lambda';

// Get allowed domains from environment variable
const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS?.split(',') || [
  'example.com',
];

export const handler = async (
  event: PreSignUpTriggerEvent,
  context: Context,
  callback: Callback<PreSignUpTriggerEvent>
): Promise<void> => {
  try {
    const email = event.request.userAttributes?.email;

    if (!email) {
      throw new Error('Email is required for registration');
    }

    // Extract domain from email
    const emailDomain = email.split('@')[1]?.toLowerCase();

    if (!emailDomain) {
      throw new Error('Invalid email format');
    }

    // Check if domain is allowed
    const isAllowedDomain = ALLOWED_DOMAINS.some(
      (allowedDomain) => emailDomain === allowedDomain.toLowerCase()
    );

    if (!isAllowedDomain) {
      throw new Error(
        `Registration restricted. Please use an email from: ${ALLOWED_DOMAINS.join(', ')}`
      );
    }

    // Auto-confirm the user if domain is allowed
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;

    // Allow the registration to proceed
    callback(null, event);
  } catch (error) {
    // Reject the registration
    callback(error as Error, event);
  }
};
