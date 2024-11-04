/**
 * This is a custom javascript file that is used to fit the text to the container.
 * To use it, add the class "fittext" to the element you want to fit.
 */

function getTextDimensions(text, styles) {
  // re-use canvas object for better performance
  const canvas =
    getTextDimensions.canvas ||
    (getTextDimensions.canvas = document.createElement("canvas"));

  const context = canvas.getContext("2d");
  window.context = context;
  context.font = styles.font;
  if (styles.letterSpacing === "normal") context.letterSpacing = "0px";
  else context.letterSpacing = styles.letterSpacing;

  const metrics = context.measureText(text);

  return {
    width: metrics.width,
    height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
  };
}

function fitAll(els) {
  function fit(el) {
    const containerWidth = el.clientWidth;
    const containerHeight = el.clientHeight;
    const textDimensions = getTextDimensions(
      el.innerText,
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
