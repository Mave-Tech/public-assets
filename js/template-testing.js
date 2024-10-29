/**
 * This is a script to allow rapid testing of Mave marketing templates.
 */

// Constants to test variations of the template
const TITLES = [
  "Sold", // 4 chars
  "Just Sold", // 9 chars
  "For Sale", // 8 chars
  "Leased", // 6 chars
  "Just Leased", // 11 chars
  "New Listing", // 11 chars
  "New Price", // 9 chars
  "Price Improvement", // 17 chars
  "Exclusive", // 9 chars
  "Purchased", // 9 chars
  "Bought", // 6 chars
  "Coming Soon", // 11 chars
  "Open House", // 10 chars
];
const ADDRESSES = [
  "Lower - 1 Queen Isabella Crescent", // 33 chars
  "7890 Oakridge Boulevard, Suite 1502A, Hamilton", // 46 chars
  "1502A-7890 Oakridge Boulevard", // 29 chars
  "45678 Maplewood Boulevard", // 26 chars
  "123 Elm St", // 10 chars
];
const CITIES = [
  "King", // 4 chars
  "Toronto", // 7 chars
  "Gravenhurst", // 11 chars
  "San Francisco", // 13 chars
  "North Vancouver", // 15 chars
  "Saint-Jean-sur-Richelieu", // 24 chars
];
const PRICES = ["$1,000/month", "$999,999", "$1,500,000", "$20,000,000"];
const BEDS = [1, "2+1", "1.5", 10];
const BATHS = [1, "2+1", "1.5", 10];
const GARAGES = [1, 10];
const SQFT = [500, 1000, 9999, 99999];
const AGENT_NAMES = [
  "Jessica Lawton-Bonello", // 1 agent
  "Tony Ho\nArif Manji", // 2 agents
  "Jony Ho\nJArif Manji\nJessica Lawton-Bonello", // 3 agents
  "Christian Forrester-Rozario\nTerry Laycock Schneider\nAnanthan Kathiramalai-Mohammed", // 3 long agents
];
const IMAGES = [
  "https://placehold.co/1920x1080?text=16:9", // 16:9
  "https://placehold.co/1600x1280?text=5:4", // 5:4
  "https://placehold.co/1440x1080?text=4:3", // 4:3
  "https://placehold.co/1620x1080?text=3:2", // 3:2
  "https://placehold.co/1280x1280?text=1:1", // 1:1
  "https://placehold.co/1080x1620?text=2:3", // 2:3
  "https://placehold.co/1080x1440?text=3:4", // 3:4
  "https://placehold.co/1280x1600?text=4:5", // 4:5
  "https://placehold.co/1080x1920?text=9:16", // 9:16
];

// Generate all permutations of the template
const permutations = [];
for (const title of TITLES) {
  for (const address of ADDRESSES)
    for (const city of CITIES)
      for (const price of PRICES)
        for (const beds of BEDS)
          for (const baths of BATHS)
            for (const garages of GARAGES)
              for (const sqft of SQFT)
                for (const agentName of AGENT_NAMES)
                  for (const image of IMAGES)
                    permutations.push({
                      title,
                      address,
                      city,
                      price,
                      num_beds: beds,
                      num_baths: baths,
                      num_garages: garages,
                      sqft: sqft,
                      agent_name: agentName,
                      property_photo: image,
                      agent_logo: image,
                      agent_headshot: image,
                    });
}

// Update the template with the current permutation
function updateFields(permutation) {
  document.querySelectorAll("[data-field]").forEach((el) => {
    const field = el.dataset.field;
    const type = el.dataset.type || "string";
    if (type === "string" || type === "number") {
      el.textContent = permutation[field] || `{${field}}`;
    } else if (type === "background-image") {
      el.style.backgroundImage = `url('${
        permutation[field] || "https://placehold.co/500?text=Missing+Field"
      }')`;
    }
  });
}

// Keybinds
document.addEventListener("keydown", (e) => {
  const currentIndex = Number(window.localStorage.getItem("currentIndex")) || 0;
  if (e.key === " ") {
    e.preventDefault();
    window.localStorage.setItem(
      "currentIndex",
      Math.floor(Math.random() * permutations.length)
    );
    window.location.reload();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const currentIndex = window.localStorage.getItem("currentIndex");
  if (currentIndex !== null) updateFields(permutations[currentIndex]);
});
