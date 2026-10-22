# Movieshelf Journal: writing & SEO rules

Every post (human- or Claude-written) follows these rules. Files starting with `_` are never published.

## Who we write for
Collectors of physical media: DVD, Blu-ray, 4K UHD, steelbooks, boutique labels (Criterion, Arrow, Shout, Vinegar Syndrome), box sets. They own hundreds to thousands of discs and they want to know what they own, where it is, and what to buy or watch next. Write like a knowledgeable collector friend, not a marketer.

## One post = one search intent
- Choose **one primary keyword** (the `keyword` front-matter field) with clear consumer intent and realistic competition. Long-tail keywords beat head terms. ("how to organize blu-ray collection by genre" beats "blu-ray".)
- Before writing, search the keyword. Read the top 5 results and note what they miss. Our post must answer the question **better and faster** than all of them.
- Never publish two posts targeting the same keyword.
- Don't target searches Blu-ray.com owns: single-title pages ("<film> blu ray", "<film> 4k" on its own), release dates/schedules, deals and news. The "<film>: 4K vs Blu-ray Compared" format is fine because it answers a comparison question. Comparisons with CLZ Movies or other apps must be factual and fair, based on their public websites. Check `content/blog/` and `_topics.md` first.

## Structure (required)
1. `title`: under 65 chars, keyword near the front. `seoTitle` may differ slightly and must also be under 65 chars.
2. `description`: 140–160 chars, contains the keyword, promises a concrete answer.
3. **Opening 2–3 sentences answer the question directly.** AI search engines (Google AI Overviews, ChatGPT, Perplexity) quote these, so make them self-contained and factual.
4. A short TL;DR box: `<div class="tldr"><strong>TL;DR</strong> ...</div>`.
5. `##` sections phrased the way people search ("How long does it take to…", "What's the best way to…"). Use `###` for sub-steps. Never skip heading levels. Never use `#` in the body because the title is the H1.
6. At least one table or numbered list (these earn featured snippets).
7. `{{app-cta}}` once, after the first genuinely useful section. `{{app-cta-end}}` at the very end.
8. A `faq:` block in the front matter with 4–6 real questions people ask (check "People also ask"), plus `{{faq}}` in the body under `## Frequently asked questions`. Each answer is 1–3 sentences.
9. 2–4 internal links to other Journal posts (`/blog/<slug>/`) or to `/#scan`, `/#organize` and `/#pricing` on the landing page. Use `{{related:slug}}` to show a card.
10. 1–3 outbound links to authoritative sources (manufacturers, studios, Wikipedia, official specs). Never link to direct competitors.
11. Length: 1,200–2,200 words. Depth beats padding. Cut any sentence that a reader would skip.

## Make it visual (required)
Plain text walls are banned. Readers skim, and visual blocks keep them on the page (which helps rankings). Every post must use **at least 5 different components** from the list below, and **never more than ~4 plain paragraphs in a row** without a table, list or component. Components still render as real HTML text, so Google and AI search can read them.

| Component | Write it like this | Use it for |
|---|---|---|
| Stats strip | `:::stats` then `- 10–15s \| label \| small print` lines, `:::` | 2–4 headline numbers near the top (numbers count up on scroll) |
| Cards grid | `:::cards` then `### Title` + one short paragraph, repeated, `:::` | Reasons, use cases, options (3–6 cards) |
| Step timeline | `:::steps` then `### Step title` + text, repeated, `:::` | Any how-to sequence (replaces numbered lists) |
| Versus | `:::versus Option A \| Option B` then list A, a line with `---`, list B, `:::` | Comparisons, myths vs facts, before/after |
| Bar chart | `:::bars Caption` then `- Label \| number \| shown text`, `:::` | Times, sizes, counts, rough comparisons (only defensible numbers) |
| Shelf illustration | `:::shelf Caption` then `- Title \| dvd/bluray/uhd`, prefix `*` to highlight, `:::` | Any post about organizing or shelving |
| Checklist | `:::checklist Title` then `- item` lines, `:::` | Routines and to-dos readers tick off (saved in their browser) |
| Callouts | `:::tip`, `:::note`, `:::warning`, `:::takeaways` + optional title, markdown inside, `:::` | Pro tips, caveats, and a takeaways box before the closing section |
| Pull quote | `:::pullquote` one sentence `:::` | One memorable line per post |
| App phone | `{{phone:scan\|Title\|Text}}`, `{{phone:collection\|…}}`, `{{phone:detail\|…}}` (title/text optional) | Show Movieshelf doing the thing the section describes; max 2 per post |
| Table | normal markdown table | Feature/edition/format comparisons |

A good default rhythm: stats after the intro → cards for "why" → steps for "how" → a phone where the app helps → bars or versus for a comparison → checklist → takeaways → closing section. See `how-to-catalog-dvd-blu-ray-collection.md` for a complete example.

## Facts & honesty
- Movieshelf features that may be mentioned: barcode scanning with batch import of up to 10 barcodes at a time, formats (DVD, Blu-ray, 4K UHD), editions and box sets, custom folders, shelf location, watchlist and "what to watch", collection stats, search and filters. **Never invent features** (no spine scanning, no price tracking unless it ships).
- Pricing facts (only these): Free plan = search and add up to 50 titles, scan up to 50 barcodes, unlimited collection folders, 3 custom fields. Movieshelf **Pro** = $0.99/month, $9.99/year, or $39.99 lifetime; unlocks unlimited search/add/scanning, unlimited custom fields, collection analytics, custom posters and backdrops, bulk CSV import and export, priority support. Bulk CSV import is Pro-only. There is no free trial. Call it "Pro", never "Premium".
- Every number, date or spec must be verifiable. Cite the source with a link. If unsure, leave it out.
- No fake testimonials, reviews, or quotes.
- Mention competitors only factually and fairly, if at all.

## Voice
- Second person, plain English, short paragraphs (2–4 sentences).
- Concrete examples with real film titles and real editions.
- No filler openers ("In today's fast-paced world…"), no "Conclusion" heading, no emoji.
- British/American: American spelling.

## Front matter template
```yaml
---
title: ""
seoTitle: ""
description: ""
date: YYYY-MM-DD        # future date = scheduled; it publishes on that day's build
updated: YYYY-MM-DD
author: Chetan Nagaraja
category: Guides         # Guides | Organizing | Formats | Collecting | Watching | Gear
tags: []
keyword: ""
cover: images/<slug>.jpg # 1600×900 JPG, <250 KB
coverAlt: ""
summary: ""              # 1–2 sentences, shown on cards
faq:
  - q: ""
    a: ""
---
```

## Cover images
1600×900 JPG under 250 KB, saved to `content/blog/images/<slug>.jpg`. If no image is available, leave `cover` out and the default social image is used. Never use copyrighted cover art as the main image except as small, clearly editorial product shots.

## Checklist before commit
- [ ] Keyword in title, description, first paragraph and one H2
- [ ] `npm run build` passes and prints the post as published (or scheduled)
- [ ] Row in `_topics.md` marked `done` with the date
