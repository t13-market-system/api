import "temporal-polyfill/global";
import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
// Apontando para o contract gerado, não mais para schema
import type { Contract } from "../../prisma/contract"; 
import contractJson from "../../prisma/contract.json" with { type: "json" };

export const prisma = postgres<Contract>({
  contractJson,
  url: process.env.DATABASE_URL!, 
});