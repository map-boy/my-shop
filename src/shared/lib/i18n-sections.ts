// FILE: src/lib/i18n-sections.ts (hand-written text for new keys; a missing language falls back to machine translation)
export const SECT: Record<'en' | 'fr' | 'ar' | 'rw', Record<string, string>> = {
  en: {
    'pd.hiddenTitle': 'Only you can see this.',
    'pd.hiddenText': 'This product is {status}, so it does not appear in the shop. Publish it from Dashboard > Products to make it public.',
  },
  fr: {
    'pd.hiddenTitle': 'Vous seul voyez ceci.',
    'pd.hiddenText': 'Ce produit est \u00ab {status} \u00bb : il n\u2019appara\u00eet donc pas dans la boutique. Publiez-le depuis Tableau de bord > Produits pour le rendre public.',
  },
  ar: {},
  rw: {
    'pd.hiddenTitle': 'Ni wowe wenyine ubibona.',
    'pd.hiddenText': 'Iki gicuruzwa ni {status}, bityo ntikigaragara mu iduka. Gishyire ahagaragara ukoresheje Dashboard > Ibicuruzwa.',
  },
};