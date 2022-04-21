import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaService } from './prisma.service';
import { identityFactory } from './utils/identity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('dft example')
    .setDescription('The dft API description')
    .setVersion('1.0')
    .addTag('dft')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  identityFactory.loadAllIdentities();
  identityFactory.loadAllCanisters();

  SwaggerModule.setup('api', app, document);
  await app.listen(3000);

  const prisma = app.get(PrismaService);

  await prisma.tokenState.upsert({
    where: {
      name: 'token_WICP',
    },
    create: {
      name: 'token_WICP',
      currentIndex: 0,
    },
    update: {},
  });
  await prisma.tokenState.upsert({
    where: {
      name: 'token_WUSD',
    },
    create: {
      name: 'token_WUSD',
      currentIndex: 0,
    },
    update: {},
  });
}
bootstrap();
