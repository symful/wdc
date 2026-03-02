import { create } from 'zustand';
import Peer, { DataConnection } from 'peerjs';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'system' | 'event';
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
}

export interface ChatUser {
  id: string;
  name: string;
  role: 'admin' | 'user';
  joinTime: number;
}

interface ChatState {
  peer: Peer | null;
  connections: Record<string, DataConnection>;
  messages: ChatMessage[];
  users: ChatUser[];
  currentUser: ChatUser | null;
  replyingTo: ChatMessage | null;
  roomKey: string | null;
  status: 'idle' | 'connecting' | 'connected' | 'error';
  error: string | null;

  // Actions
  initPeer: (userName: string) => Promise<string>;
  hostRoom: (userName: string) => Promise<void>;
  joinRoom: (userName: string, hostId: string) => Promise<void>;
  sendMessage: (content: string) => void;
  setReplyingTo: (msg: ChatMessage | null) => void;
  deleteMessage: (msgId: string) => void;
  renameUser: (newName: string) => void;
  kickUser: (userId: string) => void;
  leaveRoom: () => void;
  transferAdmin: (targetUserId: string) => void;
  clearMessages: () => void;
}

let heartbeatInterval: any = null;

export const useChatStore = create<ChatState>((set, get) => ({
  peer: null,
  connections: {},
  messages: [],
  users: [],
  currentUser: null,
  replyingTo: null,
  roomKey: null,
  status: 'idle',
  error: null,

  initPeer: (userName: string) => {
    return new Promise((resolve, reject) => {
      stopHeartbeat();
      const peer = new Peer({
        debug: 1
      });

      peer.on('open', (id) => {
        set({ peer, status: 'connecting' });
        resolve(id);
      });

      peer.on('error', (err) => {
        set({ error: err.message, status: 'error' });
        reject(err);
      });

      peer.on('connection', (conn) => {
        const state = get();
        if (state.currentUser?.role === 'admin') {
          handleIncomingConnection(conn);
        }
      });

      startHeartbeat();
    });
  },

  hostRoom: async (userName: string) => {
    try {
      const myId = await get().initPeer(userName);
      const newUser: ChatUser = {
        id: myId,
        name: userName,
        role: 'admin',
        joinTime: Date.now()
      };
      set({
        currentUser: newUser,
        users: [newUser],
        roomKey: myId,
        status: 'connected'
      });
    } catch (err) {
      console.error('Failed to host room:', err);
    }
  },

  joinRoom: async (userName: string, hostId: string) => {
    try {
      const myId = await get().initPeer(userName);
      const peer = get().peer!;
      const conn = peer.connect(hostId, {
        metadata: { name: userName, joinTime: Date.now() }
      });

      conn.on('open', () => {
        const newUser: ChatUser = {
          id: myId,
          name: userName,
          role: 'user',
          joinTime: Date.now()
        };
        set((state) => ({
          currentUser: newUser,
          connections: { ...state.connections, [hostId]: conn },
          roomKey: hostId,
          status: 'connected'
        }));
        
        // Setup data handling
        setupConnection(conn);
      });

      conn.on('error', (err) => {
        set({ error: 'Gagal terhubung ke host: ' + err.message, status: 'error' });
      });

    } catch (err) {
      console.error('Failed to join room:', err);
    }
  },

  sendMessage: (content: string) => {
    const state = get();
    if (!state.currentUser || !state.peer) return;

    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: state.currentUser.id,
      senderName: state.currentUser.name,
      content,
      timestamp: Date.now(),
      type: 'text',
      replyTo: state.replyingTo ? {
        id: state.replyingTo.id,
        senderName: state.replyingTo.senderName,
        content: state.replyingTo.content
      } : undefined
    };

    // Add to local state
    set((state) => ({ 
      messages: [...state.messages, newMessage],
      replyingTo: null 
    }));

    // Broadcast
    broadcast({ type: 'chat', message: newMessage });
  },

  setReplyingTo: (msg: ChatMessage | null) => set({ replyingTo: msg }),

  deleteMessage: (msgId: string) => {
    const state = get();
    if (state.currentUser?.role !== 'admin') return;

    set(s => ({ messages: s.messages.filter(m => m.id !== msgId) }));
    broadcast({ type: 'delete_message', messageId: msgId });
  },

  renameUser: (newName: string) => {
    const state = get();
    if (!state.currentUser || !newName.trim()) return;

    const oldName = state.currentUser.name;
    const updatedUser = { ...state.currentUser, name: newName };

    set(s => ({
      currentUser: updatedUser,
      users: s.users.map(u => u.id === updatedUser.id ? updatedUser : u)
    }));

    const eventMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: 'system',
      senderName: 'Sistem',
      content: `${oldName} mengganti nama menjadi ${newName}`,
      timestamp: Date.now(),
      type: 'event'
    };

    set(s => ({ messages: [...s.messages, eventMsg] }));
    broadcast({ type: 'user_rename', userId: state.currentUser.id, newName });
    broadcast({ type: 'chat', message: eventMsg });
  },

  kickUser: (userId: string) => {
    const state = get();
    if (state.currentUser?.role !== 'admin') return;

    const conn = state.connections[userId];
    if (conn) {
      conn.send({ type: 'kicked' });
      conn.close();
    }
    handleDisconnection(userId);
  },

  leaveRoom: () => {
    stopHeartbeat();
    const { peer, connections } = get();
    Object.values(connections).forEach(conn => conn.close());
    if (peer) peer.destroy();
    set({
      peer: null,
      connections: {},
      messages: [],
      users: [],
      currentUser: null,
      replyingTo: null,
      roomKey: null,
      status: 'idle'
    });
  },

  transferAdmin: (targetUserId: string) => {
    const { currentUser, connections } = get();
    if (currentUser?.role !== 'admin') return;

    // Send promotion message to everyone
    Object.values(connections).forEach(conn => {
      conn.send({ type: 'admin_transfer', newAdminId: targetUserId });
    });

    // Update local state temporarily, or let the loop handle it
    // In a star topology, if I transfer admin, I essentially become a client of the new host?
    // User request says "Admin can manually move admin".
    // This is tricky in star topology. If I move admin, everyone needs to reconnect to the new admin.
    
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, role: 'user' } : null,
      users: state.users.map(u => u.id === targetUserId ? { ...u, role: 'admin' } : (u.id === state.currentUser?.id ? { ...u, role: 'user' } : u))
    }));
  },

  clearMessages: () => set({ messages: [] })
}));

// Helper functions for internal logic
function setupConnection(conn: DataConnection) {
  conn.on('data', (data: any) => {
    const state = useChatStore.getState();
    const { type } = data;

    if (type === 'chat') {
      useChatStore.setState((s) => ({ messages: [...s.messages, data.message] }));
      
      // If I am admin, relay to everyone else
      if (state.currentUser?.role === 'admin') {
        Object.keys(state.connections).forEach(id => {
          if (id !== data.message.senderId) {
            state.connections[id].send(data);
          }
        });
      }
    } else if (type === 'sync_users') {
      useChatStore.setState({ users: data.users });
    } else if (type === 'admin_transfer') {
      // Reconnect logic or just update role
      if (state.currentUser?.id === data.newAdminId) {
        promoteToAdmin();
      } else {
        useChatStore.setState((s) => ({
          users: s.users.map(u => u.id === data.newAdminId ? { ...u, role: 'admin' } : (u.role === 'admin' ? { ...u, role: 'user' } : u))
        }));
      }
    } else if (type === 'delete_message') {
      useChatStore.setState((s) => ({ messages: s.messages.filter(m => m.id !== data.messageId) }));
    } else if (type === 'user_rename') {
      useChatStore.setState((s) => ({
        users: s.users.map(u => u.id === data.userId ? { ...u, name: data.newName } : u)
      }));
    } else if (type === 'kicked') {
      useChatStore.getState().leaveRoom();
      useChatStore.setState({ error: 'Anda telah dikeluarkan dari ruangan oleh Admin.', status: 'error' });
    } else if (type === 'pong') {
      // Heartbeat received
    }
  });

  conn.on('close', () => {
    handleDisconnection(conn.peer);
  });
}

function handleIncomingConnection(conn: DataConnection) {
  conn.on('open', () => {
    const state = useChatStore.getState();
    const newUser: ChatUser = {
      id: conn.peer,
      name: conn.metadata.name || 'Anonymous',
      role: 'user',
      joinTime: conn.metadata.joinTime || Date.now()
    };

    useChatStore.setState((s) => {
      const updatedUsers = [...s.users, newUser];
      const updatedConnections = { ...s.connections, [conn.peer]: conn };
      
      // Sync users list to all participants
      Object.values(updatedConnections).forEach(c => {
        c.send({ type: 'sync_users', users: updatedUsers });
      });

      // System message
      const systemMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        senderId: 'system',
        senderName: 'Sistem',
        content: `${newUser.name} bergabung ke ruangan`,
        timestamp: Date.now(),
        type: 'system'
      };

      // Broadcast system message
      Object.values(updatedConnections).forEach(c => {
        c.send({ type: 'chat', message: systemMsg });
      });

      return {
        users: updatedUsers,
        connections: updatedConnections,
        messages: [...s.messages, systemMsg]
      };
    });

    setupConnection(conn);
  });
}

function handleDisconnection(peerId: string) {
  const state = useChatStore.getState();
  const disconnectedUser = state.users.find(u => u.id === peerId);
  
  useChatStore.setState((s) => {
    const updatedUsers = s.users.filter(u => u.id !== peerId);
    const { [peerId]: removed, ...remainingConnections } = s.connections;

    const systemMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: 'system',
      senderName: 'Sistem',
      content: `${disconnectedUser?.name || 'Seseorang'} keluar dari ruangan`,
      timestamp: Date.now(),
      type: 'system'
    };

    // If I am admin, sync updated list
    if (s.currentUser?.role === 'admin') {
      Object.values(remainingConnections).forEach(c => {
        c.send({ type: 'sync_users', users: updatedUsers });
        c.send({ type: 'chat', message: systemMsg });
      });
    }

    return {
      users: updatedUsers,
      connections: remainingConnections,
      messages: [...s.messages, systemMsg]
    };
  });

  // Election Logic: If the host (admin) disconnected
  if (disconnectedUser?.role === 'admin') {
    handleHostMigration(state);
  }
}

function handleHostMigration(oldState: any) {
  const state = useChatStore.getState();
  if (state.users.length === 0) return;

  // Find oldest user
  const sortedUsers = [...state.users].sort((a, b) => a.joinTime - b.joinTime);
  const nextAdmin = sortedUsers[0];

  if (state.currentUser?.id === nextAdmin.id) {
    promoteToAdmin();
  } else {
    // Wait for the new admin to establish then reconnect
    // Since we don't have a stable ID, the new admin MUST use their existing ID
    // and others must connect to them.
    useChatStore.setState({ status: 'connecting', error: `Host keluar. Mencoba menyambung ke host baru: ${nextAdmin.name}...` });
    
    // We delay slightly to allow new admin to setup listeners
    setTimeout(() => {
      const innerState = useChatStore.getState();
      if (innerState.peer) {
        const conn = innerState.peer.connect(nextAdmin.id, {
          metadata: { name: innerState.currentUser?.name, joinTime: innerState.currentUser?.joinTime }
        });
        conn.on('open', () => {
          useChatStore.setState(s => ({
            connections: { [nextAdmin.id]: conn },
            roomKey: nextAdmin.id,
            status: 'connected',
            error: null
          }));
          setupConnection(conn);
        });
      }
    }, 2000);
  }
}

function promoteToAdmin() {
  const state = useChatStore.getState();
  const updatedUser: ChatUser = { ...state.currentUser!, role: 'admin' };
  
  useChatStore.setState({
    currentUser: updatedUser,
    users: state.users.map(u => u.id === updatedUser.id ? updatedUser : { ...u, role: 'user' }),
    roomKey: updatedUser.id,
    connections: {} // Clear old client connections as I am now the server
  });

  // System message
  const systemMsg: ChatMessage = {
    id: Math.random().toString(36).substr(2, 9),
    senderId: 'system',
    senderName: 'Sistem',
    content: `Anda sekarang adalah Admin Ruangan. Menunggu peserta lain untuk menyambung kembali...`,
    timestamp: Date.now(),
    type: 'event'
  };
  
  useChatStore.setState(s => ({ messages: [...s.messages, systemMsg] }));
}

function broadcast(data: any) {
  const state = useChatStore.getState();
  if (state.currentUser?.role === 'admin') {
    Object.values(state.connections).forEach(conn => conn.send(data));
  } else {
    const hostConn = Object.values(state.connections)[0];
    if (hostConn) hostConn.send(data);
  }
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatInterval = setInterval(() => {
    const state = useChatStore.getState();
    Object.values(state.connections).forEach(conn => {
      try {
        conn.send({ type: 'ping' });
      } catch (err) {
        handleDisconnection(conn.peer);
      }
    });
  }, 10000);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}
