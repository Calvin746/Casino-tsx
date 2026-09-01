import React, { useState } from 'react';
import { CasinoLobby3D } from './components/CasinoLobby3D';
import { AuthScreen } from './components/AuthScreen';

export const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [initialBalance, setInitialBalance] = useState<number>(0);

    const handleLogin = (balance: number) => {
        setInitialBalance(balance);
        setIsAuthenticated(true);
    };

    if (!isAuthenticated) {
        return <AuthScreen onLogin={handleLogin} />;
    }

    return <CasinoLobby3D initialBalance={initialBalance} />;
};

export default App;