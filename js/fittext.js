/**
 * This is a custom javascript file that is used to fit the text to the container.
 * To use it, add the class "fittext" to the element you want to fit.
 *
 * By default the text is sized to fit on one line. Add data-fittext-mode="word"
 * to size it so its widest word fits instead, and let it wrap between words.
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

// One canvas, created on first use, measures all the text.
function getCanvas() {
  return (
    getCanvas.canvas || (getCanvas.canvas = document.createElement("canvas"))
  );
}

function getTextDimensions(element, styles) {
  const canvas = getCanvas();

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

    // An element with no child nodes has no text to measure. Falling back to
    // [node] here would make processNode recurse into itself forever.
    const children = node.hasChildNodes()
      ? Array.from(node.childNodes).filter(
          (child) => child.nodeType !== Node.COMMENT_NODE
        )
      : [];

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

// The width of the element's widest word, measured in the element's own font.
// innerText already applies text-transform and turns each <br> into a line
// break. Splitting only at spaces and line breaks, where CSS wraps, keeps a
// no-break space inside its word.
function getWidestWordWidth(element, styles) {
  const context = getCanvas().getContext("2d");
  const words = element.innerText.split(/[ \n]+/).filter(Boolean);
  return Math.max(
    0,
    ...words.map((word) => measureText(context, word, styles).width)
  );
}

function fitAll(els) {
  function fit(el) {
    const containerWidth = el.clientWidth;
    const containerHeight = el.clientHeight;
    const textWidth =
      el.getAttribute("data-fittext-mode") === "word"
        ? getWidestWordWidth(el, getComputedStyle(el))
        : getTextDimensions(el, getComputedStyle(el)).width;

    const widthRatio = containerWidth / textWidth;

    // This is a recursive function that expands the rules of a CSS rule.
    // It is used to handle nested rules.
    function expandRules(rule) {
      if (rule.cssRules) {
        return [
          rule,
          ...Array.from(rule.cssRules).map((childRule) => {
            const parentSelector = rule.selectorText;
            const expandedSelector = childRule.selectorText.replace(
              /&/g,
              parentSelector
            );
            const expandedRule = {
              selectorText: expandedSelector,
              style: childRule.style,
              cssRules: childRule.cssRules,
            };
            return expandRules(expandedRule);
          }),
        ].flat(Infinity);
      }
      return [rule];
    }

    const setFontSize = parseFontSize(
      Array.from(document.styleSheets)
        .filter((sheet) => !sheet.href) // Filter out remote stylesheets
        .map((sheet) => Array.from(sheet.cssRules))
        .flat()
        .map((rule) => expandRules(rule))
        .flat(Infinity)
        .filter((rule) => rule.selectorText && el.matches(rule.selectorText)) // Find CSS Rules that apply to the current element
        .map((rule) => rule.style.fontSize)
        .filter((fs) => fs)
        .at(-1) || "1rem"
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

  let groups = [];

  for (const el of els) {
    if (!el.innerText) continue;
    try {
      fit(el);
    } catch (err) {
      // Never let a single element abort fitting for the rest of the page
      console.error("fittext: could not fit element", el, err);
      continue;
    }
    const group = el.getAttribute("data-fittext-group");
    if (group && !groups.includes(group)) groups.push(group);
  }

  // Group elements by data-fittext-group
  for (const group of groups) {
    const groupElements = document.querySelectorAll(
      `[data-fittext-group="${group}"]:not(:empty)`
    );
    const minFontSize = Math.min(
      ...Array.from(groupElements).map((el) =>
        parseFontSize(getComputedStyle(el).fontSize)
      )
    );
    for (const el of groupElements) el.style.fontSize = `${minFontSize}px`;
  }
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
