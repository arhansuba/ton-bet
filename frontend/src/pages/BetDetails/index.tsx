// index.tsx
import { useEffect } from 'react';
import { useParams } from '@telegram-apps/react-router-integration';
import { useRouter } from '@telegram-apps/react-router-integration';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  formatTonAmount, 
  formatAddress, 
  formatDate 
} from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Trophy,
  Users,
  AlertCircle
} from 'lucide-react';
import { useTonConnect } from '@/hooks/useTonConnect';
import { telegramService } from '@/services/telegram';
import { webAppService } from '@/services/telegram/webapp';
import { apiService } from '@/services/api';
import { BET_STATUS, QUERY_KEYS } from '@/constants';
import styles from './styles.module.css';

export default function BetDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { connected, address } = useTonConnect();

  // Fetch bet details
  const { 
    data: bet,
    isLoading,
    refetch
  } = useQuery({
    queryKey: [QUERY_KEYS.BET, id],
    queryFn: () => apiService.getBetById(id),
    enabled: !!id
  });

  // Join bet mutation
  const { mutate: joinBet, isLoading: isJoining } = useMutation({
    mutationFn: async () => {
      const confirmed = await telegramService.showConfirmBet(bet.data.amount);
      if (!confirmed) throw new Error('User cancelled');
      
      return apiService.joinBet({
        betId: bet.data.id,
        amount: bet.data.amount
      });
    },
    onSuccess: async (response) => {
      webAppService.hapticNotification('success');
      await telegramService.notifyBetJoined({
        betId: response.data.id,
        creator: response.data.creator,
        amount: response.data.amount,
        description: response.data.description
      });
      refetch();
    },
    onError: (error) => {
      webAppService.hapticNotification('error');
      webAppService.showAlert(error.message);
    }
  });

  // Resolve bet mutation (for creator only)
  const { mutate: resolveBet, isLoading: isResolving } = useMutation({
    mutationFn: async (winnerId: string) => {
      const confirmed = await webAppService.showConfirm(
        'Are you sure you want to resolve this bet?'
      );
      if (!confirmed) throw new Error('User cancelled');
      
      return apiService.resolveBet({
        betId: bet.data.id,
        winner: winnerId
      });
    },
    onSuccess: async (response) => {
      webAppService.hapticNotification('success');
      await telegramService.notifyBetResolved({
        betId: response.data.id,
        winner: response.data.winner,
        amount: response.data.amount,
        description: response.data.description
      });
      refetch();
    },
    onError: (error) => {
      webAppService.hapticNotification('error');
      webAppService.showAlert(error.message);
    }
  });

  useEffect(() => {
    webAppService.showBackButton();
    return () => {
      webAppService.hideBackButton();
    };
  }, []);

  useEffect(() => {
    WebApp.BackButton.onClick(() => {
      router.navigate('/');
    });
  }, [router]);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    webAppService.hapticImpact('light');
    webAppService.showAlert('Address copied to clipboard');
  };

  const handleOpenExplorer = (address: string) => {
    window.open(`https://tonscan.org/address/${address}`, '_blank');
  };

  const getStatusClass = (status: number) => {
    switch (status) {
      case BET_STATUS.ACTIVE:
        return styles.statusActive;
      case BET_STATUS.COMPLETED:
        return styles.statusCompleted;
      case BET_STATUS.CANCELLED:
        return styles.statusCancelled;
      default:
        return '';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case BET_STATUS.ACTIVE:
        return 'Active';
      case BET_STATUS.COMPLETED:
        return 'Completed';
      case BET_STATUS.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-4 mt-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[150px]" />
        </div>
      </div>
    );
  }

  if (!bet?.data) {
    return (
      <div className={styles.container}>
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Bet not found</h2>
          <Button onClick={() => router.navigate('/')}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const canJoin = connected && 
    bet.data.status === BET_STATUS.ACTIVE && 
    !bet.data.participants.find(p => p.address === address);

  const canResolve = connected && 
    bet.data.status === BET_STATUS.ACTIVE && 
    bet.data.creator === address;

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
          <h1 className="text-xl font-semibold">Bet Details</h1>
        </div>
      </div>

      <div className="space-y-4 mt-4">
        <div className={`${styles.status} ${getStatusClass(bet.data.status)}`}>
          {getStatusText(bet.data.status)}
        </div>

        <Card className={styles.card}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Amount</span>
            <span className={styles.infoValue}>
              {formatTonAmount(bet.data.amount)} TON
            </span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Created by</span>
            <div className="flex items-center space-x-2">
              <span className={styles.infoValue}>
                {formatAddress(bet.data.creator)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopyAddress(bet.data.creator)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenExplorer(bet.data.creator)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Created at</span>
            <span className={styles.infoValue}>
              {formatDate(bet.data.createdAt)}
            </span>
          </div>

          <div className={styles.separator} />

          <div className={styles.description}>
            {bet.data.description}
          </div>
        </Card>

        <Card className={styles.card}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <h3 className="font-medium">Participants</h3>
            </div>
            <span className="text-sm text-muted-foreground">
              {bet.data.participants.length} joined
            </span>
          </div>

          <div className={styles.participantsList}>
            {bet.data.participants.map((participant, index) => (
              <div key={participant.address} className={styles.participant}>
                <div className={styles.participantAddress}>
                  <div className={styles.participantAvatar}>
                    {index + 1}
                  </div>
                  <span className="text-sm">
                    {formatAddress(participant.address)}
                  </span>
                  {participant.address === bet.data.creator && (
                    <span className={styles.participantLabel}>
                      Creator
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyAddress(participant.address)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {bet.data.status === BET_STATUS.COMPLETED && bet.data.winner && (
          <div className={styles.winnerSection}>
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4" />
              <span className={styles.winnerLabel}>Winner</span>
            </div>
            <div className={styles.participant}>
              <div className={styles.participantAddress}>
                <div className={styles.participantAvatar}>
                  🏆
                </div>
                <span className="text-sm">
                  {formatAddress(bet.data.winner)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopyAddress(bet.data.winner)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {canJoin && (
          <div className={styles.actionButtons}>
            <Button 
              size="lg"
              onClick={() => joinBet()}
              disabled={isJoining}
            >
              Join Bet
            </Button>
          </div>
        )}

        {canResolve && (
          <div className={styles.actionButtons}>
            <Button 
              size="lg"
              onClick={() => {
                webAppService.showActionSheet(
                  bet.data.participants.map(p => formatAddress(p.address))
                ).then(winner => {
                  if (winner) resolveBet(winner);
                });
              }}
              disabled={isResolving}
            >
              Resolve Bet
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}