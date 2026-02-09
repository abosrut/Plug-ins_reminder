import { Store } from "./store.js";
import { seedData } from "./data.js";
import { initUI } from "./ui.js";

const start = async () => {
  await Store.seedIfEmpty(seedData);
  await initUI(Store);
};

start();
