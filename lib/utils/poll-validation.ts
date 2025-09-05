import { z } from 'zod';

export const PollSchema = z.object({
  title: z.string()
    .min(10, 'Poll question must be at least 10 characters.')
    .max(200, 'Poll question must not exceed 200 characters.'),
  description: z.string().optional(),
  options: z.array(
    z.string()
      .min(1, 'Option cannot be empty.')
      .max(100, 'Option must not exceed 100 characters.')
  )
    .min(2, 'You must provide at least 2 poll options.')
    .max(10, 'You can provide a maximum of 10 poll options.')
    .refine((items) => new Set(items.map(item => item.toLowerCase())).size === items.length, {
      message: "Duplicate options are not allowed.",
    }),
});