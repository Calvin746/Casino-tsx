import React, { useState, useEffect } from 'react';
import { StakeHeader, CurrencyType } from './components/layout/StakeHeader';
import { StakeSidebar, GameView } from './components/layout/StakeSidebar';
import { TopBannerCarousel } from './components/ads/TopBannerCarousel';
import { BottomAdBanner } from './components/ads/BottomAdBanner';
import { LiveBetsTable } from './components/ticker/LiveBetsTable';
import { GameGrid } from './components/games/GameGrid';
import { SlotMachine3D } from './components/SlotMachine3D';
import { MinesGame } from './components/games/MinesGame';
import { CrashGame } from './components/games/CrashGame';
import { CasinoLobby3D } from './components/CasinoLobby3D';
import { WalletModal } from './components/WalletModal';
import { AuthScreen } from './components/AuthScreen';

export const App: React.FC = () => {
    // App State
    const [balanceCents, setBalanceCents] = useState<number>(10000); // Default 100.00 € Startguthaben
    const [currency, setCurrency] = useState<CurrencyType>('EUR');
    const [activeView, setActiveView] = useState<GameView>('LOBBY');
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
    const [activeHeaderTab, setActiveHeaderTab] = useState<'casino' | 'sports'>('casino');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [kycStatus, setKycStatus] = useState<string>('VERIFIED');
    const [userEmail, setUserEmail] = useState<string>('vip_player@stake.local');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

    // Modals
    const [showWallet, setShowWallet] = useState<boolean>(false);
    const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

    // Try to load initial user data from server if available
    useEffect(() => {
        const checkUser = async () => {
            try {
                const res = await fetch('http://localhost:4000/api/users/me', {
                    credentials: 'include'
                });
                if (res.ok) {
                    const data = await res.json();
                    setBalanceCents(data.balanceCents);
                    setKycStatus(data.kycStatus);
                    setUserEmail(data.email);
                    setIsLoggedIn(true);
                }
            } catch (e) {
                // Server offline -> Keep local VIP guest demo session active
            }
        };
        checkUser();
    }, []);

    const handleLoginSuccess = (balance: number, email?: string) => {
        setBalanceCents(balance);
        if (email) setUserEmail(email);
        setIsLoggedIn(true);
        setShowAuthModal(false);
    };

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:4000/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (e) {}
        setIsLoggedIn(false);
        setUserEmail('');
    };

    const handlePromoAction = (promoId?: string) => {
        if (promoId === 'bonus') {
            setShowWallet(true);
        } else if (promoId === 'f1' || promoId === 'ufc') {
            setActiveHeaderTab('sports');
            window.scrollTo({ top: 300, behavior: 'smooth' });
        } else {
            // Default to 3D Slot or Mines for giveaway action
            setActiveView('SLOT3D');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="stake-layout">
            {/* Top Stake Header */}
            <StakeHeader
                balanceCents={balanceCents}
                currency={currency}
                onCurrencyChange={setCurrency}
                onOpenWallet={() => setShowWallet(true)}
                onOpenAuth={() => setShowAuthModal(true)}
                isLoggedIn={isLoggedIn}
                userEmail={userEmail}
                onLogout={handleLogout}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                sidebarOpen={sidebarOpen}
                activeTab={activeHeaderTab}
                onTabChange={setActiveHeaderTab}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            <div className="stake-body-container">
                {/* Collapsible Left Stake Sidebar */}
                <StakeSidebar
                    isOpen={sidebarOpen}
                    activeView={activeView}
                    onSelectView={(v) => {
                        setActiveView(v);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onOpenPromo={handlePromoAction}
                />

                {/* Main Content View */}
                <main className="stake-main-content">
                    {/* View 1: Casino Lobby */}
                    {activeView === 'LOBBY' && (
                        <>
                            {/* Echte Werbung Oben: Hero Carousel */}
                            <TopBannerCarousel onActionClick={handlePromoAction} />

                            {/* Game Category Navigation & Cards */}
                            <GameGrid
                                onSelectGame={(v) => {
                                    setActiveView(v);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                searchQuery={searchQuery}
                            />

                            {/* Live Bets & High Rollers Table */}
                            <LiveBetsTable />

                            {/* Echte Werbung Unten & Official Footer */}
                            <BottomAdBanner
                                onOpenDeposit={() => setShowWallet(true)}
                                onSelectPromo={handlePromoAction}
                            />
                        </>
                    )}

                    {/* View 2: Royal 3D Slot Machine */}
                    {activeView === 'SLOT3D' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <SlotMachine3D
                                initialBalance={balanceCents}
                                onBackToLobby={() => setActiveView('LOBBY')}
                                onUpdateBalance={setBalanceCents}
                                onOpenWallet={() => setShowWallet(true)}
                            />
                            {/* Sponsor Bar also visible below games */}
                            <BottomAdBanner
                                onOpenDeposit={() => setShowWallet(true)}
                                onSelectPromo={handlePromoAction}
                            />
                        </div>
                    )}

                    {/* View 3: Stake Mines Game */}
                    {activeView === 'MINES' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <MinesGame
                                balanceCents={balanceCents}
                                onUpdateBalance={setBalanceCents}
                                onBack={() => setActiveView('LOBBY')}
                            />
                            <BottomAdBanner
                                onOpenDeposit={() => setShowWallet(true)}
                                onSelectPromo={handlePromoAction}
                            />
                        </div>
                    )}

                    {/* View 4: Stake Crash Game */}
                    {activeView === 'CRASH' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <CrashGame
                                balanceCents={balanceCents}
                                onUpdateBalance={setBalanceCents}
                                onBack={() => setActiveView('LOBBY')}
                            />
                            <BottomAdBanner
                                onOpenDeposit={() => setShowWallet(true)}
                                onSelectPromo={handlePromoAction}
                            />
                        </div>
                    )}

                    {/* View 5: 3D Casino Room Walkthrough */}
                    {activeView === 'WALKTHROUGH3D' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button
                                    onClick={() => setActiveView('LOBBY')}
                                    className="stake-btn stake-btn-secondary"
                                >
                                    ← Zurück zur Lobby
                                </button>
                                <span className="stake-badge stake-badge-vip">3D VIRTUAL REALITY LOUNGE</span>
                            </div>
                            <div style={{ height: '70vh', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                                <CasinoLobby3D initialBalance={balanceCents} />
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Cashier / Wallet Modal */}
            {showWallet && (
                <WalletModal
                    onClose={() => setShowWallet(false)}
                    currentBalance={balanceCents}
                    kycStatus={kycStatus}
                    onUpdateBalance={setBalanceCents}
                    onKycUpdate={setKycStatus}
                />
            )}

            {/* Login / Register Modal */}
            {showAuthModal && (
                <AuthScreen
                    isModal={true}
                    onLogin={handleLoginSuccess}
                    onClose={() => setShowAuthModal(false)}
                />
            )}
        </div>
    );
};

export default App;