import * as RadixToast from '@radix-ui/react-toast';
import { create } from 'zustand';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastStore {
  toasts: ToastItem[];
  add: (t: Omit<ToastItem, 'id'>) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],
  add: (t) =>
    set((s) => ({ toasts: [...s.toasts, { ...t, id: crypto.randomUUID() }] })),
  remove: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().add({ title, description, variant: 'success' }),
  error: (title: string, description?: string) =>
    useToastStore.getState().add({ title, description, variant: 'error' }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().add({ title, description, variant: 'warning' }),
  info: (title: string, description?: string) =>
    useToastStore.getState().add({ title, description, variant: 'info' }),
};

const variantIcon: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const variantColor: Record<ToastVariant, string> = {
  success: 'var(--accent-success)',
  error: 'var(--accent-danger)',
  warning: 'var(--accent-warning)',
  info: 'var(--accent-secondary)',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, remove } = useToastStore();
  return (
    <RadixToast.Provider swipeDirection="right">
      {children}
      {toasts.map((t) => (
        <RadixToast.Root
          key={t.id}
          className="toast-root"
          onOpenChange={(open) => { if (!open) remove(t.id); }}
          duration={4000}
        >
          <div className="toast-inner">
            <span className="toast-icon" style={{ color: variantColor[t.variant] }}>
              {variantIcon[t.variant]}
            </span>
            <div className="toast-content">
              <RadixToast.Title className="toast-title">{t.title}</RadixToast.Title>
              {t.description && (
                <RadixToast.Description className="toast-desc">{t.description}</RadixToast.Description>
              )}
            </div>
            <RadixToast.Close className="toast-close" aria-label="Close">×</RadixToast.Close>
          </div>
        </RadixToast.Root>
      ))}
      <RadixToast.Viewport className="toast-viewport" />
    </RadixToast.Provider>
  );
}
