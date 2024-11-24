// index.tsx
import { useEffect, useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from '@telegram-apps/react-router-integration';
import { 
  Plus, 
  RefreshCw,
  Trophy,
  Coins,
  Users,
  ArrowUpDown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatTonAmount } from '@/utils/format';
import { BetCard } from '@/components/BetCard';
import { WalletConnect } from '@/components/WalletConnect';
import { useTonConnect } from '@/hooks/useTonConnect';
import { telegramService } from '@/services/telegram';
import { webAppService } from '@/services/telegram/webapp';
import { apiService } from '@/services/api';
import { BET_STATUS, QUERY_KEYS } from '@/constants';
import styles from './styles.module.css';

export default function HomePage() {
  const router = useRouter();
  const { connected } = useTonConnect();
  const [activeTab, setActiveTab] = useState('active');

  // Get platform stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [QUERY_KEYS.PLATFORM_STATS],
    queryFn: () => apiService.getPlatformStats(),
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Get bets based on active tab
  const { 
    data: bets,
    isLoading: betsLoading,
    refetch: refetchBets
  } = useQuery({
    queryKey: [QUERY_KEYS.BETS, activeTab],
    queryFn: () => apiService.getBets({
      status: activeTab === 'active' ? BET_STATUS.ACTIVE : BET_STATUS.COMPLETED
    })
  });

  // Setup main button based on wallet connection
  useEffect(() => {
    if (connected) {
      telegramService.showMainButton('Create Bet', () => {
        router.navigate('/create');
      });
    } else {
      telegramService.hideMainButton();
    }
  }, [connected, router]);

  const handleRefresh = () => {
    webAppService.hapticImpact('light');
    refetchBets();
  };

  if (!connected) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h2 className="text-xl font-semibold">Connect Wallet to Start</h2>
          <p className="text-muted-foreground">
            You need to connect your TON wallet to create and join bets
          </p>
          <WalletConnect />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className="text-2xl font-bold pt-2">TON Betting</h1>
        
        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <Card className={styles.statsCard}>
            <span className={styles.statsLabel}>
              <Coins className="h-4 w-4 inline mr-1" />
              Total Volume
            </span>
            <span className={styles.statsValue}>
              {statsLoading ? (
                <div className={styles.skeletonText} />
              ) : (
                `${formatTonAmount(stats?.data.totalVolume || '0')} TON`
              )}
            </span>
          </Card>

          <Card className={styles.statsCard}>
            <span className={styles.statsLabel}>
              <Trophy className="h-4 w-4 inline mr-1" />
              Total Bets
            </span>
            <span className={styles.statsValue}>
              {statsLoading ? (
                <div className={styles.skeletonText} />
              ) : (
                stats?.data.totalBets || 0
              )}
            </span>
          </Card>

          <Card className={styles.statsCard}>
            <span className={styles.statsLabel}>
              <Users className="h-4 w-4 inline mr-1" />
              Active Bets
            </span>
            <span className={styles.statsValue}>
              {statsLoading ? (
                <div className={styles.skeletonText} />
              ) : (
                stats?.data.activeBets || 0
              )}
            </span>
          </Card>

          <Card className={styles.statsCard}>
            <span className={styles.statsLabel}>
              <ArrowUpDown className="h-4 w-4 inline mr-1" />
              Avg. Bet Size
            </span>
            <span className={styles.statsValue}>
              {statsLoading ? (
                <div className={styles.skeletonText} />
              ) : (
                `${formatTonAmount(
                  String(Number(stats?.data.totalVolume || 0) / stats?.data.totalBets)
                )} TON`
              )}
            </span>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className={styles.tabs}
        >
          <TabsList className="w-full">
            <TabsTrigger value="active" className="w-1/2">
              Active Bets
            </TabsTrigger>
            <TabsTrigger value="completed" className="w-1/2">
              Completed Bets
            </TabsTrigger>
          </TabsList>

          <Button
            size="icon"
            variant="outline"
            className={styles.refreshButton}
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <TabsContent value="active" className={styles.betList}>
            {betsLoading ? (
              <div className={styles.loadingState}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={styles.skeletonCard} />
                ))}
              </div>
            ) : bets?.data.bets.length === 0 ? (
              <div className={styles.emptyState}>
                <p className="text-muted-foreground">No active bets</p>
                <Button onClick={() => router.navigate('/create')}>
                  Create First Bet
                </Button>
              </div>
            ) : (
              bets?.data.bets.map((bet) => (
                <BetCard
                  key={bet.id}
                  bet={bet}
                  onJoin={() => router.navigate(`/bet/${bet.id}`)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className={styles.betList}>
            {betsLoading ? (
              <div className={styles.loadingState}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className={styles.skeletonCard} />
                ))}
              </div>
            ) : bets?.data.bets.length === 0 ? (
              <div className={styles.emptyState}>
                <p className="text-muted-foreground">No completed bets yet</p>
              </div>
            ) : (
              bets?.data.bets.map((bet) => (
                <BetCard
                  key={bet.id}
                  bet={bet}
                  onJoin={() => router.navigate(`/bet/${bet.id}`)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Button */}
      <Button 
        size="lg"
        className={styles.createButton}
        onClick={() => router.navigate('/create')}
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Bet
      </Button>
    </div>
  );
}