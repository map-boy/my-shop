const en = {
  title: 'Check my fit', heightLabel: 'Your height (cm)', heightHint: 'We use your height to scale your body measurements.', heightErr: 'Enter a number between 120 and 220.',
  save: 'Continue', start: 'Open camera', stop: 'Stop', flip: 'Switch camera', loadingModel: 'Getting ready\u2026', modelError: 'Could not load the fit model. Check your connection and retry.',
  camDenied: 'Camera blocked. Allow it in your browser settings.', camError: 'Camera not available.', stepBack: 'Step back until your whole body shows, head to feet.',
  noBody: 'No person in view.', measuring: 'Measuring\u2026 stand still, arms relaxed.', sizeLabel: 'Size', bestSize: 'Best size for you', fits: 'Fits', tight: 'Tight', loose: 'Loose',
  estimate: 'This is an estimate, not a guarantee.', privacy: 'Camera images never leave your phone.', zShoulders: 'Shoulders', zChest: 'Chest', zLength: 'Length', changeHeight: 'Change height',
};
type Dict = Record<keyof typeof en, string>;
const fr: Dict = {
  title: 'V\u00e9rifier ma taille', heightLabel: 'Votre taille (cm)', heightHint: 'Nous utilisons votre taille pour estimer vos mesures.', heightErr: 'Entrez un nombre entre 120 et 220.',
  save: 'Continuer', start: 'Ouvrir la cam\u00e9ra', stop: 'Arr\u00eater', flip: 'Changer de cam\u00e9ra', loadingModel: 'Pr\u00e9paration\u2026', modelError: 'Impossible de charger le mod\u00e8le. V\u00e9rifiez votre connexion.',
  camDenied: 'Cam\u00e9ra bloqu\u00e9e. Autorisez-la dans les r\u00e9glages du navigateur.', camError: 'Cam\u00e9ra indisponible.', stepBack: 'Reculez jusqu\u2019\u00e0 voir tout votre corps, de la t\u00eate aux pieds.',
  noBody: 'Personne dans l\u2019image.', measuring: 'Mesure en cours\u2026 restez immobile, bras d\u00e9tendus.', sizeLabel: 'Taille', bestSize: 'Meilleure taille pour vous', fits: 'Bien', tight: 'Serr\u00e9', loose: 'Ample',
  estimate: 'Ceci est une estimation, pas une garantie.', privacy: 'Les images de la cam\u00e9ra ne quittent jamais votre t\u00e9l\u00e9phone.', zShoulders: '\u00c9paules', zChest: 'Poitrine', zLength: 'Longueur', changeHeight: 'Changer la taille',
};
const rw: Dict = {
  title: 'Reba niba bikubereye', heightLabel: 'Uburebure bwawe (cm)', heightHint: 'Dukoresha uburebure bwawe kugira ngo dupime umubiri.', heightErr: 'Andika umubare uri hagati ya 120 na 220.',
  save: 'Komeza', start: 'Fungura kamera', stop: 'Hagarika', flip: 'Hindura kamera', loadingModel: 'Turimo gutegura\u2026', modelError: 'Ntibishobotse gutegura. Ongera ugerageze.',
  camDenied: 'Wanze ko kamera ikoreshwa. Yemere mu miterere ya mushakisha.', camError: 'Kamera ntikora.', stepBack: 'Subira inyuma kugeza umubiri wose ugaragaye, uhereye ku mutwe ukageza ku birenge.',
  noBody: 'Nta muntu ugaragara.', measuring: 'Turapima\u2026 guma uhagaze utanyeganyega.', sizeLabel: 'Ingano', bestSize: 'Ingano ikubereye cyane', fits: 'Bikubereye', tight: 'Biragufashe', loose: 'Binini',
  estimate: 'Ni igereranyo gusa, si ukuri kwuzuye.', privacy: 'Amafoto ya kamera ntava kuri telefone yawe.', zShoulders: 'Intugu', zChest: 'Igituza', zLength: 'Uburebure', changeHeight: 'Hindura uburebure',
};
const D: Record<string, Dict> = { en, fr, rw };
export type StrKey = keyof typeof en;
// TODO next pass: read the app's own language (src/shared/lib/i18n.tsx) instead of <html lang>. ar falls back to en. Kinyarwanda/French need native review.
export function useTT() {
  const l = (typeof document !== 'undefined' && document.documentElement.lang) || 'en';
  const dict = D[l.slice(0, 2)] ?? en;
  return (k: StrKey) => dict[k] ?? en[k];
}