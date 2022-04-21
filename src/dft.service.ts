import { Injectable, Logger } from '@nestjs/common';
import { createLocalActorByName as createLocalActorByName } from './declarations/dft_basic';
import { PrismaService } from './prisma.service';

import { TransferDto } from './models/dft.service.dto';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ExportToCsv } from 'export-to-csv';
import { identityFactory } from './utils/identity';

@Injectable()
export class DftService {
  constructor(
    private prisma: PrismaService,
    private logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async getTransfers(tokenName: string): Promise<string> {
    const res = await this.prisma.transfer.findMany({
      where: {
        tokenName,
      },
      orderBy: {
        blockHeight: 'desc',
      },
    });

    return JSON.parse(
      JSON.stringify(
        res,
        (key, value) => (typeof value === 'bigint' ? value.toString() : value), // return everything else unchanged
      ),
    );
  }
  async getTransfersCSV(tokenName: string): Promise<any> {
    const res = await this.prisma.transfer.findMany({
      where: {
        tokenName,
      },
      orderBy: {
        blockHeight: 'desc',
      },
    });
    const options = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: false,
      title: '',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true,
      filename: 'Transfers.csv',
    };
    const csvExporter = new ExportToCsv(options);
    if (res.length > 0) {
      const data = csvExporter.generateCsv(res, true);
      return data;
    } else {
      return 'No data found';
    }
  }

  async getBalances(tokenName: string): Promise<string> {
    const res = await this.prisma.balance.findMany({
      where: {
        tokenName,
      },
      orderBy: {
        id: 'desc',
      },
    });

    return JSON.parse(
      JSON.stringify(
        res,
        (key, value) => (typeof value === 'bigint' ? value.toString() : value), // return everything else unchanged
      ),
    );
  }
  async getBalancesCSV(tokenName: string): Promise<any> {
    const res = await this.prisma.balance.findMany({
      where: {
        tokenName,
      },
      orderBy: {
        id: 'desc',
      },
    });

    const options = {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      showTitle: true,
      title: 'My Balances CSV',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true,
    };
    const csvExporter = new ExportToCsv(options);
    if (res.length > 0) {
      const data = csvExporter.generateCsv(res, true);
      return data;
    } else {
      return 'No data found';
    }
  }

  async clearAndRestart() {
    const jobs = this.schedulerRegistry.getCronJobs();
    jobs.forEach((job) => {
      job.stop();
    });
    await this.prisma.transfer.deleteMany({});
    await this.prisma.balance.deleteMany({});

    await this.prisma.tokenState.update({
      where: {
        name: 'token_WICP',
      },
      data: {
        currentIndex: 0,
      },
    });
    await this.prisma.tokenState.update({
      where: {
        name: 'token_WUSD',
      },
      data: {
        currentIndex: 0,
      },
    });

    jobs.forEach((job) => {
      job.start();
    });
  }

  async updateBalances(
    tokenName: string,
    accountIdList: string[],
  ): Promise<string> {
    const actor = createLocalActorByName(tokenName);
    for (const accountId of accountIdList) {
      const balance = await actor.balanceOf(accountId);

      await this.prisma.balance.upsert({
        where: { accountId: accountId },
        update: {
          balance: balance.toString(),
        },
        create: {
          accountId: accountId,
          balance: balance.toString(),
          tokenName: tokenName,
          accountName: identityFactory.getNameById(accountId),
        },
      });

      this.logger.debug(`${accountId} has ${balance}`);
    }

    return 'empty';
  }

  async updateTrades(
    tokenName: string,
    start: number,
    count: number,
  ): Promise<string> {
    const actor = createLocalActorByName(tokenName);

    const res = await actor.blocksByQuery(BigInt(start), BigInt(count));

    const firstBlockIndex = res.firstBlockIndex;
    const operationObjects = res.blocks.map((block) => block.transaction);
    const currentState = await this.prisma.tokenState.findFirst({
      where: { name: tokenName },
    });

    const transfers: TransferDto[] = operationObjects
      .map((op, index) => {
        if ('Transfer' in op.operation) {
          const transfer = op.operation.Transfer;
          const t = transfer as TransferDto;
          t.createAt = op.createdAt;
          t.height = index;
          return t;
        }
      })
      .filter((x) => x !== undefined);

    for (const tr of transfers) {
      await this.prisma.transfer.create({
        data: {
          from: identityFactory.getNameById(tr.from),
          to: identityFactory.getNameById(tr.to),
          caller: identityFactory.getNameById(tr.caller),
          value: tr.value.toString(),
          fee: tr.fee,
          createdAt: tr.createAt,
          height: tr.height,
          blockHeight: start + tr.height,
          tokenName: tokenName,
        },
      });
    }

    await this.updateBalances(tokenName, [
      ...new Set(transfers.map((x) => x.caller)),
    ]);
    currentState.currentIndex += operationObjects.length;
    await this.prisma.tokenState.update({
      where: { id: currentState.id },
      data: { currentIndex: currentState.currentIndex },
    });

    return 'empty';
  }

  async clearAndUpdate(tokenName: string): Promise<string> {
    const actor = createLocalActorByName(tokenName);
    await this.clearDatabase();
    const blockInfo = await actor.blocksByQuery(BigInt(0), BigInt(0));
    const tokenInfo = await actor.tokenInfo();
    if (tokenInfo.storages.length > 0) {
      await this.tryGetBlock(tokenName);
    }

    const pageSize = 100;
    for (let page = 0; page < blockInfo.chainLength; page += pageSize) {
      await this.updateTrades(tokenName, page, pageSize);
    }

    return 'empty';
  }

  async updateByCurrentState(tokenName: string): Promise<string> {
    const actor = createLocalActorByName(tokenName);
    const currentState = await this.prisma.tokenState.findFirst({
      where: { name: tokenName },
    });
    const tokenInfo = await actor.tokenInfo();

    if (Number(tokenInfo.blockHeight) - 1 <= currentState.currentIndex) {
      return 'empty';
    }

    const count = Number(tokenInfo.blockHeight) - currentState.currentIndex - 1;
    await this.updateTrades(tokenName, currentState.currentIndex, count);

    return 'empty';
  }

  async clearDatabase() {
    //delete all data
    await this.prisma.transfer.deleteMany({});
  }

  async getOwner(tokenName: string): Promise<string> {
    const actor = createLocalActorByName(tokenName);
    const res = await actor.owner();

    const pText = res.toText();

    return pText;
  }

  async tryGetBlock(canisterId: string): Promise<string> {
    throw new Error('undefined');
  }
}
