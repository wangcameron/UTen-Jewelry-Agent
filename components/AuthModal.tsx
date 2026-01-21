
import React, { useState } from 'react';
import { X, Loader2, Sparkles, ArrowLeft, Mail, MessageCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (phone: string, inviteCode: string) => void;
  initialView?: 'login' | 'support';
}

type AuthView = 'login' | 'change_password' | 'support';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, initialView = 'login' }) => {
  const [view, setView] = useState<AuthView>(initialView);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset view when modal opens/closes if needed, but here we just respect initialView if provided on mount
  // or state management. 
  // Better to use useEffect to sync initialView if prop changes while open
  React.useEffect(() => {
    if (isOpen) {
      setView(initialView);
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!phone || !password) {
      setError('请输入手机号和密码');
      return;
    }

    if (phone.length < 11) {
      setError('请输入正确的手机号');
      return;
    }

    setIsLoading(true);
    // Simulate network request
    setTimeout(() => {
      setIsLoading(false);
      onLogin(phone, password);
    }, 1000);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone || !password || !newPassword || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert('密码修改成功！请重新登录。');
      setView('login');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1000);
  };

  const renderLoginView = () => (
    <div className="p-10 flex flex-col items-center animate-in slide-in-from-right-4 duration-300">
      {/* Logo Section */}
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-black text-white p-2.5 rounded-xl">
            <Sparkles size={28} fill="currentColor" />
        </div>
        <span className="text-3xl font-bold text-black">UTen<span className="text-red-600">幼狮</span></span>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2 mt-2 text-center">欢迎来到 UTen Studio</h2>
      <p className="text-gray-500 text-base mb-10 text-center">登录或注册以继续使用珠宝智能体</p>

      <form onSubmit={handleLoginSubmit} className="w-full space-y-5">
          <div>
            <input
              type="tel"
              placeholder="手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400 font-medium text-lg shadow-sm"
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400 font-medium text-lg shadow-sm"
            />
          </div>

          <div className="flex justify-between items-center gap-4 pt-2">
            <button 
              type="button" 
              onClick={() => { setError(''); setView('change_password'); }} 
              className="flex-1 py-3 text-sm text-gray-600 bg-white border border-gray-200 hover:border-black hover:text-black rounded-xl transition-all font-bold shadow-sm"
            >
              修改密码
            </button>
            <button 
              type="button" 
              onClick={() => setView('support')} 
              className="flex-1 py-3 text-sm text-gray-600 bg-white border border-gray-200 hover:border-black hover:text-black rounded-xl transition-all font-bold shadow-sm"
            >
              没有账号？<span className="text-black">联系客服</span>
            </button>
          </div>

          {error && (
            <div className="text-red-500 text-base text-center font-medium animate-pulse">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-black text-white rounded-xl font-bold text-xl hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                验证中...
              </>
            ) : (
              "进入工作台"
            )}
          </button>
      </form>

      <div className="mt-10 text-center">
          <p className="text-sm text-gray-400">
            继续即表示您同意 <span className="text-gray-900 cursor-pointer font-bold hover:underline">使用条款</span> 和 <span className="text-gray-900 cursor-pointer font-bold hover:underline">隐私政策</span>
          </p>
      </div>
    </div>
  );

  const renderChangePasswordView = () => (
    <div className="p-10 animate-in slide-in-from-right-4 duration-300">
      <button onClick={() => { setError(''); setView('login'); }} className="flex items-center gap-1 text-base text-gray-500 hover:text-black mb-8 transition-colors font-medium">
        <ArrowLeft size={20} /> 返回登录
      </button>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-2">修改密码</h2>
      <p className="text-gray-500 text-base mb-8">为了账户安全，请设置高强度密码</p>

      <form onSubmit={handleChangePasswordSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">手机号</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入手机号"
            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all text-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">旧密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入旧密码"
            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all text-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">新密码</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="设置新密码"
            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all text-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">确认新密码</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再次输入新密码"
            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all text-lg"
          />
        </div>

        {error && <div className="text-red-500 text-base text-center font-medium">{error}</div>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg mt-4"
        >
          {isLoading ? <Loader2 className="animate-spin mx-auto" /> : "确认修改"}
        </button>
      </form>
    </div>
  );

  const renderSupportView = () => (
    <div className="p-10 animate-in slide-in-from-right-4 duration-300">
      <button onClick={() => setView('login')} className="flex items-center gap-1 text-base text-gray-500 hover:text-black mb-8 transition-colors font-medium">
        <ArrowLeft size={20} /> 返回登录
      </button>

      <h2 className="text-3xl font-bold text-gray-900 mb-2">联系客服</h2>
      <p className="text-gray-500 text-base mb-10">我们需要核实您的企业信息为您开通账号</p>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 flex items-start gap-5 hover:border-black transition-all cursor-pointer group shadow-sm hover:shadow-md">
          <div className="bg-gray-50 p-4 rounded-full text-gray-900 group-hover:bg-black group-hover:text-white transition-colors">
            <Mail size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-lg">发送邮件</h4>
            <p className="text-sm text-gray-500 mb-2">适合企业大客户咨询</p>
            <div className="inline-block">
               <p className="text-lg font-mono text-black font-bold">sales@uten.ai</p>
            </div>
            <p className="text-lg font-mono text-gray-400 font-medium mt-1 pl-1">bd@uten.ai</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 flex items-start gap-5 hover:border-green-500 transition-all cursor-pointer group shadow-sm hover:shadow-md">
          <div className="bg-gray-50 p-4 rounded-full text-gray-900 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
            <MessageCircle size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-lg">微信客服</h4>
            <p className="text-sm text-gray-500 mb-2">工作日 10:00 - 19:00</p>
            <p className="text-lg font-mono text-black font-bold">UTen_Assistant</p>
          </div>
        </div>
      </div>
      
      <div className="mt-12 pt-8 border-t border-gray-100 text-center">
         <p className="text-base text-gray-400">
             我们将尽快为您提供服务
         </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden relative animate-in zoom-in-95 duration-300">
        
        {view === 'login' && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-colors z-10 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        )}

        {view === 'login' && renderLoginView()}
        {view === 'change_password' && renderChangePasswordView()}
        {view === 'support' && renderSupportView()}
        
      </div>
    </div>
  );
};

export default AuthModal;
