import type { CSSProperties, ReactNode } from "react";

/**
 * Lightweight inline markdown renderer for chat messages.
 * Supports: **bold**, *italic*, `code`, ```code blocks```, [links](url), - lists
 * No external dependencies — renders to React elements with inline styles.
 */
export function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split("\n");
  const result: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trimStart().startsWith("```")) {
      const lang = line.trimStart().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      result.push(
        <pre
          key={`code-${result.length}`}
          style={codeBlockStyle}
          data-lang={lang || undefined}
        >
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // Table (lines starting with |)
    if (/^\|/.test(line.trim())) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\|/.test(lines[i].trim())) {
        tableLines.push(lines[i]);
        i++;
      }
      // Need at least a header + separator (2 lines)
      if (tableLines.length >= 2) {
        const parseRow = (row: string): string[] =>
          row.split("|").slice(1, -1).map((c) => c.trim());

        const headers = parseRow(tableLines[0]);
        // Skip separator row (index 1), parse data rows
        const dataRows = tableLines.slice(2).map(parseRow);

        result.push(
          <table
            key={`tbl-${result.length}`}
            style={tableStyle}
          >
            <thead>
              <tr>
                {headers.map((h, ci) => (
                  <th key={ci} style={thStyle}>
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={tdStyle}>
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>,
        );
      } else {
        // Not enough lines for a table, render as plain text
        for (const tl of tableLines) {
          result.push(
            <span
              key={`p-${result.length}`}
              style={{ display: "block", marginBottom: 2 }}
            >
              {renderInline(tl)}
            </span>,
          );
        }
      }
      continue;
    }

    // Unordered list item
    if (/^[\s]*[-*]\s/.test(line)) {
      const listItems: ReactNode[] = [];
      while (i < lines.length && /^[\s]*[-*]\s/.test(lines[i])) {
        listItems.push(
          <li key={listItems.length} style={{ marginBottom: 2 }}>
            {renderInline(lines[i].replace(/^[\s]*[-*]\s/, ""))}
          </li>,
        );
        i++;
      }
      result.push(
        <ul
          key={`ul-${result.length}`}
          style={{ margin: "4px 0", paddingLeft: 20, listStyleType: "disc" }}
        >
          {listItems}
        </ul>,
      );
      continue;
    }

    // Ordered list item
    if (/^[\s]*\d+\.\s/.test(line)) {
      const listItems: ReactNode[] = [];
      while (i < lines.length && /^[\s]*\d+\.\s/.test(lines[i])) {
        listItems.push(
          <li key={listItems.length} style={{ marginBottom: 2 }}>
            {renderInline(lines[i].replace(/^[\s]*\d+\.\s/, ""))}
          </li>,
        );
        i++;
      }
      result.push(
        <ol
          key={`ol-${result.length}`}
          style={{ margin: "4px 0", paddingLeft: 20 }}
        >
          {listItems}
        </ol>,
      );
      continue;
    }

    // Heading (clamp to h3+ in chat context)
    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
    if (headingMatch) {
      const level = Math.max(headingMatch[1].length, 3);
      const fontSize =
        ({ 3: 15, 4: 14, 5: 13, 6: 13 } as Record<number, number>)[level] ??
        14;
      result.push(
        <p
          key={`h-${result.length}`}
          style={{ fontWeight: 600, fontSize, margin: "8px 0 4px" }}
        >
          {renderInline(headingMatch[2])}
        </p>,
      );
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Regular text
    result.push(
      <span
        key={`p-${result.length}`}
        style={{ display: "block", marginBottom: 2 }}
      >
        {renderInline(line)}
      </span>,
    );
    i++;
  }

  return result;
}

/** Parse inline markdown: bold, italic, code, links */
function renderInline(text: string): ReactNode[] {
  const result: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("`")) {
      result.push(
        <code key={result.length} style={inlineCodeStyle}>
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      result.push(
        <strong key={result.length}>{token.slice(2, -2)}</strong>,
      );
    } else if (token.startsWith("*")) {
      result.push(<em key={result.length}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("[")) {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (linkMatch) {
        result.push(
          <a
            key={result.length}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            style={linkStyle}
          >
            {linkMatch[1]}
          </a>,
        );
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
}

const codeBlockStyle: CSSProperties = {
  margin: "6px 0",
  padding: "10px 12px",
  borderRadius: 6,
  backgroundColor: "rgba(0,0,0,0.15)",
  fontSize: 12,
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  overflow: "auto",
  whiteSpace: "pre",
  lineHeight: 1.5,
};

const inlineCodeStyle: CSSProperties = {
  padding: "1px 5px",
  borderRadius: 3,
  backgroundColor: "rgba(0,0,0,0.12)",
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: "0.9em",
};

const linkStyle: CSSProperties = {
  color: "var(--ai-me-primary, #6366f1)",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};

const tableStyle: CSSProperties = {
  margin: "6px 0",
  borderCollapse: "collapse",
  width: "100%",
  fontSize: 13,
};

const thStyle: CSSProperties = {
  padding: "4px 8px",
  borderBottom: "2px solid rgba(0,0,0,0.15)",
  textAlign: "left",
  fontWeight: 600,
  fontSize: 12,
};

const tdStyle: CSSProperties = {
  padding: "4px 8px",
  borderBottom: "1px solid rgba(0,0,0,0.08)",
  fontSize: 12,
};
