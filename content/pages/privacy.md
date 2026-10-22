---
title: "Privacy Policy"
description: "How Movieshelf, the iPhone app for cataloging DVD, Blu-ray and 4K UHD collections, collects, uses and protects your data, and the choices you have."
slug: privacy
updated: 2026-10-22
---

Movieshelf ("we," "our," or "the app") is an iOS app that helps you track and organize your physical movie collection. This Privacy Policy explains what data we collect, how we use it, and your choices. By using Movieshelf, you agree to this policy.

Please read this Privacy Policy carefully. By using the Service, you agree to the collection and use of information in accordance with this policy.

## 1. Information we collect

### 1.1 Account and profile data

- **Email and account information.** When you sign up, we store your email and account details in our secure database (Supabase) so you can log in and sync your collection across devices.
- **Onboarding preferences.** Choices you make during setup (e.g., collection size, formats, tracking methods) are saved so we can personalize your experience and improve the app.

### 1.2 Your collection data

- **Movies and media entries.** Titles, formats, ratings, notes, custom fields, and similar data you add or edit are stored in our database so you can view and manage your collection.
- **Collections, watchlists, wishlists.** Any lists or groupings you create are stored and synced with your account.

### 1.3 Camera and images

**Camera permission.** The app uses your device camera to:

- **Scan barcodes** on movie cases to quickly add titles to your collection.
- **Photograph front and back covers** of movies to extract details (e.g., title, year, format) and optionally attach cover images to your entries.

**How cover images are processed**

- **On-device text recognition (OCR).** On supported devices, text from cover photos is read on your device using Apple Vision OCR. Only the extracted text (not the image) may be sent to our systems for metadata enrichment.
- **Cover image storage.** If you save a cover image to an entry, we may store that image in our secure cloud storage (Supabase) so it appears in your collection and syncs across devices. You can delete entries (and their covers) at any time.

### 1.4 Barcode and metadata lookups

- **Barcode lookups.** When you scan a barcode, we may send the barcode number to a third-party barcode lookup service to fetch product information (e.g., title, format) so we can pre-fill your entry.
- **Metadata enrichment.** Text extracted from covers (or, in some flows, cover images) may be sent to an AI service (OpenAI) to structure and fill in fields like title, year, cast, and format. We do not use these inputs to train AI models; processing is for your metadata only.

## 2. Third-party services

We use the following types of services to run the app:

| Service | Purpose | Data involved |
|---|---|---|
| Supabase | Authentication, database, file storage | Account data, collection data, covers |
| OpenAI | Metadata extraction from cover text/images | Extracted text or images you submit |
| Barcode API | Lookup product info by barcode | Barcode numbers |
| Apple on-device OCR | On-device text recognition (OCR) | Processed on device only |

Each provider has its own privacy and data processing terms. We choose them for security and reliability and do not sell your data to third parties for advertising.

## 3. Data stored on your device

- **Local cache.** Some data (e.g., collection, preferences) may be cached on your device for faster loading and offline use.
- **Session and preferences.** Login session and app preferences are stored locally so you stay signed in and the app remembers your settings.

## 4. Data retention and deletion

- We keep your account and collection data for as long as your account is active.
- **Account deletion.** You can delete your account from within the app (e.g., via More → Delete account). When you do, we remove your profile, collection data, and stored cover images from our systems in line with our retention and backup procedures.
- **Local data.** Uninstalling the app will remove locally stored data from your device; cloud data remains until the account is deleted as above.

## 5. Security

We use industry-standard measures (including encryption and secure APIs) to protect your data in transit and at rest. Account and database access is restricted and we rely on trusted providers (e.g., Supabase) for infrastructure security.

## 6. Your rights and choices

- **Access and correction.** You can view and edit your collection and profile data in the app.
- **Deletion.** You can delete individual items or your entire account as described in Section 4.
- **Camera.** You can revoke camera permission in your device settings; barcode and cover scanning will then be unavailable, but the rest of the app can still be used.
- **Opt-out of sync.** Not creating an account or not signing in means your data stays only on your device (subject to app and device behavior).

If you are in a region that grants additional rights (e.g., GDPR, CCPA), you may have the right to access, port, correct, or delete your data or to object to or restrict certain processing. Contact us using the details below to exercise those rights.

## 7. Children's privacy

Movieshelf is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will delete it.

## 8. Changes to this policy

We may update this Privacy Policy from time to time. We will post the updated policy in the app or on our website and, where required, notify you of material changes. Your continued use of Movieshelf after changes take effect means you accept the updated policy.

## 9. Contact us

If you have questions about this Privacy Policy or your data, please contact us:

- Email: [thisischetan.media@gmail.com](mailto:thisischetan.media@gmail.com)
