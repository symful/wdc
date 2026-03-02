import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  resolve: {
    alias: [
      // React and its subpaths
      { find: /^react$/, replacement: 'https://esm.sh/react@19.2.0' },
      { find: /^react\/jsx-dev-runtime$/, replacement: 'https://esm.sh/react@19.2.0/jsx-dev-runtime' },
      { find: /^react\/jsx-runtime$/, replacement: 'https://esm.sh/react@19.2.0/jsx-runtime' },
      
      // React DOM and its subpaths
      { find: /^react-dom$/, replacement: 'https://esm.sh/react-dom@19.2.0' },
      { find: /^react-dom\/client$/, replacement: 'https://esm.sh/react-dom@19.2.0/client' },
      
      // Zustand and its subpaths
      { find: /^zustand$/, replacement: 'https://esm.sh/zustand@4.5.2?deps=react@19.2.0' },
      { find: /^zustand\/(.*)$/, replacement: 'https://esm.sh/zustand@4.5.2/$1?deps=react@19.2.0' },
      
      // Lucide React - FIXED TYPO
      { find: /^lucide-react$/, replacement: 'https://esm.sh/lucide-react@0.576.0?deps=react@19.2.0' },
      { find: /^lucide-react\/(.*)$/, replacement: 'https://esm.sh/lucide-react@0.576.0/$1?deps=react@19.2.0' },
      
      // React Router DOM
      { find: /^react-router-dom$/, replacement: 'https://esm.sh/react-router-dom@6.22.3?deps=react@19.2.0,react-dom@19.2.0' },
      
      // Hello Pangea DND
      { find: /^@hello-pangea\/dnd$/, replacement: 'https://esm.sh/@hello-pangea/dnd@16.5.0?deps=react@19.2.0,react-dom@19.2.0' },
      
      // PeerJS
      { find: /^peerjs$/, replacement: 'https://esm.sh/peerjs@1.5.2' }
    ]
  },
  build: {
    rollupOptions: {
      external: [
        'react', 
        'react/jsx-dev-runtime',
        'react/jsx-runtime',
        'react-dom', 
        'react-dom/client', 
        'zustand', 
        'zustand/middleware',
        'lucide-react',
        'react-router-dom',
        '@hello-pangea/dnd',
        'peerjs'
      ],
      output: {
        // THIS IS CRITICAL FOR BUILD MODE
        format: 'es',
        paths: {
          'react': 'https://esm.sh/react@19.2.0',
          'react/jsx-dev-runtime': 'https://esm.sh/react@19.2.0/jsx-dev-runtime',
          'react/jsx-runtime': 'https://esm.sh/react@19.2.0/jsx-runtime',
          'react-dom': 'https://esm.sh/react-dom@19.2.0',
          'react-dom/client': 'https://esm.sh/react-dom@19.2.0/client',
          'zustand': 'https://esm.sh/zustand@4.5.2?deps=react@19.2.0',
          'zustand/middleware': 'https://esm.sh/zustand@4.5.2/middleware?deps=react@19.2.0',
          'lucide-react': 'https://esm.sh/lucide-react@0.576.0?deps=react@19.2.0',
          'react-router-dom': 'https://esm.sh/react-router-dom@6.22.3?deps=react@19.2.0,react-dom@19.2.0',
          '@hello-pangea/dnd': 'https://esm.sh/@hello-pangea/dnd@16.5.0?deps=react@19.2.0,react-dom@19.2.0',
          'peerjs': 'https://esm.sh/peerjs@1.5.2'
        }
      }
    },
    // Ensure module preload is disabled for external deps
    modulePreload: false
  }
})