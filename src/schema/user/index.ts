import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
    @Prop({ required: false })
    name: string;

    @Prop({ required: false, unique: true })
    email: string;

    @Prop()
    isNewUser: boolean

    @Prop({ default: false })
    isLoggedIn: boolean

    @Prop()
    lastLoginAt: Date

    @Prop({ required: true, unique: true })
    phoneNumber: string;

    @Prop()
    createdAt: Date

    @Prop()
    refreshToken: string
}

export const UserSchema = SchemaFactory.createForClass(User);