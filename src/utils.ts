import crypto from "crypto";


export const GenerateOtp = (max: number, min: number) => {
    return crypto.randomInt(min, max).toString();
}