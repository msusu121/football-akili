
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";    

dotenv.config();
const prisma = new PrismaClient();

await prisma.membershipPlan.upsert({
  where: { tier: "SILVER" },
  update: {
    name: "Silver",
    price: 2000,
    currency: "KES",
    durationDays: 365,
    benefits: JSON.stringify([
      "10% merchandise discount",
      "Priority ticket access",
      "Digital QR membership card",
      "Club newsletter",
    ]),
    isActive: true,
    sort: 1,
  },
  create: {
    tier: "SILVER",
    name: "Silver",
    price: 2000,
    currency: "KES",
    durationDays: 365,
    benefits: JSON.stringify([
      "10% merchandise discount",
      "Priority ticket access",
      "Digital QR membership card",
      "Club newsletter",
    ]),
    isActive: true,
    sort: 1,
  },
});

await prisma.membershipPlan.upsert({
  where: { tier: "GOLD" },
  update: {
    name: "Gold",
    price: 5000,
    currency: "KES",
    durationDays: 365,
    benefits: JSON.stringify([
      "15% merchandise discount",
      "Priority ticket access",
      "Members-only events",
      "Digital QR membership card",
    ]),
    isActive: true,
    sort: 2,
  },
  create: {
    tier: "GOLD",
    name: "Gold",
    price: 5000,
    currency: "KES",
    durationDays: 365,
    benefits: JSON.stringify([
      "15% merchandise discount",
      "Priority ticket access",
      "Members-only events",
      "Digital QR membership card",
    ]),
    isActive: true,
    sort: 2,
  },
});

await prisma.membershipPlan.upsert({
  where: { tier: "PLATINUM" },
  update: {
    name: "Platinum",
    price: 20000,
    currency: "KES",
    durationDays: 365,
    benefits: JSON.stringify([
      "15% merchandise discount",
      "VIP experiences",
      "Priority access",
      "Premium digital card",
    ]),
    isActive: true,
    sort: 3,
  },
  create: {
    tier: "PLATINUM",
    name: "Platinum",
    price: 20000,
    currency: "KES",
    durationDays: 365,
    benefits: JSON.stringify([
      "15% merchandise discount",
      "VIP experiences",
      "Priority access",
      "Premium digital card",
    ]),
    isActive: true,
    sort: 3,
  },
});

await prisma.membershipPlan.upsert({
  where: { tier: "DIAMOND" },
  update: {
    name: "Diamond",
    price: 100000,
    currency: "KES",
    durationDays: 365,
    benefits: JSON.stringify([
      "15% merchandise discount",
      "Physical premium card",
      "VIP access",
      "Exclusive events",
    ]),
    isActive: true,
    sort: 4,
  },
  create: {
    tier: "DIAMOND",
    name: "Diamond",
    price: 100000,
    currency: "KES",
    durationDays: 365,
    benefits: JSON.stringify([
      "15% merchandise discount",
      "Physical premium card",
      "VIP access",
      "Exclusive events",
    ]),
    isActive: true,
    sort: 4,
  },
});

for (const reward of [
  { id: "free-ticket", title: "Free Ticket", pointsCost: 500, sort: 1 },
  { id: "jersey-discount", title: "Jersey Discount", pointsCost: 700, sort: 2 },
  { id: "vip-upgrade", title: "VIP Upgrade", pointsCost: 1200, sort: 3 },
  { id: "signed-ball", title: "Signed Ball", pointsCost: 2000, sort: 4 },
]) {
  await prisma.loyaltyReward.upsert({
    where: { id: reward.id },
    update: {
      title: reward.title,
      pointsCost: reward.pointsCost,
      sort: reward.sort,
      isActive: true,
    },
    create: {
      id: reward.id,
      title: reward.title,
      pointsCost: reward.pointsCost,
      sort: reward.sort,
      isActive: true,
    },
  });
}