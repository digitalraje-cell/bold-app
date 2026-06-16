import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { getAllowedOrigins, isOriginAllowed } from './common/cors.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      console.warn('[cors] blocked origin', origin);
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = Number(process.env.PORT) || 4000;
  const host = process.env.HOST || '0.0.0.0';

  await app.listen(port, host);

  console.log(`Bold API listening on http://${host}:${port}/api/health`);
  console.log(`CORS allowed origins: ${getAllowedOrigins().join(', ')}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start Bold API:', error);
  process.exit(1);
});
