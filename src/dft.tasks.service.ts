import { Injectable, Logger } from '@nestjs/common';
import { DftService } from './dft.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';
@Injectable()
export class DftTasksService {
  constructor(
    private readonly dftService: DftService,
    private readonly logger: Logger,
    private prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleCron1() {
    this.logger.debug('token_WICP called when the current second is 5');
    const currentState = await this.prisma.tokenState.findFirst({
      where: { name: 'token_WICP' },
    });
    await this.dftService.updateByCurrentState(currentState.name);

    await this.dftService.exportAll();
  }
  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleCron2() {
    this.logger.debug('token_WUSD called when the current second is 5');
    const currentState = await this.prisma.tokenState.findFirst({
      where: { name: 'token_WUSD' },
    });
    await this.dftService.updateByCurrentState(currentState.name);
  }
}
