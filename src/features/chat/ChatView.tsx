import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { 
  Send, 
  Users, 
  Key, 
  Download, 
  Upload, 
  LogOut, 
  ShieldCheck, 
  MessageSquare, 
  UserPlus,
  ArrowRight,
  Info,
  Reply,
  Trash2,
  Ban,
  Edit2,
  Check,
  X
} from 'lucide-react';

export function ChatView() {
  const { 
    currentUser, 
    users, 
    messages, 
    status, 
    error, 
    roomKey, 
    hostRoom, 
    joinRoom, 
    sendMessage, 
    leaveRoom,
    transferAdmin,
    deleteMessage,
    renameUser,
    kickUser,
    replyingTo,
    setReplyingTo
  } = useChatStore();

  const [userName, setUserName] = useState('');
  const [inputText, setInputText] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleHost = () => {
    if (!userName.trim()) return;
    hostRoom(userName.trim());
  };

  const handleJoinFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userName.trim() || !e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.roomKey) {
          joinRoom(userName.trim(), data.roomKey);
        }
      } catch (err) {
        console.error('Invalid keyroom file');
      }
    };
    reader.readAsText(file);
  };

  const handleExportKey = () => {
    if (!roomKey) return;
    const data = { roomKey, hostName: currentUser?.name, timestamp: Date.now() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Keyroom_StudiKu_${roomKey.slice(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleRename = () => {
    if (!newName.trim() || newName === currentUser?.name) {
      setIsRenaming(false);
      return;
    }
    renameUser(newName.trim());
    setIsRenaming(false);
  };


  // Setup Screen
  if (status === 'idle' || status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <div className="w-20 h-20 bg-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/30">
            <MessageSquare size={40} className="text-indigo-400" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-gradient">Grup Chat P2P</h1>
          <p className="text-text-muted text-lg max-w-md">Ngobrol bareng teman tanpa server. Privasi total, pesan tidak disimpan.</p>
        </div>

        {error && (
          <div className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-bold flex items-center gap-3">
             <Info size={18} /> {error}
          </div>
        )}

        <div className="glass-panel p-8 bg-surface-1 border border-border-main rounded-[2.5rem] shadow-2xl w-full max-w-md flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted/60 px-1">Nama Tampilan</label>
            <input 
              type="text" 
              className="w-full h-14 bg-surface-2 border border-border-main rounded-2xl px-5 font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
              placeholder="Masukkan namamu..."
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 mt-2">
            <button 
              className={`btn h-14 rounded-2xl font-black flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl
                ${!userName.trim() ? 'bg-surface-2 text-text-muted cursor-not-allowed' : 'btn-primary'}`}
              onClick={handleHost}
              disabled={!userName.trim()}
            >
              <ShieldCheck size={20} /> Buat Ruangan Baru
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="grow border-t border-border-main"></div>
              <span className="shrink mx-4 text-[10px] font-black uppercase tracking-widest text-text-muted/40">atau</span>
              <div className="grow border-t border-border-main"></div>
            </div>

            <label className={`btn h-14 rounded-2xl font-black flex items-center justify-center gap-3 transition-all cursor-pointer transform active:scale-95 shadow-xl border border-border-main
               ${!userName.trim() ? 'bg-surface-2 text-text-muted opacity-50 cursor-not-allowed' : 'bg-surface-1 hover:bg-surface-2'}`}>
              <Upload size={20} /> Gabung via Keyroom
              <input 
                type="file" 
                className="hidden" 
                accept=".json" 
                onChange={handleJoinFile}
                disabled={!userName.trim()}
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  // Connecting Screen
  if (status === 'connecting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-500 text-center">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-1">Sedang Menyambung...</h2>
          <p className="text-text-muted text-sm font-medium">Bekerja sama dengan PeerJS untuk mencari jalur tercepat.</p>
        </div>
      </div>
    );
  }

  // Chat Room Screen
  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] gap-6">
      {/* Header Room */}
      <div className="flex items-center justify-between flex-wrap gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
            <Users size={24} className="text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">Ruangan Belajar</h2>
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-green-500/10 text-green-400 rounded-md border border-green-500/20">Aktif</span>
            </div>
            <p className="text-xs font-bold text-text-muted/60">{users.length} Peserta Terhubung</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            className="btn btn-glass h-11 px-4 text-[10px] font-black uppercase tracking-widest border border-indigo-500/10 hover:border-indigo-500/30"
            onClick={handleExportKey}
          >
            <Download size={16} className="text-indigo-400" />
            Export Keyroom
          </button>
          <button 
            className="btn h-11 px-4 text-[10px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
            onClick={leaveRoom}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Participants Sidebar (Desktop) */}
        <div className={`glass-panel w-72 flex-col bg-surface-1 border border-border-main rounded-4xl p-6 hidden lg:flex shrink-0`}>
          <div className="flex flex-col gap-6 mb-8">
            <div className="text-[10px] font-black uppercase tracking-widest text-text-muted/40 flex items-center justify-between">
              Profil Saya
              <ShieldCheck size={12} className={currentUser?.role === 'admin' ? 'text-indigo-400' : 'text-text-muted/20'} />
            </div>
            
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center font-black text-sm text-indigo-400 border border-indigo-500/20">
                {currentUser?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                {isRenaming ? (
                  <div className="flex items-center gap-2">
                    <input 
                      autoFocus
                      className="bg-surface-2 border border-indigo-500/50 rounded-lg px-2 py-1 text-xs font-bold w-full outline-none"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRename()}
                    />
                    <button onClick={handleRename} className="text-green-400"><Check size={14} /></button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group">
                    <div className="text-sm font-bold truncate">{currentUser?.name}</div>
                    <button 
                      onClick={() => { setIsRenaming(true); setNewName(currentUser?.name || ''); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-text-muted/40 hover:text-indigo-400 transition-all"
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>
                )}
                <div className="text-[9px] font-black uppercase tracking-tighter text-text-muted/40">{currentUser?.role === 'admin' ? 'Administrator' : 'Peserta'}</div>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-black uppercase tracking-widest text-text-muted/40 mb-6 flex items-center justify-between">
            Daftar Peserta ({users.length})
            <Users size={12} />
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto pr-2">
            {users.map(user => (
              <div key={user.id} className="flex flex-col gap-2 p-3 rounded-xl bg-surface-2 border border-border-main group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shrink-0 ${user.role === 'admin' ? 'bg-indigo-500' : 'bg-surface-subtle border border-border-main text-text-muted'}`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold flex items-center gap-1.5 truncate">
                        {user.name}
                        {user.role === 'admin' && <ShieldCheck size={10} className="text-indigo-400" />}
                      </div>
                    </div>
                  </div>
                </div>
                
                {currentUser?.role === 'admin' && user.id !== currentUser.id && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      className="flex-1 p-1.5 text-[8px] font-black uppercase tracking-tighter bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-all"
                      onClick={() => transferAdmin(user.id)}
                    >
                      Admin
                    </button>
                    <button 
                      className="p-1.5 text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-all"
                      onClick={() => kickUser(user.id)}
                      title="Kick User"
                    >
                      <Ban size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Main Area */}
        <div className="flex-1 glass-panel bg-surface-1 border border-border-main rounded-4xl flex flex-col overflow-hidden relative">
          {/* Scrollable messages */}
          <div 
            ref={scrollRef}
            className="flex-1 p-6 overflow-y-auto flex flex-col gap-6"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4 text-center">
                <MessageSquare size={64} />
                <p className="font-black uppercase tracking-[0.2em] text-xs">Mulai obrolan baru dengan teman Anda!</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col gap-1.5 ${msg.type !== 'text' ? 'items-center my-2' : (msg.senderId === currentUser?.id ? 'items-end' : 'items-start')}`}
                >
                  {msg.type !== 'text' ? (
                    <div className={`px-4 py-1.5 rounded-full border border-border-main text-[10px] font-bold uppercase tracking-widest ${msg.type === 'event' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-surface-2 text-text-muted'}`}>
                      {msg.content}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted/60 mb-0.5">
                        {msg.senderName}
                        <span className="opacity-40">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      <div className={`group relative flex flex-col gap-1 max-w-[80%] ${msg.senderId === currentUser?.id ? 'items-end' : 'items-start'}`}>
                        {msg.replyTo && (
                          <div className={`px-3 py-2 rounded-xl text-[11px] font-medium border border-border-main mb-[-8px] opacity-60 flex flex-col gap-0.5 max-w-full ${msg.senderId === currentUser?.id ? 'bg-white/5 mr-2' : 'bg-surface-2 ml-2'}`}>
                            <div className="text-[9px] font-black uppercase tracking-tighter text-indigo-400">{msg.replyTo.senderName}</div>
                            <div className="truncate">{msg.replyTo.content}</div>
                          </div>
                        )}
                        
                        <div className={`px-5 py-3.5 rounded-2xl text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                          msg.senderId === currentUser?.id 
                            ? 'bg-indigo-500 text-white rounded-tr-sm shadow-lg shadow-indigo-500/10' 
                            : 'bg-surface-subtle border border-border-main text-text-main rounded-tl-sm'
                        }`}>
                          {msg.content}

                          <div className={`absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ${msg.senderId === currentUser?.id ? 'right-full mr-2' : 'left-full ml-2'}`}>
                            <button 
                              onClick={() => setReplyingTo(msg)}
                              className="p-2 bg-surface-2 border border-border-main rounded-xl text-text-muted hover:text-indigo-400 transition-all shadow-xl"
                              title="Balas"
                            >
                              <Reply size={14} />
                            </button>
                            {currentUser?.role === 'admin' && (
                              <button 
                                onClick={() => deleteMessage(msg.id)}
                                className="p-2 bg-surface-2 border border-border-main rounded-xl text-red-400/60 hover:text-red-400 transition-all shadow-xl"
                                title="Hapus"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 pt-0">
            {replyingTo && (
              <div className="flex items-center justify-between bg-surface-2 border border-border-main p-3 rounded-t-2xl border-b-0 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3 pl-2 min-w-0">
                   <div className="w-1.5 h-8 bg-indigo-500 rounded-full"></div>
                   <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-0.5">Membalas {replyingTo.senderName}</div>
                      <div className="text-xs text-text-muted truncate">{replyingTo.content}</div>
                   </div>
                </div>
                <button 
                  onClick={() => setReplyingTo(null)}
                  className="p-2 text-text-muted/40 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="relative">
              <textarea 
                className={`w-full bg-surface-2 border border-border-main px-6 py-4 pr-16 text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all resize-none max-h-32 ${replyingTo ? 'rounded-b-2xl border-t-0' : 'rounded-2xl'}`}
                placeholder="Tulis pesan anda..."
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              <button 
                className={`absolute right-3 bottom-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  inputText.trim() ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-surface-subtle text-text-muted cursor-not-allowed'
                }`}
                onClick={handleSend}
                disabled={!inputText.trim()}
              >
                <Send size={18} fill={inputText.trim() ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
