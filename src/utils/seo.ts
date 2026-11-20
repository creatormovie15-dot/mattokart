import { LegalDocType } from '../types';

const SITE_URL = 'https://mattokart.netlify.app';

interface RouteSeoMeta {
  title: string;
  description: string;
  canonicalPath: string;
  robots: 'index, follow' | 'noindex, nofollow';
}

export function getRouteSeoMeta(
  pathname: string,
  search: string,
  legalDoc?: LegalDocType
): RouteSeoMeta {
  const params = new URLSearchParams(search);
  const category = params.get('category');
  const query = params.get('search');

  if (pathname === '/' || pathname === '') {
    return {
      title: 'MattoKart - Sab Kuch, Ek Hi Jagah! | India Ka Apna Shopping Marketplace',
      description:
        "MattoKart - Sab Kuch, Ek Hi Jagah! India's open multi-vendor shopping marketplace. Buy Anywhere. Sell Everywhere across all 28 States & 8 UTs starting from Saharanpur, UP.",
      canonicalPath: '/',
      robots: 'index, follow',
    };
  }

  if (pathname.startsWith('/products') || pathname.startsWith('/catalog')) {
    if (query) {
      return {
        title: `Search: ${query} | MattoKart Marketplace`,
        description: `Browse ${query} from verified Indian sellers on MattoKart with Cash on Delivery and Pan-India delivery.`,
        canonicalPath: '/products',
        robots: 'index, follow',
      };
    }
    if (category) {
      const formatted = category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        title: `${formatted} | Shop Pan-India on MattoKart`,
        description: `Compare prices and order ${formatted} directly from verified merchants and manufacturers across India on MattoKart.`,
        canonicalPath: `/products?category=${encodeURIComponent(category)}`,
        robots: 'index, follow',
      };
    }
    return {
      title: 'All Products Catalog | MattoKart Pan-India Marketplace',
      description:
        'Explore construction materials, Saharanpur woodcraft, electronics, tools, home & kitchen, fashion, and daily essentials across India.',
      canonicalPath: '/products',
      robots: 'index, follow',
    };
  }

  if (pathname === '/shops') {
    return {
      title: 'Verified Indian Sellers & Shops Directory | MattoKart',
      description:
        'Discover verified shopkeepers, manufacturers, wholesalers, and artisans across all 28 States & 8 UTs on MattoKart.',
      canonicalPath: '/shops',
      robots: 'index, follow',
    };
  }

  if (pathname === '/seller/register') {
    return {
      title: 'Become a Seller — FREE First Year (₹0) | MattoKart India',
      description:
        'Register your shop or individual seller profile on MattoKart anywhere in India with ₹0 registration fee for the first year.',
      canonicalPath: '/seller/register',
      robots: 'index, follow',
    };
  }

  if (pathname.startsWith('/legal') || pathname === '/about' || pathname === '/contact' || pathname === '/contact-us' || pathname === '/privacy' || pathname === '/terms') {
    const doc = legalDoc || 'about';
    const docTitles: Record<string, string> = {
      about: 'About MattoKart — Sab Kuch, Ek Hi Jagah!',
      contact: 'Contact MattoKart Support — +91 8221077674',
      privacy: 'Privacy Policy | MattoKart India',
      terms: 'Terms & Conditions | MattoKart India',
      'returns-refunds': 'Returns & Refunds Policy | MattoKart India',
      'seller-agreement': 'Seller Agreement | MattoKart India',
    };
    return {
      title: docTitles[doc] || 'MattoKart Information & Policies',
      description:
        'Official MattoKart marketplace policies, seller guidelines, returns policy, and customer support details.',
      canonicalPath: `/legal/${doc}`,
      robots: 'index, follow',
    };
  }

  // Private / transactional routes should not be indexed
  const privateTitles: Record<string, string> = {
    '/cart': 'Shopping Cart | MattoKart',
    '/checkout': 'Secure COD Checkout | MattoKart',
    '/orders': 'My Orders & 10-Stage Live Tracking | MattoKart',
    '/wishlist': 'Saved Wishlist | MattoKart',
    '/enquiries': 'Buyer Enquiries | MattoKart',
    '/seller/dashboard': 'Seller Corner Dashboard | MattoKart',
    '/admin': 'Admin Control Center | MattoKart',
    '/admin-dashboard': 'Admin Control Center | MattoKart',
  };

  return {
    title: privateTitles[pathname] || 'MattoKart Marketplace',
    description: 'MattoKart multi-vendor shopping marketplace across India.',
    canonicalPath: pathname,
    robots: 'noindex, nofollow',
  };
}

export function applyDocumentSeo(meta: RouteSeoMeta) {
  if (typeof document === 'undefined') return;
  document.title = meta.title;

  const setMetaContent = (selector: string, attrName: 'name' | 'property', key: string, content: string) => {
    let el = document.querySelector<HTMLMetaElement>(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMetaContent('meta[name="description"]', 'name', 'description', meta.description);
  setMetaContent('meta[name="robots"]', 'name', 'robots', meta.robots);
  setMetaContent('meta[property="og:title"]', 'property', 'og:title', meta.title);
  setMetaContent('meta[property="og:description"]', 'property', 'og:description', meta.description);
  setMetaContent('meta[property="og:url"]', 'property', 'og:url', `${SITE_URL}${meta.canonicalPath}`);
  setMetaContent('meta[name="twitter:title"]', 'name', 'twitter:title', meta.title);
  setMetaContent('meta[name="twitter:description"]', 'name', 'twitter:description', meta.description);

  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', `${SITE_URL}${meta.canonicalPath}`);
}
