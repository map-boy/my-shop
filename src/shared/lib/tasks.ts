// FILE: src/lib/tasks.ts
export type TaskPhase = 'daily' | 'week1' | 'month1' | 'later';
export type TaskRepeat = 'once' | 'daily';

export interface TaskDoc {
  id: string;
  title: string;
  hint: string;
  group: string;
  phase: TaskPhase;
  repeat: TaskRepeat;
  /** Optional link: an admin path like /admin/products, or a full URL. */
  to: string;
  /** Shown on the Today list until it is done. */
  pinned: boolean;
  /** Date (YYYY-MM-DD) it was last ticked, or null. Daily tasks count as done only when this is today. */
  doneOn: string | null;
  order: number;
}

export const PHASES: { id: TaskPhase; label: string }[] = [
  { id: 'daily', label: 'Every day' },
  { id: 'week1', label: 'Week 1' },
  { id: 'month1', label: 'Month 1' },
  { id: 'later', label: 'Later' },
];

export const today = (): string => new Date().toLocaleDateString('en-CA');

export const isDone = (t: TaskDoc): boolean =>
  t.repeat === 'daily' ? t.doneOn === today() : !!t.doneOn;

export function toTask(id: string, x: Record<string, unknown>): TaskDoc {
  const phase = String(x.phase);
  return {
    id,
    title: String(x.title ?? ''),
    hint: String(x.hint ?? ''),
    group: String(x.group ?? 'General'),
    phase: (['daily', 'week1', 'month1', 'later'].includes(phase) ? phase : 'later') as TaskPhase,
    repeat: x.repeat === 'daily' ? 'daily' : 'once',
    to: String(x.to ?? ''),
    pinned: !!x.pinned,
    doneOn: typeof x.doneOn === 'string' ? x.doneOn : null,
    order: typeof x.order === 'number' ? x.order : 0,
  };
}

export type SeedRow = Omit<TaskDoc, 'id' | 'doneOn' | 'order'>;

const r = (
  group: string,
  phase: TaskPhase,
  title: string,
  hint: string,
  extra: Partial<SeedRow> = {},
): SeedRow => ({
  group,
  phase,
  title,
  hint,
  repeat: phase === 'daily' ? 'daily' : 'once',
  to: '',
  pinned: false,
  ...extra,
});

/** Loaded into the database once, with the "Add starter plan" button. After that the database is the only source. */
export const SEED: SeedRow[] = [
  // ---- Daily routine
  r('Daily routine', 'daily', 'Post on WhatsApp Status', 'One product, one real photo or short video, a short Kinyarwanda caption, and the product link.'),
  r('Daily routine', 'daily', 'Answer every message within 5 minutes', 'WhatsApp, Instagram and TikTok comments. A slow first reply loses the sale.'),
  r('Daily routine', 'daily', 'Ask one customer for a photo wearing it', 'Offer a small discount on their next order. Real customer photos build trust fastest.'),
  r('Daily routine', 'daily', 'Follow up with one creator or campus leader', 'Send a message, or give one piece to try. Their friends trust them more than a website.'),
  r('Daily routine', 'daily', 'Post one try-on video (TikTok or Instagram)', 'Show the fabric, the fit and the size on a real person. Talk in Kinyarwanda.'),
  r('Daily routine', 'daily', 'Check photos and stock of your top items', 'Clear photos, correct sizes, nothing sold out that is still listed.', { to: '/admin/products' }),

  // ---- What we sell
  r('What we sell', 'week1', 'Write one sentence for the brand identity', 'Who wears Karibu Fit and what it says about them (proud, modern, Kigali). Use it in every caption.'),
  r('What we sell', 'week1', 'Choose the entry product', 'One cheap, low-risk item (cap, tee, socks) so a stranger can make a first purchase.'),
  r('What we sell', 'week1', 'Choose the hero product', 'The one signature item people should recognise as Karibu Fit. Show it everywhere.'),
  r('What we sell', 'week1', 'Add size chart and fit notes to every product', 'Sizes in cm, model height and size, and whether it fits small, true or large.', { to: '/admin/products' }),
  r('What we sell', 'month1', 'Create 3 occasion bundles', 'Weekend outfit, church Sunday, interview day. People buy occasions, not single items.'),
  r('What we sell', 'month1', 'Name products and collections in Kinyarwanda or local references', 'Neighbourhoods, landmarks, local phrases. Names are cheap and build belonging.'),
  r('What we sell', 'month1', 'Set three price tiers', 'Cheap, middle and premium, so first-time and loyal buyers each find a fit.'),
  r('What we sell', 'month1', 'Write the origin story', 'Where the fabric comes from, who sews it, how long it takes. Real details only.'),
  r('What we sell', 'later', 'Plan a real limited drop', 'Make a small batch, sell it, and really stop. Only do this if it is true.'),
  r('What we sell', 'later', 'Plan seasonal collections', 'School start, graduations, Christmas, Umuganura, big Kigali events.'),

  // ---- Images
  r('Images', 'week1', 'Audit every product image', 'For each product: how many photos, are they sharp, is the light honest, is there a person wearing it?', { to: '/admin/products', pinned: true }),
  r('Images', 'week1', 'Give every product the minimum photo set', 'Front, back, fabric close-up, on a real person, and a size reference.', { to: '/admin/products' }),
  r('Images', 'week1', 'Shoot a full day in Kigali on real people', 'Streets, campus, a market, a moto stop. One day gives about a month of content.'),
  r('Images', 'week1', 'Record 10 to 20 second videos of each hero item', 'Walking, stretching, turning. Short and unedited is fine.'),
  r('Images', 'week1', 'Test every product link in WhatsApp', 'The preview image should be sharp and the title clear.'),
  r('Images', 'month1', 'Photograph stock, packing and the workshop', 'Slightly rough, real photos can build more trust than a polished catalogue.'),
  r('Images', 'month1', 'Put customer photos on product pages', 'With permission. They are the strongest images you can have.'),
  r('Images', 'month1', 'Photograph the parcel arriving and being opened', 'Delivery moments show the order is real.'),
  r('Images', 'month1', 'Pick one consistent look', 'One colour style and one logo position so people recognise you in a crowded feed.'),

  // ---- Trusted people
  r('Trusted people', 'week1', 'List 10 micro-influencers, student leaders and comedians', 'People whose friends trust them. Start with who you already know.'),
  r('Trusted people', 'month1', 'Gift pieces to 5 of them', 'Ask for an honest photo or story, nothing fake.'),
  r('Trusted people', 'month1', 'Find 3 tailors, moto riders or salon owners to wear Karibu Fit', 'Community figures sell by being seen.'),
  r('Trusted people', 'month1', 'Talk to one church or youth group leader about a group order', 'Offer a group discount.'),
  r('Trusted people', 'month1', 'Offer a team tee to one sports team', 'A team wearing the same piece is walking advertising.'),
  r('Trusted people', 'month1', 'Contact university clubs and class reps', 'Win a few well-connected people and they bring the rest.'),
  r('Trusted people', 'month1', 'Recruit the first agents', 'Trusted people in each community, using the agent program you already built.', { to: '/admin/agents' }),
  r('Trusted people', 'later', 'Ask a trusted local shop to display your pieces', 'People can see and touch the clothes there.'),

  // ---- Events
  r('Events', 'month1', 'Plan one pop-up at a university or market', 'Even one weekend a month. Once people touch the clothes, online reordering is easy.'),
  r('Events', 'month1', 'Run a try before you pay street stand', 'Bring 10 items and let people try and buy on the spot.'),
  r('Events', 'later', 'Run a #KaribuFitChallenge in Kinyarwanda', 'A simple photo or video challenge people can join.'),
  r('Events', 'later', 'Run a giveaway tied to a community cause', 'Keep the rules clear and the prize real.'),
  r('Events', 'later', 'Make an Umuganda tee', 'Free or discounted tees for a community cleanup day.'),
  r('Events', 'later', 'Hold a school or club uniform design contest', 'Gets groups involved before they buy.'),
  r('Events', 'later', 'Hold a style swap day', 'People exchange clothes and take photos.'),

  // ---- Making buying feel normal
  r('Making buying normal', 'week1', 'Show cash on delivery and try-on at the door on every product page', 'Pay on delivery is the biggest trust lever. Start with Kigali only.', { to: '/admin/settings' }),
  r('Making buying normal', 'week1', 'Show the MoMo Pay code everywhere it matters', 'Product page, checkout, order confirmation.', { to: '/admin/settings' }),
  r('Making buying normal', 'week1', 'Write the guarantee on the site', 'Do not like it, do not pay. Exchange within 3 days. Put it on product pages and in photos.', { to: '/admin/settings' }),
  r('Making buying normal', 'week1', 'Add a pre-filled WhatsApp message to every product', 'One tap should be enough. Use a gentle label like Ask about this item.'),
  r('Making buying normal', 'week1', 'Set up a WhatsApp Business profile', 'Logo, description, catalogue, opening hours.'),
  r('Making buying normal', 'week1', 'Turn on phone alerts so replies take under 5 minutes', 'During working hours.'),
  r('Making buying normal', 'month1', 'Send an on-the-way message with every delivery', 'The rider message builds confidence.'),
  r('Making buying normal', 'month1', 'Design packaging people want to photograph', 'Bag, thank-you note, sticker.'),

  // ---- Proof
  r('Proof', 'month1', 'Build a review wall with names and photos', 'Only real customers, only with permission.'),
  r('Proof', 'month1', 'Collect permission to share chat screenshots', 'Real conversations are strong proof.'),
  r('Proof', 'month1', 'Repost customer stories', 'Tag them and thank them.'),
  r('Proof', 'month1', 'Show the real count of delivered orders', 'Only when it is true and only once it is worth showing.'),

  // ---- Word of mouth
  r('Word of mouth', 'month1', 'Create a group-order discount', 'For classes, teams and families.', { to: '/admin/coupons' }),
  r('Word of mouth', 'month1', 'Create a referral reward for both sides', 'The person who refers and the new buyer.', { to: '/admin/coupons' }),
  r('Word of mouth', 'month1', 'Host a bring-a-friend try-on session', 'Friends trust friends.'),
  r('Word of mouth', 'month1', 'Start a WhatsApp broadcast list for new drops', 'Opt-in only, never add people without asking.'),
  r('Word of mouth', 'month1', 'Give each agent a QR link and code', 'Your traffic tracking already counts QR visits.', { to: '/admin/agents' }),

  // ---- Content
  r('Content', 'week1', 'Create a Google Business profile with a map pin', 'Real address or pickup point makes the shop feel real.'),
  r('Content', 'month1', 'Record the founder story video in Kinyarwanda', 'Who you are, where you work, what Karibu Fit stands for.'),
  r('Content', 'month1', 'Post a behind-the-scenes clip each week', 'Cutting, sewing, packing.'),
  r('Content', 'month1', 'Post a styling tip each week', 'One tee, three ways.'),
  r('Content', 'month1', 'Use Kinyarwanda voice notes and captions', 'Kinyarwanda-first builds trust English cannot, especially outside Kigali.'),
  r('Content', 'later', 'Try a local radio or community page mention', 'Reach people who are not on TikTok.'),

  // ---- Offers
  r('Offers', 'month1', 'Create a small bundle discount', 'Two items cost less than two separate items.', { to: '/admin/coupons' }),
  r('Offers', 'month1', 'Set a free delivery threshold', 'A higher basket and a clear reason to add one more item.'),
  r('Offers', 'month1', 'Plan a payday offer', 'Around month-end and school fee periods.'),
  r('Offers', 'later', 'Give repeat customers early access', 'Reward people who come back.'),
  r('Offers', 'later', 'Start a loyalty reward', 'A gift on the 5th order.'),

  // ---- Algorithm rules (build later, from your own data)
  r('Rules from our data', 'later', 'Rule: unconfirmed order older than 1 hour becomes a task', 'Turn orders into tasks automatically.'),
  r('Rules from our data', 'later', 'Rule: product with fewer than 3 photos becomes a task', 'Keeps the image standard high.'),
  r('Rules from our data', 'later', 'Rule: sold-out item still listed becomes a task', 'Nothing frustrates a new buyer like a dead listing.'),
  r('Rules from our data', 'later', 'Rule: delivered 3 days ago becomes ask for a photo', 'Collects proof without remembering.'),
  r('Rules from our data', 'later', 'Rule: product with views but no WhatsApp clicks gets a photo and price check', 'Finds the weak product pages.'),
  r('Rules from our data', 'later', 'Rule: one-time customer gets a follow-up after 14 days', 'Starts repeat buying.'),
  r('Rules from our data', 'later', 'Rule: best seller gets a post it again task', 'Repeat what works.'),

  // ---- Measure
  r('Measure', 'week1', 'Look at the Traffic page once a week', 'Visitors, QR scans, which source brings people.', { to: '/admin/traffic' }),
  r('Measure', 'month1', 'Compare sources: QR, agents, Status, TikTok', 'Do more of what brings buyers.', { to: '/admin/traffic' }),
  r('Measure', 'month1', 'Track reply time and delivery time', 'Speed is part of trust.'),
  r('Measure', 'month1', 'Hold a weekly review: what worked, what to stop', 'Edit this task list after each review.'),
];