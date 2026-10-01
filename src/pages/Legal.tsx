// FILE: src/pages/Legal.tsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export type LegalKind = 'privacy' | 'terms' | 'shipping-returns' | 'disclaimer' | 'cookies';

interface Block { h: string; p?: string[]; ul?: string[] }
interface Doc { title: string; intro: string; blocks: Block[] }

const UPDATED = '1 October 2026';

const DOCS: Record<LegalKind, Doc> = {
  privacy: {
    title: 'Privacy Policy',
    intro: '{store} respects your privacy. This policy explains what personal data we collect when you use karibu.fit, why we collect it, and the choices you have.',
    blocks: [
      { h: 'Who we are', p: [
        '{store} is an online shop based in Kigali, Rwanda. We handle personal data in line with Rwanda\'s Law No. 058/2021 relating to the protection of personal data and privacy.',
      ] },
      { h: 'Information we collect', ul: [
        'Orders: your name, phone number, delivery address, city, any order notes, and the products you order.',
        'Messages: the name, e-mail, phone number and message you send through our Contact form or WhatsApp.',
        'Newsletter: your e-mail address, if you subscribe.',
        'Notifications: if you allow push notifications, a token that identifies your browser so we can send them.',
        'Usage: pages visited, device and browser type, and chosen language, collected by our own traffic counter to understand how the shop is used.',
        'Staff and sellers: name, e-mail and profile photo when signing in to the dashboard with Google.',
      ] },
      { h: 'How we use your information', ul: [
        'To prepare, confirm and deliver your order, and to confirm payments.',
        'To reply to your messages and give support.',
        'To send our newsletter or notifications, only if you asked for them.',
        'To keep the shop secure, prevent fraud and improve what we sell.',
        'To meet legal and accounting obligations.',
      ] },
      { h: 'Payments', p: [
        'We do not collect or store card numbers. Mobile Money payments are made through MTN; we only receive the transaction reference you send us so we can match the payment to your order.',
      ] },
      { h: 'Who we share data with', p: [
        'We do not sell your personal data. We share it only with service providers who help us run the shop: Google Firebase (database, sign-in, file storage and notifications), Vercel (website hosting), delivery partners who need your address and phone number to reach you, and independent sellers for the products they fulfil.',
      ] },
      { h: 'Advertising and cookies', p: [
        'If we show advertising through Google AdSense, third-party vendors, including Google, use cookies to serve ads based on your previous visits to this and other websites. Google\'s use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the internet.',
        'You can opt out of personalised advertising in Google Ads Settings (https://adssettings.google.com) or through (https://www.aboutads.info). See our Cookie Policy for details.',
      ] },
      { h: 'How long we keep data', p: [
        'We keep personal data only for as long as needed for the purposes above or as required by law. You can ask us to delete your data at any time (see your rights below).',
      ] },
      { h: 'Your rights', p: [
        'You may ask to access, correct or delete the personal data we hold about you, object to how we use it, or withdraw consent you gave us. Contact us using the details below and we will respond. You also have the right to complain to Rwanda\'s data protection supervisory authority, the National Cyber Security Authority (NCSA).',
      ] },
      { h: 'Security', p: [
        'We use reasonable technical and organisational measures to protect your data, including encrypted connections (HTTPS) and access rules on our database. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.',
      ] },
      { h: 'Children', p: [
        'The shop is not directed at children and we do not knowingly collect their personal data.',
      ] },
      { h: 'Changes to this policy', p: [
        'We may update this policy from time to time. The date at the top of this page shows when it was last changed.',
      ] },
    ],
  },

  terms: {
    title: 'Terms & Conditions',
    intro: 'By browsing or ordering from {store} you agree to these terms. Please read them before you place an order.',
    blocks: [
      { h: 'Using the shop', p: [
        'You agree to use the shop lawfully and not to misuse it, interfere with its operation, or attempt to access areas that are not meant for you, such as the dashboard.',
      ] },
      { h: 'Products and prices', p: [
        'We try to describe and photograph products accurately, but colours, packaging and small details may differ slightly. Prices are shown in Rwandan francs (FRW). We may correct pricing or listing errors and cancel or refuse an order affected by one, in which case you will be refunded in full for anything already paid.',
      ] },
      { h: 'Orders', p: [
        'Placing an order is an offer to buy. An order is accepted once we confirm it, usually by phone or WhatsApp. We may decline or cancel an order if an item is out of stock, we cannot deliver to your address, or we cannot confirm your details.',
      ] },
      { h: 'Payment', p: [
        'You can pay by MTN Mobile Money (using the Pay code shown at checkout) or cash on delivery, where offered. For Mobile Money, send us the transaction ID so we can confirm your payment.',
      ] },
      { h: 'Delivery and returns', p: [
        'Delivery and returns are governed by our Shipping & Returns page, which forms part of these terms.',
      ] },
      { h: 'Independent sellers', p: [
        'Some products are listed by independent sellers, whose shop name appears on the listing. Those sellers are responsible for the accuracy of their listings and for preparing the items you order.',
      ] },
      { h: 'Intellectual property', p: [
        'The content of this site, including text, logos and images, belongs to {store} or its sellers and may not be copied or reused without permission.',
      ] },
      { h: 'Limitation of liability', p: [
        'To the extent permitted by law, {store} is not liable for indirect or consequential loss arising from use of the shop. Nothing in these terms limits any rights you have under Rwandan consumer law.',
      ] },
      { h: 'Governing law', p: [
        'These terms are governed by the laws of the Republic of Rwanda.',
      ] },
      { h: 'Changes', p: [
        'We may update these terms. The version published on this page when you place an order applies to that order.',
      ] },
    ],
  },

  'shipping-returns': {
    title: 'Shipping & Returns',
    intro: 'How we deliver your order, what it costs, and what to do if you need to send something back.',
    blocks: [
      { h: 'Delivery areas and times', ul: [
        'Kigali: same-day delivery for orders placed before 3 pm, subject to stock and confirmation.',
        'Rest of Rwanda: delivery within about 48 hours.',
        'We confirm your delivery details with you by phone or WhatsApp before dispatch.',
      ] },
      { h: 'Delivery fees', p: [
        'Orders above {free} are delivered free. Below that amount a small delivery fee applies, and we confirm it with you before dispatch.',
      ] },
      { h: 'Payment on delivery', p: [
        'Where cash on delivery is offered, please have the exact amount ready. For Mobile Money orders, we dispatch once your payment is confirmed.',
      ] },
      { h: 'Returns', ul: [
        'You can return an item within 7 days of receiving it if you changed your mind.',
        'The item must be unused, in its original condition and packaging.',
        'Contact us first on {phone} so we can arrange the return.',
      ] },
      { h: 'Damaged or wrong items', p: [
        'If your item arrives damaged, defective or not what you ordered, tell us as soon as possible with a photo and we will replace it or refund you.',
      ] },
      { h: 'Refunds', p: [
        'Once we receive and check a returned item, we refund you using the same method you paid with, or as we agree with you.',
      ] },
    ],
  },

  disclaimer: {
    title: 'Disclaimer',
    intro: 'Please read this notice about the information on {store}.',
    blocks: [
      { h: 'General information', p: [
        'Information on this site is provided in good faith for general purposes. We make no guarantee that it is always complete, current or error-free.',
      ] },
      { h: 'Product information', p: [
        'Product images and descriptions are for guidance. Actual items may vary slightly in colour, size or packaging. Always check the details with us if a specification matters to you.',
      ] },
      { h: 'Third-party sellers and links', p: [
        'Some listings come from independent sellers and some pages may link to other websites. We do not control and are not responsible for the content or practices of third parties.',
      ] },
      { h: 'Advertising', p: [
        'Where advertisements are shown, they are provided by third parties such as Google. Their appearance is not an endorsement of the advertiser or its products.',
      ] },
      { h: 'No professional advice', p: [
        'Nothing on this site is legal, financial, medical or other professional advice.',
      ] },
    ],
  },

  cookies: {
    title: 'Cookie Policy',
    intro: 'This page explains how {store} uses cookies and similar technologies such as browser storage.',
    blocks: [
      { h: 'What are cookies?', p: [
        'Cookies are small files stored on your device when you visit a website. Similar technologies, such as your browser\'s local storage, let a site remember choices you have made.',
      ] },
      { h: 'What we use', ul: [
        'Essential storage: remembers things like your language choice and shopping bag so the shop works properly.',
        'Analytics: our own traffic counter records which pages are visited so we can improve the shop.',
        'Notifications: a browser token, only if you choose to allow push notifications.',
        'Fonts: the shop loads fonts from Google Fonts, which means your IP address is shared with Google when a page loads.',
        'Advertising: if we show Google AdSense ads, Google and its partners may set cookies to show ads based on your previous visits and to measure ads.',
      ] },
      { h: 'Your choices', ul: [
        'You can block or delete cookies in your browser settings. Some parts of the shop may not work without essential storage.',
        'Opt out of personalised advertising at https://adssettings.google.com or https://www.aboutads.info.',
        'You can withdraw notification permission at any time in your browser settings.',
      ] },
      { h: 'More information', p: [
        'See our Privacy Policy for how we handle personal data.',
      ] },
    ],
  },
};

const NAV: { to: string; label: string }[] = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms & Conditions' },
  { to: '/shipping-returns', label: 'Shipping & Returns' },
  { to: '/disclaimer', label: 'Disclaimer' },
  { to: '/cookies', label: 'Cookie Policy' },
];

const URL_RE = /(https?:\/\/[^\s)]+)/g;

const Rich: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(URL_RE).map((part, i) =>
      /^https?:\/\//.test(part) ? (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink-900 underline">
          {part}
        </a>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      ),
    )}
  </>
);

const Legal: React.FC<{ kind: LegalKind }> = ({ kind }) => {
  const { settings, money } = useStore();
  const doc = DOCS[kind];

  const fill = (s: string) =>
    s
      .split('{store}').join(settings.storeName)
      .split('{free}').join(money(settings.shipping.freeOver))
      .split('{phone}').join(settings.contact.phone || 'the number on our Contact page');

  useEffect(() => {
    document.title = `${doc.title} - ${settings.storeName}`;
  }, [doc.title, settings.storeName]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-accent">Legal</p>
        <h1 className="font-display text-4xl font-bold sm:text-5xl">{doc.title}</h1>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Last updated {UPDATED}</p>
        <p className="mt-5 text-[15px] leading-relaxed text-ink-600">{fill(doc.intro)}</p>
      </header>

      <div className="space-y-9">
        {doc.blocks.map((b) => (
          <section key={b.h}>
            <h2 className="font-display text-2xl font-bold text-ink-900">{b.h}</h2>
            {b.p?.map((para, i) => (
              <p key={i} className="mt-3 text-[15px] leading-relaxed text-ink-600">
                <Rich text={fill(para)} />
              </p>
            ))}
            {b.ul && (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink-600">
                {b.ul.map((li, i) => (
                  <li key={i}>
                    <Rich text={fill(li)} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <section className="mt-12 rounded-brand border border-ink-200 p-6">
        <h2 className="font-display text-xl font-bold text-ink-900">Questions?</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
          Reach us through our <Link to="/contact" className="font-semibold text-ink-900 underline">Contact page</Link>
          {settings.contact.phone ? <> or call {settings.contact.phone}</> : null}
          {settings.contact.hours ? <> ({settings.contact.hours})</> : null}.
        </p>
      </section>

      <nav aria-label="Legal pages" className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-ink-200 pt-6 text-sm">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className="text-ink-500 transition hover:text-ink-900">
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Legal;