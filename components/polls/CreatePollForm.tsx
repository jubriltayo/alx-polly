import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PlusCircle, X } from 'lucide-react';

export function CreatePollForm() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create a New Poll</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Poll Question</Label>
            <Input id="title" placeholder="What would you like to ask?" />
          </div>
          
          <div className="space-y-2">
            <Label>Poll Options</Label>
            <div className="space-y-3">
              {[1, 2].map((index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input placeholder={`Option ${index}`} />
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <Button variant="outline" className="mt-2 w-full" type="button">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Option
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" placeholder="Add more context to your poll" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Create Poll</Button>
      </CardFooter>
    </Card>
  );
}
