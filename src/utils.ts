import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { FIVE_MINUTES } from './common/constants';
import {
  CountryDialCode,
  decodedJwtPayload,
  IGenerateOtp,
} from './common/interface';
import { APP_CONFIG } from './config/app.config';

export const GenerateOtp = (
  phoneNumber: string,
  max: number,
  min: number,
): IGenerateOtp => {
  const otp = createCryptoRandom(min, max);
  const ttl = FIVE_MINUTES;
  const expiryTime = Date.now() + ttl;
  const data = `${phoneNumber}.${otp}`;
  const hash = createCryptoHash(data);
  const hashWithExpiryTime = `${hash}.${expiryTime}`;

  return {
    data,
    expiryTime,
    ttl,
    hash,
    hashWithExpiryTime,
    otp,
  };
};

export const createCryptoRandom = (min: number, max: number) => {
  return crypto.randomInt(min, max).toString();
};

export const createCryptoHash = (data: any) => {
  const key = APP_CONFIG().SECRET.OTP ?? '';
  return crypto.createHmac('sha256', key).update(data).digest('hex');
};

export const validateHash = (h1: string, h2: string) => {
  return crypto.timingSafeEqual(Buffer.from(h1), Buffer.from(h2));
};

export const generateToken = (
  payload: decodedJwtPayload,
  accessTokenSecretKey?: string,
  refreshTokenSecretKey?: string,
) => {
  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  if (accessTokenSecretKey) {
    accessToken = jwt.sign(payload, accessTokenSecretKey, {
      expiresIn: '5hr',
    });
  }

  if (refreshTokenSecretKey) {
    refreshToken = jwt.sign(payload, refreshTokenSecretKey, {
      expiresIn: '30days',
    });
  }

  return { accessToken, refreshToken };
};

export const thirtyDaysFromNow = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
};

export function getPhoneNumber(
  phoneNumber: string,
  countryCode: CountryDialCode,
): string {
  return `${countryCode}${phoneNumber}`;
}

export function generateKey(keyName: string, secondaryValue?: string): string {
  if (!keyName) return '';

  if (secondaryValue) return `${keyName}:${secondaryValue}`;

  return `cached:${keyName}`;
}
