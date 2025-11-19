
import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, 
  Clock, 
  MessageSquare, 
  Calendar as CalendarIcon, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X,
  Plus,
  Send,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Coffee,
  Play,
  Briefcase,
  Bell,
  Search,
  Palette,
  Download,
  Upload,
  Database
} from 'lucide-react';
import { User, TimeRecord, Thread, CalendarEvent, UserRole, WorkStatus, ViewMode, Comment, ThemeColor } from './types';
import { generateDraftMessage, summarizeThread } from './services/geminiService';

// --- MOCK DATA & UTILS ---
const MOCK_USERS: User[] = [
  { id: 'u1', name: '田中 太郎', email: 'tanaka@example.com', role: UserRole.ADMIN, department: '開発部', bio: 'マネージャー' },
  { id: 'u2', name: '佐藤 花子', email: 'sato@example.com', role: UserRole.USER, department: '営業部', bio: '営業担当' },
  { id: 'u3', name: '鈴木 一郎', email: 'suzuki@example.com', role: UserRole.USER, department: '総務部', bio: '事務' },
];

const generateId = () => Math.random().toString(36).substr(2, 9);

const formatDate = (date: Date) => date.toISOString().split('T')[0];
const formatTime = (dateStr: string) => {
    if(!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

// --- THEME CONFIG ---
const THEME_CONFIG: Record<ThemeColor, { accent: string, label: string }> = {
    indigo: { accent: 'purple', label: 'インディゴ' },
    blue: { accent: 'cyan', label: 'ブルー' },
    emerald: { accent: 'teal', label: 'エメラルド' },
    rose: { accent: 'orange', label: 'ローズ' },
    amber: { accent: 'yellow', label: 'アンバー' },
    violet: { accent: 'fuchsia', label: 'バイオレット' },
    cyan: { accent: 'blue', label: 'シアン' },
};

// --- CONTEXT ---
interface AppContextType {
  currentUser: User | null;
  login: (email: string) => void;
  logout: () => void;
  view: ViewMode;
  setView: (v: ViewMode) => void;
  users: User[];
  updateUser: (u: User) => void;
  timeRecords: TimeRecord[];
  clockIn: () => void;
  clockOut: () => void;
  startBreak: () => void;
  endBreak: () => void;
  getTodayRecord: () => TimeRecord | undefined;
  threads: Thread[];
  addThread: (t: Omit<Thread, 'id' | 'createdAt' | 'comments'>) => void;
  addComment: (threadId: string, content: string) => void;
  events: CalendarEvent[];
  addEvent: (e: Omit<CalendarEvent, 'id'>) => void;
  themeColor: ThemeColor;
  setThemeColor: (c: ThemeColor) => void;
  exportData: () => void;
  importData: (json: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

// --- COMPONENTS ---

// 1. LOGIN
const LoginScreen = () => {
  const { login, themeColor } = useAppContext();
  const [email, setEmail] = useState('tanaka@example.com');
  const secondary = THEME_CONFIG[themeColor].accent;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className={`absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-${secondary}-500 opacity-20 blur-[100px]`}></div>
      <div className={`absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-${themeColor}-500 opacity-20 blur-[100px]`}></div>
      
      <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-${themeColor}-500 to-${secondary}-600 mb-6 shadow-lg shadow-${themeColor}-500/30`}>
            <Clock className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">WorkSync AI</h1>
          <p className="text-slate-400">次世代の勤怠・チーム管理プラットフォーム</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-${themeColor}-500 focus:border-transparent outline-none text-white placeholder-slate-500 transition-all`}
              placeholder="admin@example.com"
              required
            />
          </div>
          <button
            type="submit"
            className={`w-full bg-gradient-to-r from-${themeColor}-600 to-${secondary}-600 hover:from-${themeColor}-500 hover:to-${secondary}-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-${themeColor}-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]`}
          >
            ログイン
          </button>
          <div className="text-xs text-slate-500 text-center mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <p className="font-medium text-slate-400 mb-1">デモ用アカウント</p>
            <div className="flex justify-center space-x-4">
              <span className={`cursor-pointer hover:text-${themeColor}-400 transition`} onClick={() => setEmail('tanaka@example.com')}>Admin: tanaka@...</span>
              <span className={`cursor-pointer hover:text-${themeColor}-400 transition`} onClick={() => setEmail('sato@example.com')}>User: sato@...</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// 2. TIME CARD
const TimeCardView = () => {
  const { currentUser, clockIn, clockOut, startBreak, endBreak, getTodayRecord, timeRecords, themeColor } = useAppContext();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const record = getTodayRecord();
  
  let status = WorkStatus.OFF;
  if (record) {
    if (record.endTime) status = WorkStatus.OFF;
    else if (record.breaks.length > 0 && !record.breaks[record.breaks.length - 1].end) status = WorkStatus.BREAK;
    else status = WorkStatus.WORKING;
  }

  const canClockIn = !record;
  const canClockOut = status === WorkStatus.WORKING || status === WorkStatus.BREAK; 
  const canBreakStart = status === WorkStatus.WORKING;
  const canBreakEnd = status === WorkStatus.BREAK;

  const history = timeRecords
    .filter(r => r.userId === currentUser?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="grid md:grid-cols-5 gap-8">
        {/* Main Clock Section */}
        <div className="md:col-span-3 bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-64 h-64 bg-${themeColor}-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`}></div>
          
          <div>
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-slate-500 font-medium tracking-wide">{currentTime.toLocaleDateString('ja-JP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                  status === WorkStatus.WORKING ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                  status === WorkStatus.BREAK ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                  'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {status === WorkStatus.WORKING ? 'Working' :
                   status === WorkStatus.BREAK ? 'On Break' : 'Off Duty'}
                </span>
             </div>
             <div className="text-7xl md:text-8xl font-bold text-slate-800 font-mono tracking-tighter tabular-nums mb-8 relative z-10">
              {currentTime.toLocaleTimeString('ja-JP', { hour12: false })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10">
             <button
                onClick={clockIn}
                disabled={!canClockIn}
                className={`group relative p-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ${
                  canClockIn 
                    ? `bg-${themeColor}-600 text-white shadow-lg shadow-${themeColor}-200 hover:shadow-${themeColor}-300 hover:-translate-y-1` 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                }`}
              >
                <div className={`p-2 rounded-xl bg-white/20 ${canClockIn ? 'group-hover:scale-110 transition-transform' : ''}`}>
                    <Play size={24} fill="currentColor" />
                </div>
                <span className="font-bold text-lg">出勤</span>
              </button>

              <button
                onClick={clockOut}
                disabled={!canClockOut}
                className={`group relative p-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ${
                  canClockOut 
                    ? 'bg-slate-800 text-white shadow-lg shadow-slate-200 hover:shadow-slate-400 hover:-translate-y-1' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                }`}
              >
                 <div className={`p-2 rounded-xl bg-white/20 ${canClockOut ? 'group-hover:scale-110 transition-transform' : ''}`}>
                    <LogOut size={24} />
                </div>
                <span className="font-bold text-lg">退勤</span>
              </button>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4 relative z-10">
               <button
                onClick={startBreak}
                disabled={!canBreakStart}
                className={`p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all border ${
                  canBreakStart 
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                    : 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                }`}
              >
                <Coffee size={18} /> 休憩開始
              </button>
              <button
                onClick={endBreak}
                disabled={!canBreakEnd}
                className={`p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all border ${
                  canBreakEnd 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                    : 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                }`}
              >
                <Check size={18} /> 休憩終了
              </button>
          </div>
        </div>

        {/* History Section */}
        <div className="md:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <Clock className={`mr-2 text-${themeColor}-500`} size={20} /> 直近の履歴
          </h3>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
             {history.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <CalendarIcon size={40} className="mb-2 opacity-20" />
                    <p>履歴がありません</p>
                </div>
             )}
             {history.map((r, i) => (
                <div key={r.id} className={`group p-4 rounded-2xl bg-slate-50 hover:bg-${themeColor}-50/50 border border-slate-100 hover:border-${themeColor}-100 transition-colors`}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-700">{new Date(r.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</span>
                        <span className="text-xs text-slate-400 font-mono bg-white px-2 py-1 rounded-md border border-slate-200">
                            {r.breaks.length} Breaks
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400 mb-1">IN</span>
                            <span className="font-mono font-medium text-slate-800">{formatTime(r.startTime)}</span>
                        </div>
                        <div className="h-auto w-px bg-slate-200 mx-2"></div>
                        <div className="flex flex-col text-right">
                            <span className="text-xs text-slate-400 mb-1">OUT</span>
                            <span className="font-mono font-medium text-slate-800">{r.endTime ? formatTime(r.endTime) : '--:--'}</span>
                        </div>
                    </div>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. BULLETIN BOARD
const BulletinBoardView = () => {
  const { threads, addThread, addComment, users, currentUser, themeColor } = useAppContext();
  const [showCreate, setShowCreate] = useState(false);
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const secondary = THEME_CONFIG[themeColor].accent;

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('一般');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Comment State
  const [commentText, setCommentText] = useState('');

  // Summary State
  const [summary, setSummary] = useState<Record<string, string>>({});

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;
    addThread({
      title: newTitle,
      content: newContent,
      category: newCategory,
      authorId: currentUser?.id || ''
    });
    setNewTitle('');
    setNewContent('');
    setShowCreate(false);
  };

  const handleAiDraft = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    const text = await generateDraftMessage(aiPrompt, "Professional yet friendly");
    setNewContent(text);
    setAiLoading(false);
  };

  const handleSummarize = async (t: Thread) => {
    const s = await summarizeThread(t.content, t.comments.map(c => c.content));
    setSummary(prev => ({ ...prev, [t.id]: s }));
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if(!activeThread || !commentText) return;
    addComment(activeThread, commentText);
    setCommentText('');
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  if (activeThread) {
    const t = threads.find(th => th.id === activeThread);
    if (!t) { setActiveThread(null); return null; }

    return (
      <div className={`max-w-4xl mx-auto bg-white rounded-3xl shadow-lg shadow-${themeColor}-100 overflow-hidden border border-slate-100 animate-in slide-in-from-right-4 duration-300`}>
        <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center justify-between backdrop-blur-sm sticky top-0 z-10">
          <button onClick={() => setActiveThread(null)} className={`text-slate-600 hover:text-${themeColor}-600 flex items-center px-3 py-2 rounded-lg hover:bg-white transition`}>
            <ChevronLeft size={20} className="mr-1" /> <span className="text-sm font-medium">戻る</span>
          </button>
          <span className={`px-3 py-1 bg-${themeColor}-100 text-${themeColor}-700 text-xs font-bold rounded-full`}>{t.category}</span>
        </div>
        
        <div className="p-8 md:p-10">
          <h2 className="text-3xl font-bold text-slate-800 mb-4 leading-tight">{t.title}</h2>
          <div className="flex items-center text-sm text-slate-500 mb-8 pb-8 border-b border-slate-100">
            <div className={`w-8 h-8 rounded-full bg-${themeColor}-100 flex items-center justify-center text-${themeColor}-600 font-bold mr-3`}>
               {getUserName(t.authorId)[0]}
            </div>
            <span className="font-medium text-slate-700 mr-3">{getUserName(t.authorId)}</span>
            <span className="text-slate-400">•</span>
            <span className="ml-3">{new Date(t.createdAt).toLocaleString('ja-JP')}</span>
          </div>
          
          <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap mb-10 leading-relaxed">
            {t.content}
          </div>

          {/* AI Summary Section */}
          <div className={`mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-${themeColor}-50 to-${secondary}-50 border border-${themeColor}-100 p-6`}>
             <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-40 rounded-full blur-2xl -mr-10 -mt-10"></div>
             <div className="flex justify-between items-center mb-4 relative z-10">
                <h4 className={`text-sm font-bold text-${themeColor}-900 flex items-center`}>
                  <Sparkles size={16} className={`mr-2 text-${themeColor}-500`} /> AI スマート要約
                </h4>
                {!summary[t.id] && (
                  <button onClick={() => handleSummarize(t)} className={`text-xs bg-white text-${themeColor}-600 px-3 py-1.5 rounded-lg shadow-sm font-medium hover:bg-${themeColor}-50 transition`}>
                    生成する
                  </button>
                )}
             </div>
             {summary[t.id] ? (
                 <p className={`text-sm text-slate-700 whitespace-pre-wrap leading-relaxed relative z-10 bg-white/50 p-4 rounded-xl border border-${themeColor}-50`}>{summary[t.id]}</p>
             ) : (
                 <p className={`text-xs text-${themeColor}-400 relative z-10`}>長いスレッドの内容をAIが3つのポイントに要約します。</p>
             )}
          </div>

          <div className="">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                <MessageSquare className="mr-2 text-slate-400" size={18} /> コメント ({t.comments.length})
            </h3>
            <div className="space-y-6 mb-8">
              {t.comments.map(c => (
                <div key={c.id} className="flex gap-4 group">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-600 mt-1">
                     {getUserName(c.authorId)[0]}
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100 flex-1 group-hover:bg-white group-hover:shadow-sm transition-all">
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span className="font-bold text-slate-700">{getUserName(c.authorId)}</span>
                      <span>{new Date(c.createdAt).toLocaleString('ja-JP')}</span>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleComment} className={`flex gap-3 items-end bg-white p-2 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-${themeColor}-100 focus-within:border-${themeColor}-300 transition-all shadow-sm`}>
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="コメントを入力..."
                className="flex-1 px-4 py-3 bg-transparent outline-none resize-none text-sm h-12 focus:h-24 transition-all"
              />
              <button type="submit" disabled={!commentText} className={`bg-${themeColor}-600 text-white p-3 rounded-xl hover:bg-${themeColor}-700 disabled:opacity-50 disabled:cursor-not-allowed transition mb-1 mr-1`}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-2">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">掲示板</h2>
            <p className="text-slate-500 text-sm mt-1">チーム内の最新情報とディスカッション</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl flex items-center hover:bg-slate-800 transition shadow-lg shadow-slate-200 font-medium text-sm"
        >
          {showCreate ? <X size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />} 
          {showCreate ? 'キャンセル' : '新規スレッド'}
        </button>
      </div>

      {showCreate && (
        <div className={`bg-white p-8 rounded-3xl shadow-xl shadow-${themeColor}-100 border border-slate-100 mb-8 relative overflow-hidden animate-in slide-in-from-top-4`}>
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${themeColor}-500 via-${secondary}-500 to-pink-500`}></div>
          <h3 className="text-lg font-bold mb-6 text-slate-800">新しいトピックを作成</h3>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">タイトル</label>
                  <input
                    placeholder="例: 次回の定例会議について"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 outline-none transition-all`}
                    required
                  />
              </div>
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">カテゴリ</label>
                  <div className="relative">
                      <select
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500`}
                      >
                        <option>一般</option>
                        <option>重要</option>
                        <option>イベント</option>
                        <option>技術共有</option>
                      </select>
                      <div className="absolute right-4 top-3.5 pointer-events-none text-slate-500"><ChevronRight size={16} className="rotate-90" /></div>
                  </div>
              </div>
            </div>
            
            {/* AI Helper */}
            <div className={`bg-gradient-to-r from-${themeColor}-50 to-${secondary}-50 p-1 rounded-xl border border-${themeColor}-100`}>
               <div className="bg-white/60 p-4 rounded-lg flex items-center gap-3 backdrop-blur-sm">
                   <div className={`p-2 bg-gradient-to-br from-${themeColor}-500 to-${secondary}-500 rounded-lg shadow-md`}>
                        <Sparkles size={18} className="text-white" />
                   </div>
                   <input 
                     type="text"
                     placeholder="AIに下書きを依頼 (例: お花見の企画、楽しい雰囲気で)"
                     className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder-slate-400"
                     value={aiPrompt}
                     onChange={e => setAiPrompt(e.target.value)}
                   />
                   <button 
                    type="button"
                    onClick={handleAiDraft}
                    disabled={aiLoading}
                    className="text-xs bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition font-medium"
                   >
                     {aiLoading ? '生成中...' : '生成'}
                   </button>
               </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">本文</label>
                <textarea
                  placeholder="詳細を入力してください..."
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl h-40 focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 outline-none resize-none transition-all`}
                  required
                />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="submit" className={`px-8 py-3 bg-${themeColor}-600 text-white rounded-xl hover:bg-${themeColor}-700 shadow-lg shadow-${themeColor}-200 font-bold transition transform active:scale-95`}>投稿する</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {threads.map(t => (
          <div 
            key={t.id} 
            onClick={() => setActiveThread(t.id)}
            className={`group bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100 hover:border-${themeColor}-100 relative overflow-hidden`}
          >
            <div className={`absolute inset-0 bg-${themeColor}-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                     <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                         t.category === '重要' ? 'bg-red-100 text-red-600' :
                         t.category === 'イベント' ? 'bg-emerald-100 text-emerald-600' :
                         'bg-slate-100 text-slate-600'
                     }`}>
                         {t.category}
                     </span>
                    <span className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
                </div>
                <h3 className={`text-lg font-bold text-slate-800 mb-2 group-hover:text-${themeColor}-700 transition-colors`}>{t.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-5 leading-relaxed">{t.content}</p>
                <div className={`flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-4 group-hover:border-${themeColor}-200/50 transition-colors`}>
                    <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center mr-2 text-slate-600 font-bold border border-white shadow-sm">
                        {getUserName(t.authorId)[0]}
                        </div>
                        <span className="font-medium">{getUserName(t.authorId)}</span>
                    </div>
                    <div className="flex items-center text-slate-400 bg-slate-50 px-2 py-1 rounded-full group-hover:bg-white transition-colors">
                        <MessageSquare size={14} className="mr-1.5" /> {t.comments.length}
                    </div>
                </div>
            </div>
          </div>
        ))}
        {threads.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="text-slate-300" size={32} />
              </div>
              <p className="text-slate-500">まだ投稿がありません</p>
              <button onClick={() => setShowCreate(true)} className={`text-${themeColor}-600 font-medium text-sm mt-2 hover:underline`}>最初の投稿を作成</button>
          </div>
        )}
      </div>
    </div>
  );
};

// 4. CALENDAR
const CalendarView = () => {
  const { events, addEvent, users, currentUser, themeColor } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [viewFilter, setViewFilter] = useState<'all' | 'my'>('all');

  // New Event State
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month);

  const calendarDays = [];
  for (let i = 0; i < startDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newTitle || !newStart || !newEnd) return;
    addEvent({
        title: newTitle,
        start: newStart,
        end: newEnd,
        userId: currentUser?.id || '',
        isPublic
    });
    setShowModal(false);
    setNewTitle('');
    setNewStart('');
    setNewEnd('');
  };

  const filteredEvents = events.filter(ev => {
    if (viewFilter === 'my') return ev.userId === currentUser?.id;
    return ev.isPublic || ev.userId === currentUser?.id;
  });

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(e => e.start.startsWith(dateStr));
  };

  return (
    <div className="max-w-full mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 p-8 h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 shrink-0">
        <div className="flex items-center space-x-6">
            <div className="flex items-center bg-slate-50 rounded-xl p-1">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition text-slate-500 hover:text-slate-800"><ChevronLeft size={20} /></button>
                <button onClick={handleNextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition text-slate-500 hover:text-slate-800"><ChevronRight size={20} /></button>
            </div>
            <h2 className="text-3xl font-bold text-slate-800">
                {year}年 {month + 1}月
            </h2>
        </div>
        
        <div className="flex items-center space-x-4">
            <div className="bg-slate-100 p-1.5 rounded-xl flex text-sm font-medium">
                <button 
                    onClick={() => setViewFilter('all')}
                    className={`px-4 py-2 rounded-lg transition ${viewFilter === 'all' ? `bg-white shadow text-${themeColor}-600` : 'text-slate-500 hover:text-slate-700'}`}
                >全体</button>
                <button 
                    onClick={() => setViewFilter('my')}
                    className={`px-4 py-2 rounded-lg transition ${viewFilter === 'my' ? `bg-white shadow text-${themeColor}-600` : 'text-slate-500 hover:text-slate-700'}`}
                >自分のみ</button>
            </div>
            <button 
                onClick={() => setShowModal(true)}
                className={`bg-${themeColor}-600 text-white px-5 py-3 rounded-xl flex items-center hover:bg-${themeColor}-700 shadow-lg shadow-${themeColor}-200 font-bold text-sm transition`}
            >
                <Plus size={18} className="mr-2" /> 予定追加
            </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr] gap-4 min-h-0">
        {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
            <div key={i} className={`text-center text-xs font-bold uppercase tracking-wider pb-2 border-b border-slate-100 ${i===0 ? 'text-rose-500': i===6 ? 'text-blue-500' : 'text-slate-400'}`}>
                {d}
            </div>
        ))}
        
        <div className="col-span-7 grid grid-cols-7 grid-rows-5 md:grid-rows-6 gap-4 min-h-0 overflow-y-auto">
            {calendarDays.map((day, i) => (
                <div key={i} className={`relative flex flex-col rounded-2xl p-3 transition-all ${
                    day ? `bg-slate-50 hover:bg-white hover:shadow-md hover:shadow-${themeColor}-100 border border-transparent hover:border-${themeColor}-100` : ''
                }`}>
                    {day && (
                        <>
                            <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full mb-2 ${
                                new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year
                                ? `bg-${themeColor}-600 text-white shadow-md shadow-${themeColor}-300` 
                                : 'text-slate-700'
                            }`}>{day}</span>
                            <div className="space-y-1.5 overflow-y-auto no-scrollbar flex-1">
                                {getEventsForDay(day).map(ev => (
                                    <div key={ev.id} className={`px-2 py-1.5 rounded-lg text-[10px] font-medium truncate border-l-2 shadow-sm ${
                                        ev.isPublic 
                                        ? 'bg-white text-blue-700 border-blue-400' 
                                        : 'bg-white text-purple-700 border-purple-400'
                                    }`}>
                                        {ev.title}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
      </div>

      {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
              <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 scale-100 animate-in zoom-in-95 duration-200">
                  <h3 className="text-xl font-bold mb-6 text-slate-800">予定を追加</h3>
                  <form onSubmit={handleAddEvent} className="space-y-5">
                      <div>
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">タイトル</label>
                          <input required type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className={`w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-${themeColor}-500/50`} placeholder="会議、面談など" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">開始日時</label>
                            <input required type="datetime-local" value={newStart} onChange={e => setNewStart(e.target.value)} className={`w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-${themeColor}-500/50`} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">終了日時</label>
                            <input required type="datetime-local" value={newEnd} onChange={e => setNewEnd(e.target.value)} className={`w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-${themeColor}-500/50`} />
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-slate-50 rounded-xl">
                          <input type="checkbox" id="public" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className={`w-5 h-5 text-${themeColor}-600 rounded focus:ring-${themeColor}-500 border-gray-300 mr-3`} />
                          <label htmlFor="public" className="text-sm font-medium text-slate-700 cursor-pointer select-none">全体に公開する</label>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                          <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl font-medium transition">キャンセル</button>
                          <button type="submit" className={`px-6 py-2.5 bg-${themeColor}-600 text-white rounded-xl hover:bg-${themeColor}-700 font-bold shadow-lg shadow-${themeColor}-200 transition`}>保存</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

// 5. PROFILE
const ProfileView = () => {
    const { currentUser, updateUser, themeColor, setThemeColor, exportData, importData } = useAppContext();
    const [name, setName] = useState(currentUser?.name || '');
    const [department, setDepartment] = useState(currentUser?.department || '');
    const [bio, setBio] = useState(currentUser?.bio || '');
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const secondary = THEME_CONFIG[themeColor].accent;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if(currentUser) {
            updateUser({ ...currentUser, name, department, bio });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            if(ev.target?.result) {
                const success = importData(ev.target.result as string);
                if(success) alert('データを正常に読み込みました。');
                else alert('データの読み込みに失敗しました。');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className={`h-32 bg-gradient-to-r from-${themeColor}-500 via-${secondary}-500 to-pink-500 relative`}></div>
                <div className="px-10 pb-10">
                    <div className="relative flex justify-between items-end -mt-12 mb-8">
                        <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
                            <div className={`w-full h-full bg-${themeColor}-100 rounded-xl flex items-center justify-center text-${themeColor}-600 text-3xl font-bold`}>
                                {name[0]}
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 mb-1">プロフィール設定</h2>
                    <p className="text-slate-500 text-sm mb-8">あなたのアカウント情報を管理します</p>
                    
                    <form onSubmit={handleSave} className="space-y-8">
                        {/* THEME SELECTOR */}
                        <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-200/50">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                                <Palette className="mr-2" size={16} /> テーマカラー
                            </label>
                            <div className="flex flex-wrap gap-4">
                                {Object.entries(THEME_CONFIG).map(([color, config]) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setThemeColor(color as ThemeColor)}
                                        className={`relative group flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
                                            themeColor === color 
                                            ? 'ring-4 ring-offset-2 ring-slate-200 scale-110' 
                                            : 'hover:scale-110'
                                        }`}
                                    >
                                        <div className={`w-full h-full rounded-full bg-${color}-500 shadow-sm border border-black/5`}></div>
                                        {themeColor === color && (
                                            <div className="absolute inset-0 flex items-center justify-center text-white">
                                                <Check size={16} strokeWidth={3} />
                                            </div>
                                        )}
                                        <span className="absolute -bottom-8 text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase">
                                            {config.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">氏名</label>
                                <input value={name} onChange={e => setName(e.target.value)} className={`w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-${themeColor}-500/50 focus:border-${themeColor}-500 outline-none transition-all`} />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">部署</label>
                                <input value={department} onChange={e => setDepartment(e.target.value)} className={`w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-${themeColor}-500/50 focus:border-${themeColor}-500 outline-none transition-all`} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">自己紹介 / メモ</label>
                            <textarea value={bio} onChange={e => setBio(e.target.value)} className={`w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 h-32 resize-none focus:ring-2 focus:ring-${themeColor}-500/50 focus:border-${themeColor}-500 outline-none transition-all`} />
                        </div>
                        
                        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                            <span className={`flex items-center text-emerald-600 text-sm font-medium transition-all duration-300 ${saved ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                                <div className="bg-emerald-100 p-1 rounded-full mr-2"><Check size={12} /></div>
                                変更を保存しました
                            </span>
                            <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-200 font-bold transition transform hover:-translate-y-0.5">
                                変更を保存
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* SYSTEM MANAGEMENT SECTION */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-10">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                    <Database className="mr-2 text-slate-400" size={20} /> システム管理
                </h3>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-700 mb-2">データのバックアップと復元</h4>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                現在のユーザー設定、掲示板の投稿、勤怠記録などの全データをファイルとして保存したり、読み込んだりできます。
                                <br/>
                                <span className={`text-${themeColor}-600 font-medium`}>※他のメンバーと初期設定を共有する場合に使用してください。</span>
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                type="button"
                                onClick={exportData}
                                className={`flex items-center px-5 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition`}
                            >
                                <Download size={18} className="mr-2" /> 書き出し
                            </button>
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex items-center px-5 py-3 bg-${themeColor}-600 text-white font-bold rounded-xl shadow-lg shadow-${themeColor}-200 hover:bg-${themeColor}-700 transition`}
                            >
                                <Upload size={18} className="mr-2" /> 読み込み
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".json" 
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// DASHBOARD (HOME)
const DashboardView = () => {
    const { currentUser, timeRecords, threads, events, themeColor } = useAppContext();
    const today = formatDate(new Date());
    const secondary = THEME_CONFIG[themeColor].accent;
    
    // Quick Stats
    const myThreads = threads.filter(t => t.authorId === currentUser?.id).length;
    const todayEvents = events.filter(e => e.start.startsWith(today) && (e.isPublic || e.userId === currentUser?.id));

    // Determine Greeting Time
    const hour = new Date().getHours();
    let greeting = 'こんにちは';
    if (hour < 12) greeting = 'おはようございます';
    else if (hour > 17) greeting = 'お疲れ様です';

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Welcome Banner */}
            <div className={`bg-gradient-to-r from-${themeColor}-600 via-${secondary}-600 to-pink-600 rounded-3xl p-10 text-white shadow-xl shadow-${themeColor}-200 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-yellow-300 opacity-20 rounded-full blur-2xl -ml-10 -mb-10"></div>
                
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold mb-3 tracking-tight">{greeting}、{currentUser?.name}さん</h1>
                    <p className={`text-${themeColor}-100 text-lg opacity-90`}>今日はどのような一日になりますか？スケジュールとタスクを確認しましょう。</p>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Calendar Card */}
                <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                             <h3 className="font-bold text-xl text-slate-800">本日の予定</h3>
                             <p className="text-slate-400 text-sm">{new Date().toLocaleDateString('ja-JP', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div className={`p-3 bg-${themeColor}-50 text-${themeColor}-600 rounded-xl group-hover:scale-110 transition-transform`}>
                            <CalendarIcon size={24} />
                        </div>
                    </div>
                    <div className="space-y-3">
                        {todayEvents.length > 0 ? todayEvents.map(e => (
                             <div key={e.id} className={`flex items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-${themeColor}-200 transition-colors`}>
                                <div className={`w-1.5 h-10 rounded-full bg-${themeColor}-500 mr-4`}></div>
                                <div>
                                    <div className="font-bold text-slate-700">{e.title}</div>
                                    <div className="text-xs text-slate-400 font-mono">{new Date(e.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(e.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </div>
                             </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-32 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <span className="text-sm">本日の予定はありません</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Column */}
                <div className="space-y-6">
                    {/* Activity Card */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all h-full flex flex-col justify-between group">
                         <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg text-slate-700">ステータス</h3>
                            <div className="p-2 bg-orange-50 text-orange-500 rounded-xl">
                                <UserIcon size={20} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                                <div className={`text-3xl font-bold text-${themeColor}-600 mb-1`}>{myThreads}</div>
                                <div className="text-xs text-slate-400 font-bold uppercase">Posts</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                                <div className="text-lg font-bold text-slate-700 mt-1">{currentUser?.role}</div>
                                <div className="text-xs text-slate-400 font-bold uppercase mt-1">Role</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Board Feed */}
                <div className="md:col-span-3 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-xl text-slate-800">最新のお知らせ</h3>
                        <button className={`text-${themeColor}-600 text-sm font-medium hover:underline`}>すべて見る</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {threads.slice(0,3).map(t => (
                            <div key={t.id} className={`p-5 rounded-2xl border border-slate-100 hover:border-${themeColor}-200 hover:shadow-sm transition-all bg-slate-50 hover:bg-white cursor-pointer`}>
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-500">{t.category}</span>
                                    <span className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="font-bold text-slate-800 mb-2 truncate">{t.title}</div>
                                <div className="text-xs text-slate-500 line-clamp-2">{t.content}</div>
                            </div>
                        ))}
                        {threads.length === 0 && <p className="text-slate-400 text-sm col-span-3 text-center py-8">お知らせはありません</p>}
                    </div>
                </div>
            </div>
        </div>
    )
}


// --- MAIN APP LOGIC ---

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // PERSISTENT STATE SIMULATION
  const [users, setUsers] = useState<User[]>(() => {
      const saved = localStorage.getItem('app_users');
      return saved ? JSON.parse(saved) : MOCK_USERS;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      const saved = localStorage.getItem('app_current_user');
      return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState<ViewMode>('dashboard');
  
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>(() => {
      const saved = localStorage.getItem('app_time_records');
      return saved ? JSON.parse(saved) : [];
  });

  const [threads, setThreads] = useState<Thread[]>(() => {
      const saved = localStorage.getItem('app_threads');
      return saved ? JSON.parse(saved) : [];
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
      const saved = localStorage.getItem('app_events');
      return saved ? JSON.parse(saved) : [];
  });
  
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => {
      const saved = localStorage.getItem('app_theme_color');
      return (saved as ThemeColor) || 'indigo';
  });

  // Sync to localStorage
  useEffect(() => localStorage.setItem('app_users', JSON.stringify(users)), [users]);
  useEffect(() => {
      if(currentUser) localStorage.setItem('app_current_user', JSON.stringify(currentUser));
      else localStorage.removeItem('app_current_user');
  }, [currentUser]);
  useEffect(() => localStorage.setItem('app_time_records', JSON.stringify(timeRecords)), [timeRecords]);
  useEffect(() => localStorage.setItem('app_threads', JSON.stringify(threads)), [threads]);
  useEffect(() => localStorage.setItem('app_events', JSON.stringify(events)), [events]);
  useEffect(() => localStorage.setItem('app_theme_color', themeColor), [themeColor]);
  
  // Update Selection Color Global
  useEffect(() => {
      const colors = Object.keys(THEME_CONFIG);
      document.body.classList.remove(...colors.map(c => `selection:bg-${c}-500`));
      document.body.classList.add(`selection:bg-${themeColor}-500`);
  }, [themeColor]);

  // DATA MGMT
  const exportData = () => {
      const data = {
          app_users: users,
          app_time_records: timeRecords,
          app_threads: threads,
          app_events: events,
          app_theme_color: themeColor
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `worksync_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const importData = (json: string) => {
      try {
          const data = JSON.parse(json);
          if(data.app_users) setUsers(data.app_users);
          if(data.app_time_records) setTimeRecords(data.app_time_records);
          if(data.app_threads) setThreads(data.app_threads);
          if(data.app_events) setEvents(data.app_events);
          if(data.app_theme_color) setThemeColor(data.app_theme_color);
          return true;
      } catch(e) {
          console.error(e);
          return false;
      }
  };

  // ACTIONS
  const login = (email: string) => {
    const user = users.find(u => u.email === email);
    if (user) {
        setCurrentUser(user);
        setView('dashboard');
    } else {
        alert('ユーザーが見つかりません');
    }
  };
  
  const logout = () => {
    setCurrentUser(null);
  };

  const updateUser = (updated: User) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    setCurrentUser(updated);
  };

  const getTodayRecord = useCallback(() => {
      if(!currentUser) return undefined;
      const today = formatDate(new Date());
      return timeRecords.find(r => r.userId === currentUser.id && r.date === today);
  }, [currentUser, timeRecords]);

  const clockIn = () => {
      if(!currentUser) return;
      const today = formatDate(new Date());
      const now = new Date().toISOString();
      
      if (getTodayRecord()) return; // Already clocked in

      const newRecord: TimeRecord = {
          id: generateId(),
          userId: currentUser.id,
          date: today,
          startTime: now,
          breaks: []
      };
      setTimeRecords(prev => [...prev, newRecord]);
  };

  const clockOut = () => {
      const record = getTodayRecord();
      if(!record || record.endTime) return;
      
      // If on break, end break first
      let updatedBreaks = [...record.breaks];
      if (updatedBreaks.length > 0 && !updatedBreaks[updatedBreaks.length -1].end) {
          updatedBreaks[updatedBreaks.length -1].end = new Date().toISOString();
      }

      const updated: TimeRecord = {
          ...record,
          endTime: new Date().toISOString(),
          breaks: updatedBreaks
      };
      setTimeRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const startBreak = () => {
      const record = getTodayRecord();
      if(!record || record.endTime) return;
      
      // Check if already on break
      if(record.breaks.length > 0 && !record.breaks[record.breaks.length-1].end) return;

      const updated: TimeRecord = {
          ...record,
          breaks: [...record.breaks, { start: new Date().toISOString() }]
      };
      setTimeRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const endBreak = () => {
      const record = getTodayRecord();
      if(!record || record.endTime) return;
      
      const breaks = [...record.breaks];
      if(breaks.length === 0 || breaks[breaks.length-1].end) return; // Not on break

      breaks[breaks.length-1].end = new Date().toISOString();
      const updated = { ...record, breaks };
      setTimeRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const addThread = (t: Omit<Thread, 'id' | 'createdAt' | 'comments'>) => {
      const newThread: Thread = {
          ...t,
          id: generateId(),
          createdAt: new Date().toISOString(),
          comments: []
      };
      setThreads(prev => [newThread, ...prev]);
  };

  const addComment = (threadId: string, content: string) => {
      if(!currentUser) return;
      const newComment: Comment = {
          id: generateId(),
          authorId: currentUser.id,
          content,
          createdAt: new Date().toISOString()
      };
      setThreads(prev => prev.map(t => {
          if (t.id === threadId) {
              return { ...t, comments: [...t.comments, newComment] };
          }
          return t;
      }));
  };

  const addEvent = (e: Omit<CalendarEvent, 'id'>) => {
      const newEvent: CalendarEvent = { ...e, id: generateId() };
      setEvents(prev => [...prev, newEvent]);
  };

  return (
    <AppContext.Provider value={{
      currentUser, login, logout, view, setView, users, updateUser,
      timeRecords, clockIn, clockOut, startBreak, endBreak, getTodayRecord,
      threads, addThread, addComment, events, addEvent, themeColor, setThemeColor,
      exportData, importData
    }}>
      {children}
    </AppContext.Provider>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick, themeColor }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 mb-1 ${
      active 
        ? `bg-${themeColor}-600 text-white shadow-lg shadow-${themeColor}-200 font-medium` 
        : `text-slate-500 hover:bg-white hover:text-${themeColor}-600 hover:shadow-sm`
    }`}
  >
    <Icon size={20} className={active ? 'text-white' : 'opacity-70'} />
    <span className="text-sm">{label}</span>
  </button>
);

const MainLayout = () => {
  const { currentUser, logout, view, setView, themeColor } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) return <LoginScreen />;

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center tracking-tight">
          <div className={`w-8 h-8 bg-${themeColor}-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-md shadow-${themeColor}-200`}>
              <Clock size={18} />
          </div>
          WorkSync
        </h1>
      </div>
      <nav className="px-6 flex-1 space-y-1">
        <SidebarItem icon={LayoutDashboard} label="ダッシュボード" active={view === 'dashboard'} onClick={() => setView('dashboard')} themeColor={themeColor} />
        <SidebarItem icon={Play} label="タイムカード" active={view === 'timecard'} onClick={() => setView('timecard')} themeColor={themeColor} />
        <SidebarItem icon={MessageSquare} label="掲示板" active={view === 'board'} onClick={() => setView('board')} themeColor={themeColor} />
        <SidebarItem icon={CalendarIcon} label="カレンダー" active={view === 'calendar'} onClick={() => setView('calendar')} themeColor={themeColor} />
        <SidebarItem icon={UserIcon} label="プロフィール" active={view === 'profile'} onClick={() => setView('profile')} themeColor={themeColor} />
      </nav>
      
      <div className="p-6">
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
             <div className="flex items-center mb-3">
                 <div className={`w-10 h-10 bg-gradient-to-br from-${themeColor}-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3 shadow-sm`}>
                     {currentUser.name[0]}
                 </div>
                 <div className="min-w-0">
                     <div className="font-bold text-slate-800 text-sm truncate">{currentUser.name}</div>
                     <div className="text-xs text-slate-400 truncate">{currentUser.role}</div>
                 </div>
             </div>
             <button onClick={logout} className="w-full flex items-center justify-center px-4 py-2 text-xs font-medium text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors">
                <LogOut size={14} className="mr-1.5" /> ログアウト
             </button>
         </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 bg-slate-50/50 border-r border-slate-200/60 backdrop-blur-xl relative z-20">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-4">
         <span className={`font-bold text-${themeColor}-600 flex items-center gap-2`}>
            <div className={`w-6 h-6 bg-${themeColor}-600 rounded text-white flex items-center justify-center`}><Clock size={14} /></div>
            WorkSync
         </span>
         <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
             {mobileMenuOpen ? <X /> : <Menu />}
         </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-white animate-in slide-in-from-left duration-300">
              <div className="flex justify-end p-4">
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
              </div>
              <NavContent />
          </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden h-screen">
        {/* Background blur blobs */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
            <div className={`absolute top-[10%] right-[5%] w-[500px] h-[500px] bg-${themeColor}-300/20 rounded-full blur-[120px]`}></div>
            <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-purple-300/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10 p-4 md:p-10 pb-20 mt-16 md:mt-0 max-w-[1600px] mx-auto">
           {view === 'dashboard' && <DashboardView />}
           {view === 'timecard' && <TimeCardView />}
           {view === 'board' && <BulletinBoardView />}
           {view === 'calendar' && <CalendarView />}
           {view === 'profile' && <ProfileView />}
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default App;
