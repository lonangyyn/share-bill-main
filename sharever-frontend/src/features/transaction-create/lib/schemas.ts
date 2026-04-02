import { z } from "zod";

export const expenseSchema = z.object({
  title: z.string().min(1),
  amount: z.number().positive(),
});
