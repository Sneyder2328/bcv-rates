import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(','),
  });
  app.setGlobalPrefix("api");
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
