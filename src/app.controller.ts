import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { DftService } from './dft.service';
import { Transfer } from '@prisma/client';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dftService: DftService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('trades?')
  async getDft(@Query('tokenName') tokenName: string): Promise<string> {
    return await this.dftService.getTrades(tokenName);
  }
  @Get('getOwner')
  async getOwner(@Query('tokenName') tokenName: string): Promise<string> {
    return await this.dftService.getOwner(tokenName);
  }
  @Get('updateTrades')
  async updateTrades(
    @Query('tokenName') tokenName: string,
    @Query('start') start: number,
    @Query('count') count: number,
  ): Promise<string> {
    return await this.dftService.updateTrades(tokenName, start, count);
  }

  @Get('clearAndUpdate')
  async clearAndUpdate(
    @Query('canisterId') canisterId: string,
  ): Promise<string> {
    return await this.dftService.clearAndUpdate(canisterId);
  }
}
