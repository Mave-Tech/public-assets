/**
 * This is a custom javascript file that is used to fit the text to the container.
 * To use it, add the class "fittext" to the element you want to fit.
 */

// Helper function to transform text based on CSS text-transform
function transformText(text, styles) {
  const transform = styles.textTransform;
  if (transform === 'uppercase') return text.toUpperCase();
  if (transform === 'lowercase') return text.toLowerCase();
  if (transform === 'capitalize') {
    return text.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return text;
}

// Helper function to measure text with given styles
function measureText(context, text, styles) {
  context.font = styles.font;
  if (styles.letterSpacing !== 'normal') {
    context.letterSpacing = styles.letterSpacing;
  }

  const metrics = context.measureText(text);
  const letterSpacing = parseFloat(styles.letterSpacing) || 0;
  const letterCount = text.length - 1;
  const spacingWidth = letterCount * letterSpacing;

  return {
    width: metrics.width + spacingWidth,
    height:
      metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
  };
}

function getTextDimensions(element, styles) {
  // re-use canvas object for better performance
  const canvas =
    getTextDimensions.canvas ||
    (getTextDimensions.canvas = document.createElement("canvas"));

  const context = canvas.getContext("2d");

  // Process all nodes and total their dimensions 
  function processNode(node, parentStyles) {
    const nodeStyles = node.nodeType === Node.ELEMENT_NODE ? window.getComputedStyle(node) : parentStyles;

    const children = node.hasChildNodes() ? Array.from(node.childNodes).filter((child) => child.nodeType !== Node.COMMENT_NODE) : [node];

    // Process each child node
    return children.reduce(
      (acc, child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent.trim();
          if (!text) return acc;
          
          let processedText = transformText(text, nodeStyles);
          if (child.nextSibling) processedText += ' ';

          const dimensions = measureText(context, processedText, nodeStyles);
          return {
            width: acc.width + dimensions.width,
            height: Math.max(acc.height, dimensions.height)
          }
        }

        // Element nodes
        const childDimensions = processNode(child, nodeStyles);
        return {
          width: acc.width + childDimensions.width,
          height: Math.max(acc.height, childDimensions.height)
        }
      },
      { width: 0, height: 0 }
    );
  }
  return processNode(element, styles);
}

function fitAll(els) {
  function fit(el) {
    const containerWidth = el.clientWidth;
    const containerHeight = el.clientHeight;
    const textDimensions = getTextDimensions(
      el,
      getComputedStyle(el)
    );

    const widthRatio = containerWidth / textDimensions.width;
    const currentFontSize = parseFloat(getComputedStyle(el).fontSize);
    const maxFontSize = parseFloat(
      getComputedStyle(el).getPropertyValue("--max-font-size") ||
        currentFontSize
    );
    const minFontSize = parseFloat(
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
  for (i = 0; i < 3; i++) fitAll(document.querySelectorAll(".fittext"));
  window.FITTEXT_COMPLETED = true;
});
