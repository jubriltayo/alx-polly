'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { createPoll } from '@/lib/actions/poll';
import { PollSchema } from '@/lib/utils/poll-validation';

type FormData = z.infer<typeof PollSchema>;

export function CreatePollForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MAX_OPTIONS = 10;

  const form = useForm<FormData>({
    resolver: zodResolver(PollSchema),
    defaultValues: {
      title: '',
      description: '',
      options: ['', ''],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'options',
  });

  const handleAddOption = () => {
    if (fields.length < MAX_OPTIONS) {
      append(`Option ${fields.length + 1}`);
    }
  };

  const handleRemoveOption = (index: number) => {
    remove(index);
  };

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    setIsSubmitting(true);
    
    // Filter to non-empty options
    const nonEmptyOptions = data.options.filter(option => option.trim().length > 0);
    if (nonEmptyOptions.length < 2) {
      setServerError('Please provide at least 2 non-empty options.');
      setIsSubmitting(false);
      return;
    }
    if (nonEmptyOptions.length > MAX_OPTIONS) {
      setServerError('Maximum 10 options allowed.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.description) {
        formData.append('description', data.description);
      }
      nonEmptyOptions.forEach(option => formData.append('options[]', option.trim()));

      const result = await createPoll(formData);

      if (result?.error) {
        setServerError(result.error);
      } else {
        form.reset({ title: '', description: '', options: ['Option 1', 'Option 2'] });
      }
    } catch (error) {
      // Check if the error is a Next.js redirect error
      if (error && typeof error === 'object' && 'message' in error && (error.message as string).includes('NEXT_REDIRECT')) {
        // This is a redirect, no need to set a server error
        // Next.js will handle the redirection automatically
      } else {
        setServerError('An unexpected error occurred. Please try again.');
        console.error('Poll creation error:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Create New Poll</CardTitle>
        <CardDescription>Fill in the details to create your poll.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poll Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your poll question" {...field} />
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
                    <Textarea placeholder="Provide more details about your poll" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Poll Options</FormLabel>
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`options.${index}`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Input placeholder={`Option ${index + 1}`} {...field} />
                      </FormControl>
                      {fields.length > 2 && (
                        <Button type="button" variant="destructive" onClick={() => handleRemoveOption(index)}>
                          Remove
                        </Button>
                      )}
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddOption}
                className="w-full"
                
              >
                Add Option
              </Button>
            </div>

            {serverError && <p className="text-red-500 text-sm mt-2">{serverError}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}