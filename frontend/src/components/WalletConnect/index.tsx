
import React from 'react';
import { useTonConnect } from '../../hooks/useTonConnect';
import WebApp from '@twa-dev/sdk';
import { QRCode } from '@/components/ui/qr-code';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Wallet,
  QrCode,
  Smartphone,
  Chrome,
  AlertCircle,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import styles from './styles.module.css';

export default function WalletConnect() {
  const { connected, connecting, address, network, disconnect } = useTonConnect();
  const [isQRVisible, setQRVisible] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [showDialog, setShowDialog] = React.useState(false);

  const handleConnect = async () => {
    try {
      if (WebApp.platform === 'ios' || WebApp.platform === 'android') {
        // Mobile deep linking
        const universalUrl = 'https://ton-connect.github.io/bridge/';
        const tonkeeperUrl = `tonkeeper://v1/connect/ton-connect?connect=${encodeURIComponent(universalUrl)}`;
        
        WebApp.openLink(tonkeeperUrl);
      } else {
        setShowDialog(true);
      }
    } catch (error) {
      WebApp.showAlert('Failed to connect wallet. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      WebApp.showAlert('Wallet disconnected');
    } catch (error) {
      WebApp.showAlert('Failed to disconnect wallet');
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (connected && address) {
    return (
      <Card className={styles.walletCard}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connected Wallet
          </CardTitle>
          <CardDescription>
            Network: <span className={styles.network}>{network}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={styles.addressContainer}>
            <span className={styles.address}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyAddress}
              className={styles.copyButton}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="destructive"
            onClick={handleDisconnect}
            className="w-full"
          >
            Disconnect
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={handleConnect}
        disabled={connecting}
        className={styles.connectButton}
      >
        <Wallet className="mr-2 h-5 w-5" />
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className={styles.dialogContent}>
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
          </DialogHeader>

          {network === 'testnet' && (
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You are connecting to testnet. Make sure your wallet is configured for testnet.
              </AlertDescription>
            </Alert>
          )}

          <div className={styles.connectOptions}>
            <Button
              variant="outline"
              className={styles.optionButton}
              onClick={() => setQRVisible(true)}
            >
              <QrCode className="h-5 w-5 mr-2" />
              Scan QR Code
            </Button>

            <Button
              variant="outline"
              className={styles.optionButton}
              onClick={() => WebApp.openLink('https://chrome.google.com/webstore/detail/ton-wallet/nphplpgoakhhjchkkhmiggakijnkhfnd')}
            >
              <Chrome className="h-5 w-5 mr-2" />
              Chrome Extension
            </Button>

            <Button
              variant="outline"
              className={styles.optionButton}
              onClick={() => WebApp.openLink('https://tonkeeper.com/download')}
            >
              <Smartphone className="h-5 w-5 mr-2" />
              Mobile Wallet
            </Button>
          </div>

          {isQRVisible && (
            <div className={styles.qrContainer}>
              <QRCode
                value={`ton://connect?connect=${encodeURIComponent('https://ton-connect.github.io/bridge/')}`}
                size={256}
              />
              <p className={styles.qrInstructions}>
                Scan this QR code with your TON wallet app
              </p>
            </div>
          )}

          <div className={styles.helpText}>
            <p>
              New to TON?{' '}
              <Button
                variant="link"
                className="p-0 h-auto"
                onClick={() => WebApp.openLink('https://ton.org/wallets')}
              >
                Learn about wallets
                <ExternalLink className="h-4 w-4 ml-1" />
              </Button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}