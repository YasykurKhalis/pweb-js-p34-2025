// app.js — digunakan oleh login.html dan recipes.html

const API_USERS = "https://dummyjson.com/users";
const API_RECIPES = "https://dummyjson.com/recipes";

// Helper DOM
defineHelpers();
function defineHelpers() {
  window.$ = (selector) => document.querySelector(selector);
  window.create = (tag, cls) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  };
}

// Fungsi debounce
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ---------------- LOGIN PAGE ----------------
if ($("#loginForm")) {
  const loginForm = $("#loginForm");
  const loginMsg = $("#loginMsg");
  const loginBtn = $("#loginBtn");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginMsg.textContent = "";
    const username = $("#username").value.trim();
    const password = $("#password").value.trim();

    if (!username) return (loginMsg.textContent = "Username harus diisi.");
    if (!password)
      return (loginMsg.textContent = "Password tidak boleh kosong.");

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    try {
      const res = await fetch(API_USERS);
      if (!res.ok) throw new Error("Gagal memanggil API");
      const data = await res.json();
      const users = data.users || [];
      const user = users.find((u) => u.username === username);

      if (!user) {
        loginMsg.textContent = "Username tidak ditemukan.";
      } else {
        localStorage.setItem("rc_firstName", user.firstName);
        localStorage.setItem("rc_userId", user.id);
        loginMsg.style.color = "green";
        loginMsg.textContent = "Login berhasil! Mengalihkan...";
        setTimeout(() => (window.location.href = "recipes.html"), 800);
      }
    } catch (err) {
      console.error(err);
      loginMsg.textContent = "Gagal koneksi ke server. Coba lagi nanti.";
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    }
  });
}

// ---------------- RECIPES PAGE ----------------
if ($("#recipesList")) {
  const firstName = localStorage.getItem("rc_firstName");
  if (!firstName) {
    alert("Anda belum login. Arahkan ke halaman login.");
    window.location.href = "login.html";
  }

  const greeting = $("#greeting");
  const logoutBtn = $("#logoutBtn");
  const recipesList = $("#recipesList");
  const recipesMsg = $("#recipesMsg");
  const searchInput = $("#searchInput");
  const cuisineFilter = $("#cuisineFilter");
  const showMoreBtn = $("#showMoreBtn");
  const modal = $("#modal");
  const modalBody = $("#modalBody");
  const closeModal = $("#closeModal");

  greeting.textContent = `Hi, ${firstName}`;
  logoutBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  let allRecipes = [];
  let filtered = [];
  let page = 0;
  const PAGE_SIZE = 8;

  async function loadRecipes() {
    recipesMsg.textContent = "Loading recipes...";
    try {
      const res = await fetch(API_RECIPES);
      if (!res.ok) throw new Error("Fetch gagal");
      const data = await res.json();
      allRecipes = data.recipes || [];
      populateCuisineOptions(allRecipes);
      applyFilters();
    } catch (err) {
      recipesMsg.style.color = "crimson";
      recipesMsg.textContent = "Tidak bisa memuat resep. Coba lagi nanti.";
      console.error(err);
    }
  }

  function populateCuisineOptions(list) {
    const cuisines = [
      ...new Set(list.map((r) => r.cuisine).filter(Boolean)),
    ].sort();
    cuisines.forEach((c) => {
      const opt = create("option");
      opt.value = c;
      opt.textContent = c;
      cuisineFilter.appendChild(opt);
    });
  }

  function applyFilters() {
    const q = searchInput.value.trim().toLowerCase();
    const cuisine = cuisineFilter.value;
    filtered = allRecipes.filter((r) => {
      if (cuisine && r.cuisine !== cuisine) return false;
      if (!q) return true;
      const haystack = [
        r.title,
        r.cuisine,
        ...(r.ingredients || []),
        ...(r.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
    page = 0;
    renderPage();
  }

  function renderPage() {
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const items = filtered.slice(start, end);
    if (page === 0) recipesList.innerHTML = "";
    items.forEach((r) => recipesList.appendChild(recipeCard(r)));
    showMoreBtn.style.display =
      end >= filtered.length ? "none" : "inline-block";
    recipesMsg.textContent = filtered.length
      ? ""
      : "Tidak ada resep ditemukan.";
  }

  function recipeCard(r) {
    const card = create("article", "recipe-card");

    const img = create("img");
    img.src = r.thumbnail || (r.images && r.images[0]) || "";
    img.alt = r.title || "Recipe image";
    card.appendChild(img);

    const h3 = create("h3");
    h3.textContent = r.title;
    card.appendChild(h3);

    const meta = create("div", "meta");
    meta.innerHTML = `<div>⏱ ${
      r.totalTime || r.readyInMinutes || "—"
    } mins</div>
                  <div>Difficulty: ${r.difficulty || "—"}</div>
                  <div>🍽 ${r.cuisine || "—"}</div>`;
    card.appendChild(meta);

    const rating = create("div", "rating");
    rating.innerHTML = renderStars(r.rating || 0) + ` (${r.rating || 0})`;
    card.appendChild(rating);

    const ingr = create("div", "tags");
    (r.ingredients || []).slice(0, 6).forEach((i) => {
      const tag = create("span");
      tag.textContent = i;
      ingr.appendChild(tag);
    });
    card.appendChild(ingr);

    const viewBtn = create("button", "btn small");
    viewBtn.textContent = "View Full Recipe";
    viewBtn.addEventListener("click", () => openModal(r));
    card.appendChild(viewBtn);

    return card;
  }

  function renderStars(n) {
    const full = Math.round(n);
    return Array.from({ length: 5 }, (_, i) => (i < full ? "★" : "☆")).join("");
  }

  showMoreBtn.addEventListener("click", () => {
    page++;
    renderPage();
  });

  function openModal(r) {
    modalBody.innerHTML = "";
    const title = create("h2");
    title.textContent = r.title;
    modalBody.appendChild(title);

    const img = create("img");
    img.src = r.thumbnail || (r.images && r.images[0]) || "";
    img.style.width = "100%";
    img.style.maxHeight = "320px";
    img.style.objectFit = "cover";
    modalBody.appendChild(img);

    const details = create("div");
    details.innerHTML = `< p > <strong>Cooking time:</strong> ${
      r.totalTime || "—"
    }</p >
                     <p><strong>Difficulty:</strong> ${r.difficulty || "—"}</p>
                     <p><strong>Cuisine:</strong> ${r.cuisine || "—"}</p>
                     <p><strong>Rating:</strong> ${r.rating || 0}</p>`;
    modalBody.appendChild(details);

    const ing = create("div");
    ing.innerHTML = "<h4>Ingredients</h4>";
    const ul = create("ul");
    (r.ingredients || []).forEach((i) => {
      const li = create("li");
      li.textContent = i;
      ul.appendChild(li);
    });
    ing.appendChild(ul);
    modalBody.appendChild(ing);

    const steps = create("div");
    steps.innerHTML = "<h4>Instructions / Steps</h4>";
    if (r.instructions) steps.innerHTML += `< p > ${r.instructions}</p > `;
    else if (r.directions) {
      const ol = create("ol");
      (r.directions || []).forEach((d) => {
        const li = create("li");
        li.textContent = d;
        ol.appendChild(li);
      });
      steps.appendChild(ol);
    }
    modalBody.appendChild(steps);

    modal.classList.remove("hidden");
  }

  closeModal.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  const debouncedSearch = debounce(() => applyFilters(), 350);
  searchInput.addEventListener("input", debouncedSearch);
  cuisineFilter.addEventListener("change", applyFilters);

  loadRecipes();
}
