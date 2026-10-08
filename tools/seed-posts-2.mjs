import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const PROJECT_ID = 'my-shop-84749';
const ARTICLES = [
{
slug: 'how-delivery-works-in-kigali-and-across-rwanda',
title: 'How Delivery Works in Kigali and Across Rwanda',
excerpt: 'Same-day delivery in Kigali, about 48 hours across Rwanda. Here is how our delivery works and how to prepare so your order arrives smoothly.',
body: `Ordering clothes online is only useful if the order reaches you when you expect it. This guide explains how delivery works for orders placed with our shop, what can change the timing, and what you can do to make the handover quick and easy. If you have never ordered from us before, reading it takes a few minutes and answers most of the questions people ask on WhatsApp.

## Delivery inside Kigali

For orders placed before 3 pm, we offer same-day delivery in Kigali. That means you can order in the morning and have the item in your hands the same evening. Orders placed after 3 pm are normally delivered the next day. If you need something for a specific event, place the order as early in the day as you can, and send us a message so we know the order is time sensitive.

## Delivery across Rwanda

For addresses outside Kigali, delivery usually takes about 48 hours. The exact time depends on the district, the road conditions and the transport available that day. Rural locations can take a little longer than towns. When you order, give the clearest location you can, including the nearest landmark, the sector and the name of the person who will receive the parcel.

## What can affect the timing

A few things can slow a delivery down. Heavy rain during the rainy seasons can delay transport. Public holidays reduce the number of vehicles on the road. An address that is hard to find, or a phone that is switched off when the courier calls, can add hours. None of these is unusual, and most can be avoided with a little planning.

## Before you place the order

- Check the size using measurements, not only the label. Our guide on reading size charts explains how.
- Write your full name, phone number and delivery location carefully.
- Use a phone number that is active and reachable during the day.
- Decide how you will pay, by MTN Mobile Money or cash on delivery, so you are ready when the order arrives.

## When the courier arrives

Keep your phone close on the day of delivery, because the courier will usually call before arriving. Inspect the parcel while the courier is present if you can. Check that the item matches your order, that the colour and size are right, and that nothing is damaged. If you chose cash on delivery, have the exact amount ready, since carrying change is not always possible.

## If something is not right

Contact us as soon as possible and describe the problem clearly. Photos help us a lot. If the item does not fit or is not what you ordered, our returns process applies to eligible items within 7 days, and you can read the details on the Shipping and Returns page. Keep the packaging and tags until you are sure you are keeping the item.

## Planning ahead for gifts and events

If the order is a gift or is meant for a wedding, graduation or family gathering, do not leave it to the last day. Order early, allow extra time if the delivery location is outside Kigali, and ask us to confirm the delivery window. A short message beforehand is much easier than solving a problem on the day.

## Final thoughts

Delivery is simple when the details are clear. Order before 3 pm for same-day service in Kigali, give a precise address, keep your phone on and check the parcel when it arrives. If you are ever unsure, write to us before ordering and we will help you plan.`
},
{
slug: 'paying-with-mtn-mobile-money-or-cash-on-delivery',
title: 'Paying with MTN Mobile Money or Cash on Delivery: A Simple Guide',
excerpt: 'Two ways to pay for your order, and how to choose between them. Learn how each works and how to stay safe.',
body: `When you order clothes from our shop, you can pay with MTN Mobile Money or with cash on delivery. Both options are simple, but they suit different situations. This guide explains how each one works, when to choose which, and a few safety habits that protect your money whichever you use.

## Paying with MTN Mobile Money

Mobile Money is the fastest way to pay. You complete the payment from your phone, the shop sees it and the order can be prepared straight away. It is a good choice if you are ordering for a deadline, if you will not be at home when the parcel arrives, or if you do not want to handle cash. After you pay, you receive a confirmation message from MTN. Keep it until the order has arrived, because it is your proof of payment.

## Paying with cash on delivery

Cash on delivery means you pay when the parcel reaches you. Many shoppers like it because they can see the item before paying. It is a comfortable choice if this is your first order with us or if you are unsure about the size or colour. If you pick this option, prepare the exact amount, because the courier may not have change.

## How to choose

- Choose Mobile Money if speed matters and you are sure of your choice.
- Choose cash on delivery if you want to see the item first.
- Choose Mobile Money if you cannot be present at the time of delivery.
- Choose cash on delivery if you prefer not to pay before you receive the goods.

## Staying safe with Mobile Money

Always check the number or code before confirming a payment, because a mistake can be hard to reverse. Never share your PIN with anyone, including people who say they are from the shop or from the network. We will never ask for your PIN. Be careful with messages that claim you have won something or that ask you to send money to receive a parcel. When in doubt, contact us directly using the details on our Contact page.

## Staying safe with cash

Count the money before you hand it over, and ask the courier to confirm the amount. Check the parcel first, then pay. If something is wrong with the order, tell the courier and contact us immediately so we can sort it out.

## Keep your records

Save the order confirmation, your WhatsApp messages with us and the Mobile Money message. If you need help with an order, these records make it much faster for us to find it and answer you.

## What if the item does not fit

Eligible items can be returned within 7 days. The conditions are explained on the Shipping and Returns page, so read them before you order. If you are not sure about a size, ask us first, and compare the measurements with a garment you already own.

## Final thoughts

Both payment options are safe when you use them carefully. Pick the one that suits your situation, protect your PIN, keep your records and check your order when it arrives. If you have a question about paying, send us a message before you order and we will explain.`
},
{
slug: 'how-to-order-by-whatsapp-or-checkout-step-by-step',
title: 'How to Order From Us: Checkout or WhatsApp, Step by Step',
excerpt: 'You can order through the secure checkout on the website or by WhatsApp. Here is how each way works and what to prepare.',
body: `There are two ways to order from our shop: through the secure checkout on the website, or by sending us a message on WhatsApp. Both lead to the same result, so choose the one you find easier. This guide walks through each method and lists what to prepare so that your order is handled quickly and correctly.

## Ordering through the website checkout

Browse the shop, open the item you like and read the description and measurements. Choose the size and colour if options are shown, then add it to your cart. When you have everything you want, open the cart, check the items and continue to checkout. Enter your name, phone number and delivery location, choose how you will pay, and place the order. You will see a confirmation once it has gone through.

## Ordering through WhatsApp

If you prefer to talk to a person, send us a message with the name of the item, the size and the colour. A screenshot or a link to the product helps us find it immediately. We will confirm that it is available, tell you the total and explain the delivery and payment options. WhatsApp is also useful when you have questions about fit, because we can answer before you decide.

## What to prepare before you order

- The size you need, based on measurements and not only the label.
- A phone number that is active and reachable during the day.
- A clear delivery location, with a landmark if the address is hard to find.
- Your choice of payment, MTN Mobile Money or cash on delivery.

## Choosing between the two methods

The checkout is quick if you already know what you want, and it works at any hour. WhatsApp is better if you are unsure about a size, want to compare two items or need to ask about delivery for a particular date. Many customers browse on the website and then message us about one or two details before ordering.

## After you order

We confirm the order and prepare it. In Kigali, orders placed before 3 pm can be delivered the same day. Outside Kigali, delivery usually takes about 48 hours. Keep your phone nearby so the courier can reach you, and check the parcel when it arrives.

## Mistakes to avoid

Do not guess the size if the measurements are listed. Do not leave out the phone number or give one that is switched off. Do not forget to mention a deadline if the order is for an event. Small details like these cause most delivery delays, and they are easy to prevent.

## If you need to change something

Message us as soon as you can if you made a mistake in the size, the colour or the address. The sooner we know, the easier it is to correct before the order leaves.

## Final thoughts

Ordering from us should be easy. Use the checkout when you are ready, use WhatsApp when you have questions, and give clear details either way. With a correct size, a good address and an active phone, your order will reach you without trouble.`
}
];
try {
  initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();
  const prods = await db.collection('products').where('status', '==', 'active').get();
  const imgs = [];
  prods.forEach((d) => { const i = (d.data().images || [])[0]; if (i) imgs.push(i); });
  const now = Date.now();
  let created = 0, skipped = 0;
  for (let i = 0; i < ARTICLES.length; i++) {
    const a = ARTICLES[i];
    const t = now + i * 1000;
    const words = a.body.trim().split(/\s+/).length;
    try {
      await db.collection('posts').doc('seed-' + a.slug).create({
        title: a.title, slug: a.slug, excerpt: a.excerpt, body: a.body.trim(),
        cover: imgs.length ? imgs[(i * 11 + 3) % imgs.length] : '',
        published: true, createdAt: t, updatedAt: t,
      });
      created++; console.log('  created (' + words + ' words) ' + a.slug);
    } catch (e) {
      if (e && (e.code === 6 || /ALREADY_EXISTS/.test(String(e.message)))) { skipped++; console.log('  skipped ' + a.slug); }
      else throw e;
    }
  }
  console.log('Done. created=' + created + ' skipped=' + skipped);
} catch (err) { console.error('FAILED: ' + (err && err.message || err)); process.exit(1); }