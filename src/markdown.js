const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderInline = (text) => {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href=\"$2\" target=\"_blank\" rel=\"noopener\">$1</a>");
  return html;
};

export const renderMarkdown = (input) => {
  if (!input) return "";
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let listBuffer = [];
  let paragraphBuffer = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) return;
    const text = paragraphBuffer.join(" ").trim();
    if (text) {
      blocks.push(`<p>${renderInline(text)}</p>`);
    }
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (listBuffer.length === 0) return;
    const items = listBuffer.map((item) => `<li>${renderInline(item)}</li>`).join("");
    blocks.push(`<ul>${items}</ul>`);
    listBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      blocks.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const listMatch = line.match(/^[-*]\s+(.*)$/);
    if (listMatch) {
      flushParagraph();
      listBuffer.push(listMatch[1]);
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();
  flushList();

  return blocks.join("\n");
};
