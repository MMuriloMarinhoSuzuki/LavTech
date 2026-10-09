import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ReceiptDocument } from '@/components/receipt/ReceiptDocument';
import { orderService } from '@/services/api';
import { getErrorMessage } from '@/utils/api';
import { useToast } from '@/context/ToastContext';
import type { ReceiptPayload } from '@/types';

interface ReceiptModalProps {
  open: boolean;
  orderId: number | null;
  onClose: () => void;
}

/**
 * Notinha do pedido. Mostra as DUAS vias (comanda do cliente + via do atendente)
 * e imprime as duas de uma vez, em papeis separados, com um único clique.
 */
export function ReceiptModal({ open, orderId, onClose }: ReceiptModalProps) {
  const toast = useToast();
  const [payload, setPayload] = useState<ReceiptPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const toastRef = useRef(toast);
  toastRef.current = toast;

  useEffect(() => {
    if (!open || !orderId) return;
    let active = true;
    setLoading(true);
    setPayload(null);
    orderService
      .receipt(orderId)
      .then((data) => {
        if (active) setPayload(data);
      })
      .catch((error) => {
        if (active) {
          toastRef.current.error(getErrorMessage(error));
          onCloseRef.current();
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, orderId]);

  const ready = !!payload;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Notinha do pedido"
        description="Confira as duas vias. O botão imprime as duas de uma vez, cada uma em seu papel."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={() => window.print()} disabled={loading || !ready} data-print-vias>
              <Printer className="h-4 w-4" />
              Imprimir as 2 vias
            </Button>
          </>
        }
      >
        {loading || !payload ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Comanda do cliente (1ª via)
              </p>
              <div className="flex justify-center rounded-2xl bg-slate-100 p-4">
                <div className="overflow-hidden rounded-sm bg-white shadow-md">
                  <ReceiptDocument data={payload.customer} />
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Via do atendente (2ª via)
              </p>
              <div className="flex justify-center rounded-2xl bg-slate-100 p-4">
                <div className="overflow-hidden rounded-sm bg-white shadow-md">
                  <ReceiptDocument data={payload.full} />
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-slate-400">
          No navegador, escolha a impressora térmica e papel de 80mm. As duas vias saem em
          papeis separados, uma seguida da outra.
        </p>
      </Modal>

      {ready &&
        createPortal(
          <div id="receipt-print-root" className="hidden print:block">
            <ReceiptDocument data={payload.customer} />
            <ReceiptDocument data={payload.full} />
          </div>,
          document.body
        )}
    </>
  );
}