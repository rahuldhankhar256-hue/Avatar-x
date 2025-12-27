
import React, { useState } from 'react';
import { User, Transaction } from '../types';

interface WalletProps {
  user: User;
  onUpdateUser: (user: User) => void;
  transactions: Transaction[];
  onAddTransaction: (t: Transaction) => void;
}

const Wallet: React.FC<WalletProps> = ({ user, onUpdateUser, transactions, onAddTransaction }) => {
  const [amount, setAmount] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [tab, setTab] = useState<'deposit' | 'withdrawal'>('deposit');
  const [depositStep, setDepositStep] = useState<number>(0); // 0: Amount, 1: QR, 2: UTR

  const handleAction = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      alert("कृपया एक वैध राशि दर्ज करें। (Please enter a valid amount)");
      return;
    }

    if (tab === 'withdrawal') {
      if (val > user.balance) {
        alert("अपर्याप्त राशि! (Insufficient balance!)");
        return;
      }
      completeTransaction(val);
    } else {
      // Step 0 -> Step 1 (Show QR)
      setDepositStep(1);
    }
  };

  const handleUtrSubmit = () => {
    if (utrNumber.length < 10) {
      alert("कृपया सही UTR नंबर दर्ज करें। (Please enter a valid UTR number)");
      return;
    }
    completeTransaction(parseFloat(amount));
  };

  const completeTransaction = (val: number) => {
    const newBalance = tab === 'deposit' ? user.balance + val : user.balance - val;
    onUpdateUser({ ...user, balance: newBalance });

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: tab,
      amount: val,
      timestamp: Date.now(),
      status: 'completed'
    };
    onAddTransaction(newTx);
    setAmount('');
    setUtrNumber('');
    setDepositStep(0);
    alert(`${tab === 'deposit' ? '₹' + val + ' जमा कर दिए गए हैं!' : '₹' + val + ' निकाल लिए गए हैं!'}`);
  };

  const resetDeposit = () => {
    setDepositStep(0);
    setAmount('');
    setUtrNumber('');
  };

  return (
    <div className="bg-[#1e2329] p-6 rounded-2xl border border-gray-800 shadow-xl max-w-md w-full mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-orbitron font-bold text-yellow-500 uppercase tracking-tighter">Wallet</h2>
        <div className="text-right">
          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Available Balance</p>
          <p className="text-2xl font-bold font-orbitron text-white">₹{user.balance.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex bg-[#0b0e11] p-1 rounded-xl mb-6 border border-gray-800">
        <button
          onClick={() => { setTab('deposit'); setDepositStep(0); }}
          className={`flex-1 py-2.5 rounded-lg transition-all text-xs font-bold uppercase tracking-wider ${tab === 'deposit' ? 'bg-[#f0b90b] text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Deposit
        </button>
        <button
          onClick={() => { setTab('withdrawal'); setDepositStep(0); }}
          className={`flex-1 py-2.5 rounded-lg transition-all text-xs font-bold uppercase tracking-wider ${tab === 'withdrawal' ? 'bg-[#f0b90b] text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Withdraw
        </button>
      </div>

      {/* STEP 0: Enter Amount (Deposit or Withdraw) */}
      {depositStep === 0 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div>
            <label className="block text-gray-400 text-[10px] font-bold uppercase mb-2 tracking-widest">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#0b0e11] border border-gray-700 rounded-xl py-4 px-4 text-white font-bold text-xl focus:outline-none focus:border-[#f0b90b] transition-all"
              placeholder="0.00"
            />
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {[100, 500, 1000, 5000].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(v.toString())}
                className="bg-gray-800/50 border border-gray-700 hover:bg-gray-700 text-[10px] font-bold py-2 rounded-lg transition-colors text-gray-300"
              >
                +₹{v}
              </button>
            ))}
          </div>

          <button
            onClick={handleAction}
            className="w-full bg-[#f0b90b] hover:bg-[#d9a60a] text-black font-bold py-5 rounded-2xl shadow-lg transform active:scale-95 transition-all mt-4 uppercase tracking-widest text-sm"
          >
            {tab === 'deposit' ? 'Proceed to Pay' : 'Confirm Withdrawal'}
          </button>
        </div>
      )}

      {/* STEP 1: Show QR Code */}
      {depositStep === 1 && (
        <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
          <div className="bg-white p-4 rounded-3xl inline-block shadow-[0_0_40px_rgba(240,185,11,0.2)] border-4 border-[#f0b90b]">
            <div className="w-48 h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden rounded-xl">
               <img 
                 src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=vectorx@upi&am=100&cu=INR" 
                 alt="Payment QR Code" 
                 className="w-full h-full object-contain"
               />
               <div className="absolute inset-0 border-2 border-dashed border-[#f0b90b]/20 animate-pulse pointer-events-none"></div>
            </div>
          </div>
          
          <div className="bg-[#f0b90b]/10 p-4 rounded-2xl border border-[#f0b90b]/20">
            <h3 className="text-[#f0b90b] font-bold text-lg mb-1">QR Code स्कैन करें</h3>
            <p className="text-gray-300 text-xs">कृपया अपने UPI ऐप से स्कैन करके ₹{amount} का भुगतान करें और UTR नंबर सेव कर लें।</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setDepositStep(2)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl shadow-lg transform active:scale-95 transition-all uppercase tracking-widest text-sm"
            >
              भुगतान कर दिया, UTR भरें (Next: Enter UTR)
            </button>
            <button
              onClick={resetDeposit}
              className="w-full bg-transparent text-gray-500 hover:text-white font-bold py-2 text-xs uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Enter UTR Number */}
      {depositStep === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
          <div className="text-center">
             <div className="w-16 h-16 bg-[#f0b90b]/20 text-[#f0b90b] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
             </div>
             <h3 className="text-xl font-bold text-white mb-2">UTR नंबर दर्ज करें</h3>
             <p className="text-gray-400 text-xs px-4">पेमेंट के बाद मिलने वाला 12-अंकों का UTR नंबर यहाँ लिखें ताकि आपके वॉलेट में पैसे आ सकें।</p>
          </div>

          <div>
            <label className="block text-gray-400 text-[10px] font-bold uppercase mb-2 tracking-widest">UTR / Reference No.</label>
            <input
              type="text"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              className="w-full bg-[#0b0e11] border border-gray-700 rounded-xl py-4 px-4 text-white font-mono text-center tracking-widest focus:outline-none focus:border-[#f0b90b] transition-all"
              placeholder="Ex: 312567894012"
            />
          </div>

          <div className="space-y-2">
            <button
              onClick={handleUtrSubmit}
              className="w-full bg-[#f0b90b] hover:bg-[#d9a60a] text-black font-bold py-4 rounded-2xl shadow-lg transform active:scale-95 transition-all uppercase tracking-widest text-sm"
            >
              सबमिट करें (Submit)
            </button>
            <button
              onClick={() => setDepositStep(1)}
              className="w-full bg-transparent text-gray-500 hover:text-white font-bold py-2 text-xs uppercase tracking-widest transition-all"
            >
              Back to QR
            </button>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="mt-8">
        <h3 className="text-gray-500 text-[10px] font-bold uppercase mb-4 border-b border-gray-800 pb-2 tracking-[0.2em]">Recent History</h3>
        <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center py-8 opacity-20">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               <p className="text-xs">No transactions yet</p>
            </div>
          ) : (
            transactions.slice().reverse().map((tx) => (
              <div key={tx.id} className="flex justify-between items-center bg-[#0b0e11] p-3 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tx.type === 'deposit' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {tx.type === 'deposit' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white capitalize">{tx.type}</p>
                    <p className="text-[9px] text-gray-600 font-mono uppercase">{new Date(tx.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                  </p>
                  <p className="text-[8px] text-gray-600 uppercase">Success</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
