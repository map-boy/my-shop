import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const EXTRA = {
'seed-paying-with-mtn-mobile-money-or-cash-on-delivery': {
  marker: '## Common questions about paying',
  text: `

## Common questions about paying

Can I change my payment choice after I order? Message us as soon as possible and tell us which method you would like instead. The earlier we know, the easier it is to arrange before the parcel goes out.

What if I typed the wrong number when paying with Mobile Money? Contact your network provider straight away and then write to us with the time and the amount. Having the confirmation message ready makes it much faster for everyone to trace the payment.

Is it better to pay before or after delivery? Neither is better for everyone. If you are sure about the item and want the fastest service, paying with Mobile Money works well. If you want to see the item first, cash on delivery gives you that peace of mind. Choose the one you feel comfortable with.`
},
'seed-how-to-order-by-whatsapp-or-checkout-step-by-step': {
  marker: '## Tips for a smoother WhatsApp order',
  text: `

## Tips for a smoother WhatsApp order

Send one clear message with everything we need instead of several short ones: the item name or a screenshot, the size, the colour, your delivery location and your preferred payment method. This saves time for both of us and reduces the chance of a mistake.

Ask your questions before you confirm. If you are unsure about the length, the fabric or how an item fits, tell us what you normally wear and we can help you compare. Check the total and the delivery details in our reply before you pay.

## Ordering for someone else

If you are buying a gift, give us the name and phone number of the person who will receive the parcel, and tell us the date it should arrive. Mention if the size is a guess, so we can point out the easier fits and explain the returns policy for eligible items.`
}
};
try {
  initializeApp({ credential: applicationDefault(), projectId: 'my-shop-84749' });
  const db = getFirestore();
  for (const [id, x] of Object.entries(EXTRA)) {
    const ref = db.collection('posts').doc(id);
    const snap = await ref.get();
    if (!snap.exists) { console.log('  missing  ' + id); continue; }
    const body = String(snap.data().body || '');
    if (body.includes(x.marker)) { console.log('  already expanded  ' + id); continue; }
    const next = body.trimEnd() + x.text;
    await ref.update({ body: next, updatedAt: Date.now() });
    console.log('  expanded (' + next.trim().split(/\s+/).length + ' words)  ' + id);
  }
} catch (e) { console.error('FAILED: ' + (e && e.message || e)); process.exit(1); }