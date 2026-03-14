export interface IGenerateOtp {
    otp: string;
    ttl: number,
    expiryTime: number;
    data: string,
    hash: string,
    hashWithExpiryTime: string
}