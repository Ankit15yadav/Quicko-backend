import { OTP_QUEUE, REFRESH_TOKEN, SEND_OTP, TOKEN_SYNC_QUEUE } from '@/common';
import { User } from '@/schema/user';
import { TwilioService } from '@/twilio/twilio.service';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from 'bullmq';
import { Model } from 'mongoose';

@Processor(OTP_QUEUE)
export class OtpProcessor extends WorkerHost {
    private readonly logger = new Logger(OtpProcessor.name);

    constructor(
        private readonly twilioService: TwilioService,
    ) { super(); }

    async process(job: Job<{ phoneNumber: string, otp: string }>) {
        const { otp, phoneNumber } = job.data
        try {
            switch (job.name) {
                case SEND_OTP: return await this.twilioService.sendOtpToMobileNumber(phoneNumber, otp)
            }

        } catch (error) {
            throw error;
        }
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job, error: Error) {
        this.logger.error(`Job ${job.id} (${job.name}) failed after ${job.attemptsMade} attempt(s): ${error.message}`);
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job) {
        this.logger.log(`Job ${job.id} (${job.name}) completed successfully`);
    }
}

@Processor(TOKEN_SYNC_QUEUE)
export class RefreshTokenSyncProcessor extends WorkerHost {
    private readonly logger = new Logger(RefreshTokenSyncProcessor.name);

    constructor(
        @InjectModel(User.name)
        private userModel: Model<User>,
    ) {
        super()
    }

    async process(job: Job<{ userId: string, refreshToken: string }>): Promise<any> {
        const { userId, refreshToken } = job.data
        try {
            if (job.name === REFRESH_TOKEN) {
                await this.userModel.findOneAndUpdate(
                    { _id: userId },
                    {
                        $set: {
                            refreshToken
                        }
                    }
                )
            }

        } catch (error) {
            throw error;
        }
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job) {
        this.logger.log(`token for ${job.id} (${job.name}) inserted successfully`);
    }

}