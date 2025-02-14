import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));

const OLD_BLOG_DIRS = [
  join(__dirname, '../../blog/src/posts'),
  join(__dirname, '../../blog/src/posts-zh_cn'),
];

const NEW_BLOG_DIRS = [
  join(__dirname, '../src/content/blog/en'),
  join(__dirname, '../src/content/blog/zh'),
];

async function getTags() {
  const tags = new Map();

  for (const dir of OLD_BLOG_DIRS) {
    try {
      const files = await readdir(dir);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const content = await readFile(join(dir, file), 'utf-8');
        const { data } = matter(content);
        if (data.tags) {
          tags.set(file, Array.isArray(data.tags) ? data.tags : [data.tags]);
        }
      }
    } catch (err) {
      console.error(`Error reading directory ${dir}:`, err.message);
    }
  }

  return tags;
}

async function updateTags() {
  const oldTags = await getTags();

  for (const dir of NEW_BLOG_DIRS) {
    try {
      const files = await readdir(dir);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = join(dir, file);
        const content = await readFile(filePath, 'utf-8');
        const { data, content: markdown } = matter(content);

        const tags = oldTags.get(file);
        if (!tags) {
          console.log(`No tags found for ${file}`);
          continue;
        }

        // Update frontmatter with tags
        const updatedFrontmatter = {
          ...data,
          tags,
        };

        // Convert frontmatter to YAML
        const updatedContent = matter.stringify(markdown, updatedFrontmatter);

        await writeFile(filePath, updatedContent, 'utf-8');
        console.log(`Updated tags for ${file}: ${tags.join(', ')}`);
      }
    } catch (err) {
      console.error(`Error processing directory ${dir}:`, err.message);
    }
  }
}

updateTags().catch(console.error);
