// Usage: npm run new-post -- "Post title" [YYYY-MM-DD]
import fs from 'node:fs';
import path from 'node:path';
import { CONTENT, slugify } from './blog-lib.mjs';

const title = process.argv[2];
if (!title) { console.error('Usage: npm run new-post -- "Post title" [YYYY-MM-DD]'); process.exit(1); }
const date = process.argv[3] || new Date().toISOString().slice(0, 10);
const slug = slugify(title);
const file = path.join(CONTENT, `${slug}.md`);
if (fs.existsSync(file)) { console.error(`Already exists: ${file}`); process.exit(1); }
fs.writeFileSync(file, `---
title: "${title}"
seoTitle: "${title}"
description: "One or two sentences, 140–160 characters, that answer the search and include the main keyword."
date: ${date}
author: Chetan Nagaraja
category: Guides
tags: []
keyword: ""
cover: images/${slug}.jpg
coverAlt: ""
summary: ""
faq:
  - q: ""
    a: ""
---

Opening paragraph: answer the reader's question in the first two or three sentences.

## First section

{{app-cta}}

## Frequently asked questions

{{faq}}

{{app-cta-end}}
`);
console.log(`Created ${path.relative(process.cwd(), file)}`);
