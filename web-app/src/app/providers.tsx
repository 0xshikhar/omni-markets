'use client';

import * as React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from 'wagmi';
import {
    QueryClientProvider,
    QueryClient,
} from "@tanstack/react-query";
import 'dotenv/config';

import {
    sepolia,
    bsc,
    bscTestnet
} from 'wagmi/chains';
import { createConfig } from 'wagmi';
import { http } from 'viem';

// Configure wagmi client
const config = createConfig({
    chains: [bscTestnet, sepolia, bsc],
    transports: {
        [bscTestnet.id]: http(),
        [sepolia.id]: http(),
        [bsc.id]: http(),
    },
});

const queryClient = new QueryClient();

// Your Privy App ID - replace with your actual app ID
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'your-privy-app-id';

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);
    
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <PrivyProvider
                    appId={PRIVY_APP_ID}
                    config={{
                        defaultChain: bscTestnet,
                        supportedChains: [bscTestnet, sepolia, bsc],
                        loginMethods: ['wallet', 'email', 'google'],
                        appearance: {
                            theme: 'light',
                            accentColor: '#3B82F6',
                        },
                        embeddedWallets: {
                            createOnLogin: 'users-without-wallets',
                        },
                    }}
                >
                    {mounted ? (
                        children
                    ) : (
                        <div style={{ visibility: "hidden" }}>
                            {children}
                        </div>
                    )}
                </PrivyProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
