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
      // Handle click
      el.addEventListener("click", () => {
        // Only proceed if no modifier keys are pressed
        if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
          return;
        }
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
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
        };

        input.click();
      });

      // Handle drag and drop
      el.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.style.filter = "brightness(0.7)";
      });
      el.addEventListener("dragleave", (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.style.filter = "brightness(1)";
      });
      el.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.style.filter = "brightness(1)";

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
        el.style.filter = "brightness(1)";

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

      // Handle shifting
      let isDragging = false;
      let startX, startY;
      el.addEventListener("mousedown", (e) => {
        if (e.shiftKey) {
          isDragging = true;
          startX = e.clientX;
          startY = e.clientY;
          e.preventDefault();
        }
      });
      el.addEventListener("mousemove", (e) => {
        if (isDragging && e.shiftKey) {
          const deltaX = e.clientX - startX;
          const deltaY = e.clientY - startY;

          const currentX =
            el.style.backgroundPositionX === ""
              ? 50
              : parseFloat(el.style.backgroundPositionX);
          const currentY =
            el.style.backgroundPositionY === ""
              ? 50
              : parseFloat(el.style.backgroundPositionY);

          const newX = Math.max(0, Math.min(100, currentX - deltaX / 5));
          const newY = Math.max(0, Math.min(100, currentY - deltaY / 5));

          el.style.backgroundPositionX = `${newX}%`;
          el.style.backgroundPositionY = `${newY}%`;

          startX = e.clientX;
          startY = e.clientY;
        }
      });
      el.addEventListener("mouseup", () => {
        isDragging = false;
      });

      // Handle scrolling (brightness)
      el.addEventListener("wheel", (e) => {
        e.preventDefault();
        const delta = e.deltaY;
        const brightnessStep = 0.05;

        // Adjust brightness
        const currentDarken =
          parseFloat(el.style.getPropertyValue("--darken")) || 0;
        const newDarken = Math.max(
          0,
          Math.min(
            100,
            currentDarken +
              (delta > 0 ? brightnessStep * 100 : -brightnessStep * 100)
          )
        );
        el.style.setProperty("--darken", `${newDarken}`);
        const url = backgroundImageUrl(el.style.backgroundImage);
        el.style.backgroundImage = `linear-gradient(rgba(0,0,0,${
          newDarken / 100
        }), rgba(0,0,0,${newDarken / 100})), url('${url}')`;
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
          fitAll([el]);
        }
      });
    }
  });
});

// Add styles for editor to the page
const style = document.createElement("style");
style.textContent = `
      [contenteditable="true"]:hover {
        outline: 1px dashed;
      }
      [data-type="background-image"],
      [data-type="image"] {
        cursor: pointer;
      }
    `;
document.head.appendChild(style);
