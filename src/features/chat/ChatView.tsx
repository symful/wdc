import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { 
  Send, 
  Users, 
  Download, 
  Upload, 
  LogOut, 
  ShieldCheck, 
  MessageSquare, 
  Info,
  Reply,
  Trash2,
  Ban,
  Edit2,
  Check,
  X,
  Link,
  QrCode,
  Maximize2,
  Paperclip,
  FileText,
  Clock,
  Camera,
  Image as ImageIcon,
  Share2
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import jsQR from 'jsqr';

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

  const [ui, setUi] = useState({
    sidebar: false,
    shareModal: false,
    scanModal: false,
    inviteModal: false,
    scanning: false,
    renaming: false,
  });

  const [form, setForm] = useState({
    userName: '',
    inputText: '',
    newName: '',
    scanError: null as string | null,
  });

  const [fileShare, setFileShare] = useState({
    file: null as File | null,
    mode: 'instant' as 'instant' | 'on-waiting',
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanVideoRef = useRef<HTMLVideoElement>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement>(null);

  const joinLink = `${window.location.origin}${window.location.pathname}?join=${roomKey}`;

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleHost = () => {
    if (!form.userName.trim()) return;
    hostRoom(form.userName.trim());
  };

  const handleJoinFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!form.userName.trim() || !e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.roomKey) {
          joinRoom(form.userName.trim(), data.roomKey);
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
    if (!form.inputText.trim()) return;
    sendMessage(form.inputText.trim());
    setForm(s => ({ ...s, inputText: '' }));
  };

  const handleRename = () => {
    if (!form.newName.trim() || form.newName === currentUser?.name) {
      setUi(s => ({ ...s, renaming: false }));
      return;
    }
    renameUser(form.newName.trim());
    setUi(s => ({ ...s, renaming: false }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileShare(s => ({ ...s, file }));
      setUi(s => ({ ...s, shareModal: true }));
    }
  };

  const confirmFileShare = () => {
    if (fileShare.file) {
      const { sendFile } = useChatStore.getState();
      sendFile(fileShare.file, fileShare.mode);
      setFileShare(s => ({ ...s, file: null }));
      setUi(s => ({ ...s, shareModal: false }));
    }
  };

  const handleDownload = (msgId: string) => {
    const { messages, requestFile } = useChatStore.getState();
    const msg = messages.find(m => m.id === msgId);
    if (!msg || !msg.file) return;

    if (msg.file.data) {
      const link = document.createElement('a');
      link.href = msg.file.data;
      link.download = msg.file.name;
      link.click();
    } else {
      requestFile(msgId);
    }
  };

  const copyJoinLink = () => {
    navigator.clipboard.writeText(joinLink);
    // Optional: add a toast or indicator
  };

  // Camera Scan logic
  useEffect(() => {
    let animationFrameId: number;
    let stream: MediaStream | null = null;

    const scan = () => {
      if (scanVideoRef.current && scanCanvasRef.current && ui.scanning) {
        const video = scanVideoRef.current;
        const canvas = scanCanvasRef.current;
        const ctx = canvas.getContext('2d');

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
          
          if (imageData) {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });

            if (code) {
              handleScanSuccess(code.data);
              return;
            }
          }
        }
        animationFrameId = requestAnimationFrame(scan);
      }
    };

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (scanVideoRef.current) {
          scanVideoRef.current.srcObject = stream;
          scanVideoRef.current.setAttribute("playsinline", "true");
          scanVideoRef.current.play();
          requestAnimationFrame(scan);
        }
      } catch (err) {
        setForm(s => ({ ...s, scanError: "Gagal mengakses kamera. Pastikan izin diberikan." }));
      }
    };

    if (ui.scanning) {
      startCamera();
    } else {
      if (stream) {
        (stream as MediaStream).getTracks().forEach(track => track.stop());
      }
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) (stream as MediaStream).getTracks().forEach(track => track.stop());
    };
  }, [ui.scanning]);

  const handleScanSuccess = (data: string) => {
    try {
      const url = new URL(data);
      const key = url.searchParams.get('join');
      if (key) {
        joinRoom(form.userName || 'User', key);
        setUi(s => ({ ...s, scanning: false, scanModal: false }));
      } else {
        setForm(s => ({ ...s, scanError: "QR Code tidak valid." }));
      }
    } catch (e) {
      // Direct key scan
      if (data.length > 10) {
        joinRoom(form.userName || 'User', data);
        setUi(s => ({ ...s, scanning: false, scanModal: false }));
      } else {
        setForm(s => ({ ...s, scanError: "Format QR Code tidak dikenal." }));
      }
    }
  };

  const handleImageScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        if (imageData) {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            handleScanSuccess(code.data);
          } else {
            setForm(s => ({ ...s, scanError: "Tidak dapat menemukan QR Code di gambar ini." }));
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Auto-join logic
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinKey = params.get('join');
    if (joinKey && status === 'idle' && form.userName.trim()) {
       // If we have a name and a key, we can auto-join if the user clicks the "Join" button
       // which we'll update below.
    }
  }, [status, form.userName]);


  // Setup Screen
  if (status === 'idle' || status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4 py-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-500/20 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 border border-indigo-500/30">
            <MessageSquare size={32} className="text-indigo-400 md:hidden" />
            <MessageSquare size={40} className="text-indigo-400 hidden md:block" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-gradient">Grup Chat P2P</h1>
          <p className="text-text-muted text-sm md:text-lg max-w-md mx-auto">Ngobrol bareng teman tanpa server. Privasi total, pesan tidak disimpan.</p>
        </div>

        {error && (
          <div className="px-6 py-3 bg-status-danger-subtle border border-status-danger/20 rounded-2xl text-status-danger text-sm font-bold flex items-center gap-3">
             <Info size={18} /> {error}
          </div>
        )}

        <div className="glass-panel p-6 md:p-8 bg-surface-1 border border-border-main rounded-3xl md:rounded-[2.5rem] shadow-2xl w-full max-w-md flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 px-1">Nama Tampilan</label>
            <input 
              type="text" 
              className="w-full h-12 md:h-14 bg-surface-2 border border-border-main rounded-xl md:rounded-2xl px-5 font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
              placeholder="Masukkan namamu..."
              value={form.userName}
              onChange={(e) => setForm(s => ({ ...s, userName: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 mt-2">
            <button 
              className={`btn h-12 md:h-14 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl group
                ${!form.userName.trim() ? 'bg-surface-2 text-text-muted cursor-not-allowed' : 'btn-primary hover:scale-105'}`}
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                const joinKey = params.get('join');
                if (joinKey) {
                  joinRoom(form.userName.trim(), joinKey);
                } else {
                  handleHost();
                }
              }}
              disabled={!form.userName.trim()}
            >
              {new URLSearchParams(window.location.search).get('join') ? (
                <><Link size={20} className="group-hover:scale-110 transition-transform" /> Gabung ke Ruangan</>
              ) : (
                <><ShieldCheck size={20} className="group-hover:scale-110 transition-transform" /> Buat Ruangan Baru</>
              )}
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="grow border-t border-border-main"></div>
              <span className="shrink mx-4 text-[10px] font-black uppercase tracking-widest text-text-muted/40">atau</span>
              <div className="grow border-t border-border-main"></div>
            </div>

            <label className={`btn h-12 md:h-14 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-3 transition-all cursor-pointer transform active:scale-95 shadow-xl border border-border-main hover:border-indigo-500/30 group
               ${!form.userName.trim() ? 'bg-surface-2 text-text-muted opacity-50 cursor-not-allowed' : 'bg-surface-1 hover:bg-surface-2 hover:scale-105'}`}>
              <Upload size={20} className="group-hover:scale-110 transition-transform" /> Gabung via Keyroom
              <input 
                type="file" 
                className="hidden" 
                accept=".json" 
                onChange={handleJoinFile}
                disabled={!form.userName.trim()}
              />
            </label>

            <button 
              className={`btn h-12 md:h-14 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl border border-border-main hover:border-indigo-500/30 group
                ${!form.userName.trim() ? 'bg-surface-2 text-text-muted opacity-50 cursor-not-allowed' : 'bg-surface-1 hover:bg-surface-2 hover:scale-105'}`}
              onClick={() => form.userName.trim() && setUi(s => ({ ...s, scanModal: true }))}
              disabled={!form.userName.trim()}
            >
              <QrCode size={20} className="group-hover:scale-110 transition-transform" /> Scan QR Ruangan
            </button>
          </div>
        </div>

        {/* Setup Screen Modals */}
        {ui.scanModal && renderScanModal()}
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
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] gap-4 md:gap-6">
      {/* Header Room */}
      <div className="flex items-center justify-between gap-4 shrink-0 px-1 md:px-0">
        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-500/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-indigo-500/20 shrink-0">
            <Users size={20} className="text-indigo-400 md:hidden" />
            <Users size={24} className="text-indigo-400 hidden md:block" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-black tracking-tight truncate">Ruangan Belajar</h2>
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest px-1.5 md:px-2 py-0.5 bg-status-success-subtle text-status-success rounded-md border border-status-success/20 shrink-0">Aktif</span>
            </div>
            <p className="text-[10px] md:text-xs font-bold text-text-muted/60">{users.length} Peserta Terhubung</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button 
            className="btn btn-glass h-9 md:h-11 px-3 md:px-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-indigo-500/10 hover:border-indigo-500/30 hover:scale-105 active:scale-95 transition-all"
            onClick={handleExportKey}
            title="Export Keyroom"
          >
            <Download size={14} className="text-indigo-400 md:hidden cursor-pointer hover:scale-110 active:scale-90 transition-all" />
            <Download size={16} className="text-indigo-400 hidden md:block cursor-pointer hover:scale-110 active:scale-90 transition-all" />
            <span className="hidden sm:inline ml-1.5">Export</span>
          </button>
          <button 
            className="btn h-9 md:h-11 px-3 md:px-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-status-danger-subtle text-status-danger border border-status-danger/20 hover:bg-status-danger/20 hover:scale-105 active:scale-95 transition-all"
            onClick={leaveRoom}
            title="Keluar"
          >
            <LogOut size={14} className="md:hidden cursor-pointer hover:scale-110 active:scale-90 transition-all" />
            <LogOut size={16} className="hidden md:block cursor-pointer hover:scale-110 active:scale-90 transition-all" />
            <span className="hidden sm:inline ml-1.5">Keluar</span>
          </button>
          
          <button 
            className="lg:hidden btn btn-glass h-9 px-3 border-indigo-500/20 text-indigo-400 hover:scale-110 active:scale-90 transition-all"
            onClick={() => setUi(s => ({ ...s, sidebar: !s.sidebar }))}
          >
            <Users size={16} className="cursor-pointer hover:scale-110 transition-all" />
          </button>
          
          <button 
            className="btn btn-glass h-9 px-3 border-indigo-500/20 text-indigo-400 hover:scale-125 active:scale-90 transition-all cursor-pointer"
            onClick={() => setUi(s => ({ ...s, inviteModal: true }))}
            title="Invite Friends"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 md:gap-6 overflow-hidden relative">
        {/* Participants Sidebar (Desktop & Mobile Overlay) */}
        <div className={`
          glass-panel w-72 flex-col bg-surface-1 border border-border-main rounded-3xl md:rounded-4xl p-6 shrink-0
          lg:flex shadow-2xl transition-all duration-300
          ${ui.sidebar ? 'fixed inset-y-20 right-4 z-50 flex animate-in slide-in-from-right-full' : 'hidden lg:flex'}
        `}>
          <div className="flex flex-col gap-6 mb-8 shrink-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-text-muted/40 flex items-center justify-between">
              Profil Saya
              <ShieldCheck size={12} className={currentUser?.role === 'admin' ? 'text-indigo-400' : 'text-text-muted/20'} />
            </div>
            
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center font-black text-sm text-indigo-400 border border-indigo-500/20 shrink-0">
                {currentUser?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                {ui.renaming ? (
                  <div className="flex items-center gap-2">
                    <input 
                      autoFocus
                      className="bg-surface-2 border border-indigo-500/50 rounded-lg px-2 py-1 text-xs font-bold w-full outline-none"
                      value={form.newName}
                      onChange={e => setForm(s => ({ ...s, newName: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleRename()}
                    />
                    <button onClick={handleRename} className="text-status-success hover:scale-125 active:scale-90 transition-all"><Check size={14} className="cursor-pointer transition-all" /></button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group/name">
                    <div className="text-sm font-bold truncate">{currentUser?.name}</div>
                     <button 
                      onClick={() => { 
                        setUi(s => ({ ...s, renaming: true })); 
                        setForm(s => ({ ...s, newName: currentUser?.name || '' })); 
                      }}
                      className="opacity-0 group-hover/name:opacity-100 p-1 text-text-muted/40 hover:text-indigo-400 transition-all hover:scale-110 active:scale-90"
                    >
                      <Edit2 size={12} className="cursor-pointer transition-all" />
                    </button>
                  </div>
                )}
                <div className="text-[9px] font-black uppercase tracking-tighter text-text-muted/40">{currentUser?.role === 'admin' ? 'Administrator' : 'Peserta'}</div>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-black uppercase tracking-widest text-text-muted/40 mb-6 flex items-center justify-between shrink-0">
            Daftar Peserta ({users.length})
            <Users size={12} />
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-white/10">
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
                
                { (currentUser?.role === 'admin' || user.id === currentUser?.id) && user.id !== currentUser.id && (
                  <div className="flex items-center gap-2 max-h-0 group-hover:max-h-12 opacity-0 group-hover:opacity-100 transition-all duration-300 overflow-hidden">
                    {currentUser?.role === 'admin' && (
                      <>
                        <button 
                          className="flex-1 p-1.5 text-[8px] font-black uppercase tracking-tighter bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 hover:scale-110 active:scale-95 transition-all"
                          onClick={() => transferAdmin(user.id)}
                        >
                          Admin
                        </button>
                        <button 
                          className="p-1.5 text-status-danger bg-status-danger-subtle rounded-lg hover:bg-status-danger/20 hover:scale-110 active:scale-95 transition-all"
                          onClick={() => kickUser(user.id)}
                          title="Kick User"
                        >
                          <Ban size={12} className="cursor-pointer transition-all" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {ui.sidebar && (
            <button 
              className="mt-6 w-full lg:hidden btn btn-glass text-xs"
              onClick={() => setUi(s => ({ ...s, sidebar: false }))}
            >
              Tutup
            </button>
          )}
        </div>

        {/* Chat Main Area */}
        <div className="flex-1 glass-panel bg-surface-1 border border-border-main rounded-3xl md:rounded-4xl flex flex-col overflow-hidden relative shadow-2xl">
          {/* Scrollable messages */}
          <div 
            ref={scrollRef}
            className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-4 md:gap-6 hide-scrollbar"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4 text-center">
                <MessageSquare size={48} className="md:w-16 md:h-16" />
                <p className="font-black uppercase tracking-[0.2em] text-[10px] md:text-xs">Mulai obrolan baru!</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col gap-1.5 ${msg.type !== 'text' ? 'items-center my-2' : (msg.senderId === currentUser?.id ? 'items-end' : 'items-start')}`}
                >
                  {msg.type !== 'text' ? (
                    <div className={`px-4 py-1.5 rounded-full border border-border-main text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-center ${msg.type === 'event' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-surface-2 text-text-muted'}`}>
                      {msg.content}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-text-muted/60 mb-0.5">
                        {msg.senderName}
                        <span className="opacity-40">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      <div className={`group relative flex flex-col gap-1 max-w-[90%] md:max-w-[80%] ${msg.senderId === currentUser?.id ? 'items-end' : 'items-start'}`}>
                        {msg.replyTo && (
                          <div className={`px-3 py-2 rounded-xl text-[10px] md:text-[11px] font-medium border border-border-main mb-[-8px] opacity-60 flex flex-col gap-0.5 max-w-full ${msg.senderId === currentUser?.id ? 'bg-white/5 mr-2' : 'bg-surface-2 ml-2'}`}>
                            <div className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter text-indigo-400">{msg.replyTo.senderName}</div>
                            <div className="truncate">{msg.replyTo.content}</div>
                          </div>
                        )}
                        
                        {msg.file && (
                          <div className={`mt-2 p-3 rounded-xl border flex items-center gap-4 min-w-[200px] ${msg.senderId === currentUser?.id ? 'bg-white/5 border-white/10' : 'bg-surface-2 border-border-main'}`}>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${msg.file.status === 'completed' || msg.file.data ? 'bg-status-success-subtle text-status-success' : 'bg-indigo-500/20 text-indigo-400'}`}>
                              <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold truncate">{msg.file.name}</div>
                              <div className="text-[9px] opacity-40">{(msg.file.size / 1024).toFixed(1)} KB</div>
                            </div>
                            
                            {msg.senderId !== currentUser?.id && (
                              <button 
                                onClick={() => handleDownload(msg.id)}
                                className={`p-2 rounded-lg transition-all hover:scale-110 active:scale-95 ${
                                  msg.file.status === 'transferring' ? 'animate-pulse text-indigo-400' : 'hover:bg-indigo-500/10 text-text-muted hover:text-indigo-400'
                                }`}
                                disabled={msg.file.status === 'transferring'}
                              >
                                {msg.file.status === 'transferring' ? <Clock size={16} className="animate-spin-slow" /> : <Download size={16} className="cursor-pointer hover:scale-110 active:scale-90 transition-all" />}
                              </button>
                            )}
                          </div>
                        )}

                        <div className={`px-4 md:px-5 py-2.5 md:py-3.5 rounded-2xl text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                          msg.senderId === currentUser?.id 
                            ? 'bg-indigo-500 text-white rounded-tr-sm shadow-lg shadow-indigo-500/10' 
                            : 'bg-surface-subtle border border-border-main text-text-main rounded-tl-sm'
                        }`}>
                          {msg.content}

                          <div className={`absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ${msg.senderId === currentUser?.id ? 'right-full mr-2' : 'left-full ml-2'}`}>
                              <button 
                                onClick={() => setReplyingTo(msg)}
                                className="p-1.5 md:p-2 bg-surface-2 border border-border-main rounded-lg md:rounded-xl text-text-muted hover:text-indigo-400 hover:scale-125 active:scale-90 transition-all shadow-xl group/reply"
                                title="Balas"
                              >
                                <Reply size={12} className="md:w-[14px] md:h-[14px] cursor-pointer transition-all" />
                              </button>
                            {(currentUser?.role === 'admin' || msg.senderId === currentUser?.id) && (
                              <button 
                                onClick={() => deleteMessage(msg.id)}
                                className="p-1.5 md:p-2 bg-surface-2 border border-border-main rounded-lg md:rounded-xl text-status-danger/60 hover:text-status-danger hover:scale-125 active:scale-90 transition-all shadow-xl"
                                title="Hapus"
                              >
                                <Trash2 size={12} className="md:w-[14px] md:h-[14px] cursor-pointer" />
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
          <div className="p-4 md:p-6 pt-0">
            {replyingTo && (
              <div className="flex items-center justify-between bg-surface-2 border border-border-main p-3 rounded-t-xl md:rounded-t-2xl border-b-0 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3 pl-1 md:pl-2 min-w-0">
                   <div className="w-1 h-6 md:h-8 bg-indigo-500 rounded-full"></div>
                   <div className="min-w-0">
                      <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-0.5">Membalas {replyingTo.senderName}</div>
                      <div className="text-[10px] md:text-xs text-text-muted truncate">{replyingTo.content}</div>
                   </div>
                </div>
                <button 
                  onClick={() => setReplyingTo(null)}
                  className="p-1.5 md:p-2 text-text-muted/40 hover:text-white transition-all hover:scale-125 active:scale-90 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="relative">
              <textarea 
                className={`w-full bg-surface-2 border border-border-main pl-12 md:pl-16 pr-12 md:pr-16 py-3 md:py-4 text-xs md:text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all resize-none max-h-32 shadow-inner ${replyingTo ? 'rounded-b-xl md:rounded-b-2xl border-t-0' : 'rounded-xl md:rounded-2xl'}`}
                placeholder="Tulis pesan..."
                rows={1}
                value={form.inputText}
                onChange={(e) => setForm(s => ({ ...s, inputText: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />


              <button 
                className={`absolute right-3 bottom-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 ${
                  form.inputText.trim() ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-surface-subtle text-text-muted cursor-not-allowed'
                }`}
                onClick={handleSend}
                disabled={!form.inputText.trim()}
              >
                <Send size={18} fill={form.inputText.trim() ? 'currentColor' : 'none'} />
              </button>
              
              <button 
                className="absolute left-3 bottom-3 w-10 h-10 rounded-xl flex items-center justify-center bg-surface-subtle text-text-muted hover:text-indigo-400 hover:scale-110 active:scale-90 transition-all border border-border-main"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={18} />
              </button>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {ui.shareModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-sm p-8 bg-surface-1 border border-border-main rounded-4xl shadow-2xl flex flex-col gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-400 border border-indigo-500/20">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-black">Berbagi File</h3>
              <p className="text-sm text-text-muted mt-1 truncate">{fileShare.file?.name}</p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setFileShare(s => ({ ...s, mode: 'instant' }))}
                className={`p-4 rounded-2xl border flex items-center gap-4 transition-all text-left ${fileShare.mode === 'instant' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-surface-2 border-border-main text-text-muted hover:border-indigo-500/30'}`}
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Maximize2 size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold">Mode Instan</div>
                  <div className="text-[10px] opacity-60">Langsung kirim ke semua orang.</div>
                </div>
              </button>

              <button 
                onClick={() => setFileShare(s => ({ ...s, mode: 'on-waiting' }))}
                className={`p-4 rounded-2xl border flex items-center gap-4 transition-all text-left ${fileShare.mode === 'on-waiting' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-surface-2 border-border-main text-text-muted hover:border-indigo-500/30'}`}
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-orange-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold">Mode Tunggu (On-Waiting)</div>
                  <div className="text-[10px] opacity-60">Kirim hanya saat ada yang meminta.</div>
                </div>
              </button>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setUi(s => ({ ...s, shareModal: false }))} className="flex-1 btn btn-glass text-xs font-black py-4 hover:scale-105 active:scale-95 transition-all cursor-pointer">Batal</button>
              <button onClick={confirmFileShare} className="flex-1 btn btn-primary text-xs font-black py-4 hover:scale-105 active:scale-95 transition-all cursor-pointer">Bagikan</button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {ui.inviteModal && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-sm p-8 bg-surface-1 border border-border-main rounded-4xl shadow-2xl flex flex-col gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-400 border border-indigo-500/20">
                <Share2 size={32} />
              </div>
              <h3 className="text-xl font-black">Undang Teman</h3>
              <p className="text-sm text-text-muted mt-1">Bagikan link atau QR code ini untuk mengajak teman bergabung.</p>
            </div>

            <div className="bg-white p-4 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <QRCodeCanvas value={joinLink} size={180} />
            </div>

            <div className="flex flex-col gap-3">
              <div className="p-3 bg-surface-2 border border-border-main rounded-xl text-[10px] font-mono text-text-muted break-all">
                {joinLink}
              </div>
              <button 
                onClick={copyJoinLink}
                className="w-full btn btn-primary h-12 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all cursor-pointer group"
              >
                <Link size={16} className="mr-2 group-hover:scale-110 transition-transform" /> Copy Invite Link
              </button>
            </div>

            <button onClick={() => setUi(s => ({ ...s, inviteModal: false }))} className="w-full btn btn-glass h-12 rounded-xl text-xs font-black hover:scale-105 active:scale-95 transition-all cursor-pointer">Tutup</button>
          </div>
        </div>
      )}

      {/* Note: Scan Modal is rendered conditionally in setup screen or room if needed */}
      {/* But for this app, we only scan to JOIN, so it belongs in Setup. */}
    </div>
  );

  function renderScanModal() {
    return (
      <div className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="glass-panel w-full max-w-md p-6 bg-surface-1 border border-border-main rounded-4xl shadow-2xl flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black">Scan QR Ruangan</h3>
            <button onClick={() => setUi(s => ({ ...s, scanning: false, scanModal: false }))} className="p-2 text-text-muted hover:text-white transition-all hover:scale-125 active:scale-90 cursor-pointer">
              <X size={20} />
            </button>
          </div>

          <div className="relative aspect-square bg-black rounded-3xl overflow-hidden border border-border-main group">
            {ui.scanning ? (
              <>
                <video ref={scanVideoRef} className="w-full h-full object-cover" />
                <canvas ref={scanCanvasRef} className="hidden" />
                <div className="absolute inset-0 border-2 border-indigo-500/50 rounded-3xl pointer-events-none">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-scan-line"></div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-text-muted">
                <Camera size={48} className="opacity-20" />
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={() => {
                      setUi(s => ({ ...s, scanning: true }));
                      setForm(s => ({ ...s, scanError: null }));
                    }}
                    className="btn btn-primary px-6 h-11 rounded-xl text-xs font-black hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    Mulai Kamera
                  </button>
                  <div className="relative flex items-center w-full py-2">
                    <div className="grow border-t border-border-main"></div>
                    <span className="shrink mx-4 text-[10px] font-black uppercase tracking-widest text-text-muted/40">atau</span>
                    <div className="grow border-t border-border-main"></div>
                  </div>
                  <label className="btn btn-glass w-full h-11 rounded-xl text-xs font-black flex items-center justify-center gap-3 cursor-pointer hover:scale-105 active:scale-95 transition-all group">
                    <ImageIcon size={18} className="group-hover:scale-110 transition-transform" /> Pilih Gambar QR
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageScan} />
                  </label>
                </div>
              </div>
            )}
          </div>

          {form.scanError && (
            <div className="p-3 bg-status-danger-subtle border border-status-danger/20 rounded-xl text-status-danger text-[10px] font-bold text-center">
              {form.scanError}
            </div>
          )}

          <p className="text-center text-[10px] text-text-muted/60 px-4">Arahkan kamera ke QR Code atau unggah gambar yang berisi QR Code ruangan.</p>
        </div>
      </div>
    );
  }
}
