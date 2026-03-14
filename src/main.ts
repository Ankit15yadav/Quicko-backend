import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api')
  // const httpAdapterHost = app.get(HttpAdapterHost)
  // app.useGlobalFilters(new AppExceptionFilter(httpAdapterHost));
  app.enableVersioning({
    type: VersioningType.URI
  })
  // await app.startAllMicroservices();
  const configService = app.get(ConfigService)
  const PORT = configService.get<number>('APP_PORT')
  await app.listen(PORT as number);
}
bootstrap();
