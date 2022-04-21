import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { DftService } from './dft.service';
import { existsSync, mkdirSync, writeFile } from 'fs';

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
  @Get('getTransfers?')
  async getTrades(@Query('tokenName') tokenName: string): Promise<string> {
    return await this.dftService.getTransfers(tokenName);
  }
  @Get('getBalances?')
  async getBalances(@Query('tokenName') tokenName: string): Promise<string> {
    return await this.dftService.getBalances(tokenName);
  }

  @Get('getTransfersCSV?')
  async getTransfersCSV(@Query('tokenName') tokenName: string): Promise<any> {
    const data = await this.dftService.getTransfersCSV(tokenName);
    const dir = process.cwd() + '/csv/transfers';
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFile(dir + `/transfers_${tokenName}.csv`, data, function (err) {
      if (err) {
        return console.error(err);
      }
      console.log('File created!');
    });

    return data;
  }
  @Get('getBalancesCSV?')
  async getBalancesCSV(@Query('tokenName') tokenName: string): Promise<void> {
    const data = await this.dftService.getBalancesCSV(tokenName);
    const dir = process.cwd() + '/csv/transfers';
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFile(dir + `/balance_${tokenName}.csv`, data, function (err) {
      if (err) {
        return console.error(err);
      }
      console.log('File created!');
    });

    return;
  }

  @Get('getOwner?')
  async getOwner(@Query('tokenName') tokenName: string): Promise<string> {
    return await this.dftService.getOwner(tokenName);
  }
  @Get('updateTrades?')
  async updateTrades(
    @Query('tokenName') tokenName: string,
    @Query('start') start: number,
    @Query('count') count: number,
  ): Promise<string> {
    return await this.dftService.updateTrades(tokenName, start, count);
  }

  @Get('clearAndRestart')
  async clearAndRestart() {
    return await this.dftService.clearAndRestart();
  }
}
