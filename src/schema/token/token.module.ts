import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TokenFamily, TokenSchema } from '.';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TokenFamily.name, schema: TokenSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class TokenFamilyModule {}
