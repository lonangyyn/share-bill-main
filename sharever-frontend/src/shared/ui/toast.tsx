import { create } from "zustand";

type Toast = { id: string; message: string };

type ToastState = {
  items: Toast[];
  push: (message: string) => void;
  remove: (id: string) => void;
};

const AUTO_DISMISS_MS = 3000;

export const useToast = create<ToastState>((set, get) => ({
  items: [],
  push: (message) => {
    const id = crypto.randomUUID();
    set((s) => ({
      items: [...s.items, { id, message }],
    }));
    setTimeout(() => {
      get().remove(id);
    }, AUTO_DISMISS_MS);
  },
  remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

export function ToastViewport() {
  const { items, remove } = useToast();
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3">
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => remove(t.id)}
          className="block rounded-2xl bg-gray-900 text-white px-4 py-3 shadow-xl animate-enter"
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
