import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BLOG_DIRS = [
  join(__dirname, '../src/content/blog/en'),
  join(__dirname, '../src/content/blog/zh'),
];

function formatTags(tagsStr) {
  if (!tagsStr) return [];
  // Handle both array-like strings and comma-separated strings
  const tagsArray = tagsStr.replace(/[\[\]"']/g, '').split(',');
  return tagsArray.map((tag) => tag.trim()).filter(Boolean);
}

function formatDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  // Remove quotes
  dateStr = dateStr.replace(/['"]/g, '');
  // Parse the date in YYYY-MM-DD format
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return dateStr; // Already in YYYY-MM-DD format
  }
  // Try to parse the date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    console.log(`Warning: Could not parse date: ${dateStr}`);
    return new Date().toISOString().split('T')[0];
  }
  return date.toISOString().split('T')[0];
}

async function updateFrontmatter() {
  for (const dir of BLOG_DIRS) {
    try {
      const files = await readdir(dir);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = join(dir, file);
        const content = await readFile(filePath, 'utf-8');

        // Extract frontmatter
        const match = content.match(/^---\n([\s\S]*?)\n---/);
        if (!match) {
          console.log(`No frontmatter found in ${file}`);
          continue;
        }

        const frontmatter = match[1];
        const restContent = content.slice(match[0].length);

        // Parse existing frontmatter
        const parsed = {};
        frontmatter.split('\n').forEach((line) => {
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            const key = line.slice(0, colonIndex).trim();
            const value = line.slice(colonIndex + 1).trim();
            parsed[key] = value.replace(/^["'](.*)["']$/, '$1');
          }
        });

        // Create new frontmatter
        const newContent = `---
title: "${parsed.title || file.replace(/\.md$/, '')}"
description: "${parsed.description || parsed.title || ''}"
pubDate: "${parsed.date || new Date().toISOString().split('T')[0]}"
heroImage: "/blog-placeholder-1.jpg"
tags:
${formatTags(parsed.tags)
  .map((tag) => `  - ${tag}`)
  .join('\n')}
---${restContent}`;

        await writeFile(filePath, newContent, 'utf-8');
        console.log(`Updated ${file} with date: ${parsed.date}`);
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

updateFrontmatter().catch(console.error);
