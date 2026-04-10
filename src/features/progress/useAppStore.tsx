import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { defaultStore, type AppStore } from "./appStore";

const LS_KEY = "technikum_ready_store_v1";

function safeParse(raw: string | null): AppStore | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object") return null;
    if (v.version !== 1) return null;
    return v as AppStore;
  } catch {
    return null;
  }
}

export function loadStore(): AppStore {
  const parsed = safeParse(localStorage.getItem(LS_KEY));
  return parsed ? mergeWithDefaults(parsed) : structuredClone(defaultStore);
}

export function saveStore(store: AppStore) {
  localStorage.setItem(LS_KEY, JSON.stringify(store));
}

function mergeWithDefaults(store: AppStore): AppStore {
  return {
    ...structuredClone(defaultStore),
    ...store,
    settings: { ...structuredClone(defaultStore.settings), ...store.settings },
    stats: { ...structuredClone(defaultStore.stats), ...store.stats },
    habits: { ...structuredClone(defaultStore.habits), ...store.habits },
    journal: { ...structuredClone(defaultStore.journal), ...store.journal },
  };
}

type AppStoreCtx = {
  store: AppStore;
  setStore: (s: AppStore) => void;
  update: (fn: (draft: AppStore) => void) => void;
};

const Ctx = createContext<AppStoreCtx | null>(null);

export function AppStoreProvider(props: { children: ReactNode }) {
  const [store, setStore] = useState<AppStore>(() => loadStore());

  useEffect(() => {
    saveStore(store);
  }, [store]);

  const update = useCallback((fn: (draft: AppStore) => void) => {
    setStore((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ store, setStore, update }), [store, update]);
  return <Ctx.Provider value={value}>{props.children}</Ctx.Provider>;
}

export function useAppStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppStore must be used within AppStoreProvider");
  return v;
}

