-- CreateTable
CREATE TABLE "Transfer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "height" INTEGER NOT NULL,
    "blockHeight" INTEGER NOT NULL,
    "createdAt" BIGINT NOT NULL,
    "to" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "fee" BIGINT NOT NULL,
    "caller" TEXT NOT NULL,
    "tokenName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Approve" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "height" INTEGER NOT NULL,
    "blockHeight" INTEGER NOT NULL,
    "createdAt" BIGINT NOT NULL,
    "fee" BIGINT NOT NULL,
    "value" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "caller" TEXT NOT NULL,
    "spender" TEXT NOT NULL,
    "tokenName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TokenState" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "currentIndex" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Balance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" TEXT NOT NULL,
    "balance" TEXT NOT NULL,
    "tokenName" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenState_name_key" ON "TokenState"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Balance_accountId_key" ON "Balance"("accountId");
