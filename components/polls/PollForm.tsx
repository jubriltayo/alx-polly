'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PollSchema } from '@/lib/utils/poll-validation';
import { PlusCircle, Trash2 } from 'lucide-react';
import { createPoll } from '@/lib/actions/poll';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type PollFormValues = z.infer<typeof PollSchema>;

const defaultValues: Partial<PollFormValues> = {
  title: '',
  description: '',
  options: [{ value: '' }, { value: '' }], // Initialize with objects for useFieldArray
};

export function PollForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PollFormValues>({
    resolver: zodResolver(PollSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  async function onSubmit(data: PollFormValues) {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) {
      formData.append('description', data.description);
    }
    // Ensure options are sent as strings for the Server Action
    data.options.forEach((option) => formData.append('options[]', option.value));

    try {
      const result = await createPoll(formData);
      if (result?.error) {
        toast({
          title: 'Error creating poll',
          description: result.error,
          variant: 'destructive',
        });
      } 
      // No else block here for success toast, as createPoll redirects on success.
      // The redirect itself implies success.
    } catch (error) {
      // Check if the error is a Next.js redirect error and re-throw it
      if (error && typeof error === 'object' && 'message' in error && (error.message as string).includes('NEXT_REDIRECT')) {
        throw error; // Re-throw the redirect error so Next.js can handle it
      }
      console.error('Unexpected error during poll creation form submission:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
    finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Poll Question</FormLabel>
              <FormControl>
                <Textarea placeholder="What's your favorite color?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Provide more context for your poll." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Poll Options</FormLabel>
          {fields.map((item, index) => (
            <FormField
              key={item.id}
              control={form.control}
              name={`options.${index}.value`}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 mt-4">
                  <FormControl>
                    <Input placeholder={`Option ${index + 1}`} {...field} />
                  </FormControl>
                  {fields.length > 2 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          {form.formState.errors.options && typeof form.formState.errors.options.message === 'string' && (
            <p className="text-sm font-medium text-red-500 mt-2">{form.formState.errors.options.message}</p>
          )}
          
          {fields.length < 10 && (
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ value: '' })}>
              <PlusCircle className="h-4 w-4 mr-2" /> Add Option
            </Button>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
          {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
        </Button>
      </form>
    </Form>
  );
}
