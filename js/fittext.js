/**
 * This is a custom javascript file that is used to fit the text to the container.
 * To use it, add the class "fittext" to the element you want to fit.
 */

function getTextDimensions(element, styles) {
  // re-use canvas object for better performance
  const canvas =
    getTextDimensions.canvas ||
    (getTextDimensions.canvas = document.createElement("canvas"));

  const context = canvas.getContext("2d");
  window.context = context;

  // If it's an md-block or has nested elements
  const paragraph = element.querySelector('p');
  if (paragraph) {
    let totalWidth = 0;
    let maxHeight = 0;
    const nodes = Array.from(paragraph.childNodes);

    // Measure each node with its proper styling
    nodes.forEach((node, index) => {
      let nodeText = node.textContent.replace(/\s+/g, ' ').trim();

      let textTransform;
      if (node.nodeType === Node.ELEMENT_NODE) {
        const nodeStyles = window.getComputedStyle(node);
        textTransform = nodeStyles.textTransform;
      } else {
        // Parent style for text nodes
        textTransform = styles.textTransform; 
      }

      // Apply text transform
      if (textTransform === 'uppercase') {
        nodeText = nodeText.toUpperCase();
      } else if (textTransform === 'lowercase') {
        nodeText = nodeText.toLowerCase();
      } else if (textTransform === 'capitalize') {
        nodeText = nodeText.replace(/\b\w/g, (c) => c.toUpperCase());
      }

      // Skip empty or whitespace-only nodes
      if (!nodeText || nodeText.trim() === '') {
        return;
      }

      // Get the proper font style for this node
      if (node.nodeType === Node.ELEMENT_NODE) {
        const nodeStyles = window.getComputedStyle(node);
        const font = `${nodeStyles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
        context.font = font;

        // Apply letter spacing if specified
        if (nodeStyles.letterSpacing !== 'normal') {
          context.letterSpacing = nodeStyles.letterSpacing;
        }
      } else {
        // use parent styles
        const font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
        context.font = font;

        // Apply letter spacing if specified
        if (styles.letterSpacing !== 'normal') {
          context.letterSpacing = styles.letterSpacing;
        }
      }

      // Measure the text in this node
      const nodeMetrics = context.measureText(nodeText);

      // Add letter spacing to width calculation
      const letterSpacing = parseFloat(styles.letterSpacing) || 0;
      const letterCount = nodeText.length - 1;
      const spacingWidth = letterCount * letterSpacing;

      const totalNodeWidth = nodeMetrics.width + spacingWidth;

      // Add word spacing between nodes (30% of font size)
      // This compensates for browser's rendering of spaces between inline elements and text nodes. 
      // The percentage is based on typical typographic spacing standards where word spacing is roughly 1/3 of the font size.
      const spacing =
        index < nodes.length - 1 ? parseFloat(styles.fontSize) * 0.3 : 0;
      totalWidth += totalNodeWidth + spacing;

      // Track maximum height from actual text
      const nodeHeight =
        nodeMetrics.actualBoundingBoxAscent +
        nodeMetrics.actualBoundingBoxDescent;
      maxHeight = Math.max(maxHeight, nodeHeight);
    });

    return {
      width: totalWidth,
      height: maxHeight,
    };
  }

  // Otherwise, do regular text measurement
  const elementText = element.innerText;

  context.font = styles.font;
  if (styles.letterSpacing === 'normal') context.letterSpacing = '0px';
  else context.letterSpacing = styles.letterSpacing;

  const metrics = context.measureText(elementText);

  return {
    width: metrics.width,
    height:
      metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
  };
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
