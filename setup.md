# GLOWA — local & content setup

## 1. Run the theme locally

```powershell
npm i -g @shopify/cli@latest
cd glowa-new
shopify auth login
shopify theme dev --store zzgehi-gd.myshopify.com
# password: titusa
# preview: http://127.0.0.1:9292
```

## 2. Create the footer pages

In Shopify Admin → **Online Store → Pages → Add page**, create the following pages and assign each one its custom template. The footer is already wired to point to these URLs.

| Page title             | URL handle           | Template               | What it renders                                          |
| ---------------------- | -------------------- | ---------------------- | -------------------------------------------------------- |
| Contact                | `contact`            | `page.contact`         | Split-screen contact card + form (already deployed)      |
| FAQs                   | `faqs`               | `page.faqs`            | "Frequently asked questions" accordion (preset content)  |

> Terms of Use and Privacy Policy live on Shopify's built-in **Settings → Policies** (URLs `/policies/terms-of-service` and `/policies/privacy-policy`). See Section 3 below for the ready-to-paste Terms of Use copy.

For each page:
1. Set **Title** and **Search engine listing** → Handle exactly as in the table above (Shopify auto-generates the handle from the title; double-check it).
2. Pick the **Theme template** at the bottom of the page editor.
3. Type or paste the content into the rich text area, then **Save**.

> Tip: For Shipping & Returns, you can copy the content from Shopify's built-in Refund Policy + Shipping Policy (Settings → Policies → Insert template) and paste it into the page.

## 3. Connect the footer to legal policies (Terms of Use, Privacy, Refund)

GLOWA uses Shopify's built-in policies — same URL pattern as `/policies/privacy-policy`. The footer auto-resolves to those URLs once each policy is filled in, so there's no extra theme config.

### Step-by-step

1. Shopify Admin → **Settings → Policies**.
2. **Privacy policy** — click *Insert template* (or paste your own), edit, **Save**. Published at `/policies/privacy-policy`.
3. **Terms of service** — open `legal/terms-of-service.md` from this repo, copy everything from "Last updated" downwards, paste into the editor, **Save**. Published at `/policies/terms-of-service`.
4. **Refund policy / Shipping policy** — *Insert template*, edit, **Save**. Published at `/policies/refund-policy` and `/policies/shipping-policy`.

That's it — the footer's *Terms of Use*, *Privacy Policy* and *Refund Policy* links (both in the newsletter fine-print and the bottom legal row) will all resolve automatically.

### Optional override

If you ever want a footer link to point at a custom page instead of the Shopify policy, open the Theme Editor → Footer section → *Legal link X — URL* and paste a manual URL (e.g. `/pages/something`). Manual URLs always override the auto-resolution.

## 4. Verify

- Visit each footer link from the storefront — every Customer care entry should resolve to a real page.
- Visit `/policies/privacy-policy`, `/policies/terms-of-service`, `/policies/refund-policy` and confirm the content is filled in.
