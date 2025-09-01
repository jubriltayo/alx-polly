'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { submitVote } from '@/lib/actions/poll';
import { useToast } from '@/components/ui/use-toast';

type VoteFormProps = {
  pollId: string;
  options: { id: string; text: string }[];
};

export function VoteForm({ pollId, options }: VoteFormProps) {
  const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedOption) {
      toast({
        title: "No option selected",
        description: "Please select an option before submitting your vote.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('pollId', pollId);
    formData.append('optionId', selectedOption);

    const result = await submitVote(formData);
    setIsSubmitting(false);

    if (result?.error) {
      toast({
        title: "Error submitting vote",
        description: result.error,
        variant: "destructive",
      });
    } else {
      // The server action handles the redirect on success, so no explicit redirect here
      // But we can show a success toast before the redirect takes effect
      toast({
        title: "Vote submitted!",
        description: "Thank you for your vote.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <RadioGroup onValueChange={setSelectedOption} value={selectedOption} className="space-y-2">
        {options.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <RadioGroupItem value={option.id} id={option.id} />
            <Label htmlFor={option.id}>{option.text}</Label>
          </div>
        ))}
      </RadioGroup>
      <Button type="submit" disabled={isSubmitting || !selectedOption}>
        {isSubmitting ? 'Submitting...' : 'Vote'}
      </Button>
    </form>
  );
}
