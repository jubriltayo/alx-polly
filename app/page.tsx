import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="container mx-auto py-10 px-4">
      <section className="py-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Alx-Polly</h1>
        <p className="text-xl text-gray-600 mb-8">Create, share, and vote on polls with ease</p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/dashboard">Browse Polls</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/create">Create Poll</Link>
          </Button>
        </div>
      </section>

      <section className="py-12">
        <h2 className="text-2xl font-bold mb-8 text-center">Features</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Create Custom Polls</CardTitle>
              <CardDescription>Design polls with multiple options</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Easily create polls with custom questions and multiple choice options.</p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/create">Get Started</Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Vote on Polls</CardTitle>
              <CardDescription>Participate in community polls</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Browse and vote on polls created by the community.</p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard">View Polls</Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>User Accounts</CardTitle>
              <CardDescription>Track your polls and votes</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Create an account to track your created polls and voting history.</p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href="/register">Sign Up</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
}
