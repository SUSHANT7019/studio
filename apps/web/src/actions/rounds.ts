'use server'

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getRounds() {
  try {
    const rounds = await prisma.round.findMany({
      orderBy: {
        startDate: 'asc',
      },
    });
    return { success: true, data: rounds };
  } catch (error) {
    console.error("Failed to fetch rounds:", error);
    return { success: false, error: "Failed to fetch rounds" };
  }
}

export async function createRound(formData: FormData) {
  const name = formData.get("name") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  if (!name || !startDate || !endDate) {
    return { success: false, error: "All fields are required" };
  }

  try {
    const round = await prisma.round.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    revalidatePath("/admin/rounds");
    return { success: true, data: round };
  } catch (error) {
    console.error("Failed to create round:", error);
    return { success: false, error: "Failed to create round" };
  }
}