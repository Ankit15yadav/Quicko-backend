import { OTP_QUEUE, SEND_OTP } from '@/common';
import { REDIS_CLIENT } from '@/redis-v2/redis-v2.module';
import { TwilioService } from '@/twilio/twilio.service';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import Redis from 'ioredis';

@Processor(OTP_QUEUE)
export class otpProcessor extends WorkerHost {
    private readonly logger = new Logger(otpProcessor.name);

    constructor(
        private readonly twilioService: TwilioService,
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
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