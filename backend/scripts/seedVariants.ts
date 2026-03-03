import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const adultSizes = ["S", "M", "L", "XL", "2XL", "3XL"];
const kidsSizes = ["24", "26", "28", "30", "32", "34"];

async function main() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { variants: true },
  });

  for (const p of products) {
    if (p.variants.length > 0) continue;

    if (p.category === "KIT") {
      // Adults
      for (const s of adultSizes) {
        await prisma.productVariant.create({
          data: {
            productId: p.id,
            group: "ADULT",
            size: s,
            currency: p.currency,
            price: null,      // uses product.price
            stock: null,
            isActive: true,
          },
        });
      }

      // Kids
      for (const s of kidsSizes) {
        await prisma.productVariant.create({
          data: {
            productId: p.id,
            group: "KIDS",
            size: s,
            currency: p.currency,
            price: null,
            stock: null,
            isActive: true,
          },
        });
      }
    } else {
      // Non-kit merch: default ONE SIZE so checkout always has a variantId
      await prisma.productVariant.create({
        data: {
          productId: p.id,
          group: "ADULT",
          size: "ONE SIZE",
          currency: p.currency,
          price: null,
          stock: null,
          isActive: true,
        },
      });
    }
  }

  console.log("✅ Variants seeded where missing");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });