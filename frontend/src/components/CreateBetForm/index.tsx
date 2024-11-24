import React from 'react';
import { useTonConnect } from '../../hooks/useTonConnect';
import { useBetContract } from '../../hooks/useBetContract';
import { toNano } from '@ton/core';
import WebApp from '@twa-dev/sdk';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Coins, Users, Clock, AlertCircle } from 'lucide-react';
import styles from './styles.module.css';

const createBetSchema = z.object({
  amount: z.string()
    .min(1, "Amount is required")
    .refine(val => {
      try {
        const amount = Number(val);
        return amount >= 0.1 && amount <= 10000;
      } catch {
        return false;
      }
    }, "Amount must be between 0.1 and 10,000 TON"),
  description: z.string()
    .min(5, "Description must be at least 5 characters")
    .max(500, "Description must be less than 500 characters"),
  expiryTime: z.string()
    .refine(val => {
      const time = new Date(val).getTime();
      return time > Date.now() + 5 * 60 * 1000;
    }, "Expiry time must be at least 5 minutes in the future"),
  maxParticipants: z.string()
    .transform(val => Number(val))
    .refine(val => val >= 2 && val <= 10, "Between 2 and 10 participants allowed")
});

type FormData = z.infer<typeof createBetSchema>;

export default function CreateBetForm() {
  const { connected } = useTonConnect();
  const { createBet, loading } = useBetContract();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(createBetSchema),
    defaultValues: {
      amount: "1",
      description: "",
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      maxParticipants: 2
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (!connected) {
        WebApp.showAlert("Please connect your wallet first");
        return;
      }

      setError(null);
      WebApp.showConfirm(
        `Create bet for ${data.amount} TON?`,
        async (confirmed) => {
          if (confirmed) {
            await createBet({
              amount: toNano(data.amount).toString(),
              description: data.description,
              expiryTime: new Date(data.expiryTime).getTime(),
              maxParticipants: Number(data.maxParticipants)
            });
            WebApp.showAlert("Bet created successfully!");
            form.reset();
          }
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bet");
      WebApp.showAlert("Failed to create bet. Please try again.");
    }
  };

  return (
    <Card className={styles.formCard}>
      <CardHeader>
        <CardTitle>Create New Bet</CardTitle>
      </CardHeader>

      <CardContent>
        {!connected && (
          <Alert variant="warning" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connect your wallet to create a bet
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Amount (TON)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Coins className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        {...field}
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="10000"
                        className="pl-10"
                        placeholder="1.0"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your bet..."
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiryTime"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Expiry Time</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        {...field}
                        type="datetime-local"
                        className="pl-10"
                        min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxParticipants"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Max Participants</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        {...field}
                        type="number"
                        min="2"
                        max="10"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </Form>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          size="lg"
          disabled={!connected || loading}
          onClick={form.handleSubmit(onSubmit)}
        >
          {loading ? "Creating..." : "Create Bet"}
        </Button>
      </CardFooter>
    </Card>
  );
}