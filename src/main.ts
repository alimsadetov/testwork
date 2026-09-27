import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);
  const port = Number(config.get<string>('PORT') ?? 3000);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swagger = new DocumentBuilder()
    .setTitle('Сервис баланса пользователей')
    .setDescription(
      'Web-сервер для списания средств с баланса пользователя с пересчётом по истории платежей.',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  new Logger('Bootstrap').log(
    `HTTP on http://localhost:${port} | Swagger on /docs`,
  );
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed', err);
  process.exit(1);
});
