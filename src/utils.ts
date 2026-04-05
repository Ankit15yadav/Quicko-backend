import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { FIVE_MINUTES } from './common/constants';
import { IGenerateOtp } from './common/interface';
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
  return h1 === h2;
};

export const generateToken = (
  payload: JwtPayload,
  accessTokenSecretKey: string,
  refreshTokenSecretKey: string,
) => {
  const accessToken = jwt.sign(payload, accessTokenSecretKey, {
    expiresIn: '15s',
  });
  const refreshToken = jwt.sign(payload, refreshTokenSecretKey, {
    expiresIn: '30d',
  });

  return { accessToken, refreshToken };
};
