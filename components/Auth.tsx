
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, MessageCircle, Smartphone, ArrowRight, Lock, 
  Send, ChevronLeft, ShieldCheck, Loader2, AlertCircle, CheckCircle, ExternalLink
} from 'lucide-react';
import { User } from '../types';
import { sendOtp, sendMagicLink, verifyOtpAndLogin, verifyMagicToken } from '../services/authService';

interface AuthProps {
  onLogin: (user: User) => void;
  onCancel: () => void;
}

type AuthMethod = 'email' | 'whatsapp' | 'telegram';
type AuthStep = 'input' | 'method' | 'verify' | 'email-sent';

export const Auth: React.FC<AuthProps> = ({ onLogin, onCancel }) => {
  const [step, setStep] = useState<AuthStep>('input');
  const [identifier, setIdentifier] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod>('email');
  
  // OTP State (Phone)
  const [otp, setOtp] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  // Magic Link State (Email)
  const [magicLinkToken, setMagicLinkToken] = useState<string | null>(null);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Helpers to detect input type
  const isEmail = identifier.includes('@');
  const isPhone = /^\+?[\d\s-]{8,}$/.test(identifier);

  const resetError = () => setError('');

  const handleStart = () => {
    resetError();
    if (!identifier || (!isEmail && !isPhone)) {
      setError('Please enter a valid email address or phone number.');
      return;
    }

    if (isEmail) {
      handleSendMagicLink();
    } else {
      setStep('method');
    }
  };

  // --- Email Flow ---
  const handleSendMagicLink = async () => {
    resetError();
    setIsLoading(true);
    setSelectedMethod('email');

    try {
      const response = await sendMagicLink(identifier);
      if (response.success && response.token) {
        setMagicLinkToken(response.token);
        setStep('email-sent');
      } else {
        setError(response.error || 'Failed to send activation email.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkVerify = async () => {
    // This simulates the user clicking the link in their email
    if (!magicLinkToken) return;
    setIsLoading(true);

    try {
      const response = await verifyMagicToken(identifier, magicLinkToken);
      if (response.success && response.user) {
        onLogin(response.user);
      } else {
        setError(response.message || 'Link expired or invalid.');
      }
    } catch (err) {
      setError('Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Phone Flow ---
  const handleSendOtp = async (method: 'whatsapp' | 'telegram') => {
    resetError();
    setIsLoading(true);
    setSelectedMethod(method);

    try {
      const response = await sendOtp(method, identifier);
      if (response.success && response.code) {
        setGeneratedCode(response.code);
        setStep('verify');
      } else {
        setError(response.error || 'Failed to send code.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    resetError();
    setIsLoading(true);

    try {
      const response = await verifyOtpAndLogin(identifier, otp, generatedCode || '');
      
      if (response.success && response.user) {
        onLogin(response.user);
      } else {
        setError(response.message || 'Verification failed.');
      }
    } catch (err) {
      setError('Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const MethodButton = ({ 
    id, 
    icon: Icon, 
    label, 
    subLabel, 
    colorClass, 
    bgClass 
  }: { 
    id: 'whatsapp' | 'telegram', 
    icon: any, 
    label: string, 
    subLabel: string, 
    colorClass: string, 
    bgClass: string 
  }) => (
    <button
      onClick={() => handleSendOtp(id)}
      className={`w-full flex items-center justify-between p-4 rounded-xl border transition group ${bgClass}`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full text-white ${colorClass}`}>
          <Icon size={20} />
        </div>
        <div className="text-left">
          <span className="block font-medium text-brand-900">{label}</span>
          <span className="text-xs text-brand-500">{subLabel}</span>
        </div>
      </div>
      <ArrowRight size={18} className="text-brand-400 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
    </button>
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative bg-brand-50/50">
      <button 
        onClick={onCancel}
        className="absolute top-4 left-4 text-brand-500 hover:text-brand-800 flex items-center gap-1 text-sm font-medium transition-colors"
      >
        <ChevronLeft size={16} /> Back to Boutique
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-brand-100"
      >
        {/* Header */}
        <div className="bg-brand-900 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20"
            >
              <Lock className="w-6 h-6 text-brand-100" />
            </motion.div>
            <h2 className="font-serif text-2xl mb-2 tracking-wide">Welcome to Aura</h2>
            <p className="text-brand-200 text-sm font-light">Your personal olfactory sanctuary</p>
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {/* STEP 1: INPUT */}
            {step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs font-bold text-brand-500 uppercase tracking-widest mb-2">
                    Identity
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        resetError();
                      }}
                      placeholder="Email or Phone (e.g. +1...)"
                      className="w-full bg-brand-50 border border-brand-200 rounded-lg pl-11 pr-4 py-3 text-brand-900 placeholder:text-brand-300 focus:ring-1 focus:ring-brand-400 focus:border-brand-400 outline-none transition-all"
                      onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 group-focus-within:text-brand-600 transition-colors">
                      {isEmail ? <Mail size={18} /> : <Smartphone size={18} />}
                    </div>
                  </div>
                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 mt-2 text-red-500 text-xs">
                      <AlertCircle size={12} /> {error}
                    </motion.div>
                  )}
                </div>

                <div className="text-xs text-brand-400 leading-relaxed bg-brand-50 p-3 rounded-lg border border-brand-100">
                  <span className="font-bold">Tip:</span> Use <code className="bg-white px-1 py-0.5 rounded border border-brand-200 text-brand-600">admin@aura.com</code> to access the CRM Dashboard.
                </div>

                <button
                  onClick={handleStart}
                  disabled={isLoading}
                  className="w-full bg-brand-900 text-white py-3.5 rounded-lg font-medium hover:bg-brand-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-900/10 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin"/> : <>Continue <ArrowRight size={18} /></>}
                </button>
              </motion.div>
            )}

            {/* STEP 2: METHOD SELECTION (Phone only) */}
            {step === 'method' && (
              <motion.div
                key="method"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <p className="text-brand-500 mb-1 text-xs uppercase tracking-wider">Verify Mobile Identity</p>
                  <p className="font-medium text-brand-900 text-lg">{identifier}</p>
                </div>

                <div className="space-y-3">
                  <MethodButton 
                    id="whatsapp"
                    icon={MessageCircle}
                    label="WhatsApp"
                    subLabel="Instant code via secure message"
                    colorClass="bg-[#25D366]"
                    bgClass="bg-[#25D366]/5 border-[#25D366]/20 hover:bg-[#25D366]/10"
                  />
                  
                  <MethodButton 
                    id="telegram"
                    icon={Send}
                    label="Telegram"
                    subLabel="Verify via AuraBot"
                    colorClass="bg-[#0088cc]"
                    bgClass="bg-[#0088cc]/5 border-[#0088cc]/20 hover:bg-[#0088cc]/10"
                  />
                </div>
                
                <button 
                  onClick={() => setStep('input')} 
                  className="text-xs text-brand-400 hover:text-brand-600 w-full text-center mt-4 transition-colors"
                >
                  Change number
                </button>
              </motion.div>
            )}

            {/* STEP 2a: EMAIL SENT (Magic Link) */}
            {step === 'email-sent' && (
              <motion.div
                key="email-sent"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 py-4"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-100 relative">
                     <Mail size={32} className="text-brand-600" />
                     <div className="absolute top-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <CheckCircle size={10} className="text-white"/>
                     </div>
                  </div>
                  <h3 className="font-serif text-xl text-brand-900 mb-2">Check your Inbox</h3>
                  <p className="text-sm text-brand-500 max-w-[260px] mx-auto leading-relaxed">
                    We have sent a confirmation link to <br/>
                    <span className="font-semibold text-brand-800">{identifier}</span>
                  </p>
                </div>

                <div className="bg-brand-50/50 p-6 rounded-xl border border-dashed border-brand-200 text-center">
                  <p className="text-xs text-brand-400 mb-4 uppercase tracking-wider">Demo Environment</p>
                  <p className="text-xs text-brand-500 mb-4">
                    In a real application, you would click the link in your email provider. For this demo, simulate the click below:
                  </p>
                  <button
                    onClick={handleMagicLinkVerify}
                    disabled={isLoading}
                    className="w-full bg-white border border-brand-200 text-brand-900 py-3 rounded-lg text-sm font-medium hover:bg-brand-50 hover:border-brand-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin"/> : <><ExternalLink size={16} /> Simulate Clicking Link</>}
                  </button>
                </div>

                <div className="text-center">
                   <button onClick={() => setStep('input')} className="text-xs text-brand-400 hover:text-brand-600">
                    Use a different email
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: OTP VERIFICATION (Phone) */}
            {step === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600 mb-4">
                     <ShieldCheck size={24} />
                  </div>
                  <p className="text-brand-600 mb-1 text-sm">
                    Enter the code sent via <span className="capitalize font-bold text-brand-800">{selectedMethod}</span>
                  </p>
                  <p className="text-xs text-brand-400">to {identifier}</p>
                </div>

                {/* DEMO HINT */}
                {generatedCode && (
                   <motion.div 
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-xs text-center mb-4"
                   >
                     <span className="font-bold">DEMO MODE:</span> Your verification code is <span className="font-mono text-lg font-bold mx-1">{generatedCode}</span>
                   </motion.div>
                )}

                <div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(val);
                      resetError();
                    }}
                    placeholder="0 0 0 0 0 0"
                    className="w-full bg-brand-50 border border-brand-200 rounded-lg py-4 text-center text-3xl tracking-[0.5em] font-serif text-brand-900 focus:ring-1 focus:ring-brand-400 outline-none transition-all placeholder:text-brand-200"
                    autoFocus
                  />
                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs mt-3 text-center flex items-center justify-center gap-1">
                      <AlertCircle size={12}/> {error}
                    </motion.p>
                  )}
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-brand-900 text-white py-3.5 rounded-lg font-medium hover:bg-brand-800 transition-all shadow-lg shadow-brand-900/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin"/> : 'Verify & Access'}
                </button>
                
                <div className="text-center space-y-2">
                   <button 
                     onClick={() => handleSendOtp(selectedMethod as 'whatsapp' | 'telegram')}
                     disabled={isLoading} 
                     className="text-xs text-brand-400 hover:text-brand-600 font-medium"
                   >
                    Resend Code
                  </button>
                  <div>
                    <button onClick={() => setStep('input')} className="text-xs text-brand-300 hover:text-brand-500">
                      Use a different method
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
