import type { Plugin } from 'vite';
import {
  copyFonts,
  copyFontAwesome,
  copyBootstrapJs,
  processImages,
  copyContainers,
} from './utils.js';

export function postBuild(): Plugin {
  return {
    name: 'dnn-post-build',

    closeBundle() {
      console.log('\n🔧 Running post-build tasks...\n');

      try {
        copyFonts();
        copyFontAwesome();
        copyBootstrapJs();
        processImages();
        copyContainers();

        console.log('\n✅ Post-build tasks complete!\n');
      } catch (error) {
        console.error('\n❌ Post-build tasks failed:', error);
        throw error;
      }
    },
  };
}