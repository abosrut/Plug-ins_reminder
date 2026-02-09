import { renderMarkdown } from "../src/markdown.js";

export const runMarkdownTests = (assert) => {
  const heading = renderMarkdown("# Title");
  assert(heading.includes("<h1>Title</h1>"), "renders h1");

  const list = renderMarkdown("- One\n- Two");
  assert(list.includes("<ul>"), "renders list wrapper");
  assert(list.includes("<li>One</li>"), "renders list item");

  const inline = renderMarkdown("**Bold** and *italic* with `code`");
  assert(inline.includes("<strong>Bold</strong>"), "renders bold");
  assert(inline.includes("<em>italic</em>"), "renders italic");
  assert(inline.includes("<code>code</code>"), "renders code");

  const link = renderMarkdown("[Site](https://example.com)");
  assert(link.includes("href=\"https://example.com\""), "renders link");
};
