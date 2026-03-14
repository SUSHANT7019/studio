
'use server'

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

export async function getRounds() {
  try {
    const { data, error } = await supabase
      .from("rounds")
      .select("*")
      .order("start_date", { ascending: true });

    if (error) throw error;

    // Map snake_case from DB to camelCase for the UI
    const formattedData = data?.map((round: any) => ({
      id: round.id,
      name: round.name || round.round_name, // Support both potential column names
      startDate: new Date(round.start_date),
      endDate: new Date(round.end_date),
    })) || [];

    return { success: true, data: formattedData };
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
    const { data, error } = await supabase
      .from("rounds")
      .insert([
        {
          name: name,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    revalidatePath("/admin/rounds");
    return { success: true, data: data[0] };
  } catch (error) {
    console.error("Failed to create round:", error);
    return { success: false, error: "Failed to create round" };
  }