import { PrismaClient, Prisma } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

const userData: Prisma.UserCreateInput[] = [
  {
    email: 'test@prisma.io',
    password: '$10$nUTWOCUDDK0nLY0ibzN1YOTm5QTrR1PXwi5Bd4yQkVaYno0C7gpTy', // 123456
  },
];

export async function main() {
  for (const u of userData) {
    await prisma.user.create({ data: u });
  }
}

main();
