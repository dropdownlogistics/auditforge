-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'PREPARER', 'REVIEWER', 'APPROVER', 'VIEWER');

-- CreateTable
CREATE TABLE "dim_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'PREPARER',
    "company_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "dim_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_invite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'PREPARER',
    "token" TEXT NOT NULL,
    "invited_by_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dim_user_email_key" ON "dim_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_session_token_key" ON "auth_session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "auth_invite_token_key" ON "auth_invite"("token");

-- AddForeignKey
ALTER TABLE "dim_user" ADD CONSTRAINT "dim_user_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dim_company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "dim_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_invite" ADD CONSTRAINT "auth_invite_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dim_company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_invite" ADD CONSTRAINT "auth_invite_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "dim_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
