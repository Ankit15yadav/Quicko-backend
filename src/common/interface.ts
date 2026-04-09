import { Types } from 'mongoose';

export interface IGenerateOtp {
  otp: string;
  ttl: number;
  expiryTime: number;
  data: string;
  hash: string;
  hashWithExpiryTime: string;
}

export interface decodedJwtPayload {
  name: string;
  phoneNumber: string;
  userId: Types.ObjectId;
  familyId: string;
  tokenVersion: number;
}

export const countryCodes = {
  IN: '+91',
  US: '+1',
  GB: '+44',
  CA: '+1',
  AU: '+61',
  AE: '+971',
  DE: '+49',
  FR: '+33',
  SG: '+65',
  JP: '+81',
} as const;

export type CountryCode = keyof typeof countryCodes;
export type CountryDialCode = (typeof countryCodes)[CountryCode];
