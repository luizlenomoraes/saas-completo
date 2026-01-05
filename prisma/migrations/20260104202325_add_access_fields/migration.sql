/*
  Warnings:

  - You are about to drop the column `aluno_email` on the `alunos_acessos` table. All the data in the column will be lost.
  - You are about to drop the column `data_concessao` on the `alunos_acessos` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email_aluno,produto_id]` on the table `alunos_acessos` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email_aluno` to the `alunos_acessos` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "alunos_acessos_aluno_email_produto_id_key";

-- AlterTable
ALTER TABLE "alunos_acessos" DROP COLUMN "aluno_email",
DROP COLUMN "data_concessao",
ADD COLUMN     "data_acesso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email_aluno" TEXT NOT NULL,
ADD COLUMN     "senha" TEXT,
ADD COLUMN     "venda_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "alunos_acessos_email_aluno_produto_id_key" ON "alunos_acessos"("email_aluno", "produto_id");
