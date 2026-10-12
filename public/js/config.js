/**
 * SITE CONFIG — the one file to edit when rebranding for a client.
 * Brand text, contact details, shipping rules, theme colors and page copy live here.
 * Products live in products.js. Images live in /public/images.
 */
export const SITE = {
  brand: {
    name: 'VERRA',
    tagline: 'A more considered way to dress.',
  },

  currency: { code: 'UGX', locale: 'en-UG' },

  shipping: {
    freeThreshold: 250000, // demonstration threshold in UGX
    flatRate: 8000,
    returnsDays: 7,
  },

  contact: {
    email: 'hello@verra.example',
    phone: '+256 700 000 000 (demo number)',
    address: 'Kampala, Uganda (demo address)',
    hours: 'Online enquiries: Monday–Saturday',
    instagram: { label: '@verra.studio (demo)', url: 'https://instagram.com/' },
    whatsapp: '256700000000', // replace with the real business number before launch
    // Optional: paste a form-backend URL (Formspree, Basin, your API) to deliver
    // contact-form messages by email. Leave '' to run in demo mode (no network call).
    formEndpoint: '',
  },

  // Colors are applied to CSS variables at start-up (see applyTheme in app.js).
  theme: {
    bg: '#f5f1eb',       // warm ivory page background
    surface: '#fffdf9',  // drawers, dialog
    ink: '#171512',      // near-black text
    muted: '#746c63',    // secondary text
    line: '#ded7ce',     // soft borders
    accent: '#7c2838',   // restrained burgundy
    blush: '#e9e0d6',    // soft highlight panels
  },

  hero: {
    headline: 'A more considered way to dress.',
    subline: 'Contemporary pieces selected for personal style, everyday confidence, and lasting appeal.',
    cta: 'Explore the collection',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1400&q=88',
    imageAlt: 'Fashion editorial portrait in contemporary clothing',
  },

  about: {
    title: 'Style should feel like your own.',
    paragraphs: [
      'Verra is a fashion concept built around thoughtful styling, versatile pieces, and the confidence that comes from finding what feels right for you.',
      'Explore the collection, discover new combinations, and choose pieces that work with your everyday life. This demonstration store uses sample products and placeholder business details.',
    ],
    facts: [
      { value: 'Everyday', label: 'pieces for personal style' },
      { value: 'Curated', label: 'collections with a clear point of view' },
      { value: 'Kampala', label: 'Uganda-focused demo storefront' },
    ],
  },

  lookbook: [
    { image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=85', alt: 'Contemporary street style fashion editorial', caption: 'The everyday statement' },
    { image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85', alt: 'Fashion shoppers exploring a clothing collection', caption: 'Find your own point of view' },
    { image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=85', alt: 'Carefully styled contemporary wardrobe', caption: 'Pieces that work together' },
  ],

  footer: { note: 'Independent fashion concept · Demonstration website. Products, prices and contact details are samples.' },
};
