/**
 * This is a custom javascript file that is used to fit the text to the container.
 * To use it, add the class "fittext" to the element you want to fit.
 */

function parseFontSize(fontSize) {
  if (typeof fontSize === "number") return fontSize;

  if (fontSize.includes("var(")) {
    const varName = fontSize.match(/var\((.*)\)/)[1];
    fontSize = getComputedStyle(document.body).getPropertyValue(varName);
  }

  if (fontSize.includes("rem"))
    return (
      parseFloat(fontSize) *
      parseFloat(getComputedStyle(document.body).fontSize)
    );

  return parseFloat(fontSize);
}

// Helper function to transform text based on CSS text-transform
function transformText(text, styles) {
  const transform = styles.textTransform;
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  if (transform === "capitalize") {
    return text.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return text;
}

// Helper function to measure text with given styles
function measureText(context, text, styles) {
  context.font = styles.font;
  if (styles.letterSpacing === "normal") context.letterSpacing = "0px";
  else context.letterSpacing = styles.letterSpacing;

  const metrics = context.measureText(text);

  return {
    width: metrics.width,
    height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
  };
}

function getTextDimensions(element, styles) {
  // re-use canvas object for better performance
  const canvas =
    getTextDimensions.canvas ||
    (getTextDimensions.canvas = document.createElement("canvas"));

  // If canvas isn't on DOM yet, append it
  if (window.DEBUG_DRAW && !canvas.parentNode) {
    canvas.width = 1080;
    canvas.height = 500;
    canvas.style.backgroundColor = "aliceblue";
    document.body.appendChild(canvas);
  }

  const context = canvas.getContext("2d");

  // Process all nodes and total their dimensions
  function processNode(node, parentStyles) {
    const nodeStyles =
      node.nodeType === Node.ELEMENT_NODE
        ? window.getComputedStyle(node)
        : parentStyles;

    const children = node.hasChildNodes()
      ? Array.from(node.childNodes).filter(
          (child) => child.nodeType !== Node.COMMENT_NODE
        )
      : [node];

    // Process each child node
    return children.reduce(
      (acc, child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent.trim();
          if (!text) return acc;

          let processedText = transformText(text, nodeStyles);

          if (
            (child.nextSibling ||
              (child.parentNode !== element && child.parentNode.nextSibling)) &&
            (child.nextSibling?.textContent.trim() ||
              child.parentNode.nextSibling?.textContent.trim())
          ) {
            processedText += " ";
          }

          const dimensions = measureText(context, processedText, nodeStyles);

          // Draw the text on the canvas
          if (window.DEBUG_DRAW) {
            context.fillText(
              processedText,
              window.currentWidth,
              150 * (window.i + 1)
            );
            window.currentWidth += dimensions.width;
          }

          return {
            width: acc.width + dimensions.width,
            height: Math.max(acc.height, dimensions.height),
          };
        }

        // Element nodes
        const childDimensions = processNode(child, nodeStyles);
        return {
          width: acc.width + childDimensions.width,
          height: Math.max(acc.height, childDimensions.height),
        };
      },
      { width: 0, height: 0 }
    );
  }
  const nodeDimensions = processNode(element, styles);

  if (window.DEBUG_DRAW) {
    context.strokeRect(
      0,
      150 * (window.i + 1) - nodeDimensions.height,
      nodeDimensions.width,
      nodeDimensions.height
    );
  }
  return nodeDimensions;
}

function fitAll(els) {
  function fit(el) {
    const containerWidth = el.clientWidth;
    const containerHeight = el.clientHeight;
    const textDimensions = getTextDimensions(el, getComputedStyle(el));

    const widthRatio = containerWidth / textDimensions.width;
    const setFontSize = parseFontSize(
      Array.from(document.styleSheets)
        .filter((sheet) => !sheet.href) // Filter out remote stylesheets
        .map((sheet) => Array.from(sheet.cssRules))
        .flat()
        .filter((rule) => el.matches(rule.selectorText)) // Find CSS Rules that apply to the current element
        .map((rule) => rule.style.fontSize)
        .filter((fs) => fs)[0]
    );
    const currentFontSize = parseFontSize(getComputedStyle(el).fontSize);
    const maxFontSize = parseFontSize(
      getComputedStyle(el).getPropertyValue("--max-font-size") || setFontSize
    );
    const minFontSize = parseFontSize(
      getComputedStyle(el).getPropertyValue("--min-font-size") || 0
    );
    const newFontSize = Math.floor(
      Math.max(minFontSize, Math.min(currentFontSize * widthRatio, maxFontSize))
    );
    el.style.fontSize = `${newFontSize}px`;
  }

  for (const el of els) fit(el);
}

window.addEventListener("load", () => {
  window.DEBUG_DRAW =
    new URLSearchParams(window.location.search).get("debug_draw") === "true";

  for (window.i = 0; i < 3; i++) {
    window.currentWidth = 0;
    fitAll(document.querySelectorAll(".fittext"));
  }
  window.FITTEXT_COMPLETED = true;
});
