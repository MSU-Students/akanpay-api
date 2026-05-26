import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/app-bootstrap';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  
  await app.listen(port);
}
void bootstrap();
