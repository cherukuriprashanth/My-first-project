const searchInput = document.getElementById("searchInput");
const stalls = document.querySelectorAll("article");
const noResults = document.getElementById("noResults");
const resultSummary = document.getElementById("resultSummary");
const chips = document.querySelectorAll(".chip");

let activeLocation = "all";   // "all", "Block_34", "BH-1" or "Uni-Hospital"

// Makes "BH-1", "Block_34" and "Uni-Hospital" compare reliably (ignores case, spaces, - and _)
function normLoc(text) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Show each price on the right side of its row (text stays the same, so search still works)
document.querySelectorAll("li").forEach(function (item) {
    const text = item.textContent;
    const cut = text.lastIndexOf(" - ₹");
    if (cut === -1) return;
    const name = document.createElement("span");
    name.textContent = text.slice(0, cut);
    const price = document.createElement("b");
    price.textContent = text.slice(cut + 3);
    item.textContent = "";
    item.append(name, price);
});

function runSearch() {
    const query = searchInput.value.trim().toLowerCase();
    let stallsFound = 0;
    const foundList = [];   // names of stalls that have the dish

    stalls.forEach(function (stall) {
        const items = stall.querySelectorAll("li");
        const menu = stall.querySelector("details");
        // the location is read from the tag span on the stall's photo (BH-1, Block_34, Uni-Hospital)
        const stallLoc = normLoc(stall.querySelector(".tag").textContent);
        const inLocation = activeLocation === "all" || stallLoc === normLoc(activeLocation);
        let matches = 0;

        // show only dishes that match the search
        items.forEach(function (item) {
            const isMatch = item.textContent.toLowerCase().includes(query);
            item.hidden = query !== "" && !isMatch;
            if (isMatch) matches++;
        });

        // hide section headings (Momos, Noodles...) with no visible dishes
        stall.querySelectorAll("section").forEach(function (sec) {
            const visible = sec.querySelectorAll("li:not([hidden])").length;
            sec.hidden = visible === 0;
        });

        if (!inLocation) {
            // stall is outside the chosen location
            stall.hidden = true;
        } else if (query === "") {
            // empty search: reset everything
            stall.hidden = false;
            menu.open = false;
            stallsFound++;
        } else if (matches > 0) {
            // this stall has the dish
            stall.hidden = false;
            menu.open = true;
            stallsFound++;
            foundList.push(stall.querySelector("h2").textContent);
        } else {
            // this stall does not have the dish
            stall.hidden = true;
        }
    });

    // banner: "chaap is available at: Chaap Express"
    if (query !== "" && foundList.length > 0) {
        resultSummary.hidden = false;
        resultSummary.textContent =
            '"' + searchInput.value.trim() + '" is available at: ' + foundList.join(", ");
    } else {
        resultSummary.hidden = true;
    }

    // "not found" message
    noResults.hidden = stallsFound > 0;
}

searchInput.addEventListener("input", runSearch);

// location filter buttons
chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
        activeLocation = chip.dataset.loc;
        chips.forEach(function (c) {
            c.setAttribute("aria-pressed", c === chip ? "true" : "false");
        });
        runSearch();
    });
});