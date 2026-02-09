import { runMarkdownTests } from "./markdown.test.js";

const results = [];

const assert = (condition, message) => {
  if (!condition) {
    results.push({ ok: false, message });
    return;
  }
  results.push({ ok: true, message });
};

runMarkdownTests(assert);

const failed = results.filter((item) => !item.ok);

if (failed.length > 0) {
  console.error("Tests failed:");
  failed.forEach((item) => console.error(`- ${item.message}`));
  process.exit(1);
} else {
  console.log(`All ${results.length} tests passed.`);
}
