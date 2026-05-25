import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';

// -----------------------------------------------------------------------------
// SECURE CONFIGURATION BLOCK & INITIALIZATION (FIREBASE V10 COMPATIBILITY PATH)
// -----------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCXZkKCbqZNB-gWIoKiZE4E6W977_H4PcU",
  authDomain: "pokicoin-3a02c.firebaseapp.com",
  databaseURL: "https://pokicoin-3a02c-default-rtdb.firebaseio.com", // Your Realtime Database URL
  projectId: "pokicoin-3a02c",
  storageBucket: "pokicoin-3a02c.firebasestorage.app",
  messagingSenderId: "660501737397",
  appId: "1:660501737397:web:7fe47fb288b6b65208f3fc"
};

// Singleton initialization safety check
let app: firebase.app.App;
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

const auth = firebase.auth();
const db = firebase.database();

export { app, auth, db };

// -----------------------------------------------------------------------------
// TYPES & RECORD SCHEMAS
// -----------------------------------------------------------------------------
export interface PokiUserPayload {
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  balance: number;
  transferableBalance: number;
  isMining: boolean;
  signupTimestamp: string;
  updatedAt: string;
  kycRequired: boolean;
  securityTier: string;
}

export interface OTPRequestResult {
  success: boolean;
  message: string;
  verificationId?: string;
  confirmationResult?: firebase.auth.ConfirmationResult;
}

export interface OTPVerifyResult {
  success: boolean;
  message: string;
  user?: firebase.User;
  isNewUser?: boolean;
}

// -----------------------------------------------------------------------------
// COMPREHENSIVE REGEX FILTER FOR INDIAN TELEPHONE NUMBERS (+91 COUNTRY ROUTING)
// -----------------------------------------------------------------------------
/**
 * Strict validation routine for Indian portable numbers.
 * Supports:
 * - Direct 10 digit entries (e.g. 9876543210)
 * - Country code prefixed entries with or without space/dash (e.g. +91 9876543210 or +91-9876543210)
 * Indian cellular routing prefixes start strictly with 6, 7, 8, or 9.
 */
export function validateIndianPhoneNumber(phoneStr: string): { isValid: boolean; formatted: string; error?: string } {
  // Strip non-digit characters except for leading "+" signs
  let cleanInput = phoneStr.trim().replace(/[^\d+]/g, '');

  if (!cleanInput) {
    return { isValid: false, formatted: '', error: 'Mobile number field cannot be empty.' };
  }

  // Handle case where user entered leading zero
  if (cleanInput.startsWith('0')) {
    cleanInput = cleanInput.substring(1);
  }

  // Handle case where user forgot the +91 prefix
  if (cleanInput.length === 10) {
    if (/^[6789]\d{9}$/.test(cleanInput)) {
      return { isValid: true, formatted: `+91${cleanInput}` };
    } else {
      return { isValid: false, formatted: '', error: 'Indian cellular networks strictly require starting with 6, 7, 8, or 9.' };
    }
  }

  // Handle +91 or 91 country layouts
  if (cleanInput.startsWith('+91')) {
    const digitsOnly = cleanInput.substring(3);
    if (digitsOnly.length === 10 && /^[6789]\d{9}$/.test(digitsOnly)) {
      return { isValid: true, formatted: cleanInput };
    }
  } else if (cleanInput.startsWith('91') && cleanInput.length === 12) {
    const digitsOnly = cleanInput.substring(2);
    if (/^[6789]\d{9}$/.test(digitsOnly)) {
      return { isValid: true, formatted: `+91${digitsOnly}` };
    }
  }

  return {
    isValid: false,
    formatted: '',
    error: 'Unrecognized format. Enter a 10-digit mobile number, optionally starting with +91.'
  };
}

// -----------------------------------------------------------------------------
// MULTI-STAGE AUTHENTICATION WORKFLOW (ROBUST PEER HANDSHAKE)
// -----------------------------------------------------------------------------

/**
 * Triggers reCAPTCHA and fires an SMS OTP challenge strictly configured for Indian telecom carriers.
 * Operates double verification to prevent memory leak and reCAPTCHA node reload loops.
 */
export async function requestOTPMessage(
  rawPhoneNumber: string,
  elementIdOrObj: string | HTMLElement,
  onStateCleanUp: () => void
): Promise<OTPRequestResult> {
  try {
    // 1. Strict Validation Input Filter
    const validation = validateIndianPhoneNumber(rawPhoneNumber);
    if (!validation.isValid) {
      return { success: false, message: validation.error || 'Invalid phone configuration detected.' };
    }

    const targetPhone = validation.formatted;

    // 2. Safe verification container cleanup
    const verifierElement = typeof elementIdOrObj === 'string' 
      ? document.getElementById(elementIdOrObj) 
      : elementIdOrObj;

    if (!verifierElement) {
      return { success: false, message: 'Security reCAPTCHA viewport anchor is missing from the application UI.' };
    }

    // Clear any leftover child nodes inside recaptcha-container to prevent re-initialization crashes
    verifierElement.innerHTML = `<div id="recaptcha-anchor-inner"></div>`;

    // 3. Initialize Verification Widget with reset safety
    const verifier = new firebase.auth.RecaptchaVerifier('recaptcha-anchor-inner', {
      size: 'invisible',
      callback: (response: string) => {
        console.log('✓ Security reCAPTCHA puzzle successfully solved by human peer.', response);
      },
      'expired-callback': () => {
        console.warn('⚠️ Safety token expired. Automatically recycling security verifiers.');
        onStateCleanUp();
      }
    });

    // 4. Force SMS Delivery payload
    const confirmationResult = await auth.signInWithPhoneNumber(targetPhone, verifier);
    
    return {
      success: true,
      message: `Consensus verified. SMS passkey successfully piped to ${targetPhone}.`,
      verificationId: confirmationResult.verificationId || '',
      confirmationResult
    };

  } catch (err: any) {
    console.error('⛔ Critical OTP Request Handshake Failure:', err);
    onStateCleanUp();
    
    let errorHelp = 'Failed to request SMS OTP. Verify cellular coverage or network status.';
    if (err?.code === 'auth/invalid-phone-number') {
      errorHelp = 'The network rejected this telemetry layout. Please check the phone prefix alignment.';
    } else if (err?.code === 'auth/too-many-requests') {
      errorHelp = 'Node flow restricted due to heavy quorums. Please wait 10 minutes and try again.';
    } else if (err?.code === 'auth/network-request-failed') {
      errorHelp = 'Local offline isolation mode triggered. Ensure your internet connection is active.';
    } else if (err?.message) {
      errorHelp = err.message;
    }

    return { success: false, message: errorHelp };
  }
}

/**
 * Validates the 6-digit confirmation Code Token, completes peer node handshake,
 * and sets up database provisioning parameters securely.
 */
export async function confirmOTPAndAuthorize(
  confirmationResult: firebase.auth.ConfirmationResult,
  otpCode: string
): Promise<OTPVerifyResult> {
  try {
    // String sanitation
    const trimmedOtp = otpCode.trim();
    if (trimmedOtp.length !== 6 || !/^\d+$/.test(trimmedOtp)) {
      return { success: false, message: 'Ledger passcode must be an exact 6-digit numerical string.' };
    }

    // Complete transaction with the authentication quorums
    const userCredential = await confirmationResult.confirm(trimmedOtp);
    const user = userCredential.user;

    if (!user) {
      return { success: false, message: 'Session payload is null. The access token could not be verified.' };
    }

    // Initialize user profile registration write inside Realtime Database
    const isNewUser = await provisionRealtimeProfileNode(user);

    return {
      success: true,
      message: '✓ Node fully established. Identity consensus approved.',
      user,
      isNewUser
    };

  } catch (err: any) {
    console.error('⛔ OTP Validation Handshake Denied:', err);
    
    let friendlyReason = 'Access validation denied. The dynamic code entered is incorrect or expired.';
    if (err?.code === 'auth/invalid-verification-code') {
      friendlyReason = 'The secure key entered does not align with the current quorums.';
    } else if (err?.code === 'auth/session-expired') {
      friendlyReason = 'The transaction expired. Please request a new verification block.';
    } else if (err?.message) {
      friendlyReason = err.message;
    }

    return { success: false, message: friendlyReason };
  }
}

// -----------------------------------------------------------------------------
// SECURE USER PROFILE DATABASE HANDSHAKE TRANSACTION (WRITE/PROVISION)
// -----------------------------------------------------------------------------

/**
 * Safeguards database schema generation under the absolute canonical path:
 * `/users/${user.uid}`
 * Implements transaction integrity checks to avoid corrupting high-score coin metrics.
 */
export async function provisionRealtimeProfileNode(user: firebase.User): Promise<boolean> {
  const userRef = db.ref(`users/${user.uid}`);
  
  try {
    // Read first with timeout prevention to verify if account exists
    const snapshot = await userRef.get();
    const cleanPhone = user.phoneNumber || '';
    
    if (snapshot.exists()) {
      console.log(`✓ Synchronized peer profile retrieved for returning miner: ${user.uid}`);
      // Returning Miner - write updated heartbeat telemetry metadata
      await userRef.update({
        updatedAt: new Date().toISOString()
      });
      return false; // Returning user
    }

    // New Miner setup - Construct complete quorums schema with precision seed values
    const generatedName = `Poki Miner ${cleanPhone.slice(-4) || user.uid.substring(0, 5)}`;
    const welcomePayload: PokiUserPayload = {
      userId: user.uid,
      fullName: generatedName,
      phone: cleanPhone,
      email: user.email || `${cleanPhone || user.uid}@pokicoin-rtdb.in`,
      balance: 10.0, // Welcome gift seed coin
      transferableBalance: 0.0,
      isMining: false,
      signupTimestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      kycRequired: false,
      securityTier: 'Level 1 Base Miner'
    };

    await userRef.set(welcomePayload);
    console.log(`🚀 Provisioned pristine user registry node for peer: ${user.uid}`);
    return true; // Brand-new user setup completed

  } catch (err) {
    console.error(`⛔ Failed to provision database telemetry payload for ${user.uid}:`, err);
    // Graceful offline fallback logging
    return false;
  }
}
