import { useEffect, useRef, useCallback } from "react";
import { useChatStore } from "../../store/useChatStore";
import { translations, useLanguageStore } from "../../store/useLanguageStore";
import { useChatViewStore } from "../../store/useChatViewStore";
import {
  Ban,
  Camera,
  Check,
  Clock,
  Download,
  Edit2,
  FileText,
  ImageIcon,
  Info,
  Link,
  ListChecks,
  LogOut,
  Maximize2,
  MessageSquare,
  Paperclip,
  Plus,
  QrCode,
  Reply,
  Send,
  Share2,
  ShieldCheck,
  Trash2,
  Trophy,
  Upload,
  Users,
  X,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import jsQR from "jsqr";

export function ChatView() {
  const {
    currentUser,
    users,
    messages,
    status,
    error,
    roomKey,
    replyingTo,
    hostRoom,
    joinRoom,
    sendMessage,
    leaveRoom,
    deleteMessage,
    renameUser,
    kickUser,
    setReplyingTo,
    sharedTasks,
    addSharedTask: storeAddSharedTask,
    toggleSharedTask,
    removeSharedTask,
    transferAdmin,
  } = useChatStore();

  const { language } = useLanguageStore();
  const t = translations[language];

  const {
    ui,
    form,
    fileShare,
    newTaskText,
    sidebarTab,
    setUi,
    setForm,
    setFileShare,
    setNewTaskText,
    setSidebarTab,
  } = useChatViewStore();

  const addSharedTask = () => {
    if (!newTaskText.trim()) return;
    storeAddSharedTask(newTaskText.trim());
    setNewTaskText("");
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanVideoRef = useRef<HTMLVideoElement>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement>(null);

  const joinLink =
    `${window.location.origin}${window.location.pathname}?join=${roomKey}`;

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, scrollRef]);

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
      } catch {
        console.error("Invalid keyroom file");
      }
    };
    reader.readAsText(file);
  };

  const handleExportKey = () => {
    if (!roomKey) return;
    const data = {
      roomKey,
      hostName: currentUser?.name,
      timestamp: Date.now(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Keyroom_ontime!_${roomKey.slice(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSend = () => {
    if (!form.inputText.trim()) return;
    sendMessage(form.inputText.trim());
    setForm((s) => ({ ...s, inputText: "" }));
  };

  const handleRename = () => {
    if (!form.newName.trim() || form.newName === currentUser?.name) {
      setUi((s) => ({ ...s, renaming: false }));
      return;
    }
    renameUser(form.newName.trim());
    setUi((s) => ({ ...s, renaming: false }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileShare((s) => ({ ...s, file }));
      setUi((s) => ({ ...s, shareModal: true }));
    }
  };

  const confirmFileShare = () => {
    if (fileShare.file) {
      const { sendFile } = useChatStore.getState();
      sendFile(fileShare.file, fileShare.mode);
      setFileShare((s) => ({ ...s, file: null }));
      setUi((s) => ({ ...s, shareModal: false }));
    }
  };

  const handleDownload = (msgId: string) => {
    const { messages, requestFile } = useChatStore.getState();
    const msg = messages.find((m) => m.id === msgId);
    if (!msg || !msg.file) return;

    if (msg.file.data) {
      const link = document.createElement("a");
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

  const handleScanSuccess = useCallback((data: string) => {
    try {
      const url = new URL(data);
      const key = url.searchParams.get("join");
      if (key) {
        joinRoom(form.userName || "User", key);
        setUi((s) => ({ ...s, scanning: false, scanModal: false }));
      } else {
        setForm((s) => ({ ...s, scanError: t.chat.invalidQr }));
      }
    } catch {
      // Direct key scan
      if (data.length > 10) {
        joinRoom(form.userName || "User", data);
        setUi((s) => ({ ...s, scanning: false, scanModal: false }));
      } else {
        setForm((s) => ({ ...s, scanError: t.chat.unknownQr }));
      }
    }
  }, [joinRoom, form.userName, setUi, setForm, t.chat]);

  // Camera Scan logic
  useEffect(() => {
    let animationFrameId: number;
    let stream: MediaStream | null = null;

    const scan = () => {
      if (scanVideoRef.current && scanCanvasRef.current && ui.scanning) {
        const video = scanVideoRef.current;
        const canvas = scanCanvasRef.current;
        const ctx = canvas.getContext("2d");

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx?.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );

          if (imageData) {
            const code = jsQR(
              imageData.data,
              imageData.width,
              imageData.height,
              {
                inversionAttempts: "dontInvert",
              },
            );

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
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (scanVideoRef.current) {
          scanVideoRef.current.srcObject = stream;
          scanVideoRef.current.setAttribute("playsinline", "true");
          scanVideoRef.current.play();
          requestAnimationFrame(scan);
        }
      } catch {
        setForm((s) => ({ ...s, scanError: t.chat.scanError }));
      }
    };

    if (ui.scanning) {
      startCamera();
    } else {
      if (stream) {
        (stream as MediaStream).getTracks().forEach((track) => track.stop());
      }
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) {
        (stream as MediaStream).getTracks().forEach((track) => track.stop());
      }
    };
  }, [ui.scanning, handleScanSuccess, setForm, t.chat.scanError]);

  const handleImageScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        if (imageData) {
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            handleScanSuccess(code.data);
          } else {
            setForm((s) => ({ ...s, scanError: t.chat.noQrFound }));
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
    const joinKey = params.get("join");
    if (joinKey && status === "idle" && form.userName.trim()) {
      // If we have a name and a key, we can auto-join if the user clicks the "Join" button
      // which we'll update below.
    }
  }, [form.userName, status]);

  // Setup Screen
  if (status === "idle" || status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4 py-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-neon-cyan/10 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 border border-neon-cyan/20 shadow-[0_0_30px_rgba(0,240,255,0.1)]">
            <MessageSquare size={32} className="text-neon-cyan md:hidden" />
            <MessageSquare
              size={40}
              className="text-neon-cyan hidden md:block"
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 neon-glow-text font-display">
            {t.chat.title}
          </h1>
          <p className="text-text-muted text-sm md:text-lg max-w-md mx-auto">
            {t.chat.subtitle}
          </p>
        </div>

        {error && (
          <div className="px-6 py-3 bg-status-danger-subtle border border-status-danger/20 rounded-2xl text-status-danger text-sm font-bold flex items-center gap-3">
            <Info size={18} /> {error}
          </div>
        )}

        <div className="game-panel p-6 md:p-8 w-full max-w-md flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 px-1">
              {t.chat.displayNameLabel}
            </label>
            <input
              type="text"
              className="w-full h-12 md:h-14 bg-surface-2 border border-neon-cyan/10 rounded-xl md:rounded-2xl px-5 font-bold focus:ring-2 focus:ring-neon-cyan/30 outline-none transition-all"
              placeholder={t.chat.displayNamePlaceholder}
              value={form.userName}
              onChange={(e) =>
                setForm((s) => ({ ...s, userName: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 mt-2">
            <button
              className={`btn h-12 md:h-14 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl group font-display
                ${
                !form.userName.trim()
                  ? "bg-surface-2 text-text-muted cursor-not-allowed"
                  : "btn-primary hover:scale-105"
              }`}
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                const joinKey = params.get("join");
                if (joinKey) {
                  joinRoom(form.userName.trim(), joinKey);
                } else {
                  handleHost();
                }
              }}
              disabled={!form.userName.trim()}
            >
              {new URLSearchParams(window.location.search).get("join")
                ? (
                  <>
                    <Link
                      size={20}
                      className="group-hover:scale-110 transition-transform"
                    />{" "}
                    {t.chat.joinGuildBtn}
                  </>
                )
                : (
                  <>
                    <ShieldCheck
                      size={20}
                      className="group-hover:scale-110 transition-transform"
                    />{" "}
                    {t.chat.createGuildBtn}
                  </>
                )}
            </button>

            <div className="relative flex items-center py-2">
              <div className="grow border-t border-border-main"></div>
              <span className="shrink mx-4 text-[10px] font-black uppercase tracking-widest text-text-muted/40">
                {t.chat.or}
              </span>
              <div className="grow border-t border-border-main"></div>
            </div>

            <label
              className={`btn h-12 md:h-14 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-3 transition-all cursor-pointer transform active:scale-95 shadow-xl border border-neon-cyan/10 hover:border-neon-cyan/30 group
               ${
                !form.userName.trim()
                  ? "bg-surface-2 text-text-muted opacity-50 cursor-not-allowed"
                  : "bg-surface-1 hover:bg-surface-2 hover:scale-105"
              }`}
            >
              <Upload
                size={20}
                className="group-hover:scale-110 transition-transform"
              />{" "}
              {t.chat.joinViaFile}
              <input
                type="file"
                className="hidden"
                accept=".json"
                onChange={handleJoinFile}
                disabled={!form.userName.trim()}
              />
            </label>

            <button
              className={`btn h-12 md:h-14 rounded-xl md:rounded-2xl font-black flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl border border-neon-cyan/10 hover:border-neon-cyan/30 group
                ${
                !form.userName.trim()
                  ? "bg-surface-2 text-text-muted opacity-50 cursor-not-allowed"
                  : "bg-surface-1 hover:bg-surface-2 hover:scale-105"
              }`}
              onClick={() =>
                form.userName.trim() &&
                setUi((s) => ({ ...s, scanModal: true }))}
              disabled={!form.userName.trim()}
            >
              <QrCode
                size={20}
                className="group-hover:scale-110 transition-transform"
              />{" "}
              {t.chat.scanQrBtn}
            </button>
          </div>
        </div>

        {/* Setup Screen Modals */}
        {ui.scanModal && renderScanModal()}
      </div>
    );
  }

  // Connecting Screen
  if (status === "connecting") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-500 text-center">
        <div className="w-16 h-16 border-4 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin shadow-[0_0_20px_rgba(0,240,255,0.15)]">
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight mb-1 font-display neon-cyan-text">
            {t.chat.connectingTitle}
          </h2>
          <p className="text-text-muted text-sm font-medium">
            {t.chat.connectingDesc}
          </p>
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
          <div className="w-10 h-10 md:w-12 md:h-12 bg-neon-cyan/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-neon-cyan/20 shrink-0">
            <Users size={20} className="text-neon-cyan md:hidden" />
            <Users size={24} className="text-neon-cyan hidden md:block" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-black tracking-tight truncate font-display">
                {t.chat.guildChamber}
              </h2>
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest px-1.5 md:px-2 py-0.5 bg-neon-green/8 text-neon-green rounded-md border border-neon-green/20 shrink-0 font-display">
                {t.chat.onlineStatus}
              </span>
            </div>
            <p className="text-[10px] md:text-xs font-bold text-text-muted/60">
              {t.chat.connectedMembers(users.length)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button
            className="btn btn-glass h-9 md:h-11 px-3 md:px-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-neon-cyan/10 hover:border-neon-cyan/30 hover:scale-105 active:scale-95 transition-all font-display"
            onClick={handleExportKey}
            title="Export Keyroom"
          >
            <Download
              size={14}
              className="text-neon-cyan md:hidden cursor-pointer hover:scale-110 active:scale-90 transition-all"
            />
            <Download
              size={16}
              className="text-neon-cyan hidden md:block cursor-pointer hover:scale-110 active:scale-90 transition-all"
            />
            <span className="hidden sm:inline ml-1.5">{t.chat.exportKey}</span>
          </button>
          <button
            className="btn h-9 md:h-11 px-3 md:px-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-status-danger-subtle text-status-danger border border-status-danger/20 hover:bg-status-danger/20 hover:scale-105 active:scale-95 transition-all"
            onClick={leaveRoom}
            title={t.chat.exit}
          >
            <LogOut
              size={14}
              className="md:hidden cursor-pointer hover:scale-110 active:scale-90 transition-all"
            />
            <LogOut
              size={16}
              className="hidden md:block cursor-pointer hover:scale-110 active:scale-90 transition-all"
            />
            <span className="hidden sm:inline ml-1.5">{t.chat.exit}</span>
          </button>

          <button
            className="lg:hidden btn btn-glass h-9 px-3 border-neon-cyan/20 text-neon-cyan hover:scale-110 active:scale-90 transition-all"
            onClick={() => setUi((s) => ({ ...s, sidebar: !s.sidebar }))}
          >
            <Users
              size={16}
              className="cursor-pointer hover:scale-110 transition-all"
            />
          </button>

          <button
            className="btn btn-glass h-9 px-3 border-neon-cyan/20 text-neon-cyan hover:scale-125 active:scale-90 transition-all cursor-pointer"
            onClick={() => setUi((s) => ({ ...s, inviteModal: true }))}
            title="Invite Friends"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 md:gap-6 overflow-hidden relative">
        {/* Participants Sidebar (Desktop & Mobile Overlay) */}
        <div
          className={`
          game-panel w-72 flex-col p-6 shrink-0
          lg:flex shadow-2xl transition-all duration-300
          ${
            ui.sidebar
              ? "fixed inset-y-20 right-4 z-50 flex animate-in slide-in-from-right-full"
              : "hidden lg:flex"
          }
        `}
        >
          <div className="flex flex-col gap-6 mb-8 shrink-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-text-muted/40 flex items-center justify-between font-display">
              {t.chat.myProfile}
              <ShieldCheck
                size={12}
                className={currentUser?.role === "admin"
                  ? "text-neon-cyan"
                  : "text-text-muted/20"}
              />
            </div>

            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 flex items-center justify-center font-black text-sm text-neon-cyan border border-neon-cyan/20 shrink-0">
                {currentUser?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                {ui.renaming
                  ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        className="bg-surface-2 border border-neon-cyan/50 rounded-lg px-2 py-1 text-xs font-bold w-full outline-none"
                        value={form.newName}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, newName: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && handleRename()}
                      />
                      <button
                        onClick={handleRename}
                        className="text-neon-green hover:scale-125 active:scale-90 transition-all"
                      >
                        <Check
                          size={14}
                          className="cursor-pointer transition-all"
                        />
                      </button>
                    </div>
                  )
                  : (
                    <div className="flex items-center justify-between group/name">
                      <div className="text-sm font-bold truncate">
                        {currentUser?.name}
                      </div>
                      <button
                        onClick={() => {
                          setUi((s) => ({ ...s, renaming: true }));
                          setForm((s) => ({
                            ...s,
                            newName: currentUser?.name || "",
                          }));
                        }}
                        className="opacity-0 group-hover/name:opacity-100 p-1 text-text-muted/40 hover:text-neon-cyan transition-all hover:scale-110 active:scale-90"
                      >
                        <Edit2
                          size={12}
                          className="cursor-pointer transition-all"
                        />
                      </button>
                    </div>
                  )}
                <div className="text-[9px] font-black uppercase tracking-tighter text-text-muted/40 font-display">
                  {currentUser?.role === "admin"
                    ? t.chat.guildMaster
                    : t.chat.partyMember}
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-black uppercase tracking-widest text-text-muted/40 mb-6 flex items-center justify-between shrink-0 font-display">
            {t.chat.participantsTitle} ({users.length})
            <Users size={12} />
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-white/10">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-2 p-3 rounded-xl bg-surface-2 border border-neon-cyan/10 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shrink-0 ${
                        user.role === "admin"
                          ? "bg-neon-cyan/80 shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                          : "bg-surface-subtle border border-neon-cyan/10 text-text-muted"
                      }`}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold flex items-center gap-1.5 truncate">
                        {user.name}
                        {user.role === "admin" && (
                          <ShieldCheck size={10} className="text-neon-cyan" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {(currentUser?.role === "admin" ||
                  user.id === currentUser?.id) &&
                  user.id !== currentUser.id && (
                  <div className="flex items-center gap-2 max-h-0 group-hover:max-h-12 opacity-0 group-hover:opacity-100 transition-all duration-300 overflow-hidden">
                    {currentUser?.role === "admin" && (
                      <>
                        <button
                          className="flex-1 p-1.5 text-[8px] font-black uppercase tracking-tighter bg-neon-cyan/10 text-neon-cyan rounded-lg hover:bg-neon-cyan/20 hover:scale-110 active:scale-95 transition-all font-display"
                          onClick={() => transferAdmin(user.id)}
                        >
                          Admin
                        </button>
                        <button
                          className="p-1.5 text-status-danger bg-status-danger-subtle rounded-lg hover:bg-status-danger/20 hover:scale-110 active:scale-95 transition-all"
                          onClick={() => kickUser(user.id)}
                          title="Kick User"
                        >
                          <Ban
                            size={12}
                            className="cursor-pointer transition-all"
                          />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 border-t border-white/5 pt-4 mt-4 shrink-0">
            <button
              onClick={() => setSidebarTab("members")}
              className={`flex-1 px-2 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all font-display ${
                sidebarTab === "members"
                  ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
                  : "text-text-muted/40 hover:text-text-muted/60"
              }`}
            >
              <Users size={14} className="mx-auto mb-1" />
              Members
            </button>
            <button
              onClick={() => setSidebarTab("tasks")}
              className={`flex-1 px-2 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all font-display ${
                sidebarTab === "tasks"
                  ? "bg-neon-green/10 text-neon-green border border-neon-green/20"
                  : "text-text-muted/40 hover:text-text-muted/60"
              }`}
            >
              <ListChecks size={14} className="mx-auto mb-1" />
              Tasks
              {sharedTasks.length > 0 && (
                <span className="ml-1 text-[7px] bg-neon-green/20 text-neon-green px-1 rounded">
                  {sharedTasks.filter((t) => !t.done).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setSidebarTab("progress")}
              className={`flex-1 px-2 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all font-display ${
                sidebarTab === "progress"
                  ? "bg-neon-gold/10 text-neon-gold border border-neon-gold/20"
                  : "text-text-muted/40 hover:text-text-muted/60"
              }`}
            >
              <Trophy size={14} className="mx-auto mb-1" />
              Progress
            </button>
          </div>

          {/* Group Tasks Panel */}
          {sidebarTab === "tasks" && (
            <div className="flex flex-col gap-3 mt-4 flex-1 overflow-y-auto">
              <div className="text-[10px] font-black uppercase tracking-widest text-text-muted/40 flex items-center justify-between font-display">
                {language === "id" ? "SHARED TASKS" : "SHARED TASKS"}
                <ListChecks size={12} className="text-neon-green" />
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-surface-2 border border-white/5 rounded-lg px-3 py-2 text-xs outline-none focus:border-neon-green/40 transition-colors"
                  placeholder={language === "id"
                    ? "Tambah task baru..."
                    : "Add new task..."}
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSharedTask()}
                />
                <button
                  onClick={addSharedTask}
                  className="p-2 bg-neon-green/10 text-neon-green border border-neon-green/20 rounded-lg hover:scale-110 active:scale-95 transition-all"
                >
                  <Plus size={14} />
                </button>
              </div>
              {sharedTasks.length === 0
                ? (
                  <div className="text-center py-6 text-text-muted/30">
                    <ListChecks size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-[10px] font-black uppercase tracking-widest font-display">
                      {language === "id" ? "Belum ada task" : "No tasks yet"}
                    </p>
                  </div>
                )
                : (
                  sharedTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                        task.done
                          ? "bg-neon-green/5 border-neon-green/10 opacity-60"
                          : "bg-surface-2 border-white/5 hover:border-neon-green/20"
                      }`}
                    >
                      <button
                        onClick={() => toggleSharedTask(task.id)}
                        className={`mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          task.done
                            ? "bg-neon-green border-neon-green text-white"
                            : "border-text-muted/20 hover:border-neon-green/50"
                        }`}
                      >
                        {task.done && <Check size={12} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-xs font-semibold ${
                            task.done
                              ? "line-through text-text-muted/40"
                              : "text-text-main"
                          }`}
                        >
                          {task.text}
                        </div>
                        <div className="text-[8px] text-text-muted/40 font-display">
                          {task.author}
                        </div>
                      </div>
                      <button
                        onClick={() => removeSharedTask(task.id)}
                        className="p-1 text-text-muted/20 hover:text-neon-red hover:scale-110 transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              {sharedTasks.length > 0 && (
                <div className="text-[9px] text-text-muted/40 text-center pt-2 border-t border-white/5 font-display">
                  {sharedTasks.filter((t) => t.done).length}/{sharedTasks
                    .length} {language === "id" ? "selesai" : "completed"}
                </div>
              )}
            </div>
          )}

          {/* Group Progress Panel */}
          {sidebarTab === "progress" && (
            <div className="flex flex-col gap-3 mt-4 flex-1 overflow-y-auto">
              <div className="text-[10px] font-black uppercase tracking-widest text-text-muted/40 flex items-center justify-between font-display">
                {language === "id" ? "AKTIVITAS GROUP" : "GROUP ACTIVITY"}
                <Trophy size={12} className="text-neon-gold" />
              </div>
              {users.map((user, i) => {
                const userMsgs = messages.filter((m) =>
                  m.senderId === user.id && m.type === "text"
                ).length;
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-white/5"
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                        i === 0
                          ? "bg-neon-gold/20 text-neon-gold"
                          : i === 1
                          ? "bg-neon-cyan/20 text-neon-cyan"
                          : "bg-surface-subtle text-text-muted/40"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">
                        {user.name}
                      </div>
                      <div className="text-[8px] text-text-muted/40 font-display">
                        {userMsgs} {language === "id" ? "pesan" : "messages"}
                      </div>
                    </div>
                    {user.role === "admin" && (
                      <ShieldCheck
                        size={12}
                        className="text-neon-cyan shrink-0"
                      />
                    )}
                  </div>
                );
              })}
              {users.length === 1 && (
                <div className="text-center py-4 text-text-muted/30">
                  <p className="text-[10px] font-black uppercase tracking-widest font-display">
                    {language === "id"
                      ? "Undang teman untuk mulai kolaborasi!"
                      : "Invite friends to start collaborating!"}
                  </p>
                </div>
              )}
            </div>
          )}

          {ui.sidebar && (
            <button
              className="mt-6 w-full lg:hidden btn btn-glass text-xs"
              onClick={() => setUi((s) => ({ ...s, sidebar: false }))}
            >
              {t.chat.close}
            </button>
          )}
        </div>

        {/* Chat Main Area */}
        <div className="flex-1 game-panel rounded-3xl md:rounded-4xl flex flex-col overflow-hidden relative shadow-2xl">
          {/* Scrollable messages */}
          <div
            ref={scrollRef}
            className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-4 md:gap-6 hide-scrollbar"
          >
            {messages.length === 0
              ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4 text-center">
                  <MessageSquare
                    size={48}
                    className="md:w-16 md:h-16 text-neon-cyan/30"
                  />
                  <p className="font-black uppercase tracking-[0.2em] text-[10px] md:text-xs font-display">
                    {t.chat.startConversation}
                  </p>
                </div>
              )
              : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1.5 ${
                      msg.type !== "text"
                        ? "items-center my-2"
                        : (msg.senderId === currentUser?.id
                          ? "items-end"
                          : "items-start")
                    }`}
                  >
                    {msg.type !== "text"
                      ? (
                        <div
                          className={`px-4 py-1.5 rounded-full border text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-center font-display ${
                            msg.type === "event"
                              ? "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20"
                              : "bg-surface-2 text-text-muted border-neon-cyan/10"
                          }`}
                        >
                          {msg.content}
                        </div>
                      )
                      : (
                        <>
                          <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-text-muted/60 mb-0.5">
                            {msg.senderName}
                            <span className="opacity-40">
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div
                            className={`group relative flex flex-col gap-1 max-w-[90%] md:max-w-[80%] ${
                              msg.senderId === currentUser?.id
                                ? "items-end"
                                : "items-start"
                            }`}
                          >
                            {msg.replyTo && (
                              <div
                                className={`px-3 py-2 rounded-xl text-[10px] md:text-[11px] font-medium border border-border-main mb-[-8px] opacity-60 flex flex-col gap-0.5 max-w-full ${
                                  msg.senderId === currentUser?.id
                                    ? "bg-white/5 mr-2"
                                    : "bg-surface-2 ml-2"
                                }`}
                              >
                                <div className="text-[8px] md:text-[9px] font-black uppercase tracking-tighter text-indigo-400">
                                  {msg.replyTo.senderName}
                                </div>
                                <div className="truncate">
                                  {msg.replyTo.content}
                                </div>
                              </div>
                            )}

                            {msg.file && (
                              <div
                                className={`mt-2 p-3 rounded-xl border flex items-center gap-4 min-w-[200px] ${
                                  msg.senderId === currentUser?.id
                                    ? "bg-white/5 border-white/10"
                                    : "bg-surface-2 border-border-main"
                                }`}
                              >
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                    msg.file.status === "completed" ||
                                      msg.file.data
                                      ? "bg-status-success-subtle text-status-success"
                                      : "bg-indigo-500/20 text-indigo-400"
                                  }`}
                                >
                                  <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold truncate">
                                    {msg.file.name}
                                  </div>
                                  <div className="text-[9px] opacity-40">
                                    {(msg.file.size / 1024).toFixed(1)} KB
                                  </div>
                                </div>

                                {msg.senderId !== currentUser?.id && (
                                  <button
                                    onClick={() => handleDownload(msg.id)}
                                    className={`p-2 rounded-lg transition-all hover:scale-110 active:scale-95 ${
                                      msg.file.status === "transferring"
                                        ? "animate-pulse text-indigo-400"
                                        : "hover:bg-indigo-500/10 text-text-muted hover:text-indigo-400"
                                    }`}
                                    disabled={msg.file.status ===
                                      "transferring"}
                                  >
                                    {msg.file.status === "transferring"
                                      ? (
                                        <Clock
                                          size={16}
                                          className="animate-spin-slow"
                                        />
                                      )
                                      : (
                                        <Download
                                          size={16}
                                          className="cursor-pointer hover:scale-110 active:scale-90 transition-all"
                                        />
                                      )}
                                  </button>
                                )}
                              </div>
                            )}

                            <div
                              className={`px-4 md:px-5 py-2.5 md:py-3.5 rounded-2xl text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                                msg.senderId === currentUser?.id
                                  ? "bg-neon-cyan/80 text-white rounded-tr-sm shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                                  : "bg-surface-subtle border border-neon-cyan/10 text-text-main rounded-tl-sm"
                              }`}
                            >
                              {msg.content}

                              <div
                                className={`absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ${
                                  msg.senderId === currentUser?.id
                                    ? "right-full mr-2"
                                    : "left-full ml-2"
                                }`}
                              >
                                <button
                                  onClick={() => setReplyingTo(msg)}
                                  className="p-1.5 md:p-2 bg-surface-2 border border-neon-cyan/10 rounded-lg md:rounded-xl text-text-muted hover:text-neon-cyan hover:scale-125 active:scale-90 transition-all shadow-xl group/reply"
                                  title="Reply"
                                >
                                  <Reply
                                    size={12}
                                    className="md:w-[14px] md:h-[14px] cursor-pointer transition-all"
                                  />
                                </button>
                                {(currentUser?.role === "admin" ||
                                  msg.senderId === currentUser?.id) && (
                                  <button
                                    onClick={() => deleteMessage(msg.id)}
                                    className="p-1.5 md:p-2 bg-surface-2 border border-neon-cyan/10 rounded-lg md:rounded-xl text-neon-red/60 hover:text-neon-red hover:scale-125 active:scale-90 transition-all shadow-xl"
                                    title={t.common.delete}
                                  >
                                    <Trash2
                                      size={12}
                                      className="md:w-[14px] md:h-[14px] cursor-pointer"
                                    />
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
                  <div className="w-1 h-6 md:h-8 bg-neon-cyan rounded-full shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-neon-cyan mb-0.5 font-display">
                      Replying to {replyingTo.senderName}
                    </div>
                    <div className="text-[10px] md:text-xs text-text-muted truncate">
                      {replyingTo.content}
                    </div>
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
            <div className="relative flex flex-col sm:block">
              <textarea
                className={`w-full bg-surface-2 border border-neon-cyan/10 pl-11 md:pl-16 pr-11 md:pr-16 py-3.5 md:py-4 text-xs md:text-sm font-medium focus:ring-2 focus:ring-neon-cyan/30 outline-none transition-all resize-none max-h-32 shadow-inner overflow-hidden ${
                  replyingTo
                    ? "rounded-b-xl md:rounded-b-2xl border-t-0"
                    : "rounded-xl md:rounded-2xl"
                }`}
                placeholder={t.chat.inputPlaceholder}
                rows={1}
                value={form.inputText}
                onChange={(e) =>
                  setForm((s) => ({ ...s, inputText: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              <button
                className={`absolute right-1.5 md:right-3 bottom-1.5 md:bottom-3 w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 ${
                  form.inputText.trim()
                    ? "bg-neon-cyan text-white shadow-glow"
                    : "bg-surface-subtle text-text-muted cursor-not-allowed"
                }`}
                onClick={handleSend}
                disabled={!form.inputText.trim()}
              >
                <Send
                  size={14}
                  className="md:w-5 md:h-5"
                  fill={form.inputText.trim() ? "currentColor" : "none"}
                />
              </button>

              <button
                className="absolute left-1.5 md:left-3 bottom-1.5 md:bottom-3 w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center bg-surface-subtle text-text-muted hover:text-neon-cyan hover:scale-110 active:scale-90 transition-all border border-neon-cyan/10"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={14} className="md:w-5 md:h-5" />
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
          <div className="game-panel w-full max-w-sm p-8 rounded-4xl flex flex-col gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-neon-cyan/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-neon-cyan border border-neon-cyan/20">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-black font-display neon-cyan-text">
                {t.chat.itemTradeTitle}
              </h3>
              <p className="text-sm text-text-muted mt-1 truncate">
                {fileShare.file?.name}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setFileShare((s) => ({ ...s, mode: "instant" }))}
                className={`p-4 rounded-2xl border flex items-center gap-4 transition-all text-left ${
                  fileShare.mode === "instant"
                    ? "bg-neon-cyan/10 border-neon-cyan/50 text-neon-cyan"
                    : "bg-surface-2 border-neon-cyan/10 text-text-muted hover:border-neon-cyan/30"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 flex items-center justify-center shrink-0">
                  <Maximize2 size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold">{t.chat.instantMode}</div>
                  <div className="text-[10px] opacity-60">
                    {t.chat.instantModeDesc}
                  </div>
                </div>
              </button>

              <button
                onClick={() =>
                  setFileShare((s) => ({ ...s, mode: "on-waiting" }))}
                className={`p-4 rounded-2xl border flex items-center gap-4 transition-all text-left ${
                  fileShare.mode === "on-waiting"
                    ? "bg-neon-gold/10 border-neon-gold/50 text-neon-gold"
                    : "bg-surface-2 border-neon-cyan/10 text-text-muted hover:border-neon-cyan/30"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-orange-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold">{t.chat.waitingMode}</div>
                  <div className="text-[10px] opacity-60">
                    {t.chat.waitingModeDesc}
                  </div>
                </div>
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setUi((s) => ({ ...s, shareModal: false }))}
                className="flex-1 btn btn-glass text-xs font-black py-4 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {t.chat.cancel}
              </button>
              <button
                onClick={confirmFileShare}
                className="flex-1 btn btn-primary text-xs font-black py-4 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {t.chat.share}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {ui.inviteModal && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="game-panel w-full max-w-sm p-8 rounded-4xl flex flex-col gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-neon-cyan/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-neon-cyan border border-neon-cyan/20">
                <Share2 size={32} />
              </div>
              <h3 className="text-xl font-black font-display neon-cyan-text">
                {t.chat.inviteTitle}
              </h3>
              <p className="text-sm text-text-muted mt-1">
                {t.chat.inviteDesc}
              </p>
            </div>

            <div className="bg-white p-4 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <QRCodeCanvas value={joinLink} size={180} />
            </div>

            <div className="flex flex-col gap-3">
              <div className="p-3 bg-surface-2 border border-neon-cyan/10 rounded-xl text-[10px] font-mono text-text-muted break-all">
                {joinLink}
              </div>
              <button
                onClick={copyJoinLink}
                className="w-full btn btn-primary h-12 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all cursor-pointer group"
              >
                <Link
                  size={16}
                  className="mr-2 group-hover:scale-110 transition-transform"
                />{" "}
                {t.chat.copyLink}
              </button>
            </div>

            <button
              onClick={() => setUi((s) => ({ ...s, inviteModal: false }))}
              className="w-full btn btn-glass h-12 rounded-xl text-xs font-black hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {t.chat.close}
            </button>
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
        <div className="game-panel w-full max-w-md p-6 rounded-4xl flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black font-display neon-cyan-text">
              {t.chat.scanQrBtn}
            </h3>
            <button
              onClick={() =>
                setUi((s) => ({ ...s, scanning: false, scanModal: false }))}
              className="p-2 text-text-muted hover:text-white transition-all hover:scale-125 active:scale-90 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative aspect-square bg-black rounded-3xl overflow-hidden border border-border-main group">
            {ui.scanning
              ? (
                <>
                  <video
                    ref={scanVideoRef}
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={scanCanvasRef} className="hidden" />
                  <div className="absolute inset-0 border-2 border-neon-cyan/50 rounded-3xl pointer-events-none">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.8)] animate-scan-line">
                    </div>
                  </div>
                </>
              )
              : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-text-muted">
                  <Camera size={48} className="opacity-20" />
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => {
                        setUi((s) => ({ ...s, scanning: true }));
                        setForm((s) => ({ ...s, scanError: null }));
                      }}
                      className="btn btn-primary px-6 h-11 rounded-xl text-xs font-black hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      {language === "id" ? "Mulai Kamera" : "Start Camera"}
                    </button>
                    <div className="relative flex items-center w-full py-2">
                      <div className="grow border-t border-border-main"></div>
                      <span className="shrink mx-4 text-[10px] font-black uppercase tracking-widest text-text-muted/40">
                        {t.chat.or}
                      </span>
                      <div className="grow border-t border-border-main"></div>
                    </div>
                    <label className="btn btn-glass w-full h-11 rounded-xl text-xs font-black flex items-center justify-center gap-3 cursor-pointer hover:scale-105 active:scale-95 transition-all group">
                      <ImageIcon
                        size={18}
                        className="group-hover:scale-110 transition-transform"
                      />{" "}
                      {language === "id"
                        ? "Pilih Gambar QR"
                        : "Choose QR Image"}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageScan}
                      />
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

          <p className="text-center text-[10px] text-text-muted/60 px-4">
            {language === "id"
              ? "Arahkan kamera ke QR Code atau unggah gambar yang berisi QR Code ruangan."
              : "Point your camera at the QR Code or upload an image containing the room QR Code."}
          </p>
        </div>
      </div>
    );
  }
}
