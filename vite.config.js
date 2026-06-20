import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // GitHub Pages 프로젝트 사이트는 루트가 아닌 서브 경로(/conference_ticket_generator/)에 배포되므로 base 지정 필요
  // (GitHub Pages project sites are served from a sub-path, not the domain root, so base must match the repo name)
  base: '/conference_ticket_generator/',
  plugins: [
    tailwindcss(),
  ],
});
