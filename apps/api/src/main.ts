import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { AppModule } from "@/app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(",") ?? [],
  });
  app.setGlobalPrefix("api");
  const port = Number(process.env.PORT);
  const host = process.env.NODE_ENV === "development" ? "0.0.0.0" : "127.0.0.1";
  await app.listen(port, host);
}
bootstrap();
