import { Injectable, Logger } from '@nestjs/common';
import { createLocalActorByName as createLocalActorByName } from './token_WICP';
import { BlockResult } from './token_WICP/token_WICP.did';
import { PrismaService } from './prisma.service';
import { type } from 'os';
import { Transfer } from '@prisma/client';
import {
  ApproveDto,
  FeeToModifyDto,
  TransferDto,
} from './models/dft.service.dto';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class DftService {
  constructor(
    private prisma: PrismaService,
    private logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getTrades(tokenName: string): Promise<string> {
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

    const transfers = operationObjects
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
          from: tr.from,
          to: tr.to,
          caller: tr.caller,
          value: tr.value.toString(),
          fee: tr.fee,
          createdAt: tr.createAt,
          height: tr.height,
          blockHeight: start + tr.height,
          tokenName: tokenName,
        },
      });
    }

    await this.updateBalances(
      tokenName,
      transfers.map((x) => x.caller),
    );
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
    const pageSize = 100;
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
