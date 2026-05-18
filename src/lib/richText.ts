export function stripHtml(value = "") {
  if (!value) return "";
  if (typeof window === "undefined") {
    return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  const element = document.createElement("div");
  element.innerHTML = value;
  return element.textContent?.replace(/\s+/g, " ").trim() || "";
}

export function isRichText(value = "") {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function sanitizeRichTextHtml(value = "") {
  if (!value) return "";
  if (typeof window === "undefined") return stripHtml(value);

  const template = document.createElement("template");
  template.innerHTML = value;
  const allowedTags = new Set(["B", "STRONG", "I", "EM", "U", "P", "BR", "UL", "OL", "LI", "H2", "H3", "SPAN", "DIV", "FONT"]);
  const allowedFonts = new Set(["Inter", "Georgia", "Arial", "Verdana", "Times New Roman", "Courier New"]);

  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        if (!allowedTags.has(element.tagName)) {
          const children = Array.from(element.childNodes);
          element.replaceWith(...children);
          children.forEach(walk);
          return;
        }

        const font = (element.getAttribute("face") || element.style.fontFamily || "").replace(/["']/g, "");
        Array.from(element.attributes).forEach((attr) => element.removeAttribute(attr.name));
        if (font && allowedFonts.has(font)) {
          if (element.tagName === "FONT") {
            const span = document.createElement("span");
            span.innerHTML = element.innerHTML;
            span.style.fontFamily = font;
            element.replaceWith(span);
            walk(span);
            return;
          }
          element.style.fontFamily = font;
        } else {
          element.removeAttribute("style");
        }
      }
      walk(child);
    });
  };

  walk(template.content);
  return template.innerHTML.trim();
}
