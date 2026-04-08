import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class TokenFamily extends Document {
  @Prop({ required: true }) tokenVersion!: number;
  @Prop({ required: true, unique: true }) familyId!: string;
  @Prop({ required: true }) userId!: Types.ObjectId;
  @Prop() deviceName!: string;
  @Prop() deviceLocation!: string;
  @Prop() lastUsedAt!: Date;
  @Prop() expiryTime!: Date;
}

export const TokenSchema = SchemaFactory.createForClass(TokenFamily);
