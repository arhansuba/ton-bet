// index.tsx
import { useEffect, useState } from 'react';
import { useRouter } from '@telegram-apps/react-router-integration';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { fromNano, toNano } from '@ton/core';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Info } from 'lucide-react';
import { useTonConnect } from '@/hooks/useTonConnect';
import { telegramService } from '@/services/telegram';
import { webAppService } from '@/services/telegram/webapp';
import { apiService } from '@/services/api';
import { MIN_BET_AMOUNT, PLATFORM_FEE } from '@/constants';
import styles from './styles.module.css';

const formSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .refine(val => {
      const amount = parseFloat(val);
      return !isNaN(amount) && amount >= Number(fromNano(MIN_BET_AMOUNT));
    }, `Minimum bet amount is ${fromNano(MIN_BET_AMOUNT)} TON`),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(200, 'Description must be less than 200 characters')
});

type FormValues = z.infer<typeof formSchema>;

const PRESET_AMOUNTS = ['1', '5', '10', '25', '50', '100'];

export default function CreateBetPage() {
  const router = useRouter();
  const { connected, wallet } = useTonConnect();
  const [customAmount, setCustomAmount] = useState('');
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      description: ''
    }
  });

  const { mutate: createBet, isLoading } = useMutation({
    mutationFn: async (values: FormValues) => {
      const confirmed = await telegramService.showConfirmBet(values.amount);
      if (!confirmed) throw new Error('User cancelled');
      
      return apiService.createBet({
        amount: toNano(values.amount).toString(),
        description: values.description
      });
    },
    onSuccess: async (response) => {
      webAppService.hapticNotification('success');
      await telegramService.notifyNewBet({
        betId: response.data.id,
        creator: response.data.creator,
        amount: response.data.amount,
        description: response.data.description
      });
      router.navigate('/');
    },
    onError: (error) => {
      webAppService.hapticNotification('error');
      webAppService.showAlert(error.message);
    }
  });

  useEffect(() => {
    if (!connected) {
      router.navigate('/');
      return;
    }

    webAppService.showBackButton();
    return () => {
      webAppService.hideBackButton();
    };
  }, [connected, router]);

  useEffect(() => {
    WebApp.BackButton.onClick(() => {
      router.navigate('/');
    });
  }, [router]);

  const handlePresetAmount = (amount: string) => {
    form.setValue('amount', amount, { shouldValidate: true });
    setCustomAmount(amount);
    webAppService.hapticImpact('light');
  };

  const calculateFee = (amount: string) => {
    const value = parseFloat(amount) || 0;
    return (value * PLATFORM_FEE) / 100;
  };

  const calculateTotal = (amount: string) => {
    const value = parseFloat(amount) || 0;
    return value + calculateFee(amount);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Create New Bet</h1>
        </div>
      </div>

      <Form {...form}>
        <form 
          className={styles.form}
          onSubmit={form.handleSubmit(values => createBet(values))}
        >
          <Card className={styles.formCard}>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className={styles.inputGroup}>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className={styles.amountInput}>
                      <Input 
                        {...field}
                        type="number"
                        step="0.1"
                        placeholder="Enter amount"
                        value={customAmount}
                        onChange={e => {
                          setCustomAmount(e.target.value);
                          field.onChange(e.target.value);
                        }}
                      />
                      <span className={styles.amountSuffix}>TON</span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Minimum bet amount is {fromNano(MIN_BET_AMOUNT)} TON
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className={styles.presetAmounts}>
              {PRESET_AMOUNTS.map(amount => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  onClick={() => handlePresetAmount(amount)}
                >
                  {amount}
                </Button>
              ))}
            </div>
          </Card>

          <Card className={styles.formCard}>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field}
                      placeholder="What's the bet about?"
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe what participants are betting on
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Platform Fee ({PLATFORM_FEE}%)</span>
              <span className={styles.infoValue}>
                {calculateFee(form.watch('amount')).toFixed(2)} TON
              </span>
            </div>

            <div className={styles.separator} />

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Total Required</span>
              <span className={styles.infoValue}>
                {calculateTotal(form.watch('amount')).toFixed(2)} TON
              </span>
            </div>

            <div className="flex items-start space-x-2 mt-4 text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5" />
              <p className="text-sm">
                Your wallet needs to have enough TON to cover the bet amount plus platform fees
              </p>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            Create Bet
          </Button>
        </form>
      </Form>
    </div>
  );
}