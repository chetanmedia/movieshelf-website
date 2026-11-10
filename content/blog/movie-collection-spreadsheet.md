---
title: "Movie Collection Spreadsheet: Columns, Formulas, When to Switch"
seoTitle: "Movie Collection Spreadsheet: The Columns That Actually Matter"
description: "Build a movie collection spreadsheet that works: the 11 columns collectors need, duplicate-check formulas, barcode pitfalls, and when an app beats a sheet."
date: 2026-11-10
updated: 2026-11-10
author: Chetan Nagaraja
category: Guides
tags: [movie collection spreadsheet, dvd inventory, google sheets, excel, catalog dvd collection]
keyword: movie collection spreadsheet
cover: images/movie-collection-spreadsheet.jpg
coverAlt: "A movie collection spreadsheet with title, format and shelf columns, two matching Heat Blu-ray rows highlighted as a duplicate"
summary: "The 11 columns a disc collector actually needs, the formulas that catch duplicates, the barcode trap that wrecks most sheets, and the honest point where an app wins."
faq:
  - q: "What columns should a movie collection spreadsheet have?"
    a: "At minimum: title, year, format, edition, region, barcode, shelf location, date added, price paid, watched and notes. Format and edition are the two most template downloads leave out, and they are what stop you buying the same film twice in a different version."
  - q: "Is Google Sheets or Excel better for a DVD inventory?"
    a: "Google Sheets is easier if you want the list on your phone in a store, because it syncs automatically and has a free iPhone app. Excel is stronger offline and for very large files. Both handle dropdowns, filters, duplicate highlighting and pivot tables."
  - q: "Why does my barcode column show numbers like 8.83929E+11?"
    a: "Spreadsheets treat a 12- or 13-digit barcode as a number, so they drop leading zeros and Excel switches to scientific notation. Format the barcode column as plain text before you type or paste anything into it."
  - q: "How do I find duplicate movies in a spreadsheet?"
    a: "Add a conditional formatting rule with a custom formula such as =COUNTIFS($A:$A,$A2,$C:$C,$C2)>1, which highlights any row whose title and format both appear more than once. Matching on title alone also flags legitimate upgrades, like a Blu-ray and a 4K of the same film."
  - q: "Can I move my spreadsheet into a collection app later?"
    a: "Yes, if the app imports CSV files. Export the sheet as CSV, keep one row per disc, and check that titles and years are clean. In Movieshelf, bulk CSV import is part of Movieshelf Pro."
---

A good movie collection spreadsheet needs about eleven columns: title, year, format, edition, region, barcode, shelf location, date added, price paid, watched and notes. Format and edition are the two that free templates usually skip, and they are the ones that stop you buying the same film twice. Set dropdowns for the repeating values, store barcodes as text, and add one formula to flag duplicates, and a spreadsheet will serve a collection of a few hundred discs well.

Past that point, or the moment you want to check your list standing in a store aisle, typing every row by hand starts to hurt. This guide gives you the full spreadsheet setup first, then an honest look at where it stops scaling.

:::stats
- 11 | columns a collector's sheet needs | most templates ship with 6–8
- 12 | digits in a US UPC barcode | 13 in a European EAN
- 15 | digits Excel keeps in a number | everything after becomes zero
:::

<div class="tldr">

**TL;DR**

- Use **one row per disc you own**, not per film. A Blu-ray and a 4K of *Alien* are two rows.
- Add **Format, Edition, Region and Shelf** columns; generic movie-list templates miss them.
- Format the **barcode column as text** before entering anything, or the numbers get mangled.
- Highlight duplicates with `COUNTIFS` on **title plus format**, not title alone.
- A sheet works well into the low hundreds. Beyond that, or if you shop in person, a scanning app saves real time.

</div>

## What columns should a movie collection spreadsheet have?

Most free "movie list" templates are built for tracking what you've *watched*: title, genre, rating, runtime, cast. That's a viewing log. A physical collection needs columns that describe the object on your shelf, because that's what you're trying not to rebuy, lend out and lose, or find again.

| Column | Example | Why it matters |
|---|---|---|
| Title | Alien | Use the title as printed; move "The" to the end or ignore it when sorting |
| Year | 1979 | Separates remakes and same-name films |
| Format | 4K UHD | Dropdown: DVD, Blu-ray, 4K UHD |
| Edition | Steelbook | The column that tells an upgrade from a duplicate |
| Label / studio | 20th Century Studios | Essential for Criterion, Arrow and other boutique releases |
| Region | A / B / Free | Record it for every import |
| Barcode | 12 or 13 digits from the back | Identifies the exact release; store as text |
| Shelf location | Living room · B · 14 | Turns "somewhere" into an exact spot |
| Date added / price | 2026-11-08 · $24.99 | Spending totals and insurance records |
| Watched | Yes / No | Powers a "films I own but haven't seen" filter |
| Notes | Lent to Sam; slipcover kept | Loans, condition, packaging |

If you collect box sets, add a **Package** column: the name of the set a disc belongs to (for example, *The Lord of the Rings Extended Trilogy*). Every film still gets its own row, so searching for any title finds it, and filtering on the package shows the whole set.

:::tip One row per disc, not per film
It feels redundant to list *Alien* twice, but a single "Alien" row can't tell you whether you own the 4K, the Blu-ray, or both. Collectors who start with one row per film almost always end up splitting rows later.
:::

## How do you set up the sheet so it stays clean?

The difference between a sheet you trust and one you abandon is mostly data entry discipline. Five setup steps take about fifteen minutes and save hours of cleanup.

:::steps
### Freeze the header row and turn on filters
In Google Sheets, use View › Freeze › 1 row, then Data › Create a filter. In Excel, Format as Table does both at once and keeps formulas extending as you add rows.
### Add dropdowns for Format, Region and Watched
Use data validation so "Blu-ray", "BluRay" and "blu ray" can't all exist. Google's help page on [creating an in-cell dropdown list](https://support.google.com/docs/answer/186103) walks through it; Excel's equivalent lives under Data › Data Validation.
### Format the barcode column as plain text
Do this before you type or paste a single number (more on why below).
### Use a fixed shelf-address pattern
Pick one pattern, like *Room · Shelf · Slot*, and stick to it so filters actually group things.
### Keep a second tab for lists
Put allowed formats, rooms and labels on a "Lists" tab and point the dropdowns at it. Adding a new shelf then means editing one cell.
:::

:::warning The barcode trap
Spreadsheets see a 12-digit UPC as a number. Both Sheets and Excel strip any leading zero, Excel displays long numbers in scientific notation (8.83929E+11), and Excel only keeps [15 significant digits](https://support.microsoft.com/en-us/office/keeping-leading-zeros-and-large-numbers-1bf7b935-36e1-4985-842f-5dfa51f85fe7) of any number. Formatting the column as text first, or typing an apostrophe before the digits, keeps the barcode exactly as printed. Fixing it afterwards usually means retyping.
:::

{{app-cta}}

## Which formulas make a DVD inventory spreadsheet useful?

A list only becomes a tool once it can answer questions. These four formulas cover what collectors ask most. They work in both Google Sheets and Excel, assuming Title is column A and Format is column C.

:::cards
### Flag duplicates
Conditional formatting with the custom formula `=COUNTIFS($A:$A,$A2,$C:$C,$C2)>1` highlights rows where the same title appears twice **in the same format**. Your Blu-ray and 4K of *Heat* stay unflagged.
### Count by format
`=COUNTIF(C:C,"4K UHD")` tells you how many 4K discs you own. Repeat for DVD and Blu-ray to see how your collection is shifting.
### Total spend
`=SUM(I:I)` on the price column, or `=SUMIF(C:C,"4K UHD",I:I)` for spend on one format. Useful for budgets and insurance.
### Owned but unwatched
Filter Watched to "No" and sort by date added. That's your shelf-of-shame watchlist, oldest first.
:::

For anything bigger, such as spend per year, discs per label, or which room holds what, a pivot table (Insert › Pivot table in both apps) does it in a few clicks without any formulas.

## Google Sheets or Excel: which is better for a movie list?

Both are capable. The deciding question is where you'll use the list.

:::versus Google Sheets | Excel
- Free, saves and syncs automatically
- Free iPhone app, so the list comes to the store with you
- Easy to share read-only with family
- Slows down with very large, formula-heavy files
---
- Works fully offline
- Handles big files and pivot tables smoothly
- Format as Table keeps formatting consistent
- Phone access needs OneDrive and the Excel app
:::

If your collection lives on one shelf and you only update it at a desk, either works. If you buy discs in person, Google Sheets is usually the more practical pick, simply because it's already on your phone.

## When does a spreadsheet stop being enough?

Spreadsheets fail slowly. They rarely break; they just fall behind. The pattern collectors describe on forums and r/dvdcollection is consistent: the sheet is great for the first few hundred entries, then new discs pile up next to the TV because adding a full row feels like a chore.

The main cost is typing. A complete row with edition, region, barcode and shelf takes a minute or two to fill in by hand. A barcode scan identifies the exact release in seconds.

:::bars Rough time to add one disc with full details
- Barcode scan in an app | 12 | ~10–15 sec
- Search by title in an app | 40 | ~30–45 sec
- Typing a full spreadsheet row | 90 | ~1–2 min
:::

Across 500 discs, that gap is the difference between an evening and a couple of weekends. There are a few other places a sheet struggles:

- **In the store.** Scrolling a 900-row sheet on a phone, with a filter half-applied, is slow when you're deciding between two editions.
- **Covers.** A grid of cover art is how most people browse for something to watch. Sheets can hold images, but adding them by hand rarely survives the first hundred rows.
- **Box sets.** One package containing four films is awkward in a flat table, however you name the columns.

:::pullquote
A spreadsheet rarely breaks. It just quietly falls behind your shelf.
:::

None of this means a sheet is wrong. Under about a hundred discs, with no in-store shopping, a spreadsheet is free and perfectly good. Our [comparison of movie collection apps](/blog/movie-collection-app/) covers the alternatives if you're weighing them up.

## How do you move a spreadsheet into an app?

If you already have years of data in a sheet, you don't need to start over. Most collection apps read CSV files, and a clean CSV is easy to make from any spreadsheet.

{{phone:collection|From rows to a shelf of covers|Movieshelf Pro imports a CSV of your existing list in bulk. After that, new discs go in by scanning up to 10 barcodes at a time, each with its format, edition and shelf location.}}

Before you export, tidy three things: one row per disc, a consistent Format column, and a Year on every row so remakes match correctly. Then use File › Download › CSV in Google Sheets, or Save As › CSV in Excel. Bulk CSV import (and export, so your data is never locked in) comes with Movieshelf Pro, which is $2.99 a month, $14.99 a year or $44.99 once; see [pricing](/#pricing). The free plan lets you scan or add up to 50 titles if you'd rather try the scanning workflow first.

If you're starting from nothing rather than migrating, our [step-by-step catalog guide](/blog/how-to-catalog-dvd-blu-ray-collection/) covers the whole process, and [how to organize a DVD collection](/blog/how-to-organize-dvd-collection/) helps you settle the shelf order before you assign shelf addresses.

:::checklist Spreadsheet health check
- Header row frozen and filters on
- Format, Region and Watched use dropdowns
- Barcode column formatted as text
- Duplicate rule matches title **and** format
- Every disc has a shelf address
- New discs added the day they arrive
:::

## Frequently asked questions

{{faq}}

:::takeaways
- Track the **disc**, not just the film: format, edition and region are essential.
- Set up **dropdowns and a text barcode column** before entering data.
- Use `COUNTIFS` on **title plus format** to catch true duplicates.
- A sheet is fine for a small, stable collection; scanning wins once you're in the hundreds.
:::

## Pick your tool, then keep it current

The best inventory is the one you actually update. If a spreadsheet fits how you collect, build it with the columns above and it will serve you for years. If you find yourself with a stack of new discs and no urge to type them in, that's the sign to let a barcode scanner do the typing for you.

{{app-cta-end}}
