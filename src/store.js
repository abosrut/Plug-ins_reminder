const DB_NAME = "plugins-reminder";
const DB_VERSION = 1;
const STORE_NAMES = ["apps", "groups", "plugins", "settings"];

const openDb = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      STORE_NAMES.forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: "id" });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withStore = async (storeName, mode, action) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = action(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
};

const getAll = (storeName) =>
  withStore(storeName, "readonly", (store) => store.getAll());

const get = (storeName, id) =>
  withStore(storeName, "readonly", (store) => store.get(id));

const put = (storeName, value) =>
  withStore(storeName, "readwrite", (store) => store.put(value));

const add = (storeName, value) =>
  withStore(storeName, "readwrite", (store) => store.add(value));

const remove = (storeName, id) =>
  withStore(storeName, "readwrite", (store) => store.delete(id));

const clear = (storeName) =>
  withStore(storeName, "readwrite", (store) => store.clear());

const seedIfEmpty = async (data) => {
  const apps = await getAll("apps");
  if (apps.length > 0) return;

  await Promise.all([
    ...data.apps.map((item) => add("apps", item)),
    ...data.groups.map((item) => add("groups", item)),
    ...data.plugins.map((item) => add("plugins", item)),
    put("settings", data.settings)
  ]);
};

const exportAll = async () => {
  const [apps, groups, plugins, settings] = await Promise.all([
    getAll("apps"),
    getAll("groups"),
    getAll("plugins"),
    getAll("settings")
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    apps,
    groups,
    plugins,
    settings: settings[0] ?? null
  };
};

const importAll = async (payload) => {
  await Promise.all(STORE_NAMES.map((name) => clear(name)));

  const tasks = [];
  (payload.apps || []).forEach((item) => tasks.push(add("apps", item)));
  (payload.groups || []).forEach((item) => tasks.push(add("groups", item)));
  (payload.plugins || []).forEach((item) => tasks.push(add("plugins", item)));
  if (payload.settings) {
    tasks.push(put("settings", payload.settings));
  }

  await Promise.all(tasks);
};

const createId = () => {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const Store = {
  getAll,
  get,
  put,
  add,
  remove,
  clear,
  seedIfEmpty,
  exportAll,
  importAll,
  createId
};
