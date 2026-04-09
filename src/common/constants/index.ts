export const PHONE_NUMBER_MIN_LENGTH = 10;
export const INDIA_COUNTRY_CODE = '+91';

// Should pass the 0th index of the phone Number to validate using this regex
export const VALID_PHONE_NUMBER_REGEX = /^[6-9]/;
export const MIN_OTP_VALUE = 1000;
export const MAX_OTP_VALUE = 9999;
export const FIVE_MINUTES = 5 * 60 * 1000;
export const DEFAULT_OTP_EXPIRY_TIME = FIVE_MINUTES / 1000; // this is in seconds
export const MAX_OTP_ATTEMPTS = 3;

// processors and jobs constants
export const OTP_QUEUE = 'otp-queue';
export const SEND_OTP = 'send-otp';
export const TOKEN_SYNC_QUEUE = 'refreshToken-sync-queue';
export const REFRESH_TOKEN = 'refresh-token';
export const ONBOARDING_SMS_QUEUE = 'onboard-sms-queue';

// guards
export const IS_PUBLIC_KEY = 'isPublic';
