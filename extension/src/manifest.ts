import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'ALT-DEV TOOLS',
  description:
    'A powerful sidebar DevTools alternative — Elements, Console, Network, Sources & Application panels right in your browser sidebar',
  version: '1.0.2',
  permissions: ['activeTab', 'scripting', 'sidePanel', 'tabs', 'cookies', 'debugger', 'storage'],
  host_permissions: ['<all_urls>'],
  action: {
    default_icon: {
      '16': 'icons/16.png',
      '32': 'icons/32.png',
      '48': 'icons/48.png',
      '128': 'icons/128.png',
    },
  },
  icons: {
    '16': 'icons/16.png',
    '32': 'icons/32.png',
    '48': 'icons/48.png',
    '64': 'icons/64.png',
    '128': 'icons/128.png',
    '256': 'icons/256.png',
  },
  side_panel: {
    default_path: 'src/panel/panel.html',
  },
  externally_connectable: {
    matches: ['https://altdevtools.codingfrontend.in/*'],
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/page-hooks.ts'],
      run_at: 'document_start',
      all_frames: false,
      world: 'MAIN',
    },
    {
      matches: ['<all_urls>'],
      js: ['src/content/content-script.ts'],
      run_at: 'document_start',
      all_frames: false,
    },
    {
      matches: ['https://altdevtools.codingfrontend.in/payment/success*'],
      js: ['src/content/auto-activate.ts'],
      run_at: 'document_idle',
      all_frames: false,
    },
  ],
});
