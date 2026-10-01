// FILE: src/components/ShopQr.tsx
import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Download } from 'lucide-react';
import { Button } from './ui';
import { useToast } from '../context/ToastContext';

interface Props {
  /** Plain shop link, for sharing in chats. */
  url: string;
  /** Link encoded in the QR (carries ?src=qr so scans can be counted). */
  qrUrl: string;
  fileName: string;
}

const ShopQr: React.FC<Props> = ({ url, qrUrl, fileName }) => {
  const toast = useToast();
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(qrUrl, { width: 720, margin: 2, errorCorrectionLevel: 'M' })
      .then((u) => { if (alive) setDataUrl(u); })
      .catch(() => { if (alive) setDataUrl(''); });
    return () => { alive = false; };
  }, [qrUrl]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Shop link copied.');
    } catch {
      toast.error('Could not copy. Your browser blocked clipboard access.');
    }
  };

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="rounded-2xl bg-white p-3">
        {dataUrl ? (
          <img src={dataUrl} alt="QR code for your shop" className="h-44 w-44" />
        ) : (
          <div className="h-44 w-44" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <p className="break-all rounded-xl border border-white/10 bg-white/[0.03] p-3 font-mono text-xs text-ink-300">
          {url}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="subtle" icon={<Copy size={14} />} onClick={() => void copy()}>
            Copy link
          </Button>
          {dataUrl && (
            <a href={dataUrl} download={fileName}>
              <Button size="sm" variant="subtle" icon={<Download size={14} />}>
                Download QR
              </Button>
            </a>
          )}
        </div>
        <p className="text-[11px] leading-relaxed text-ink-500">
          Print the QR on a poster, bag or receipt. Anyone who scans it lands on your shop.
        </p>
      </div>
    </div>
  );
};

export default ShopQr;
