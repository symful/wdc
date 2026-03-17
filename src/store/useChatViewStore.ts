import { create } from 'zustand';

interface ChatUIState {
  sidebar: boolean;
  shareModal: boolean;
  scanModal: boolean;
  inviteModal: boolean;
  scanning: boolean;
  renaming: boolean;
}

interface ChatFormState {
  userName: string;
  inputText: string;
  newName: string;
  scanError: string | null;
}

interface FileShareState {
  file: File | null;
  mode: 'instant' | 'on-waiting';
}

interface ChatViewState {
  ui: ChatUIState;
  form: ChatFormState;
  fileShare: FileShareState;
  newTaskText: string;
  sidebarTab: 'members' | 'tasks' | 'progress';

  // Actions
  setUi: (updates: Partial<ChatUIState> | ((s: ChatUIState) => Partial<ChatUIState>)) => void;
  setForm: (updates: Partial<ChatFormState> | ((s: ChatFormState) => Partial<ChatFormState>)) => void;
  setFileShare: (updates: Partial<FileShareState> | ((s: FileShareState) => Partial<FileShareState>)) => void;
  setNewTaskText: (text: string) => void;
  setSidebarTab: (tab: ChatViewState['sidebarTab']) => void;
  reset: () => void;
}

const initialUi: ChatUIState = {
  sidebar: false,
  shareModal: false,
  scanModal: false,
  inviteModal: false,
  scanning: false,
  renaming: false,
};

const initialForm: ChatFormState = {
  userName: '',
  inputText: '',
  newName: '',
  scanError: null,
};

const initialFileShare: FileShareState = {
  file: null,
  mode: 'instant',
};

export const useChatViewStore = create<ChatViewState>((set) => ({
  ui: initialUi,
  form: initialForm,
  fileShare: initialFileShare,
  newTaskText: '',
  sidebarTab: 'members',

  setUi: (updates) => set((state) => ({
    ui: {
      ...state.ui,
      ...(typeof updates === 'function' ? updates(state.ui) : updates)
    }
  })),
  setForm: (updates) => set((state) => ({
    form: {
      ...state.form,
      ...(typeof updates === 'function' ? updates(state.form) : updates)
    }
  })),
  setFileShare: (updates) => set((state) => ({
    fileShare: {
      ...state.fileShare,
      ...(typeof updates === 'function' ? updates(state.fileShare) : updates)
    }
  })),
  setNewTaskText: (newTaskText) => set({ newTaskText }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  reset: () => set({
    ui: initialUi,
    form: initialForm,
    fileShare: initialFileShare,
    newTaskText: '',
    sidebarTab: 'members',
  }),
}));
