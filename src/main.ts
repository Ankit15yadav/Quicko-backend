import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log(process.env, Number(process.env.REDIS_PORT))

  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.REDIS,
  //   options: {
  //     host: process.env.REDIS_HOST,
  //     port: Number(process.env.REDIS_PORT)
  //   }
  // })
  app.setGlobalPrefix('api')
  app.enableVersioning({
    type: VersioningType.URI
  })
  // await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
