// FILE: src/pages/admin/ProductEditor.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { logActivity } from '../../lib/activity';
import ImageInput from '../../components/ImageInput';
import { Button, Field, Input, Modal, Select, Textarea, Toggle } from '../../components/ui';
import type { Product, ProductOption } from '../../lib/types';
import { cn, discountPercent, errorMessage, slugify } from '../../lib/utils';

const BLANK: Omit<Product, 'id'> = {
  name: '', slug: '', sku: '', description: '', shortDescription: '',
  price: 0, compareAtPrice: 0, cost: 0,
  images: [], categoryId: '', categoryName: '', tags: [],
  options: [], stock: 0, trackStock: true, status: 'active',
  featured: false, bestSeller: false, newArrival: true,
  rating: 0, reviewCount: 0, soldCount: 0, order: 0,
  createdAt: 0, updatedAt: 0,
};

type Tab = 'basics' | 'media' | 'pricing' | 'options' | 'visibility';

const TABS: { id: Tab; label: string }[] = [
  { id: 'basics', label: 'Basics' },
  { id: 'media', label: 'Images' },
  { id: 'pricing', label: 'Price & stock' },
  { id: 'options', label: 'Variants' },
  { id: 'visibility', label: 'Visibility' },
];

interface Props {
  open: boolean;
  product: Product | null;
  onClose: () => void;
}

const ProductEditor: React.FC<Props> = ({ open, product, onClose }) => {
  const { categories, money } = useStore();
  const { admin } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState<Omit<Product, 'id'>>(BLANK);
  const [tab, setTab] = useState<Tab>('basics');
  const [tagDraft, setTagDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTab('basics');
    setTagDraft('');
    if (product) {
      const { id, ...rest } = product;
      setForm({ ...BLANK, ...rest });
      setSlugTouched(true);
    } else {
      setForm({ ...BLANK });
      setSlugTouched(false);
    }
  }, [open, product]);

  const set = <K extends keyof Omit<Product, 'id'>>(key: K, value: Omit<Product, 'id'>[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const margin = useMemo(() => {
    if (!form.cost || !form.price) return null;
    return Math.round(((form.price - form.cost) / form.price) * 100);
  }, [form.cost, form.price]);

  const off = discountPercent(form.price, form.compareAtPrice);

  const addTag = () => {
    const t = tagDraft.trim().toLowerCase();
    if (!t || form.tags.includes(t)) return setTagDraft('');
    set('tags', [...form.tags, t]);
    setTagDraft('');
  };

  const addOption = () => set('options', [...form.options, { name: '', values: [] }]);

  const patchOption = (i: number, patch: Partial<ProductOption>) =>
    set('options', form.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));

  const save = async (andPublish?: boolean) => {
    if (!form.name.trim()) {
      setTab('basics');
      return toast.error('A product needs a name.');
    }
    if (form.price <= 0) {
      setTab('pricing');
      return toast.error('Set a price above zero.');
    }

    setBusy(true);
    const now = Date.now();
    const category = categories.find((c) => c.id === form.categoryId);

    const payload: Omit<Product, 'id'> = {
      ...form,
      name: form.name.trim(),
      slug: (slugTouched && form.slug ? form.slug : slugify(form.name)) || slugify(form.name),
      categoryName: category?.name ?? '',
      status: andPublish ? 'active' : form.status,
      options: form.options.filter((o) => o.name.trim() && o.values.length),
      price: Number(form.price) || 0,
      compareAtPrice: Number(form.compareAtPrice) || 0,
      cost: Number(form.cost) || 0,
      stock: Number(form.stock) || 0,
      createdAt: product?.createdAt || now,
      updatedAt: now,
    };

    try {
      if (product) {
        await setDoc(doc(db, 'products', product.id), payload, { merge: true });
        logActivity(admin?.email ?? 'admin', 'updated product', payload.name);
        toast.success(`“${payload.name}” updated.`);
      } else {
        await addDoc(collection(db, 'products'), { ...payload, createdAtServer: serverTimestamp() });
        logActivity(admin?.email ?? 'admin', 'created product', payload.name);
        toast.success(`“${payload.name}” is now on the shop.`);
      }
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={product ? 'Edit product' : 'New product'}
      subtitle={product ? product.name : 'It goes live on the storefront the moment you save.'}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-ink-500">
            {form.status === 'active' ? 'Visible to shoppers' : form.status === 'draft' ? 'Hidden — draft' : 'Archived'}
            {form.price > 0 && ` · ${money(form.price)}`}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
            {form.status !== 'active' && (
              <Button variant="accent" onClick={() => void save(true)} loading={busy}>
                Save & publish
              </Button>
            )}
            <Button onClick={() => void save(false)} loading={busy}>Save</Button>
          </div>
        </div>
      }
    >
      {/* Tabs */}
      <div className="no-scrollbar -mt-2 mb-7 flex gap-1 overflow-x-auto border-b border-ink-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-px shrink-0 border-b-2 px-4 pb-3 pt-1 text-[12px] font-bold uppercase tracking-[0.12em] transition',
              tab === t.id ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-400 hover:text-ink-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'basics' && (
        <div className="space-y-5">
          <Field label="Product name" required>
            <Input
              value={form.name}
              onChange={(e) => {
                set('name', e.target.value);
                if (!slugTouched) set('slug', slugify(e.target.value));
              }}
              placeholder="Leather weekend bag"
              autoFocus
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category">
              <Select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                <option value="">Uncategorised</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="SKU / item code">
              <Input value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="BAG-001" />
            </Field>
          </div>

          <Field label="Short description" hint="One line shown under the product name.">
            <Input
              value={form.shortDescription}
              onChange={(e) => set('shortDescription', e.target.value)}
              placeholder="Full-grain leather, fits a laptop and a weekend."
            />
          </Field>

          <Field label="Full description">
            <Textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Materials, dimensions, care instructions…"
              className="min-h-44"
            />
          </Field>

          <Field label="Tags" hint="Used by the search box. Press Enter to add.">
            <div className="flex gap-2">
              <Input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="leather, travel, gift"
              />
              <Button type="button" variant="outline" onClick={addTag} className="shrink-0">Add</Button>
            </div>
            {form.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.tags.map((t) => (
                  <button
                    key={t}
                    onClick={() => set('tags', form.tags.filter((x) => x !== t))}
                    className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-red-100 hover:text-red-700"
                  >
                    {t} <Trash2 size={11} />
                  </button>
                ))}
              </div>
            )}
          </Field>

          <Field label="URL slug" hint="Where the product lives, e.g. /product/leather-weekend-bag">
            <Input
              value={form.slug}
              onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }}
              placeholder="leather-weekend-bag"
            />
          </Field>
        </div>
      )}

      {tab === 'media' && (
        <div className="space-y-5">
          <ImageInput
            value={form.images}
            onChange={(urls) => set('images', urls)}
            max={8}
            folder="products"
            label="Product gallery"
            hint="The first image is the one shoppers see in listings. Drag to reorder."
          />
          {form.images.length === 0 && (
            <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-800">
              A product without an image still sells — just not very well. Add at least one.
            </p>
          )}
        </div>
      )}

      {tab === 'pricing' && (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Selling price" required>
              <Input
                type="number"
                min={0}
                step="any"
                value={form.price || ''}
                onChange={(e) => set('price', Number(e.target.value))}
                placeholder="0"
              />
            </Field>
            <Field label="Compare-at price" hint="Shown struck through. Leave 0 for no discount badge.">
              <Input
                type="number"
                min={0}
                step="any"
                value={form.compareAtPrice || ''}
                onChange={(e) => set('compareAtPrice', Number(e.target.value))}
                placeholder="0"
              />
            </Field>
          </div>

          {off > 0 && (
            <p className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
              Shoppers see a {off}% discount badge on this product.
            </p>
          )}

          <Field label="Cost price" hint="Private — used only to show your margin here.">
            <Input
              type="number"
              min={0}
              step="any"
              value={form.cost || ''}
              onChange={(e) => set('cost', Number(e.target.value))}
              placeholder="0"
            />
          </Field>

          {margin !== null && (
            <p className="text-xs text-ink-600">
              Margin: <strong className={margin < 0 ? 'text-red-600' : 'text-emerald-600'}>{margin}%</strong>{' '}
              ({money(form.price - form.cost)} per unit)
            </p>
          )}

          <div className="rounded-xl border border-ink-200 p-5">
            <Toggle
              checked={form.trackStock}
              onChange={(v) => set('trackStock', v)}
              label="Track stock for this product"
              hint="When on, the product is marked sold out at zero."
            />
            {form.trackStock && (
              <div className="mt-5">
                <Field label="Units in stock">
                  <Input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => set('stock', Number(e.target.value))}
                  />
                </Field>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'options' && (
        <div className="space-y-5">
          <p className="text-xs leading-relaxed text-ink-500">
            Add choices a shopper must make — size, colour, flavour. They appear as buttons on the product page
            and are recorded on the order.
          </p>

          {form.options.map((opt, i) => (
            <div key={i} className="rounded-xl border border-ink-200 p-5">
              <div className="flex gap-3">
                <Field label="Option name" className="flex-1">
                  <Input
                    value={opt.name}
                    onChange={(e) => patchOption(i, { name: e.target.value })}
                    placeholder="Size"
                  />
                </Field>
                <button
                  onClick={() => set('options', form.options.filter((_, idx) => idx !== i))}
                  className="mt-6 h-11 shrink-0 rounded-xl border border-ink-200 px-3 text-ink-500 transition hover:border-red-400 hover:text-red-600"
                  aria-label="Remove option"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <Field label="Values" hint="Comma separated — S, M, L, XL" className="mt-4">
                <Input
                  value={opt.values.join(', ')}
                  onChange={(e) =>
                    patchOption(i, {
                      values: e.target.value.split(',').map((v) => v.trim()).filter(Boolean),
                    })
                  }
                  placeholder="S, M, L"
                />
              </Field>
            </div>
          ))}

          <Button variant="outline" onClick={addOption} icon={<Plus size={15} />}>
            Add an option
          </Button>
        </div>
      )}

      {tab === 'visibility' && (
        <div className="space-y-5">
          <Field label="Status">
            <Select value={form.status} onChange={(e) => set('status', e.target.value as Product['status'])}>
              <option value="active">Active — visible in the shop</option>
              <option value="draft">Draft — hidden from shoppers</option>
              <option value="archived">Archived — hidden and out of reports</option>
            </Select>
          </Field>

          <div className="space-y-4 rounded-xl border border-ink-200 p-5">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-500">
              <Sparkles size={13} className="text-accent" /> Home page placement
            </p>
            <Toggle
              checked={form.featured}
              onChange={(v) => set('featured', v)}
              label="Featured"
              hint="Shows in the “Featured” row on the home page."
            />
            <Toggle
              checked={form.newArrival}
              onChange={(v) => set('newArrival', v)}
              label="New arrival"
              hint="Shows in the “New arrivals” row and gets a New badge."
            />
            <Toggle
              checked={form.bestSeller}
              onChange={(v) => set('bestSeller', v)}
              label="Best seller"
              hint="Shows in the “Best sellers” row with a badge."
            />
          </div>

          <Field label="Sort weight" hint="Lower numbers appear first inside a category listing.">
            <Input type="number" value={form.order} onChange={(e) => set('order', Number(e.target.value))} />
          </Field>
        </div>
      )}
    </Modal>
  );
};

export default ProductEditor;
