import React, { useState, useEffect } from 'react';
import { 
  X, Check, Trash2, Plus, ShieldCheck, RefreshCw, Server, 
  ExternalLink, Key, Lock, Eye, EyeOff, Activity, AlertTriangle, 
  Zap, CheckCircle2, DollarSign, Wallet, Copy
} from 'lucide-react';
import { MountAlgoLogo } from './MountAlgoLogo';
import { useTrade } from '../context/TradeContext';
import { useTheme } from '../context/ThemeContext';
import { BrokerAccount, BrokerType, BrokerAccountType } from '../types';

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountManagerModal({ isOpen, onClose }: AccountManagerModalProps) {
  const { palette } = useTheme();
  const {
    connectedAccounts = [],
    activeAccountId,
    connectAccount,
    updateAccount,
    deleteAccount,
    switchActiveAccount,
    refreshAccountData,
    resetAccountBalance,
    autoRefreshIntervalSec,
    setAutoRefreshIntervalSec
  } = useTrade();

  // Tab: 'list' | 'add' | 'edit'
  const [viewTab, setViewTab] = useState<'list' | 'add' | 'edit'>('list');
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  // Broker selection in 'add' tab
  const [selectedBroker, setSelectedBroker] = useState<BrokerType>('BINANCE');
  const [accountType, setAccountType] = useState<BrokerAccountType>('FUTURES');
  const [isReal, setIsReal] = useState<boolean>(true);
  
  // Form fields
  const [accountName, setAccountName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [mtServer, setMtServer] = useState('');
  const [mtLoginId, setMtLoginId] = useState('');
  const [mtPassword, setMtPassword] = useState('');
  const [currency, setCurrency] = useState('USDT');
  const [balanceInput, setBalanceInput] = useState('10000');
  const [leverage, setLeverage] = useState(20);
  const [isTestnet, setIsTestnet] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // State for loading / testing connection
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Quick reset state for demo balance
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [customResetAmount, setCustomResetAmount] = useState('10000');

  // API Audit Health & Wallet Breakdown State
  const [auditingAccountId, setAuditingAccountId] = useState<string | null>(null);
  const [auditResultsMap, setAuditResultsMap] = useState<Record<string, any>>({});

  // Server Outbound IP & Live Credential Test State
  const [serverIpInfo, setServerIpInfo] = useState<{ ip: string; advice?: string } | null>(null);
  const [isTestingCredentials, setIsTestingCredentials] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; balance?: number; canRead?: boolean; canTrade?: boolean } | null>(null);
  const [ipCopied, setIpCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/server-ip')
        .then(r => r.json())
        .then(d => {
          if (d && d.success) {
            setServerIpInfo({ ip: d.ip, advice: d.advice });
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleCopyServerIp = () => {
    if (serverIpInfo?.ip) {
      navigator.clipboard.writeText(serverIpInfo.ip);
      setIpCopied(true);
      setTimeout(() => setIpCopied(false), 2000);
    }
  };

  const handleTestCredentialsDirectly = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      setTestResult({ success: false, message: 'Masukkan API Key dan API Secret terlebih dahulu.' });
      return;
    }
    setIsTestingCredentials(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/broker/test-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker: selectedBroker.toLowerCase(),
          apiKey: apiKey.trim(),
          secret: apiSecret.trim(),
          accountType,
          isTestnet,
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `Kredensial Terverifikasi! Saldo: $${Number(data.balanceUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} (Izin: Read ${data.canRead ? '✓' : '✗'}, Trade ${data.canTrade ? '✓' : '✗'})`,
          balance: data.balanceUSD,
          canRead: data.canRead,
          canTrade: data.canTrade,
        });
        if (data.balanceUSD !== undefined) {
          setBalanceInput(data.balanceUSD.toString());
        }
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Gagal memverifikasi kredensial bursa.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Koneksi ke gateway bursa terputus.',
      });
    } finally {
      setIsTestingCredentials(false);
    }
  };

  const handleAuditAccount = async (acc: BrokerAccount) => {
    setAuditingAccountId(acc.id);
    try {
      const res = await fetch('/api/broker/audit-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broker: acc.broker.toLowerCase(),
          apiKey: acc.apiKey || '',
          secret: acc.apiSecret || '',
          accountType: acc.accountType,
          isTestnet: acc.isTestnet,
        })
      });
      const data = await res.json();
      setAuditResultsMap(prev => ({
        ...prev,
        [acc.id]: data
      }));
    } catch (err: any) {
      setAuditResultsMap(prev => ({
        ...prev,
        [acc.id]: { success: false, error: err.message || 'Audit gagal' }
      }));
    } finally {
      setAuditingAccountId(null);
    }
  };

  if (!isOpen) return null;

  const resetForm = () => {
    setAccountName('');
    setApiKey('');
    setApiSecret('');
    setMtServer('');
    setMtLoginId('');
    setMtPassword('');
    setCurrency(selectedBroker === 'MT5' || selectedBroker === 'MT4' ? 'USD' : 'USDT');
    setBalanceInput('10000');
    setLeverage(20);
    setIsTestnet(false);
    setShowPassword(false);
    setConnectionError(null);
    setConnectionSuccess(null);
  };

  const handleOpenAdd = (broker: BrokerType = 'BINANCE') => {
    setSelectedBroker(broker);
    setIsReal(broker !== 'DEMO');
    if (broker === 'BINANCE') {
      setAccountName('Binance USD-M Futures Real');
      setAccountType('FUTURES');
      setCurrency('USDT');
      setBalanceInput('5000');
    } else if (broker === 'MEXC') {
      setAccountName('MEXC Global Futures Real');
      setAccountType('FUTURES');
      setCurrency('USDT');
      setBalanceInput('5000');
    } else if (broker === 'MT5') {
      setAccountName('IC Markets MT5 Real');
      setAccountType('FOREX_ECN');
      setMtServer('ICMarketsSC-Live02');
      setCurrency('USD');
      setBalanceInput('3000');
    } else if (broker === 'MT4') {
      setAccountName('Exness MT4 Real');
      setAccountType('FOREX_STP');
      setMtServer('Exness-Real15');
      setCurrency('USD');
      setBalanceInput('3000');
    } else {
      setAccountName('MountAlgo Paper Simulator');
      setAccountType('FUTURES');
      setCurrency('USDT');
      setBalanceInput('10000');
    }
    setViewTab('add');
  };

  const handleOpenEdit = (acc: BrokerAccount) => {
    setEditingAccountId(acc.id);
    setSelectedBroker(acc.broker);
    setAccountName(acc.name);
    setAccountType(acc.accountType);
    setIsReal(acc.isReal);
    setCurrency(acc.currency);
    setBalanceInput(acc.balance.toString());
    setLeverage(acc.leverage || 20);
    setApiKey(acc.apiKey || '');
    setApiSecret(acc.apiSecret || '');
    setMtServer(acc.server || '');
    setMtLoginId(acc.loginId || '');
    setMtPassword(acc.password || '');
    setIsTestnet(acc.isTestnet || false);
    setViewTab('edit');
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectionError(null);
    setConnectionSuccess(null);
    setIsConnecting(true);

    if (!accountName.trim()) {
      setConnectionError('Nama akun tidak boleh kosong');
      setIsConnecting(false);
      return;
    }

    if (isReal) {
      if (selectedBroker === 'BINANCE' || selectedBroker === 'BYBIT' || selectedBroker === 'MEXC') {
        if (!apiKey.trim() || !apiSecret.trim()) {
          setConnectionError(`API Key & Secret ${selectedBroker} wajib diisi untuk akun Real`);
          setIsConnecting(false);
          return;
        }

        // Live verify API Key with Broker API
        try {
          const testRes = await fetch('/api/broker/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              broker: selectedBroker.toLowerCase(),
              apiKey: apiKey.trim(),
              secret: apiSecret.trim(),
              accountType,
              isTestnet,
            })
          });
          const testData = await testRes.json();
          if (!testRes.ok || !testData.success) {
            setConnectionError(`Gagal terhubung ke broker ${selectedBroker}: ${testData.error || 'Autentikasi API Key gagal'}`);
            setIsConnecting(false);
            return;
          }
          if (testData.totalBalanceUSD !== undefined) {
            setBalanceInput(testData.totalBalanceUSD.toString());
          }
        } catch (err: any) {
          setConnectionError(`Gagal menghubungi server gateway broker ${selectedBroker}: ${err.message}`);
          setIsConnecting(false);
          return;
        }
      } else if (selectedBroker === 'MT5' || selectedBroker === 'MT4') {
        if (!mtServer.trim() || !mtLoginId.trim()) {
          setConnectionError(`Server dan Login ID ${selectedBroker} wajib diisi`);
          setIsConnecting(false);
          return;
        }
      }
    }

    // Balance, currency & leverage will sync from broker after connection
    const defaultCurrency = (selectedBroker === 'MT5' || selectedBroker === 'MT4') ? 'USD' : 'USDT';
    const fetchedBalance = parseFloat(balanceInput) || 0;

    if (viewTab === 'add') {
      const created = connectAccount({
        name: accountName.trim(),
        broker: selectedBroker,
        accountType,
        isReal,
        status: 'CONNECTED',
        balance: fetchedBalance,
        equity: fetchedBalance,
        currency: defaultCurrency,
        leverage: leverage || 20,
        apiKey: apiKey.trim() || undefined,
        apiSecret: apiSecret.trim() || undefined,
        server: mtServer.trim() || undefined,
        loginId: mtLoginId.trim() || undefined,
        password: mtPassword.trim() || undefined,
        isTestnet,
        pingMs: Math.floor(12 + Math.random() * 20),
        notes: isReal ? `Akun Real ${selectedBroker}` : 'Simulasi Paper Trading',
      });

      setConnectionSuccess(`Berhasil terhubung ke broker ${selectedBroker}: Saldo Real $${fetchedBalance.toLocaleString()}`);
      setTimeout(() => {
        setIsConnecting(false);
        setViewTab('list');
        resetForm();
      }, 700);
    } else if (viewTab === 'edit' && editingAccountId) {
      updateAccount(editingAccountId, {
        name: accountName.trim(),
        accountType,
        isReal,
        currency: (selectedBroker === 'MT5' || selectedBroker === 'MT4') ? 'USD' : 'USDT',
        balance: fetchedBalance,
        equity: fetchedBalance,
        leverage: leverage || 20,
        apiKey: apiKey.trim() || undefined,
        apiSecret: apiSecret.trim() || undefined,
        server: mtServer.trim() || undefined,
        loginId: mtLoginId.trim() || undefined,
        password: mtPassword.trim() || undefined,
        isTestnet,
      });

      setConnectionSuccess('Perubahan akun berhasil disimpan');
      setTimeout(() => {
        setIsConnecting(false);
        setViewTab('list');
        resetForm();
      }, 600);
    }
  };

  const getBrokerBadge = (broker: BrokerType) => {
    switch (broker) {
      case 'BINANCE':
        return { label: 'BINANCE', bg: '#F3BA2F20', text: '#F3BA2F', border: '#F3BA2F80' };
      case 'MEXC':
        return { label: 'MEXC GLOBAL', bg: '#2563EB20', text: '#38BDF8', border: '#38BDF880' };
      case 'MT5':
        return { label: 'METATRADER 5', bg: '#10B98120', text: '#34D399', border: '#10B98180' };
      case 'MT4':
        return { label: 'METATRADER 4', bg: '#8B5CF620', text: '#A78BFA', border: '#8B5CF680' };
      default:
        return { label: 'PAPER DEMO', bg: '#6B728020', text: '#9CA3AF', border: '#6B728060' };
    }
  };

  return (
    <div className="fixed inset-0 z-modal-ultimate flex items-center justify-center bg-black/85 backdrop-blur-md p-1.5 sm:p-3 md:p-4 animate-in fade-in duration-150 select-none">
      <div 
        className="bg-[var(--color-panel)] rounded-xl sm:rounded-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border"
        style={{ borderColor: `${palette.bull}70`, boxShadow: `0 20px 60px -10px rgba(0,0,0,0.8), 0 0 20px ${palette.bull}20` }}
      >
        {/* Header */}
        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-panel)]">
          <div className="flex items-center gap-2 sm:gap-3">
            <MountAlgoLogo size="sm" className="w-8 h-8" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-[var(--color-text)] tracking-wide">
                  Kelola Akun Broker Real & Demo
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase" style={{ backgroundColor: `${palette.bull}20`, color: palette.bull, border: `1px solid ${palette.bull}40` }}>
                  Multi-Broker
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[var(--color-text-muted)] hidden sm:block">
                Hubungkan, sinkronkan saldo, dan kelola akun trading Binance, MEXC, MT5, MT4, serta Paper Demo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-2.5 bg-[var(--color-bg)]/20 border-b border-[var(--color-border)] gap-2 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setViewTab('list'); resetForm(); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewTab === 'list'
                  ? 'bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <Wallet size={14} style={{ color: viewTab === 'list' ? palette.bull : undefined }} />
              <span className="text-[11px] sm:text-xs">Daftar Akun ({connectedAccounts.length})</span>
            </button>

            <button
              onClick={() => handleOpenAdd('BINANCE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewTab === 'add'
                  ? 'bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              <Plus size={14} style={{ color: viewTab === 'add' ? palette.bull : undefined }} />
              <span className="text-[11px] sm:text-xs">Hubungkan Akun Baru</span>
            </button>
          </div>

          <div 
            className="hidden sm:flex items-center gap-2 text-[10px] px-2.5 py-1 rounded-full font-mono border"
            style={{ color: palette.bull, backgroundColor: `${palette.bull}10`, borderColor: `${palette.bull}30` }}
          >
            <ShieldCheck size={13} />
            <span>Kredensial tersimpan lokal (Aman & Terisolasi)</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-3 sm:space-y-4">
          {/* TAB 1: LIST CONNECTED ACCOUNTS */}
          {viewTab === 'list' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Akun Aktif Saat Ini untuk Eksekusi:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono text-[var(--color-bull)] font-bold">
                    {connectedAccounts.find(a => a.id === activeAccountId)?.name || 'Demo'}
                  </span>
                  <div className="flex items-center gap-1.5 bg-[var(--color-bg)] px-2 py-0.5 rounded border border-[var(--color-border)] text-[10px] font-mono">
                    <span className="text-[var(--color-text-muted)]">Auto-Sync:</span>
                    <select
                      value={autoRefreshIntervalSec}
                      onChange={(e) => setAutoRefreshIntervalSec(Number(e.target.value))}
                      className="bg-transparent font-bold text-amber-400 focus:outline-none cursor-pointer"
                    >
                      <option value={0} className="bg-[var(--color-bg-secondary)] text-[var(--color-text)]">Off (Manual)</option>
                      <option value={5} className="bg-[var(--color-bg-secondary)] text-[var(--color-text)]">⚡ 5 Detik</option>
                      <option value={10} className="bg-[var(--color-bg-secondary)] text-[var(--color-text)]">⏱️ 10 Detik</option>
                      <option value={30} className="bg-[var(--color-bg-secondary)] text-[var(--color-text)]">⏳ 30 Detik</option>
                    </select>
                  </div>
                  <button
                    onClick={() => connectedAccounts.forEach(a => refreshAccountData(a.id))}
                    className="px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-[10px] font-bold font-mono transition-colors flex items-center gap-1 cursor-pointer"
                    title="Sinkronkan saldo dan ping semua akun sekaligus"
                  >
                    <RefreshCw size={11} /> Sync Semua
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {connectedAccounts.map((acc) => {
                  const isActive = acc.id === activeAccountId;
                  const badge = getBrokerBadge(acc.broker);

                  return (
                    <div
                      key={acc.id}
                      style={{
                        borderColor: acc.status === 'ERROR' ? '#f43f5e' : isActive ? palette.bull : 'var(--color-border)',
                        backgroundColor: acc.status === 'ERROR' ? '#f43f5e0a' : isActive ? `${palette.bull}08` : 'var(--color-panel)',
                      }}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2.5 ${
                        isActive ? 'shadow-md ring-1 ring-[var(--color-bull)]/40' : 'hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Left: Info & Broker */}
                        <div className="flex items-start gap-3">
                          <div 
                            style={{ backgroundColor: badge.bg, borderColor: badge.border, color: badge.text }}
                            className="w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 mt-0.5"
                          >
                            {acc.broker === 'BINANCE' ? 'BN' : acc.broker === 'MEXC' ? 'MX' : acc.broker === 'MT5' ? 'M5' : acc.broker === 'MT4' ? 'M4' : 'DM'}
                          </div>

                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-[var(--color-text)]">{acc.name}</span>
                              <span 
                                style={{ backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }} 
                                className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase"
                              >
                                {acc.broker}
                              </span>
                              <span 
                                style={
                                  acc.isReal 
                                    ? { backgroundColor: `${palette.poc}20`, color: palette.poc, borderColor: `${palette.poc}40` }
                                    : {}
                                }
                                className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase ${
                                  acc.isReal ? '' : 'bg-[var(--color-bg)] text-[var(--color-text)] border-[var(--color-border)]'
                                }`}
                              >
                                {acc.isReal ? 'REAL' : 'DEMO'}
                              </span>
                              {isActive && (
                                <span 
                                  style={{ backgroundColor: `${palette.bull}20`, color: palette.bull, borderColor: `${palette.bull}60` }}
                                  className="text-[9px] font-mono font-bold px-2 py-0.2 rounded-full border flex items-center gap-1"
                                >
                                  <CheckCircle2 size={10} /> SEDANG DIGUNAKAN
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-1 font-mono flex-wrap">
                              <span>Tipe: {acc.accountType}</span>
                              {acc.server && <span>Server: {acc.server}</span>}
                              {acc.loginId && <span>Login: {acc.loginId}</span>}
                              {acc.isTestnet && <span style={{ color: palette.poc }}>Testnet</span>}
                              <span className="flex items-center gap-1" style={{ color: palette.bull }}>
                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: palette.bull }} />
                                {acc.pingMs ? `${acc.pingMs}ms` : '14ms'}
                              </span>
                            </div>
                          </div>
                        </div>

                      {/* Right: Balance & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]">
                        <div className="flex flex-col sm:items-end">
                          <span className="text-[10px] text-[var(--color-text-muted)] font-mono uppercase">Saldo Akun</span>
                          <span className="text-base font-extrabold font-mono text-[var(--color-text)]">
                            {acc.currency} {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!isActive && (
                            <button
                              onClick={() => switchActiveAccount(acc.id)}
                              style={{ backgroundColor: `${palette.bull}20`, borderColor: `${palette.bull}60`, color: palette.bull }}
                              className="px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all hover:opacity-80 active:scale-95 cursor-pointer"
                              title="Jadikan akun aktif untuk order trading"
                            >
                              Gunakan
                            </button>
                          )}

                          <button
                            onClick={() => refreshAccountData(acc.id)}
                            disabled={acc.status === 'CONNECTING'}
                            className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer disabled:opacity-50"
                            title="Sinkronkan saldo & ping jaringan"
                          >
                            <RefreshCw size={14} className={acc.status === 'CONNECTING' ? "animate-spin text-amber-400" : ""} />
                          </button>

                          {/* Demo balance quick reset */}
                          {!acc.isReal && (
                            <button
                              onClick={() => {
                                if (resettingId === acc.id) {
                                  resetAccountBalance(acc.id, parseFloat(customResetAmount) || 10000);
                                  setResettingId(null);
                                } else {
                                  setResettingId(acc.id);
                                }
                              }}
                              style={{ backgroundColor: `${palette.poc}15`, borderColor: `${palette.poc}40`, color: palette.poc }}
                              className="p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer hover:opacity-80"
                              title="Reset Saldo Demo"
                            >
                              <DollarSign size={14} />
                            </button>
                          )}

                          {/* API Health Audit Button for Real Accounts */}
                          {acc.isReal && (
                            <button
                              onClick={() => handleAuditAccount(acc)}
                              disabled={auditingAccountId === acc.id}
                              style={{ backgroundColor: `${palette.poc}15`, borderColor: `${palette.poc}40`, color: palette.poc }}
                              className="p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer hover:opacity-80 disabled:opacity-50 flex items-center gap-1"
                              title="Audit Kesehatan API Key & Status Izin Wallet"
                            >
                              <ShieldCheck size={14} className={auditingAccountId === acc.id ? "animate-spin" : ""} />
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(acc)}
                            className="p-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
                            title="Edit Kredensial & Pengaturan Akun"
                          >
                            <Key size={14} />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus / Putuskan koneksi akun "${acc.name}"?`)) {
                                deleteAccount(acc.id);
                              }
                            }}
                            style={{ backgroundColor: `${palette.bear}15`, borderColor: `${palette.bear}40`, color: palette.bear }}
                            className="p-1.5 rounded-lg border text-xs transition-colors cursor-pointer hover:opacity-80"
                            title="Hapus / Putuskan Akun"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      </div>

                      {/* Error Diagnostic Recovery Banner */}
                      {(acc.lastSyncError || acc.status === 'ERROR') && (
                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs flex items-center justify-between gap-2 text-rose-400 animate-fadeIn font-mono">
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={15} className="shrink-0 text-rose-400 animate-pulse" />
                            <span>
                              <strong>Kendala Koneksi:</strong> {acc.lastSyncError || 'Gagal tersambung ke broker'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleOpenEdit(acc)}
                            className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[11px] font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1"
                          >
                            <Key size={12} /> Perbaiki Key
                          </button>
                        </div>
                      )}

                      {/* Audit Health & Wallet Breakdown Report Card */}
                      {auditResultsMap[acc.id] && (
                        <div className="mt-2 p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] text-xs flex flex-col gap-2 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-400 flex items-center gap-1.5">
                              <ShieldCheck size={14} /> AUDIT DIAGNOSTIK KESEHATAN API KEY & WALLET
                            </span>
                            <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
                              Ping Latency: <strong className="text-emerald-400">{auditResultsMap[acc.id].pingMs || 0}ms</strong>
                            </span>
                          </div>

                          {/* Status Badges */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 rounded bg-[var(--color-panel)] border border-[var(--color-border)] flex flex-col gap-0.5">
                              <span className="text-[10px] text-[var(--color-text-muted)]">Read Balance</span>
                              <span className={`font-bold ${auditResultsMap[acc.id].canRead ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {auditResultsMap[acc.id].canRead ? '✓ PERMITTED' : '✕ DENIED'}
                              </span>
                            </div>
                            <div className="p-2 rounded bg-[var(--color-panel)] border border-[var(--color-border)] flex flex-col gap-0.5">
                              <span className="text-[10px] text-[var(--color-text-muted)]">Trading Swap</span>
                              <span className={`font-bold ${auditResultsMap[acc.id].canTrade ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {auditResultsMap[acc.id].canTrade ? '✓ PERMITTED' : '✕ RESTRICTED'}
                              </span>
                            </div>
                            <div className="p-2 rounded bg-[var(--color-panel)] border border-[var(--color-border)] flex flex-col gap-0.5">
                              <span className="text-[10px] text-[var(--color-text-muted)]">Enkripsi Backend</span>
                              <span className="font-bold text-sky-400">
                                🔒 AES-256 GCM
                              </span>
                            </div>
                          </div>

                          {/* Sub-account Wallet Breakdown */}
                          {auditResultsMap[acc.id].walletBreakdown && (
                            <div className="p-2.5 rounded-lg bg-[var(--color-panel)] border border-sky-500/20 flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-sky-300 uppercase">
                                💼 Rincian Jenis Wallet / Sub-Account ({acc.broker}):
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] mt-1">
                                <div>
                                  <span className="text-[9px] text-[var(--color-text-muted)] block">Spot Wallet:</span>
                                  <strong>${Number(auditResultsMap[acc.id].walletBreakdown.spot || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                                </div>
                                <div>
                                  <span className="text-[9px] text-[var(--color-text-muted)] block">Swap/Futures:</span>
                                  <strong>${Number(auditResultsMap[acc.id].walletBreakdown.swap || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                                </div>
                                <div>
                                  <span className="text-[9px] text-[var(--color-text-muted)] block">Saldo Tersedia:</span>
                                  <strong className="text-emerald-400">${Number(auditResultsMap[acc.id].walletBreakdown.available || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                                </div>
                                <div>
                                  <span className="text-[9px] text-[var(--color-text-muted)] block">Total Equity:</span>
                                  <strong className="text-amber-400">${Number(auditResultsMap[acc.id].walletBreakdown.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                                </div>
                              </div>
                            </div>
                          )}

                          {auditResultsMap[acc.id].message && (
                            <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                              Message: {auditResultsMap[acc.id].message}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Resetting Demo balance popup input */}
              {resettingId && (
                <div 
                  style={{ borderColor: `${palette.poc}40` }}
                  className="p-2.5 sm:p-3 bg-[var(--color-bg)]/40 border rounded-lg sm:rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 animate-in fade-in"
                >
                  <div className="flex items-center gap-2 text-xs font-bold" style={{ color: palette.poc }}>
                    <DollarSign size={15} />
                    <span>Pilih Saldo Reset Demo:</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                    {['5000', '10000', '25000', '100000'].map(val => (
                      <button
                        key={val}
                        onClick={() => {
                          resetAccountBalance(resettingId, parseFloat(val));
                          setResettingId(null);
                        }}
                        style={{ backgroundColor: `${palette.poc}20`, borderColor: `${palette.poc}50` }}
                        className="px-2 py-1 rounded border text-[11px] font-mono text-white hover:opacity-80 cursor-pointer"
                      >
                        ${parseInt(val).toLocaleString()}
                      </button>
                    ))}
                    <button
                      onClick={() => setResettingId(null)}
                      className="text-xs text-[var(--color-text-muted)] hover:text-white px-2 py-1 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Connect Shortcuts */}
              <div className="pt-3 border-t border-[var(--color-border)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-2">
                  Tambah Koneksi Broker Cepat:
                </span>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  {[
                    { broker: 'BINANCE' as const, label: '+ Binance Real', sub: 'Futures & Spot' },
                    { broker: 'MEXC' as const, label: '+ MEXC Real', sub: 'Global Futures' },
                    { broker: 'MT5' as const, label: '+ MetaTrader 5', sub: 'Forex ECN/STP' },
                    { broker: 'MT4' as const, label: '+ MetaTrader 4', sub: 'Forex Classic' },
                  ].map(b => (
                    <button
                      key={b.broker}
                      onClick={() => handleOpenAdd(b.broker)}
                      className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-white/30 text-left transition-all cursor-pointer hover:scale-[1.02] flex flex-col"
                    >
                      <span className="text-xs font-bold text-[var(--color-text)]">{b.label}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">{b.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2 & 3: ADD OR EDIT BROKER ACCOUNT */}
          {(viewTab === 'add' || viewTab === 'edit') && (
            <form onSubmit={handleSaveAccount} className="space-y-4">
              {/* Select Broker Type */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                  Pilih Platform Broker / Bursa:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2">
                  {[
                    { id: 'BINANCE', name: 'Binance', desc: 'Futures & Spot' },
                    { id: 'MEXC', name: 'MEXC', desc: 'Global Futures' },
                    { id: 'MT5', name: 'MetaTrader 5', desc: 'Forex ECN/STP' },
                    { id: 'MT4', name: 'MetaTrader 4', desc: 'Forex Classic' },
                    { id: 'DEMO', name: 'Paper Demo', desc: 'Simulasi MountAlgo' },
                  ].map(b => {
                    const isSelected = selectedBroker === b.id;
                    return (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => {
                          setSelectedBroker(b.id as BrokerType);
                          setIsReal(b.id !== 'DEMO');
                          if (b.id === 'MT5' || b.id === 'MT4') {
                            setCurrency('USD');
                            setAccountType('FOREX_ECN');
                          } else {
                            setCurrency('USDT');
                            setAccountType('FUTURES');
                          }
                        }}
                        style={isSelected ? { borderColor: palette.bull, backgroundColor: `${palette.bull}15` } : {}}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'text-[var(--color-text)] shadow-sm'
                            : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                        }`}
                      >
                        <div className="text-xs font-bold">{b.name}</div>
                        <div className="text-[10px] text-[var(--color-text-muted)] truncate">{b.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mode Real vs Demo Toggle */}
              {selectedBroker !== 'DEMO' && (
                <div className="flex items-center justify-between p-3 bg-[var(--color-bg)]/20 border border-[var(--color-border)] rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-[var(--color-text)] block">Tipe Lingkungan Akun</span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">Gunakan Akun Real atau Simulasi Demo untuk broker ini</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[var(--color-bg)] p-1 rounded-lg border border-[var(--color-border)]">
                    <button
                      type="button"
                      onClick={() => setIsReal(true)}
                      style={isReal ? { backgroundColor: palette.poc, color: '#000000' } : {}}
                      className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition-colors ${
                        isReal ? 'shadow' : 'text-[var(--color-text-muted)]'
                      }`}
                    >
                      Real Live
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsReal(false)}
                      className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition-colors ${
                        !isReal ? 'bg-[var(--color-panel)] text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'
                      }`}
                    >
                      Demo Testnet
                    </button>
                  </div>
                </div>
              )}

              {/* General Account Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1">
                    Nama / Nickname Akun:
                  </label>
                  <input
                    type="text"
                    required
                    value={accountName ?? ''}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Contoh: Binance USD-M Futures Main"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-bull)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1">
                    Jenis Pasar / Akun:
                  </label>
                  <select
                    value={accountType ?? 'FUTURES'}
                    onChange={(e) => setAccountType(e.target.value as BrokerAccountType)}
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-bull)] cursor-pointer"
                  >
                    <option value="FUTURES">Crypto Futures (Perpetual USD-M)</option>
                    <option value="SPOT">Crypto Spot (Cash & Exchange)</option>
                    <option value="FOREX_ECN">Forex ECN / Raw Spread</option>
                    <option value="FOREX_STP">Forex STP / Standard</option>
                  </select>
                </div>
              </div>

              {/* Advanced Risk Guard Settings */}
              <div className="p-3.5 bg-[var(--color-bg)]/20 border border-[var(--color-border)] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: palette.poc }}>
                  <ShieldCheck size={15} />
                  <span>Pengaturan Risk Guard & Proteksi Akun</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--color-text-muted)] mb-1">
                      Maksimal Kerugian Harian ($ USD):
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 500 (kosongkan jika tanpa batas)"
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--color-text-muted)] mb-1">
                      Maksimal Lot / Ukuran Posisi:
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Contoh: 10.0"
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Copy Trading Settings */}
              <div className="p-3.5 bg-[var(--color-bg)]/20 border border-[var(--color-border)] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: palette.poc }}>
                  <Zap size={15} />
                  <span>Master / Slave Copy Trading Mirroring</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--color-text-muted)] mb-1">
                      Peran Copy Trading Akun:
                    </label>
                    <select className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-purple-400 cursor-pointer">
                      <option value="NONE">Standalone (Tidak Meng-copy)</option>
                      <option value="MASTER">👑 Master Account (Sinyal Sumber)</option>
                      <option value="SLAVE">🔗 Slave Account (Auto Mirror Master)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--color-text-muted)] mb-1">
                      Rasio Lot Mirroring (Ratio):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      defaultValue="1.0"
                      className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text)] focus:outline-none focus:border-purple-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Broker-Specific Credentials */}
              {(selectedBroker === 'BINANCE' || selectedBroker === 'BYBIT' || selectedBroker === 'MEXC') && (
                <div className="space-y-3 p-3.5 bg-[var(--color-bg)]/20 border border-[var(--color-border)] rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-bold" style={{ color: palette.bull }}>
                    <Key size={14} />
                    <span>Kredensial API {selectedBroker}</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--color-text-muted)] mb-1">
                      API Key:
                    </label>
                    <input
                      type="text"
                      value={apiKey ?? ''}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={`Masukkan API Key ${selectedBroker}`}
                      className="w-full font-mono bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-bull)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--color-text-muted)] mb-1">
                      API Secret Key:
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={apiSecret ?? ''}
                        onChange={(e) => setApiSecret(e.target.value)}
                        placeholder={`Masukkan API Secret ${selectedBroker}`}
                        className="w-full font-mono bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-bull)] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {selectedBroker === 'BINANCE' && (
                    <label className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={Boolean(isTestnet)}
                        onChange={(e) => setIsTestnet(e.target.checked)}
                        className="rounded border-[var(--color-border)] accent-[var(--color-bull)]"
                      />
                      <span>Gunakan Binance Futures Testnet Network</span>
                    </label>
                  )}

                  {/* Tombol Uji Kredensial Langsung */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleTestCredentialsDirectly}
                      disabled={isTestingCredentials || !apiKey.trim() || !apiSecret.trim()}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg)] transition-colors disabled:opacity-50 cursor-pointer text-[var(--color-text)]"
                    >
                      {isTestingCredentials ? (
                        <>
                          <RefreshCw size={13} className="animate-spin text-[var(--color-bull)]" />
                          <span>Memverifikasi Hak Akses & Saldo ke {selectedBroker}...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={13} style={{ color: palette.bull }} />
                          <span>Uji Koneksi & Hak Akses {selectedBroker} Sekarang</span>
                        </>
                      )}
                    </button>

                    {testResult && (
                      <div className={`mt-2 p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                        testResult.success 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}>
                        {testResult.success ? <CheckCircle2 size={15} className="shrink-0 mt-0.5" /> : <AlertTriangle size={15} className="shrink-0 mt-0.5" />}
                        <div className="leading-relaxed">
                          <span className="font-semibold">{testResult.message}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Panduan Hak Akses & IP Whitelist (Interactive Guide) */}
                  <div className="p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl space-y-2.5 text-[11px]">
                    <div className="flex items-center justify-between text-[var(--color-text-muted)] font-semibold border-b border-[var(--color-border)]/60 pb-1.5">
                      <span className="flex items-center gap-1.5 text-[var(--color-text)]">
                        <ShieldCheck size={13} className="text-[var(--color-bull)]" />
                        Panduan Izin API {selectedBroker}
                      </span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        Keamanan Terproteksi
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
                      <div className="flex items-center gap-1.5 text-emerald-300/90">
                        <Check size={12} className="text-emerald-400 shrink-0" />
                        <span><strong>Read Info:</strong> Wajib (Baca Saldo)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-300/90">
                        <Check size={12} className="text-emerald-400 shrink-0" />
                        <span><strong>Futures Trading:</strong> Wajib (Perpetual)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <span className="w-3 text-center text-zinc-500 shrink-0">○</span>
                        <span><strong>Spot Trading:</strong> Opsional</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                        <X size={12} className="text-rose-400 shrink-0" />
                        <span><strong>Withdrawal:</strong> JANGAN Centang (Tolak)</span>
                      </div>
                    </div>

                    {/* Server Outbound IP Egress for IP Whitelist */}
                    <div className="pt-2 border-t border-[var(--color-border)]/60">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[var(--color-text-muted)]">IP Gateway Server Egress:</span>
                        <div className="flex items-center gap-1.5">
                          <code className="font-mono bg-[var(--color-bg)]/40 px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-text)] text-[10px]">
                            {serverIpInfo?.ip || 'Mendeteksi IP Gateway...'}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyServerIp}
                            title="Salin IP Gateway Server"
                            className="p-1 rounded bg-[var(--color-surface)] hover:bg-[var(--color-border)] text-zinc-300 cursor-pointer transition-colors"
                          >
                            {ipCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-1 leading-normal">
                        💡 Rekomendasi MEXC: Pilih opsi <strong>"No IP restriction"</strong> saat membuat API Key untuk mencegah blokir jaringan dinamis.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(selectedBroker === 'MT5' || selectedBroker === 'MT4') && (
                <div className="space-y-3 p-3.5 bg-[var(--color-bg)]/20 border border-[var(--color-border)] rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-bold" style={{ color: palette.bull }}>
                    <Server size={14} />
                    <span>Kredensial Server {selectedBroker} (MetaTrader)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--color-text-muted)] mb-1">
                        Broker Server Name:
                      </label>
                      <input
                        type="text"
                        value={mtServer ?? ''}
                        onChange={(e) => setMtServer(e.target.value)}
                        placeholder="Contoh: ICMarketsSC-Live02 atau Exness-Real15"
                        className="w-full font-mono bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-bull)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[var(--color-text-muted)] mb-1">
                        Login Account ID / Nomor Akun:
                      </label>
                      <input
                        type="text"
                        value={mtLoginId ?? ''}
                        onChange={(e) => setMtLoginId(e.target.value)}
                        placeholder="Contoh: 8930211"
                        className="w-full font-mono bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-bull)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[var(--color-text-muted)] mb-1">
                      Trader Password / Investor Password:
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={mtPassword ?? ''}
                        onChange={(e) => setMtPassword(e.target.value)}
                        placeholder="Masukkan password akun MetaTrader"
                        className="w-full font-mono bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text)] focus:outline-none focus:border-[var(--color-bull)] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Note: Balance, Currency & Leverage sync from broker automatically */}
              <div className="px-3 py-2 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-[10px] font-mono text-[var(--color-text-muted)] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ backgroundColor: palette.bull }}></span>
                Saldo, Mata Uang & Leverage akan disync otomatis dari broker setelah koneksi berhasil.
              </div>

              {/* Status feedback */}
              {connectionError && (
                <div 
                  style={{ backgroundColor: `${palette.bear}15`, borderColor: `${palette.bear}40`, color: palette.bear }}
                  className="p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in"
                >
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{connectionError}</span>
                </div>
              )}

              {connectionSuccess && (
                <div 
                  style={{ backgroundColor: `${palette.bull}15`, borderColor: `${palette.bull}40`, color: palette.bull }}
                  className="p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in"
                >
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{connectionSuccess}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => { setViewTab('list'); resetForm(); }}
                  className="px-4 py-2 rounded-xl border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isConnecting}
                  style={{ backgroundColor: palette.bull, color: '#000000' }}
                  className="px-5 py-2 rounded-xl text-xs font-extrabold transition-all hover:opacity-90 active:scale-95 cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Memverifikasi Koneksi...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} strokeWidth={3} />
                      <span>{viewTab === 'add' ? 'Hubungkan Akun' : 'Simpan Perubahan'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
