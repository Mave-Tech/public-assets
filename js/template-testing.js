function backgroundImageUrl(style) {
  // Extract the background image URL from a style attribute
  return style.match(/url\(['"]?(.*?)['"]?\)/)[1];
}

function replaceBackgroundImageUrl(style, url) {
  // Replace the background image URL in a style attribute
  return style.replace(/url\(['"]?(.*?)['"]?\)/, `url('${url}')`);
}

window.addEventListener("load", () => {
  document.querySelectorAll("[data-field]").forEach((el) => {
    if (["background-image", "image"].includes(el.dataset.type)) {
      // Handle drag and drop
      el.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.style.filter = "brightness(0.7)";
      });
      el.addEventListener("dragleave", (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.style.filter = "";
      });
      el.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.style.filter = "";

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (el.tagName === "IMG") {
              el.src = e.target.result;
            } else {
              el.style.backgroundImage = `url('${e.target.result}')`;
            }
          };
          reader.readAsDataURL(file);
        }
      });

      // Handle dragging between image elements
      el.draggable = true;
      el.addEventListener("dragstart", (e) => {
        const data = {
          isImg: el.tagName === "IMG",
          src:
            el.tagName === "IMG"
              ? el.src
              : backgroundImageUrl(el.style.backgroundImage),
          dataField: el.dataset.field,
        };
        e.dataTransfer.setData("text/plain", JSON.stringify(data));
      });
      el.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.style.filter = "";

        try {
          const sourceData = JSON.parse(e.dataTransfer.getData("text/plain"));
          const targetEl = e.currentTarget;
          const targetIsImg = targetEl.tagName === "IMG";

          // Store target's current data
          const targetData = {
            isImg: targetIsImg,
            src: targetIsImg
              ? targetEl.src
              : backgroundImageUrl(targetEl.style.backgroundImage),
            dataField: targetEl.dataset.field,
          };

          // Update target with source data
          if (targetIsImg) {
            targetEl.src = sourceData.src;
          } else {
            targetEl.style.backgroundImage = replaceBackgroundImageUrl(
              targetEl.style.backgroundImage,
              sourceData.src
            );
          }

          // Find and update source element
          const sourceEl = document.querySelector(
            `[data-field="${sourceData.dataField}"]`
          );
          if (sourceEl) {
            if (sourceEl.tagName === "IMG") {
              sourceEl.src = targetData.src;
            } else {
              sourceEl.style.backgroundImage = replaceBackgroundImageUrl(
                sourceEl.style.backgroundImage,
                targetData.src
              );
            }
          }
        } catch (err) {
          console.error("Error swapping images:", err);
        }
      });
    } else {
      el.contentEditable = true;
      el.addEventListener("input", () => {
        const maxLength = parseInt(el.dataset.max);
        if (el.innerText.length > maxLength) {
          const cursorPosition = window
            .getSelection()
            .getRangeAt(0).startOffset;
          const text = el.innerText;
          el.innerText =
            text.slice(0, cursorPosition - 1) + text.slice(cursorPosition);
          const selection = window.getSelection();
          const range = document.createRange();
          range.setStart(el.firstChild, cursorPosition - 1);
          range.setEnd(el.firstChild, cursorPosition - 1);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        // Fit text
        if (el.classList.contains("fittext")) {
          for (let i = 0; i < 3; i++) fitAll([el]);
        }
      });
    }
  });
});

// Add styles for editor to the page
const style = document.createElement("style");
style.textContent = `
      [contenteditable="true"]:hover,
      [contenteditable="true"]:focus,
      [contenteditable="true"]:focus-within {
        outline: 1px dashed;
      }
      md-block[contenteditable="true"]:hover > * {
        outline: 1px dashed;
      }
      [data-type="background-image"],
      [data-type="image"] {
        cursor: pointer;
      }
    `;
document.head.appendChild(style);
