import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const OLD_BLOG_DIRS = [
  join(__dirname, '../../blog/src/posts'),
  join(__dirname, '../../blog/src/posts-zh_cn'),
];

const NEW_BLOG_DIRS = [
  join(__dirname, '../src/content/blog/en'),
  join(__dirname, '../src/content/blog/zh'),
];

async function getOriginalDates() {
  const dates = new Map();

  for (const dir of OLD_BLOG_DIRS) {
    try {
      const files = await readdir(dir);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const content = await readFile(join(dir, file), 'utf-8');
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        if (!match) continue;

        const frontmatter = match[1];
        const dateMatch = frontmatter.match(/date:\s*["'](.+?)["']/);
        if (dateMatch) {
          dates.set(file, dateMatch[1]);
        }
      }
    } catch (err) {
      console.error(`Error reading directory ${dir}:`, err.message);
    }
  }

  return dates;
}

async function updateDates() {
  const originalDates = await getOriginalDates();

  for (const dir of NEW_BLOG_DIRS) {
    try {
      const files = await readdir(dir);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = join(dir, file);
        const content = await readFile(filePath, 'utf-8');

        const originalDate = originalDates.get(file);
        if (!originalDate) {
          console.log(`No original date found for ${file}`);
          continue;
        }

        // Update the pubDate in the frontmatter
        const updatedContent = content.replace(
          /(pubDate:\s*)["'].*?["']/,
          `$1"${originalDate}"`,
        );

        await writeFile(filePath, updatedContent, 'utf-8');
        console.log(`Updated date for ${file} to ${originalDate}`);
      }
    } catch (err) {
      console.error(`Error processing directory ${dir}:`, err.message);
    }
  }
}

updateDates().catch(console.error);
