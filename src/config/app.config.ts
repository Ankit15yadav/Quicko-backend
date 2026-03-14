export function APP_CONFIG() {
    return {
        APP_NAME: process.env['APP_NAME'],
        REDIS: {
            HOST: process.env['REDIS_HOST'],
            PORT: process.env['REDIS_PORT'],
        },
        MONGODB: {
            URI: process.env['MONGODB_URI'],
        },
        TWILIO: {
            SID: process.env['TWILIO_SID'],
            AUTH_TOKEN: process.env['TWILIO_AUTH_TOKEN'],
            PHONE: process.env['TWILIO_PHONE_NUMBER'],
        },
        SECRET: {
            OTP: process.env['CRYPTO_SHA_KEY']
        }
    }
} 