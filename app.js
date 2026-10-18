const categories = structuredClone(defaultCategories);

function render() {

  const root =
    document.getElementById(
      "categoryContainer"
    );

  if (!root) return;

  root.innerHTML = "";

  Object.entries(categories).forEach(
    ([cat, items]) => {

      const details =
        document.createElement("details");

      details.open = true;

      let html =
        `<summary>${cat}</summary>`;

      items.forEach(name => {

        html += `
          <div class="item">
            <b>${name}</b>
          </div>
        `;

      });

      details.innerHTML = html;

      root.appendChild(details);

    }
  );
}

window.addEventListener(
  "DOMContentLoaded",
  render
);