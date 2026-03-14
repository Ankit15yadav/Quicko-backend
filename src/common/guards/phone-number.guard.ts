import { BadRequestException, CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { VALID_PHONE_NUMBER_REGEX } from "../constants";

@Injectable()
export class PhoneNumberGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const { phoneNumber } = request.body

        if (!VALID_PHONE_NUMBER_REGEX.test(phoneNumber[0])) {
            throw new BadRequestException('Provide a valid Phone Number');
        }

        return true;
    }
}