import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BLOG_DIRS = [
  join(__dirname, '../src/content/blog/en'),
  join(__dirname, '../src/content/blog/zh'),
];

async function updateImageRefs() {
  for (const dir of BLOG_DIRS) {
    try {
      const files = await readdir(dir);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = join(dir, file);
        let content = await readFile(filePath, 'utf-8');

        // Update image references
        content = content.replace(
          /!\[(.*?)\]\((.*?)\)/g,
          (match, alt, path) => {
            // If it's already an absolute path or URL, leave it as is
            if (path.startsWith('/') || path.startsWith('http')) {
              return match;
            }

            // If it's a relative path starting with ../assets, update it
            if (path.includes('assets/')) {
              const newPath = path.replace('../assets/', '/src/assets/');
              return `![${alt}](${newPath})`;
            }

            // For other relative paths, assume they're in assets
            return `![${alt}](/src/assets/images/${path})`;
          },
        );

        // Update HTML img tags
        content = content.replace(
          /<img[^>]*src=["'](.*?)["'][^>]*>/g,
          (match, path) => {
            // If it's already an absolute path or URL, leave it as is
            if (path.startsWith('/') || path.startsWith('http')) {
              return match;
            }

            // If it's a relative path starting with ../assets, update it
            if (path.includes('assets/')) {
              const newPath = path.replace('../assets/', '/src/assets/');
              return match.replace(path, newPath);
            }

            // For other relative paths, assume they're in assets
            return match.replace(path, `/src/assets/images/${path}`);
          },
        );

        await writeFile(filePath, content, 'utf-8');
        console.log(`Updated image references in ${file}`);
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log(`Directory ${dir} does not exist, skipping...`);
      } else {
        throw err;
      }
    }
  }
}

updateImageRefs().catch(console.error);
