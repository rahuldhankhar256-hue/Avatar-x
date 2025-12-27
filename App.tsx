
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, User, Bet, HistoryItem, Transaction } from './types';
import VectorCanvas from './components/VectorCanvas';
import Wallet from './components/Wallet';
import { getFlightAnalysis } from './services/geminiService';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ username: '', password: '' });

  // Game State
  const [gameState, setGameState] = useState<GameState>(GameState.WAITING);
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashValue, setCrashValue] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [aiTip, setAiTip] = useState<string>("Initializing radar...");
  
  // Betting State
  const [betAmount, setBetAmount] = useState<number>(100);
  const [currentBet, setCurrentBet] = useState<Bet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Navigation
  const [view, setView] = useState<'game' | 'wallet'>('game');

  // Fix: Changed NodeJS.Timeout to any to avoid namespace errors in browser environment
  const gameTimerRef = useRef<any>(null);

  // Persistence
  useEffect(() => {
    const savedUser = localStorage.getItem('v_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    
    const savedTxs = localStorage.getItem('v_txs');
    if (savedTxs) setTransactions(JSON.parse(savedTxs));
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('v_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('v_txs', JSON.stringify(transactions));
  }, [transactions]);

  // Auth Handlers
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authForm.username) return;
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: authForm.username,
      balance: 1000, // Initial bonus
    };
    setUser(mockUser);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('v_user');
  };

  // Game Engine Logic
  const startRound = useCallback(() => {
    setGameState(GameState.STARTING);
    setMultiplier(1.0);
    
    // Determine crash point using house edge logic (Simplified)
    // Formula: 1 / (1 - X) where X is a uniform random [0, 0.95]
    const randomVal = Math.random();
    const crash = Math.max(1.0, 0.99 / (1 - randomVal));
    setCrashValue(crash);

    setTimeout(() => {
      setGameState(GameState.FLYING);
    }, 2000);
  }, []);

  useEffect(() => {
    if (gameState === GameState.FLYING) {
      const interval = setInterval(() => {
        setMultiplier(prev => {
          const increment = Math.max(0.01, (prev - 1) * 0.05 + 0.01);
          const next = prev + increment;
          
          if (next >= crashValue) {
            clearInterval(interval);
            setGameState(GameState.CRASHED);
            const newHistoryItem: HistoryItem = {
              id: Date.now().toString(),
              multiplier: crashValue,
              timestamp: Date.now()
            };
            setHistory(prevH => [newHistoryItem, ...prevH].slice(0, 20));
            
            // AI Analysis
            getFlightAnalysis(history.map(h => h.multiplier)).then(setAiTip);
            
            // Wait before next round
            setTimeout(startRound, 5000);
            return crashValue;
          }
          return next;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [gameState, crashValue, history, startRound]);

  // Initial trigger
  useEffect(() => {
    if (user && gameState === GameState.WAITING) {
      startRound();
    }
  }, [user, gameState, startRound]);

  // Betting Actions
  const placeBet = () => {
    if (!user || user.balance < betAmount) return;
    if (gameState !== GameState.WAITING && gameState !== GameState.STARTING) return;
    
    setUser({ ...user, balance: user.balance - betAmount });
    setCurrentBet({
      amount: betAmount,
      isCashedOut: false
    });
  };

  const cashOut = () => {
    if (!user || !currentBet || currentBet.isCashedOut || gameState !== GameState.FLYING) return;
    
    const winAmount = currentBet.amount * multiplier;
    setUser({ ...user, balance: user.balance + winAmount });
    setCurrentBet({
      ...currentBet,
      isCashedOut: true,
      cashedAt: multiplier,
      winAmount
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0e11] p-4">
        <div className="bg-[#1e2329] p-8 rounded-3xl border border-gray-800 shadow-2xl w-full max-w-md transform transition-all">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#f0b90b] rounded-2xl flex items-center justify-center mb-4 rotate-12 shadow-lg">
              <span className="text-black font-orbitron font-bold text-3xl">VX</span>
            </div>
            <h1 className="text-3xl font-orbitron font-bold tracking-tighter text-white">VECTOR<span className="text-[#f0b90b]">X</span></h1>
            <p className="text-gray-400 text-sm">Next Generation Crash Gaming</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Username</label>
              <input
                type="text"
                required
                className="w-full bg-[#0b0e11] border border-gray-700 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-[#f0b90b] transition-all"
                placeholder="Ex: sky_walker_99"
                value={authForm.username}
                onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Password</label>
              <input
                type="password"
                required
                className="w-full bg-[#0b0e11] border border-gray-700 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-[#f0b90b] transition-all"
                placeholder="********"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#f0b90b] hover:bg-[#d9a60a] text-black font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all mt-4"
            >
              {isLogin ? 'LOG IN' : 'SIGN UP'}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6 text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button onClick={() => setIsLogin(!isLogin)} className="text-[#f0b90b] ml-2 font-bold hover:underline">
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="fixed bottom-0 md:relative md:w-24 bg-[#1e2329] border-t md:border-t-0 md:border-r border-gray-800 flex md:flex-col justify-around md:justify-start items-center p-4 z-50 w-full md:h-screen">
        <div className="hidden md:flex w-12 h-12 bg-[#f0b90b] rounded-xl items-center justify-center mb-12 shadow-lg">
          <span className="text-black font-orbitron font-bold text-xl">VX</span>
        </div>
        
        <button 
          onClick={() => setView('game')}
          className={`flex flex-col items-center gap-1 group transition-all ${view === 'game' ? 'text-[#f0b90b]' : 'text-gray-500 hover:text-white'}`}
        >
          <div className={`p-3 rounded-xl transition-all ${view === 'game' ? 'bg-[#f0b90b]/10' : 'group-hover:bg-white/5'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Play</span>
        </button>

        <button 
          onClick={() => setView('wallet')}
          className={`flex flex-col items-center gap-1 group transition-all mt-0 md:mt-8 ${view === 'wallet' ? 'text-[#f0b90b]' : 'text-gray-500 hover:text-white'}`}
        >
          <div className={`p-3 rounded-xl transition-all ${view === 'wallet' ? 'bg-[#f0b90b]/10' : 'group-hover:bg-white/5'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Wallet</span>
        </button>

        <div className="md:mt-auto">
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 p-3">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
             </svg>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto pb-20 md:pb-0">
        {/* Header */}
        <header className="bg-[#1e2329] px-6 py-4 flex justify-between items-center border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-4">
             <div className="md:hidden w-10 h-10 bg-[#f0b90b] rounded-lg flex items-center justify-center">
                <span className="text-black font-orbitron font-bold text-lg">VX</span>
             </div>
             <div className="hidden sm:block">
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Active Player</p>
                <p className="font-bold text-[#f0b90b]">@{user.username}</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3 bg-[#0b0e11] px-4 py-2 rounded-full border border-gray-800 cursor-pointer hover:border-[#f0b90b] transition-all" onClick={() => setView('wallet')}>
            <div className="w-6 h-6 bg-yellow-500/10 rounded-full flex items-center justify-center text-[#f0b90b]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-bold text-white">₹{user.balance.toFixed(2)}</span>
            <div className="bg-[#f0b90b] text-black p-0.5 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </header>

        {view === 'game' ? (
          <div className="flex-1 p-4 lg:p-8 flex flex-col lg:flex-row gap-6">
            {/* Left: Game Area */}
            <div className="flex-[3] flex flex-col gap-6">
              {/* History Bar */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {history.map((h) => (
                  <div key={h.id} className={`shrink-0 px-4 py-1.5 rounded-full font-bold text-xs border ${h.multiplier > 2 ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                    {h.multiplier.toFixed(2)}x
                  </div>
                ))}
              </div>

              {/* Canvas Rendering */}
              <div className="relative aspect-video lg:flex-1">
                <VectorCanvas multiplier={multiplier} gameState={gameState} />
                
                {/* AI Assistant Tooltip */}
                <div className="absolute top-4 left-4 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 max-w-xs">
                  <div className="relative">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Flight AI</p>
                    <p className="text-xs text-white italic">"{aiTip}"</p>
                  </div>
                </div>
              </div>

              {/* Betting Controls */}
              <div className="bg-[#1e2329] p-6 rounded-2xl border border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-xl">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <p className="text-gray-400 text-xs font-bold uppercase">Set Your Bet</p>
                     <p className="text-gray-500 text-[10px]">Min: ₹10 | Max: ₹10,000</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#0b0e11] p-2 rounded-xl border border-gray-700">
                    <button onClick={() => setBetAmount(prev => Math.max(10, prev - 100))} className="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-xl transition-colors">−</button>
                    <div className="flex-1 text-center font-bold text-xl">₹{betAmount}</div>
                    <button onClick={() => setBetAmount(prev => prev + 100)} className="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-xl transition-colors">+</button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 200, 500, 1000].map(v => (
                      <button key={v} onClick={() => setBetAmount(v)} className="bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-xs font-bold transition-colors">₹{v}</button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  {gameState === GameState.FLYING && currentBet && !currentBet.isCashedOut ? (
                    <button
                      onClick={cashOut}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-orbitron font-bold py-8 rounded-2xl shadow-[0_0_30px_rgba(249,115,22,0.4)] flex flex-col items-center group transition-all"
                    >
                      <span className="text-sm opacity-80 group-hover:scale-110 transition-transform">CASH OUT</span>
                      <span className="text-4xl mt-1">₹{(betAmount * multiplier).toFixed(2)}</span>
                    </button>
                  ) : (
                    <button
                      disabled={gameState !== GameState.WAITING && gameState !== GameState.STARTING || (currentBet && !currentBet.isCashedOut)}
                      onClick={placeBet}
                      className={`w-full py-8 rounded-2xl font-orbitron font-bold shadow-lg flex flex-col items-center transition-all ${
                        gameState === GameState.WAITING || gameState === GameState.STARTING
                          ? 'bg-[#f0b90b] hover:bg-[#d9a60a] text-black animate-pulse'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-sm opacity-80 uppercase tracking-widest">Next Flight</span>
                      <span className="text-4xl mt-1">BET NOW</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Round Stats */}
            <div className="flex-1 bg-[#1e2329] rounded-2xl border border-gray-800 overflow-hidden flex flex-col shadow-xl">
               <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#161a1e]">
                 <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400">Live Players</h3>
                 <span className="flex items-center gap-1.5 text-xs text-green-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                    142 Online
                 </span>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {currentBet && (
                    <div className="flex justify-between items-center bg-[#f0b90b]/5 p-3 rounded-lg border border-[#f0b90b]/20">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#f0b90b] rounded-full flex items-center justify-center text-black font-bold text-xs">YOU</div>
                        <div>
                          <p className="text-xs font-bold">₹{currentBet.amount}</p>
                          <p className="text-[10px] text-gray-500">Your current stake</p>
                        </div>
                      </div>
                      {currentBet.isCashedOut ? (
                        <div className="text-right">
                          <p className="text-xs text-green-500 font-bold">{currentBet.cashedAt?.toFixed(2)}x</p>
                          <p className="text-[10px] font-bold text-green-400">+₹{currentBet.winAmount?.toFixed(2)}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-yellow-500 italic animate-pulse">Flying...</span>
                      )}
                    </div>
                  )}
                  {/* Mock Players */}
                  {[
                    { u: 'Rider_01', b: 500, m: 2.12 },
                    { u: 'AceHigh', b: 200, m: null },
                    { u: 'Wolf77', b: 1000, m: 1.45 },
                    { u: 'SkyKing', b: 50, m: 5.67 },
                    { u: 'NeonFlux', b: 300, m: null },
                  ].map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-[#0b0e11] p-3 rounded-lg border border-gray-800 opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white text-[10px]">{p.u[0]}</div>
                        <div>
                          <p className="text-xs font-bold text-gray-300">@{p.u}</p>
                          <p className="text-[10px] text-gray-500">₹{p.b}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {p.m ? (
                          <span className="text-xs text-green-500 font-bold">{p.m}x</span>
                        ) : (
                          <span className="text-xs text-gray-600">...</span>
                        )}
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-8 overflow-y-auto">
            <Wallet 
              user={user} 
              onUpdateUser={setUser} 
              transactions={transactions}
              onAddTransaction={(tx) => setTransactions(prev => [...prev, tx])}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
