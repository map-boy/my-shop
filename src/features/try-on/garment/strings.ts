const en = { garment: 'Garment', zones: 'Zones', pickGarment: 'Choose garment photo', noGarment: 'Choose a clothing photo (a flat photo on a plain background works best) to see it on you.', garmentLoading: 'Preparing the garment\u2026', garmentError: 'Could not load that photo.', openFromProduct: 'Open this page from a product to try it on.' };
type Dict = Record<keyof typeof en, string>;
const fr: Dict = { garment: 'V\u00eatement', zones: 'Zones', pickGarment: 'Choisir une photo du v\u00eatement', noGarment: 'Choisissez une photo du v\u00eatement (photo \u00e0 plat sur fond uni) pour le voir sur vous.', garmentLoading: 'Pr\u00e9paration du v\u00eatement\u2026', garmentError: 'Impossible de charger cette photo.', openFromProduct: 'Ouvrez cette page depuis un produit pour essayer.' };
const rw: Dict = { garment: 'Imyenda', zones: 'Uduce', pickGarment: 'Hitamo ifoto y\u2019imyenda', noGarment: 'Hitamo ifoto y\u2019imyenda (iri ku mwanya woroshye) urebe uko igukwiriye.', garmentLoading: 'Turimo gutegura imyenda\u2026', garmentError: 'Ntibishobotse gufungura iyo foto.', openFromProduct: 'Fungura iyi paji uri ku gicuruzwa kugira ngo ugerageze.' };
const D: Record<string, Dict> = { en, fr, rw };
export type GKey = keyof typeof en;
export function useGT() {
  const l = (typeof document !== 'undefined' && document.documentElement.lang) || 'en';
  const dict = D[l.slice(0, 2)] ?? en;
  return (k: GKey) => dict[k] ?? en[k];
}