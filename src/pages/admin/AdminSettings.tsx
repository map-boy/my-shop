// FILE: src/pages/admin/AdminSettings.tsx
import React, { useState } from 'react';
import {
  CreditCard, Globe, Palette, Phone, Search as SearchIcon, Share2, ShoppingBag, Store, TriangleAlert, Truck,
} from 'lucide-react';
import { useSettingsDraft } from '../../hooks/useSettingsDraft';
import { useStore } from '../../context/StoreContext';
import ImageInput from '../../components/ImageInput';
import SaveBar from '../../components/SaveBar';
import { Field, Input, Select, Textarea, Toggle } from '../../components/ui';
import { cn } from '../../lib/utils';

type Tab = 'identity' | 'theme' | 'commerce' | 'payments' | 'contact' | 'social' | 'footer' | 'seo' | 'advanced';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'identity', label: 'Store identity', icon: Store },
  { id: 'theme', label: 'Look & feel', icon: Palette },
  { id: 'commerce', label: 'Delivery & tax', icon: ShoppingBag },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'contact', label: 'Contact', icon: Phone },
  { id: 'social', label: 'Social links', icon: Share2 },
  { id: 'footer', label: 'Footer', icon: Globe },
  { id: 'seo', label: 'SEO', icon: SearchIcon },
  { id: 'advanced', label: 'Advanced', icon: TriangleAlert },
];

const Panel: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
  title, description, children,
}) => (
  <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
    <h2 className="font-display text-xl font-bold text-white">{title}</h2>
    {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-400">{description}</p>}
    <div className="mt-7 space-y-5">{children}</div>
  </section>
);

const ColorField: React.FC<{ label: string; hint?: string; value: string; onChange: (v: string) => void }> = ({
  label, hint, value, onChange,
}) => (
  <Field label={label} hint={hint}>
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent"
        aria-label={`${label} colour picker`}
      />
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
    </div>
  </Field>
);

const AdminSettings: React.FC = () => {
  const { draft, set, setIn, save, reset, busy, dirty } = useSettingsDraft('store settings');
  const { money } = useStore();
  const [tab, setTab] = useState<Tab>('identity');

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">Storefront</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Store settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-400">
          Everything a shopper sees — name, colours, delivery fees, payment methods, contact details — is set
          here. Changes go live the moment you save.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
        <nav className="thin-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 lg:sticky lg:top-6 lg:h-fit lg:flex-col">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-semibold transition',
                tab === t.id ? 'bg-accent text-ink-950' : 'text-ink-400 hover:bg-white/5 hover:text-white',
              )}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="space-y-6">
          {tab === 'identity' && (
            <Panel title="Store identity" description="The name, logo and currency used across the whole site.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Store name" required>
                  <Input value={draft.storeName} onChange={(e) => set('storeName', e.target.value)} />
                </Field>
                <Field label="Tagline" hint="Used on the about page banner.">
                  <Input value={draft.tagline} onChange={(e) => set('tagline', e.target.value)} />
                </Field>
              </div>

              <ImageInput
                value={draft.logoUrl ? [draft.logoUrl] : []}
                onChange={(urls) => set('logoUrl', urls[0] ?? '')}
                max={1}
                compact
                folder="brand"
                label="Logo"
                hint="A transparent PNG or SVG works best. Leave empty to use the first letter of the store name."
              />

              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="Currency code">
                  <Input value={draft.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} placeholder="RWF" />
                </Field>
                <Field label="Symbol shown">
                  <Input value={draft.currencySymbol} onChange={(e) => set('currencySymbol', e.target.value)} placeholder="RWF" />
                </Field>
                <Field label="Symbol position">
                  <Select
                    value={draft.currencyPosition}
                    onChange={(e) => set('currencyPosition', e.target.value as 'before' | 'after')}
                  >
                    <option value="before">Before — RWF 5,000</option>
                    <option value="after">After — 5,000 RWF</option>
                  </Select>
                </Field>
              </div>

              <Field label="Number locale" hint="Controls thousands separators, e.g. en-RW, en-US, fr-FR.">
                <Input value={draft.locale} onChange={(e) => set('locale', e.target.value)} />
              </Field>
            </Panel>
          )}

          {tab === 'theme' && (
            <>
              <Panel title="Brand colours" description="Applied instantly across buttons, badges and highlights.">
                <div className="grid gap-5 sm:grid-cols-2">
                  <ColorField
                    label="Primary colour"
                    hint="Buttons, the newsletter block and the logo tile."
                    value={draft.brandColor}
                    onChange={(v) => set('brandColor', v)}
                  />
                  <ColorField
                    label="Accent colour"
                    hint="Badges, links, hover states and the dashboard highlight."
                    value={draft.accentColor}
                    onChange={(v) => set('accentColor', v)}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Corner rounding" hint={`${draft.radius}px — 0 is sharp, 24 is very round.`}>
                    <input
                      type="range"
                      min={0}
                      max={28}
                      value={draft.radius}
                      onChange={(e) => set('radius', Number(e.target.value))}
                      className="w-full accent-[var(--accent)]"
                    />
                  </Field>
                  <Field label="Heading typeface">
                    <Select value={draft.headingFont} onChange={(e) => set('headingFont', e.target.value)}>
                      <option value="'Playfair Display', Georgia, serif">Playfair Display — editorial</option>
                      <option value="'Inter', system-ui, sans-serif">Inter — modern sans</option>
                      <option value="Georgia, 'Times New Roman', serif">Georgia — classic serif</option>
                      <option value="ui-monospace, 'SF Mono', monospace">Monospace — technical</option>
                    </Select>
                  </Field>
                </div>

                <div className="rounded-xl border border-white/10 p-5">
                  <p className="label">Live preview</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="inline-flex h-11 items-center rounded-xl px-6 text-[13px] font-bold uppercase tracking-wider"
                      style={{ background: draft.brandColor, color: '#fff', borderRadius: draft.radius }}
                    >
                      Primary
                    </span>
                    <span
                      className="inline-flex h-11 items-center rounded-xl px-6 text-[13px] font-bold uppercase tracking-wider text-ink-950"
                      style={{ background: draft.accentColor, borderRadius: draft.radius }}
                    >
                      Accent
                    </span>
                    <span className="text-2xl font-bold text-white" style={{ fontFamily: draft.headingFont }}>
                      {draft.storeName}
                    </span>
                  </div>
                </div>
              </Panel>

              <Panel title="Announcement bar" description="The thin strip above the navigation. Great for a promotion or a delivery notice.">
                <Toggle
                  checked={draft.announcement.enabled}
                  onChange={(v) => setIn('announcement', { enabled: v })}
                  label="Show the announcement bar"
                />
                <Field label="Message">
                  <Input
                    value={draft.announcement.text}
                    onChange={(e) => setIn('announcement', { text: e.target.value })}
                    placeholder="Free delivery on orders over 50,000 RWF"
                  />
                </Field>
                <Field label="Links to">
                  <Input
                    value={draft.announcement.link}
                    onChange={(e) => setIn('announcement', { link: e.target.value })}
                    placeholder="/shop"
                  />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <ColorField label="Background" value={draft.announcement.bg} onChange={(v) => setIn('announcement', { bg: v })} />
                  <ColorField label="Text colour" value={draft.announcement.color} onChange={(v) => setIn('announcement', { color: v })} />
                </div>
              </Panel>
            </>
          )}

          {tab === 'commerce' && (
            <>
              <Panel title="Delivery" description="How much shoppers pay to receive their order.">
                <Toggle
                  checked={draft.shipping.enabled}
                  onChange={(v) => setIn('shipping', { enabled: v })}
                  label="Charge for delivery"
                  hint="Turn off to make every order ship free."
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Flat delivery fee">
                    <Input
                      type="number"
                      min={0}
                      value={draft.shipping.flatRate}
                      onChange={(e) => setIn('shipping', { flatRate: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Free delivery above" hint="0 disables the free-delivery threshold.">
                    <Input
                      type="number"
                      min={0}
                      value={draft.shipping.freeOver}
                      onChange={(e) => setIn('shipping', { freeOver: Number(e.target.value) })}
                    />
                  </Field>
                </div>
                <Field label="Delivery note" hint="Shown on the product page and at checkout.">
                  <Textarea value={draft.shipping.note} onChange={(e) => setIn('shipping', { note: e.target.value })} />
                </Field>
              </Panel>

              <Panel
                title="Delivery banner"
                description="A strip across the top of every page telling shoppers what they need to spend to get free delivery."
              >
                <Toggle
                  checked={draft.shipping.banner.enabled}
                  onChange={(v) => setIn('shipping', { banner: { ...draft.shipping.banner, enabled: v } })}
                  label="Show the delivery banner"
                  hint="Hidden automatically if you switch delivery charges off or set the threshold to 0."
                />

                <Field
                  label="Message"
                  hint="Write {amount} where the money should go — it is filled in from the free-delivery threshold above, so the banner can never contradict the real rule."
                >
                  <Input
                    value={draft.shipping.banner.text}
                    onChange={(e) => setIn('shipping', { banner: { ...draft.shipping.banner, text: e.target.value } })}
                    placeholder="Order for more than {amount} and we deliver to you free."
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <ColorField
                    label="Background"
                    value={draft.shipping.banner.bg}
                    onChange={(v) => setIn('shipping', { banner: { ...draft.shipping.banner, bg: v } })}
                  />
                  <ColorField
                    label="Text colour"
                    value={draft.shipping.banner.color}
                    onChange={(v) => setIn('shipping', { banner: { ...draft.shipping.banner, color: v } })}
                  />
                </div>

                <div>
                  <p className="label">Exactly what shoppers will see</p>
                  <div
                    className="flex items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-[13px] font-bold"
                    style={{ background: draft.shipping.banner.bg, color: draft.shipping.banner.color }}
                  >
                    <Truck size={16} />
                    {draft.shipping.banner.text.replace(
                      /\{amount\}/gi,
                      money(draft.shipping.freeOver),
                    )}
                  </div>
                  {(!draft.shipping.enabled || draft.shipping.freeOver <= 0) && (
                    <p className="mt-2 text-[11px] text-amber-300">
                      The banner is hidden on the live site right now because
                      {!draft.shipping.enabled
                        ? ' delivery charges are switched off.'
                        : ' the free-delivery threshold is 0.'}
                    </p>
                  )}
                </div>
              </Panel>

              <Panel title="Tax" description="Added on top of the discounted subtotal at checkout.">
                <Toggle
                  checked={draft.tax.enabled}
                  onChange={(v) => setIn('tax', { enabled: v })}
                  label="Charge tax"
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Label">
                    <Input value={draft.tax.label} onChange={(e) => setIn('tax', { label: e.target.value })} placeholder="VAT" />
                  </Field>
                  <Field label="Rate (%)">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={draft.tax.rate}
                      onChange={(e) => setIn('tax', { rate: Number(e.target.value) })}
                    />
                  </Field>
                </div>
              </Panel>

              <Panel title="Checkout rules">
                <Toggle
                  checked={draft.checkout.requirePhone}
                  onChange={(v) => setIn('checkout', { requirePhone: v })}
                  label="Require a phone number"
                  hint="Recommended — most deliveries need a call."
                />
                <Toggle
                  checked={draft.checkout.allowNotes}
                  onChange={(v) => setIn('checkout', { allowNotes: v })}
                  label="Allow order notes"
                />
                <Field label="Minimum order value" hint="0 means no minimum.">
                  <Input
                    type="number"
                    min={0}
                    value={draft.checkout.minOrder}
                    onChange={(e) => setIn('checkout', { minOrder: Number(e.target.value) })}
                  />
                </Field>
              </Panel>
            </>
          )}

          {tab === 'payments' && (
            <Panel title="Payment methods" description="Only the methods you enable appear at checkout.">
              <Toggle checked={draft.payments.cod} onChange={(v) => setIn('payments', { cod: v })} label="Cash on delivery" />
              <Toggle checked={draft.payments.mobileMoney} onChange={(v) => setIn('payments', { mobileMoney: v })} label="Mobile Money" />
              <Toggle checked={draft.payments.bank} onChange={(v) => setIn('payments', { bank: v })} label="Bank transfer" />
              <Toggle checked={draft.payments.card} onChange={(v) => setIn('payments', { card: v })} label="Card (payment link sent by e-mail)" />
              <Field label="Payment instructions" hint="Shown under the Mobile Money option at checkout.">
                <Textarea
                  value={draft.payments.instructions}
                  onChange={(e) => setIn('payments', { instructions: e.target.value })}
                />
              </Field>
            </Panel>
          )}

          {tab === 'contact' && (
            <Panel title="Contact details" description="Used in the footer, the contact page and the WhatsApp button.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Phone">
                  <Input value={draft.contact.phone} onChange={(e) => setIn('contact', { phone: e.target.value })} />
                </Field>
                <Field label="WhatsApp number" hint="Digits only, with the country code — 250788000000.">
                  <Input value={draft.contact.whatsapp} onChange={(e) => setIn('contact', { whatsapp: e.target.value })} />
                </Field>
                <Field label="E-mail">
                  <Input value={draft.contact.email} onChange={(e) => setIn('contact', { email: e.target.value })} />
                </Field>
                <Field label="Opening hours">
                  <Input value={draft.contact.hours} onChange={(e) => setIn('contact', { hours: e.target.value })} />
                </Field>
                <Field label="Address" className="sm:col-span-2">
                  <Input value={draft.contact.address} onChange={(e) => setIn('contact', { address: e.target.value })} />
                </Field>
                <Field
                  label="Google Maps embed URL"
                  hint="Maps → Share → Embed a map → copy the src value. Leave empty to hide the map."
                  className="sm:col-span-2"
                >
                  <Input value={draft.contact.mapUrl} onChange={(e) => setIn('contact', { mapUrl: e.target.value })} />
                </Field>
              </div>
            </Panel>
          )}

          {tab === 'social' && (
            <Panel title="Social links" description="Empty fields are hidden from the footer.">
              <div className="grid gap-5 sm:grid-cols-2">
                {(['facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'linkedin'] as const).map((key) => (
                  <Field key={key} label={key}>
                    <Input
                      value={draft.social[key]}
                      onChange={(e) => setIn('social', { [key]: e.target.value } as never)}
                      placeholder={`https://${key}.com/yourshop`}
                    />
                  </Field>
                ))}
              </div>
            </Panel>
          )}

          {tab === 'footer' && (
            <Panel title="Footer" description="The link columns and small print at the bottom of every page.">
              <Field label="About text">
                <Textarea value={draft.footer.about} onChange={(e) => setIn('footer', { about: e.target.value })} />
              </Field>

              {draft.footer.columns.map((col, ci) => (
                <div key={ci} className="rounded-xl border border-white/10 p-5">
                  <Field label={`Column ${ci + 1} heading`}>
                    <Input
                      value={col.title}
                      onChange={(e) =>
                        setIn('footer', {
                          columns: draft.footer.columns.map((c, i) =>
                            i === ci ? { ...c, title: e.target.value } : c,
                          ),
                        })
                      }
                    />
                  </Field>

                  <div className="mt-4 space-y-3">
                    {col.links.map((link, li) => (
                      <div key={li} className="grid gap-2 sm:grid-cols-2">
                        <Input
                          value={link.label}
                          placeholder="Label"
                          onChange={(e) =>
                            setIn('footer', {
                              columns: draft.footer.columns.map((c, i) =>
                                i === ci
                                  ? { ...c, links: c.links.map((l, j) => (j === li ? { ...l, label: e.target.value } : l)) }
                                  : c,
                              ),
                            })
                          }
                        />
                        <div className="flex gap-2">
                          <Input
                            value={link.href}
                            placeholder="/shop"
                            onChange={(e) =>
                              setIn('footer', {
                                columns: draft.footer.columns.map((c, i) =>
                                  i === ci
                                    ? { ...c, links: c.links.map((l, j) => (j === li ? { ...l, href: e.target.value } : l)) }
                                    : c,
                                ),
                              })
                            }
                          />
                          <button
                            onClick={() =>
                              setIn('footer', {
                                columns: draft.footer.columns.map((c, i) =>
                                  i === ci ? { ...c, links: c.links.filter((_, j) => j !== li) } : c,
                                ),
                              })
                            }
                            className="shrink-0 rounded-xl border border-white/15 px-3 text-xs text-ink-400 transition hover:border-red-400 hover:text-red-400"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        setIn('footer', {
                          columns: draft.footer.columns.map((c, i) =>
                            i === ci ? { ...c, links: [...c.links, { label: '', href: '' }] } : c,
                          ),
                        })
                      }
                      className="text-[11px] font-bold uppercase tracking-wider text-accent"
                    >
                      + Add link
                    </button>
                  </div>
                </div>
              ))}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Copyright line">
                  <Input value={draft.footer.copyright} onChange={(e) => setIn('footer', { copyright: e.target.value })} />
                </Field>
                <Field label="Payment note">
                  <Input value={draft.footer.paymentNote} onChange={(e) => setIn('footer', { paymentNote: e.target.value })} />
                </Field>
              </div>
            </Panel>
          )}

          {tab === 'seo' && (
            <Panel title="Search engines & sharing" description="What people see in Google results and when the site is shared.">
              <Field label="Page title" hint="Keep it under about 60 characters.">
                <Input value={draft.seo.title} onChange={(e) => setIn('seo', { title: e.target.value })} />
              </Field>
              <Field label="Meta description" hint="Around 150 characters works best.">
                <Textarea value={draft.seo.description} onChange={(e) => setIn('seo', { description: e.target.value })} />
              </Field>
              <ImageInput
                value={draft.seo.ogImage ? [draft.seo.ogImage] : []}
                onChange={(urls) => setIn('seo', { ogImage: urls[0] ?? '' })}
                max={1}
                compact
                folder="brand"
                label="Share image"
                hint="Shown when a link to the shop is posted on social media. 1200 × 630 is ideal."
              />
            </Panel>
          )}

          {tab === 'advanced' && (
            <Panel
              title="Maintenance mode"
              description="Takes the storefront offline for shoppers while you work. The dashboard stays reachable."
            >
              <Toggle
                checked={draft.maintenance.enabled}
                onChange={(v) => setIn('maintenance', { enabled: v })}
                label="Put the shop into maintenance mode"
                hint="Visitors see a holding page instead of the store."
              />
              <Field label="Holding page title">
                <Input value={draft.maintenance.title} onChange={(e) => setIn('maintenance', { title: e.target.value })} />
              </Field>
              <Field label="Holding page message">
                <Textarea value={draft.maintenance.message} onChange={(e) => setIn('maintenance', { message: e.target.value })} />
              </Field>
            </Panel>
          )}

          <SaveBar dirty={dirty} busy={busy} onSave={() => void save()} onReset={reset} />
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
