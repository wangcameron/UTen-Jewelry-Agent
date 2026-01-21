
import React, { useState } from 'react';
import { User, PricingPlan, UsageRecord, BillingRecord } from '../types';
import { MOCK_USAGE_HISTORY, MOCK_BILLING_HISTORY } from '../constants';
import { LogOut, User as UserIcon, Camera, X } from 'lucide-react';

interface UserCenterProps {
  user: User;
  currentPlan: PricingPlan;
  userPoints: number;
  onLogout: () => void;
  onTopUp: () => void;
}

type TabType = 'account' | 'usage' | 'billing';

const UserCenter: React.FC<UserCenterProps> = ({ user, currentPlan, userPoints, onLogout, onTopUp }) => {
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState(user.phone);

  // Mock data derived from props or constants
  const expiryDate = "January 30, 2026";
  const monthlyResetDate = "February 1, 2026";
  // Random avatar using DiceBear based on user phone/id
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.phone}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  const renderEditProfileModal = () => {
    if (!isEditProfileOpen) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-10 relative animate-in zoom-in-95 duration-300">
          <button 
            onClick={() => setIsEditProfileOpen(false)}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X size={24} />
          </button>

          {/* Avatar Edit Section */}
          <div className="flex justify-center mb-8 relative">
             <div className="relative group cursor-pointer">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl bg-blue-50">
                   <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0 right-0 bg-white rounded-full p-2.5 shadow-md border border-gray-100 text-gray-600 hover:text-black transition-colors">
                   <Camera size={20} />
                </div>
             </div>
          </div>

          <div className="space-y-6">
             {/* Username */}
             <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                   <span className="text-red-500 mr-1">*</span>用户名
                </label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                />
                <p className="text-sm text-gray-400 mt-2">长度为1-40个字符，支持字母、数字和-</p>
             </div>

             {/* Bio */}
             <div>
                <label className="block text-base font-bold text-gray-900 mb-2">
                   介绍自己
                </label>
                <div className="relative">
                    <textarea 
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="介绍一下自己吧"
                      rows={4}
                      maxLength={200}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all placeholder:text-gray-300"
                    />
                    <div className="absolute bottom-3 right-3 text-sm text-gray-400 font-medium">
                       {bio.length}/200
                    </div>
                </div>
             </div>

             {/* Actions */}
             <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-900 rounded-xl font-bold text-base hover:bg-gray-50 transition-colors"
                >
                   取消
                </button>
                <button 
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-3.5 bg-black text-white rounded-xl font-bold text-base hover:bg-gray-800 transition-colors shadow-lg"
                >
                   保存
                </button>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAccountTab = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-50 border-4 border-white shadow-md">
             <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">{user.phone}</h2>
            {/* Email removed as requested */}
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setIsEditProfileOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors font-bold text-base shadow-lg"
          >
            <UserIcon size={18} /> 编辑资料
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors font-bold text-base"
          >
            <LogOut size={18} /> 退出登录
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-8 mb-10 border-b border-gray-100 pb-6">
           <h3 className="text-2xl font-bold text-gray-900">账户信息</h3>
        </div>

        <div className="space-y-10">
           {/* Row 1: Subscription */}
           <div className="flex items-start">
              <div className="w-56 text-gray-500 font-bold text-lg pt-1">当前订阅</div>
              <div>
                 <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-900">{currentPlan.name}</span>
                    <span className="text-gray-400 text-base font-medium">(过期时间: {expiryDate})</span>
                    <button className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded hover:bg-gray-200 uppercase tracking-wider">取消</button>
                 </div>
              </div>
           </div>

           {/* Row 2: Points */}
           <div className="flex items-start">
              <div className="w-56 text-gray-500 font-bold text-lg pt-1">可用积分</div>
              <div>
                 <div className="flex items-center gap-4">
                    <span className="text-3xl font-black text-gray-900">{userPoints.toLocaleString()}</span>
                    <button 
                        onClick={onTopUp}
                        className="px-5 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 shadow-md"
                    >
                        充值
                    </button>
                 </div>
              </div>
           </div>

           {/* Row 3: Quota */}
           <div className="flex items-start">
              <div className="w-56 text-gray-500 font-bold text-lg pt-1">每月更新积分</div>
              <div>
                 <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-900">{currentPlan.points.toLocaleString()}</span>
                    <span className="text-gray-400 text-base font-medium">({currentPlan.points} credits expire after {monthlyResetDate})</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  const renderUsageTab = () => (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-gray-800 px-10 py-6 grid grid-cols-12 gap-4 text-gray-300 text-lg font-bold">
         <div className="col-span-5">明细 (Detail)</div>
         <div className="col-span-2 text-center">状态 (Status)</div>
         <div className="col-span-3 text-center">日期 (Date)</div>
         <div className="col-span-2 text-right">积分消耗 (BP)</div>
      </div>
      
      <div className="divide-y divide-gray-50">
         {MOCK_USAGE_HISTORY.map((record) => (
            <div key={record.id} className="px-10 py-8 grid grid-cols-12 gap-4 text-lg hover:bg-gray-50 transition-colors items-center">
                <div className="col-span-5 text-gray-900 font-medium truncate pr-4" title={record.description}>
                    {record.description}
                </div>
                <div className="col-span-2 text-center">
                    <span className={`px-4 py-1.5 rounded-lg text-base font-bold ${record.status.includes('获取') || record.status.includes('退还') ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {record.status}
                    </span>
                </div>
                <div className="col-span-3 text-center text-gray-500 font-mono text-base font-medium">
                    {record.date}
                </div>
                <div className="col-span-2 text-right font-mono font-bold text-xl">
                    <span className={record.pointsChange > 0 ? 'text-green-600' : 'text-gray-900'}>
                        {record.pointsChange > 0 ? '+' : ''}{record.pointsChange}
                    </span>
                </div>
            </div>
         ))}
      </div>
      
      <div className="p-6 bg-gray-50 text-center text-base text-gray-400 border-t border-gray-100 font-medium">
         暂无更多数据
      </div>
    </div>
  );

  const renderBillingTab = () => (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-gray-800 px-10 py-6 grid grid-cols-12 gap-4 text-gray-300 text-lg font-bold">
         <div className="col-span-3">日期 (Date)</div>
         <div className="col-span-4">类别 (Category)</div>
         <div className="col-span-3">金额 (Amount)</div>
         <div className="col-span-2 text-right">状态 (Status)</div>
      </div>
      
      <div className="divide-y divide-gray-50">
         {MOCK_BILLING_HISTORY.map((record) => (
            <div key={record.id} className="px-10 py-8 grid grid-cols-12 gap-4 text-lg hover:bg-gray-50 transition-colors items-center">
                <div className="col-span-3 text-gray-900 font-mono text-base font-medium">
                    {record.date}
                </div>
                <div className="col-span-4 text-gray-900 font-bold text-lg">
                    {record.category}
                </div>
                <div className="col-span-3 text-gray-900 font-medium text-lg">
                    {record.amount}
                </div>
                <div className="col-span-2 text-right">
                    <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-lg text-base font-bold border border-gray-200">
                        {record.status}
                    </span>
                </div>
            </div>
         ))}
      </div>
      
      <div className="p-12 text-center text-gray-400 bg-gray-50/50 text-base font-medium">
         暂无更多数据
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      {renderEditProfileModal()}

      {/* Tab Header */}
      <div className="flex gap-12 mb-10 border-b border-transparent">
        <button 
          onClick={() => setActiveTab('account')}
          className={`text-2xl font-bold pb-3 transition-colors relative ${activeTab === 'account' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
        >
          账户管理
          {activeTab === 'account' && <div className="absolute bottom-0 left-0 w-full h-1 bg-black rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('usage')}
          className={`text-2xl font-bold pb-3 transition-colors relative ${activeTab === 'usage' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
        >
          用量
          {activeTab === 'usage' && <div className="absolute bottom-0 left-0 w-full h-1 bg-black rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('billing')}
          className={`text-2xl font-bold pb-3 transition-colors relative ${activeTab === 'billing' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
        >
          账单
          {activeTab === 'billing' && <div className="absolute bottom-0 left-0 w-full h-1 bg-black rounded-full" />}
        </button>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'account' && renderAccountTab()}
        {activeTab === 'usage' && renderUsageTab()}
        {activeTab === 'billing' && renderBillingTab()}
      </div>
    </div>
  );
};

export default UserCenter;
