import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class ParseDatePipe implements PipeTransform {
    transform(value: string | number, metadata: ArgumentMetadata) {
        const { data } = metadata;
        if (!data) {
            value = value['time'];
            console.log('value', value);
        }
        const date = this.convertTimeStamp(value);
        if (!date || isNaN(+date)) {
            throw new BadRequestException("invalid date")
        }
        const { metatype } = metadata
        switch (metatype) {
            case String: return date.toUTCString();
            case Date: return date;
            case Number: return date.getTime();
            default: return date.toISOString();
        }
    }

    private convertTimeStamp(timeStamp: string | number): Date {
        timeStamp = +timeStamp;
        const isSecond = !(timeStamp > (Date.now() + 24 * 60 * 60 * 1000) / 1000);
        return isSecond ? new Date(timeStamp * 1000) : new Date(timeStamp)
    }
}