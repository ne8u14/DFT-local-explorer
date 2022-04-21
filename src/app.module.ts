import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DftService } from './dft.service';
import { PrismaService } from './prisma.service';
import { ScheduleModule } from '@nestjs/schedule';
import { DftTasksService } from './dft.tasks.service';
import { SchedulerRegistry } from '@nestjs/schedule';
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [
    AppService,
    DftService,
    PrismaService,
    DftTasksService,
    Logger,
    SchedulerRegistry,
  ],
})
export class AppModule {}
