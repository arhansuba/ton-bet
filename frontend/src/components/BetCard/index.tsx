import React from 'react';
import { useTonConnect } from '@/hooks/useTonConnect';
import { fromNano } from '@ton/core';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Users, 
  Wallet, 
  Trophy,
  ArrowRight,
  AlertCircle 
} from 'lucide-react';
import styles from './styles.module.css';

interface BetCardProps {
  id: string;
  amount: string;
  description: string;
  participants: string[];
  status: 'PENDING' | 'ACTIVE' | 'RESOLVED' | 'EXPIRED';
  winner?: string;
  expiryTime: number;
  creatorId: string;
  onJoin?: () => void;
  onResolve?: () => void;
}

export default function BetCard({
  id,
  amount,
  description,
  participants,
  status,
  winner,
  expiryTime,
  creatorId,
  onJoin,
  onResolve
}: BetCardProps) {
  const { connected, address } = useTonConnect();
  
  // Format TON amount for display
  const formattedAmount = React.useMemo(() => {
    return `${fromNano(amount)} TON`;
  }, [amount]);

  // Calculate time remaining
  const timeRemaining = React.useMemo(() => {
    const now = Date.now();
    const remaining = expiryTime - now;
    if (remaining <= 0) return '0m';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }, [expiryTime]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'RESOLVED':
        return 'bg-blue-100 text-blue-800';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={styles.betCard}>
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-start">
          <CardTitle className="text-2xl font-bold">{formattedAmount}</CardTitle>
          <Badge className={getStatusColor(status)}>{status}</Badge>
        </div>
        <p className="text-sm text-gray-500 truncate">{description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Time remaining */}
        <div className="flex items-center space-x-2 text-sm">
          <Clock className="w-4 h-4" />
          <span>Time remaining: {timeRemaining}</span>
        </div>

        {/* Participants */}
        <div className="flex items-center space-x-2 text-sm">
          <Users className="w-4 h-4" />
          <span>{participants.length} participants</span>
        </div>

        {/* Winner info if resolved */}
        {status === 'RESOLVED' && winner && (
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <Trophy className="w-4 h-4" />
            <span>Winner: {winner === address ? 'You' : winner}</span>
          </div>
        )}

        {/* Connection warning */}
        {!connected && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connect your wallet to participate</AlertTitle>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {status === 'PENDING' && connected && (
          <Button 
            onClick={onJoin}
            disabled={!connected || creatorId === address}
            className="w-full"
          >
            Join Bet <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}

        {status === 'ACTIVE' && creatorId === address && (
          <Button 
            onClick={onResolve}
            variant="secondary"
            className="w-full"
          >
            Resolve Bet
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}