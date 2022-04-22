import { Injectable, Logger } from '@nestjs/common';
import { createLocalActorByName as createBasicLocalActorByName } from './declarations/dft_basic';
import { createLocalActorByName as createFusionLocalActorByName } from './declarations/fusion';
import { createLocalActorByName as createBalanceKeeperLocalActorByName } from './declarations/balance_keeper';
import { PrismaService } from './prisma.service';

import { ApproveDto, TransferDto } from './models/dft.service.dto';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ExportToCsv } from 'export-to-csv';
import { identityFactory } from './utils/identity';
import { existsSync, mkdirSync, writeFile } from 'fs';

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

  async getAllTransfers(): Promise<any> {
    const res = await this.prisma.transfer.findMany({
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
    };
    const csvExporter = new ExportToCsv(options);
    if (res.length > 0) {
      return csvExporter.generateCsv(res, true);
    } else {
      return 'No data found';
    }
  }
  async getAllBalances(): Promise<any> {
    const res = await this.prisma.balance.findMany({
      orderBy: {
        id: 'desc',
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
    };
    const csvExporter = new ExportToCsv(options);
    if (res.length > 0) {
      return csvExporter.generateCsv(res, true);
    } else {
      return 'No data found';
    }
  }
  async getAllApproves(): Promise<any> {
    const res = await this.prisma.approve.findMany({
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
    };
    const csvExporter = new ExportToCsv(options);
    if (res.length > 0) {
      return csvExporter.generateCsv(res, true);
    } else {
      return 'No data found';
    }
  }

  async exportAll(): Promise<void> {
    const transfers = await this.getAllTransfers();
    await this.export('transfers', transfers);
    const balances = await this.getAllBalances();
    await this.export('balances', balances);
    const approves = await this.getAllApproves();
    await this.export('approves', approves);
  }

  async export(name: string, data: any): Promise<void> {
    const dir = process.cwd() + `/csv/${name}`;
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFile(dir + `/${name}.csv`, data, function (err) {
      if (err) {
        return console.error(err);
      }
      console.log('File created!');
    });
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
  ): Promise<void> {
    const actor = createBasicLocalActorByName(tokenName);
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
  }

  async updateAllBalances(tokenName: string): Promise<void> {
    const actor = createBasicLocalActorByName(tokenName);
    const balances = await this.prisma.balance.findMany({
      where: {
        tokenName: tokenName,
      },
    });
    for (const balance of balances) {
      const accountId = balance.accountId;
      const balance2 = await actor.balanceOf(accountId);
      await this.prisma.balance.update({
        where: { accountId: accountId },
        data: {
          balance: balance2.toString(),
        },
      });
      this.logger.debug(`${accountId} has ${balance2}`);
    }
  }

  async updateTrades(
    tokenName: string,
    start: number,
    count: number,
  ): Promise<string> {
    const actor = createBasicLocalActorByName(tokenName);

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

    const approves: ApproveDto[] = operationObjects
      .map((op, index) => {
        if ('Approve' in op.operation) {
          const approve = op.operation.Approve;
          const a = approve as ApproveDto;
          a.createAt = op.createdAt;
          a.height = index;
          return a;
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

    for (const ap of approves) {
      await this.prisma.approve.create({
        data: {
          owner: identityFactory.getNameById(ap.owner),
          spender: identityFactory.getNameById(ap.spender),
          caller: identityFactory.getPrincipalNameById(ap.caller.toText()),
          value: ap.value.toString(),
          fee: ap.fee,
          createdAt: ap.createAt,
          height: ap.height,
          blockHeight: start + ap.height,
          tokenName: tokenName,
        },
      });
    }

    const updateAccouts = transfers.map((tr) => tr.caller);
    updateAccouts.push(...transfers.map((tr) => tr.from));
    updateAccouts.push(...transfers.map((tr) => tr.to));
    // updateAccouts.push(...approves.map((ap) => ap.owner));
    // updateAccouts.push(...approves.map((ap) => ap.spender));

    await this.updateBalances(tokenName, updateAccouts);
    currentState.currentIndex += operationObjects.length;
    await this.prisma.tokenState.update({
      where: { id: currentState.id },
      data: { currentIndex: currentState.currentIndex },
    });

    return;
  }

  async clearAndUpdate(tokenName: string): Promise<void> {
    const actor = createBasicLocalActorByName(tokenName);
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

    return;
  }

  async updateByCurrentState(tokenName: string): Promise<void> {
    const actor = createBasicLocalActorByName(tokenName);
    const currentState = await this.prisma.tokenState.findFirst({
      where: { name: tokenName },
    });
    const tokenInfo = await actor.tokenInfo();

    if (Number(tokenInfo.blockHeight) - 1 <= currentState.currentIndex) {
      return;
    }

    const count = Number(tokenInfo.blockHeight) - currentState.currentIndex - 1;
    await this.updateTrades(tokenName, currentState.currentIndex, count);

    await this.exportAll();
    return;
  }

  async clearDatabase() {
    //delete all data
    await this.prisma.transfer.deleteMany({});
  }

  async getOwner(tokenName: string): Promise<string> {
    const actor = createBasicLocalActorByName(tokenName);
    const res = await actor.owner();

    const pText = res.toText();

    return pText;
  }

  async checkBalanceKeeperVerion(): Promise<boolean> {
    const fusionActor = createFusionLocalActorByName('fusion');
    const balanceKeeperActor = createBalanceKeeperLocalActorByName('balance');
    const state = await this.prisma.tokenState.findFirst({
      where: { name: 'fusion' },
    });
    const fusionRes = await fusionActor.version();
    const balanceKeeperRes = await balanceKeeperActor.version();
    //get res
    const fusionVersionRes = fusionRes as {
      Ok: bigint;
    };
    const balanceKeeperVersionRes = balanceKeeperRes as {
      Ok: bigint;
    };

    if (fusionVersionRes === undefined) {
      return false;
    }
    if (fusionVersionRes.Ok.toString() === state.currentIndex.toString()) {
      return false;
    }
    if (
      balanceKeeperVersionRes.Ok.toString() !== fusionVersionRes.Ok.toString()
    ) {
      return false;
    }

    await this.prisma.tokenState.update({
      where: { name: 'fusion' },
      data: { version: fusionVersionRes.Ok },
    });
    return true;
  }

  async tryGetBlock(canisterId: string): Promise<string> {
    throw new Error('undefined');
  }
}
