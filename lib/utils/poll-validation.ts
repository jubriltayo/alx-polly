import { z } from 'zod';

export const PollSchema = z.object({
  title: z.string().min(1, 'Poll title is required.'),
  description: z.string().optional(),
  options: z.array(z.string()).min(2, 'At least two options are required.'),
}).refine(
  (data) => data.options.filter(option => option.trim().length > 0).length >= 2,
  { 
    message: 'At least two non-empty options are required.',
    path: ['options']
  }
);