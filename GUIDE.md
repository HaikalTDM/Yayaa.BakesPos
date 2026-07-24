# YayaaBakes POS — System Guide

*A comprehensive point-of-sale system built for small baking businesses*

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Checkout — Making a Sale](#checkout--making-a-sale)
4. [Payment Methods](#payment-methods)
5. [Product Management](#product-management)
6. [Session Management](#session-management)
7. [Reconciliation & Analytics](#reconciliation--analytics)
8. [Inventory Control](#inventory-control)
9. [Security & PIN](#security--pin)
10. [Multi-Device Setup](#multi-device-setup)
11. [Troubleshooting](#troubleshooting)

---

## Overview

YayaaBakes POS is a multi-tenant point-of-sale system designed specifically for small bakeries and dessert shops. It handles everything from product cataloging to sales tracking, inventory management, and end-of-day reconciliation.

**Key Capabilities:**
- Add products to cart with a tap, track stock in real time
- Accept cash or DuitNow QR payments
- Manage products, categories, and stock from an admin panel
- Open/close daily sessions with float tracking and discrepancy detection
- View sales analytics, export data as CSV
- Protect admin features with a 4-digit PIN
- Multi-device sync via Supabase cloud database
- Low-stock alerts to prevent selling out without noticing

The system runs on any device with a web browser — phone, tablet, or desktop.

---

## Getting Started

### 1. Open a Session

When you first load the checkout screen, you'll see a yellow **"No session"** button in the header.

1. Tap **"No session"**
2. Enter your starting cash float (e.g., RM 50.00)
3. Tap **"Open Session"**

A green pulsing **"Session open"** indicator will appear. You're now ready to take orders.

> **Note:** You must open a session before making sales. The session tracks your cash flow throughout the day and helps you balance at closing time.

### 2. Set Up Your PIN (First Time Only)

The first time you access the app, you'll be prompted to create a 4-digit PIN. This PIN protects admin features like the product manager and reconciliation dashboard.

- Enter a 4-digit PIN
- Confirm it by entering it again
- This PIN syncs across all devices via Supabase

---

## Checkout — Making a Sale

### Adding Products

The checkout screen displays your product catalog organized by category (e.g., "Sweet Treats", "Soft Cookies").

**To add a product:**
1. Tap any product card in the grid
2. A small cake icon will fly from the card down to the cart area — a visual confirmation the item was added
3. The cart bar appears at the bottom showing your running total

**To increase/decrease quantity:**
1. Tap the cart bar at the bottom to expand it
2. Use the **+** and **−** buttons next to each item
3. The total updates automatically

**To remove an item completely:**
- Decrease quantity to 0, or tap **"Clear all"** from the expanded cart

### Cart Bar (Mobile)

The collapsible cart bar at the bottom of the screen shows:
- Number of items (pink badge)
- Running total in RM
- Tap **"View cart"** to expand and see item list

On tablets, the cart appears as a permanent sidebar instead.

### Stock Indicators

Each product card shows:
- **Stock count** — how many units are available (e.g., "7 pcs")
- **Low stock warning** — "Low stock" badge appears when 3 or fewer remain
- **Sold out** — grayed out, cannot be tapped
- **Cart quantity badge** — shows how many of this item are already in the cart

---

## Payment Methods

Once you've added all items to the cart, tap **"Proceed to Pay"** to choose a payment method.

### Cash Payment

1. Tap **"Cash"**
2. You'll see a confirmation screen with the total
3. Ask the customer for payment, collect cash
4. Tap **"Confirm"**

### DuitNow QR Payment

1. Tap **"DuitNow"**
2. A QR code screen appears — show this to your customer
3. The customer scans and pays via their banking app
4. Once payment is confirmed, tap **"PAID / DONE"**

**🎉 Celebration:** After every successful sale, confetti bursts across the screen accompanied by a soft chime sound.

### What Happens After Payment
- Stock is automatically deducted from the product
- Sale is recorded in the database
- Cart is cleared
- You return to the product grid ready for the next order

---

## Product Management

Access the product manager by tapping the **"Products"** tab. You'll need to enter your PIN first.

### Viewing Products

All products are listed with:
- Product image (if added)
- Name
- Price and stock count
- Category

### Adding a New Product

1. Tap **"+ Add Item"** at the top
2. Fill in:
   - **Product name** — e.g., "Chocolate Brownie"
   - **Price (RM)** — selling price per unit
   - **Stock** — current quantity available
   - **Category** — choose from existing categories or create a new one
3. Optionally add a photo (tap "Add Photo" — choose from gallery or take a new picture)
4. Tap **"Save Product"**

### Category Management

The category field uses a smart dropdown:
- **Select existing category** — pick from categories already in use
- **"+ Add new category"** — type a new category name, keeping your catalog organized

This prevents typos and duplicate categories like "Sweet Treat" vs "Sweet Treats".

### Editing a Product

1. Find the product in the list
2. Tap the **pencil icon**
3. Modify name, price, stock, or photo
4. Tap **"Save"**

### Deleting a Product

1. Tap the **trash icon** on any product
2. Confirm the deletion

> ⚠️ **Warning:** Deleting a product is permanent and cannot be undone.

---

## Session Management

The session system tracks your daily cash flow — how much money should be in the drawer vs. what's actually there.

### Opening a Session

1. On the checkout screen, look for the **"No session"** button in the header
2. Tap it and enter your starting float
3. Tap **"Open Session"**

A green **"Session open"** indicator with a pulsing dot confirms you're active.

### Closing a Session (End of Day)

1. Tap the green **"Session open"** button
2. You'll see a breakdown:
   - **Opening float** — what you started with
   - **Cash sales today** — total cash received
   - **Expected in drawer** — float + cash sales (what the math says you should have)
3. Count the physical cash in your drawer
4. Enter the amount under **"Cash counted in drawer"**
5. Tap **"Close Session"**

The system calculates the **discrepancy** (difference between expected and actual):
- **Over by RM X.XX** — you have more money than expected (good!)
- **Short by RM X.XX** — you're missing money (needs investigation)

### Low-Stock Alerts

The header shows a warning badge (⚠) when products drop to 3 units or fewer. This gives you a visual nudge to restock before items sell out.

---

## Reconciliation & Analytics

Access by tapping the **"Reconciliation"** tab. Requires PIN entry.

### Period Selection

Choose to view data for:
- **Daily** — today's sales
- **Weekly** — this week (Monday to Sunday)
- **Monthly** — this calendar month

### What You'll See

| Metric | Description |
|--------|-------------|
| Gross Sales | Total revenue before deductions |
| Cash Total | Revenue from cash payments |
| DuitNow Total | Revenue from QR payments |
| Total Modal | Starting float + cash added during the day |
| Net Profit | Gross Sales − Total Modal |
| Sale Count | Number of transactions completed |
| Average Order Value | Average spend per customer |
| Category Breakdown | Revenue split by product category |
| Low Stock Products | Items with 3 or fewer units remaining |

### Restock History

A section showing recent restocks — which products were topped up, the quantity added, and when.

### Export CSV

Tap the **"Export CSV"** button to download your sales data as a spreadsheet. The file includes:
- Date, Product Name, Category, Quantity Sold, Revenue (RM), Payment Method

This can be opened in Excel, Google Sheets, or imported into accounting software.

### Session Modals

You can record additional cash movements:
- **Starting float additions** — if you add more money to the drawer mid-day
- **Cash withdrawals** — if you take money out for change or expenses

These are logged separately and factored into the net profit calculation.

---

## Inventory Control

### Long-Press Actions

**Press and hold** any product on the checkout grid for 0.8 seconds to open a quick-action popup. This lets you manage stock without leaving the checkout screen.

The popup shows three actions:

| Action | Effect | When to Use |
|--------|--------|-------------|
| **Wasted / Dropped** (red) | Deducts 1 from stock, logs as waste | A product was damaged, dropped, or expired |
| **Freebie / Taste Test** (yellow) | Deducts 1 from stock, logs as freebie | You gave a sample or complimentary item |
| **Add X to stock** (green) | Adds X units to stock, logs as restock | You've baked more or restocked supplies |

**Restock quantity:** Use the **−** and **+** buttons to adjust how many units to add (default: 5, range: 1–99).

### Stock Updates

All stock changes — sales, waste, freebies, and restocks — are:
1. Applied to the product's current stock count
2. Logged in the inventory history with timestamps
3. Synced instantly across all devices

---

## Security & PIN

### PIN Protection

A 4-digit PIN protects access to:
- **Reconciliation Dashboard** (sales data, analytics)
- **Product Manager** (add/edit/delete products)

Tapping either tab without an active PIN session prompts you to enter your PIN.

### Changing Your PIN

1. Unlock admin access (enter your PIN on the reconciliation or products tab)
2. Look for the **"Change PIN"** button in the header
3. You'll go through 3 steps:
   - **Step 1:** Enter current PIN
   - **Step 2:** Create new PIN
   - **Step 3:** Confirm new PIN
4. The new PIN is saved and syncs to all devices

> 🔒 **Security Note:** There is no "Forgot PIN" option. If you lose your PIN, it must be reset manually in the Supabase database. This prevents unauthorized access.

### Auto-Lock

Admin access does not auto-lock — it stays unlocked until you close the browser or switch tabs. This is designed for single-owner businesses where convenience is prioritized.

---

## Multi-Device Setup

The system supports multiple devices (e.g., your phone + a tablet at the counter) using the same Supabase backend.

### Setup Steps

1. **Create a store** in Supabase (one-time, done via SQL)
2. **Set up the PIN** from any device — all devices will use the same PIN
3. **Add products, make sales** — everything syncs in real time

### What Syncs
- Product catalog (additions, edits, deletions)
- Product stock levels
- Sales and payment history
- Inventory logs (waste, freebie, restock)
- Session state (open/close, float)
- PIN hash

### What Does NOT Sync
- Cart contents (each device has its own cart session)
- Active checkout flow (payment modal, QR screen)

---

## Troubleshooting

### "supabaseUrl is required" Error
**Cause:** Missing or invalid Supabase environment variables.  
**Fix:** Check your `.env.local` file has valid values for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_STORE_ID`.

### Products Not Loading
**Cause:** Database connection issue or empty product table.  
**Fix:** 
1. Verify your Supabase project is active
2. Check that products exist in the database (run `SELECT * FROM products;` in Supabase SQL Editor)
3. Ensure `NEXT_PUBLIC_STORE_ID` matches your store UUID

### Session Won't Open
**Cause:** The `sessions` table may not exist yet.  
**Fix:** Run the sessions table SQL in your Supabase SQL Editor (see schema.sql).

### Restock Button Not Working
**Cause:** The `add_stock` RPC function hasn't been created.  
**Fix:** Run the `add_stock` function SQL (included in schema.sql).

### Low Stock Badge Not Showing
**Note:** The badge only appears when products have stock between 1–3 units. Products at 0 stock are "sold out" and not counted. It updates automatically when stock changes.

### Photo Upload Not Working on Mobile
**Cause:** Camera-only mode was active.  
**Fix:** The photo picker now shows both "Take Photo" and "Choose from Gallery" options. If the camera still opens directly, ensure your device has a gallery app installed and try tapping "Choose from Gallery."

---

## Quick Reference

| Action | How |
|--------|-----|
| Add item to cart | Tap product |
| View/edit cart | Tap cart bar at bottom → expand |
| Remove item from cart | Decrease to 0 or "Clear all" |
| Change item quantity | +/− buttons in expanded cart |
| Proceed to payment | "Proceed to Pay" from cart |
| Cash payment | Select Cash → Confirm |
| DuitNow payment | Select DuitNow → Show QR → PAID/DONE |
| Open session | Tap "No session" in header |
| Close session | Tap "Session open" in header |
| Add product | Products tab → + Add Item |
| Edit product | Products tab → pencil icon |
| Delete product | Products tab → trash icon |
| Log waste/freebie | Long-press product on checkout grid |
| Restock product | Long-press product → set quantity → Add to stock |
| View analytics | Reconciliation tab (PIN required) |
| Export CSV | Reconciliation tab → Export CSV |
| Change PIN | Admin tab (unlocked) → Change PIN button |
| Change category | Add/edit product → Category dropdown |

---

*YayaaBakes POS — Built with Next.js, Supabase & ❤️*