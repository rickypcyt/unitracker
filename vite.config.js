import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@chakra-ui/react',
      '@chakra-ui/react/modal',
      '@chakra-ui/react/button'
    ]
  }
});