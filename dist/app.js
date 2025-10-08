"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const API_USERS = "https://dummyjson.com/users";
const API_RECIPES = "https://dummyjson.com/recipes";
// Helper DOM
const $ = (selector) => document.querySelector(selector);
const create = (tag, className) => {
    const el = document.createElement(tag);
    if (className)
        el.className = className;
    return el;
};
// Debounce
const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};
// Login
const login = () => {
    const loginForm = $("#loginForm");
    const loginMsg = $("#loginMsg");
    const loginBtn = $("#loginBtn");
    const usernameElement = $("#username");
    const passwordElement = $("#password");
    if (loginForm && loginMsg && loginBtn && usernameElement && passwordElement) {
        const toggleBtn = document.querySelector(".toggle-password");
        const addError = (el) => {
            if (!el) {
                return;
            }
            el.classList.remove("shake");
            el.offsetWidth;
            el.classList.add("input-error", "shake");
            if (el.id === "password") {
                if (!toggleBtn) {
                    return;
                }
                toggleBtn.classList.remove("shake");
                toggleBtn.offsetWidth;
                toggleBtn.classList.add("input-error", "shake");
                toggleBtn.addEventListener("animationend", () => toggleBtn.classList.remove("shake"), { once: true });
            }
            el.addEventListener("animationend", () => el.classList.remove("shake"), { once: true });
        };
        const removeError = (el) => {
            if (!el) {
                return;
            }
            el.classList.remove("input-error", "shake");
        };
        if (toggleBtn && passwordElement) {
            const svgNS = "http://www.w3.org/2000/svg";
            const eyeOnIcon = () => {
                const svg = document.createElementNS(svgNS, "svg");
                svg.setAttribute("viewBox", "0 0 24 24");
                svg.setAttribute("width", "22");
                svg.setAttribute("height", "22");
                svg.setAttribute("stroke", "currentColor");
                svg.setAttribute("fill", "none");
                svg.setAttribute("stroke-width", "2");
                svg.setAttribute("stroke-linecap", "round");
                svg.setAttribute("stroke-linejoin", "round");
                const path = document.createElementNS(svgNS, "path");
                path.setAttribute("d", "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z");
                const circle = document.createElementNS(svgNS, "circle");
                circle.setAttribute("cx", "12");
                circle.setAttribute("cy", "12");
                circle.setAttribute("r", "3");
                svg.append(path);
                svg.append(circle);
                return svg;
            };
            const eyeOffIcon = () => {
                const svg = document.createElementNS(svgNS, "svg");
                svg.setAttribute("viewBox", "0 0 24 24");
                svg.setAttribute("width", "22");
                svg.setAttribute("height", "22");
                svg.setAttribute("stroke", "currentColor");
                svg.setAttribute("fill", "none");
                svg.setAttribute("stroke-width", "2");
                svg.setAttribute("stroke-linecap", "round");
                svg.setAttribute("stroke-linejoin", "round");
                const path = document.createElementNS(svgNS, "path");
                path.setAttribute("d", "M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.84 21.84 0 0 1 5.05-6.91M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.89 21.89 0 0 1-4.9 6.84M1 1l22 22");
                svg.appendChild(path);
                return svg;
            };
            toggleBtn.replaceChildren(eyeOffIcon());
            toggleBtn.addEventListener("click", () => {
                const show = passwordElement.type === "password";
                passwordElement.type = show ? "text" : "password";
                toggleBtn.setAttribute("aria-pressed", show ? "true" : "false");
                toggleBtn.replaceChildren(show ? eyeOnIcon() : eyeOffIcon());
                passwordElement.focus();
            });
        }
        usernameElement.addEventListener("input", () => removeError(usernameElement));
        passwordElement.addEventListener("input", () => removeError(passwordElement));
        loginForm.addEventListener("submit", (e) => __awaiter(void 0, void 0, void 0, function* () {
            e.preventDefault();
            loginMsg.textContent = "";
            const username = usernameElement.value.trim() || "";
            const password = passwordElement.value.trim() || "";
            removeError(usernameElement);
            removeError(passwordElement);
            if (!username && !password) {
                loginMsg.textContent = "Username dan password harus diisi.";
                loginMsg.style.color = "crimson";
                addError(usernameElement);
                addError(passwordElement);
                return;
            }
            if (!username && password) {
                loginMsg.textContent = "Username harus diisi.";
                loginMsg.style.color = "crimson";
                addError(usernameElement);
                return;
            }
            if (username && !password) {
                loginMsg.textContent = "Password tidak boleh kosong.";
                loginMsg.style.color = "crimson";
                addError(passwordElement);
                return;
            }
            loginBtn.disabled = true;
            loginBtn.textContent = "Logging in...";
            try {
                const res = yield fetch(API_USERS);
                if (!res.ok)
                    throw new Error("Gagal mengambil data pengguna.");
                const data = yield res.json();
                const users = data.users;
                const user = users.find((u) => u.username === username);
                if (!user) {
                    loginMsg.textContent = "Username tidak ditemukan.";
                    loginMsg.style.color = "crimson";
                    addError(usernameElement);
                }
                else if (user.password !== password) {
                    loginMsg.textContent = "Password salah.";
                    loginMsg.style.color = "crimson";
                    addError(passwordElement);
                }
                else {
                    localStorage.setItem("rc_firstName", user.firstName);
                    localStorage.setItem("rc_userId", user.id.toString());
                    loginMsg.style.color = "green";
                    loginMsg.textContent = "Login berhasil! Mengalihkan...";
                    setTimeout(() => (window.location.href = "recipes.html"), 800);
                }
            }
            catch (err) {
                console.error(err);
                loginMsg.textContent = "Gagal koneksi ke server. Coba lagi nanti.";
                loginMsg.style.color = "crimson";
            }
            finally {
                loginBtn.disabled = false;
                loginBtn.textContent = "Login";
            }
        }));
    }
};
// Recipe
const recipes = () => {
    const firstName = localStorage.getItem("rc_firstName");
    if (!firstName) {
        alert("Anda belum login. Mengarahkan ke halaman login...");
        window.location.href = "login.html";
        return;
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
    if (!greeting || !logoutBtn || !recipesList || !recipesMsg || !searchInput || !cuisineFilter || !showMoreBtn || !modal || !modalBody || !closeModal) {
        console.warn("Halaman resep: satu atau lebih elemen hilang.");
        return;
    }
    greeting.innerHTML = `Hi, <strong>${firstName}!</strong>`;
    logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });
    let allRecipes = [];
    let filteredRecipes = [];
    let page = 0;
    const PAGE_SIZE = 8;
    function fetchRecipes() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!recipesMsg) {
                return;
            }
            recipesMsg.style.color = "";
            recipesMsg.textContent = "Memuat resep...";
            try {
                const res = yield fetch(API_RECIPES);
                if (!res.ok)
                    throw new Error("Gagal mengambil data resep.");
                const data = yield res.json();
                allRecipes = data.recipes || [];
                populateCuisineOptions(allRecipes);
                applyFilters();
            }
            catch (err) {
                recipesMsg.style.color = "crimson";
                recipesMsg.textContent = "Gagal memuat resep. Coba lagi nanti.";
                console.error(err);
            }
        });
    }
    function populateCuisineOptions(list) {
        if (!cuisineFilter) {
            return;
        }
        cuisineFilter.innerHTML = "<option value=''>Semua Masakan</option>";
        const cuisines = Array.from(new Set(list.map(recipe => recipe.cuisine).filter((cuisine) => Boolean(cuisine)))).sort();
        cuisines.forEach(cuisine => {
            const option = document.createElement("option");
            option.value = cuisine;
            option.textContent = cuisine;
            cuisineFilter.appendChild(option);
        });
    }
    function applyFilters() {
        if (!searchInput || !cuisineFilter) {
            return;
        }
        const q = (searchInput.value || "").trim().toLowerCase();
        const cuisine = cuisineFilter.value;
        filteredRecipes = allRecipes.filter(recipe => {
            var _a, _b;
            if (cuisine && recipe.cuisine !== cuisine) {
                return false;
            }
            if (!q) {
                return true;
            }
            const haystack = [
                (_a = recipe.name) !== null && _a !== void 0 ? _a : "",
                (_b = recipe.cuisine) !== null && _b !== void 0 ? _b : "",
                ...(recipe.ingredients || []),
                ...(recipe.tags || []),
            ].join(" ").toLowerCase();
            return haystack.includes(q);
        });
        page = 0;
        renderPage();
    }
    function renderPage() {
        const start = page * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const items = filteredRecipes.slice(start, end);
        if (!recipesList) {
            return;
        }
        if (page === 0) {
            recipesList.innerHTML = "";
        }
        items.forEach(recipe => recipesList.appendChild(recipeCard(recipe)));
        if (!showMoreBtn || !recipesMsg) {
            return;
        }
        showMoreBtn.style.display = end >= filteredRecipes.length ? "none" : "inline-block";
        recipesMsg.textContent = filteredRecipes.length ? "" : "Tidak ada resep yang ditemukan.";
    }
    function recipeCard(recipe) {
        var _a, _b, _c;
        const card = create("article", "recipe-card");
        // Recipe Thumbnail
        const img = document.createElement("img");
        img.src = recipe.image || "";
        img.alt = recipe.name || "";
        card.appendChild(img);
        // Recipe Title
        const h3 = document.createElement("h3");
        h3.textContent = recipe.name || "-";
        card.appendChild(h3);
        // Meta
        const meta = create("div", "meta");
        const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
        const timeText = `Waktu masak: ${totalTime > 0 ? totalTime : "-"} menit`;
        const timeDiv = create("div");
        timeDiv.textContent = `⏱ ${timeText}`;
        const diffDiv = create("div");
        diffDiv.textContent = `Kesulitan: ${(_a = recipe.difficulty) !== null && _a !== void 0 ? _a : "-"}`;
        const cuisineDiv = create("div");
        cuisineDiv.textContent = `🍽 ${(_b = recipe.cuisine) !== null && _b !== void 0 ? _b : "-"}`;
        meta.appendChild(timeDiv);
        meta.appendChild(diffDiv);
        meta.appendChild(cuisineDiv);
        card.appendChild(meta);
        // Recipe Rating
        const rating = create("div", "rating");
        const stars = renderStars(recipe.rating || 0);
        rating.textContent = `${stars} (${(_c = recipe.rating) !== null && _c !== void 0 ? _c : 0})`;
        card.appendChild(rating);
        // Recipe Ingredient Tags
        const ingredientTags = create("div", "tags");
        (recipe.ingredients || []).slice(0, 6).forEach(ingredient => {
            const tag = create("span");
            tag.textContent = ingredient;
            ingredientTags.appendChild(tag);
        });
        card.appendChild(ingredientTags);
        // Recipe View Button
        const viewBtn = document.createElement("button");
        viewBtn.className = "btn small";
        viewBtn.textContent = "Lihat Resep Lengkap";
        viewBtn.addEventListener("click", () => openModal(recipe));
        card.appendChild(viewBtn);
        return card;
    }
    function renderStars(num) {
        const full = Math.round(num);
        return Array.from({ length: 5 }, (_, i) => i < full ? "★" : "☆").join("");
    }
    // Tampilkan Lebih
    showMoreBtn.addEventListener("click", () => {
        page++;
        renderPage();
    });
    // Modal
    function openModal(recipe) {
        var _a, _b, _c;
        if (!modal || !modalBody) {
            return;
        }
        modalBody.innerHTML = "";
        const title = document.createElement("h2");
        title.textContent = recipe.name || "-";
        modalBody.appendChild(title);
        if (recipe.image) {
            const img = document.createElement("img");
            img.src = recipe.image || "";
            img.style.width = "100%";
            img.style.maxHeight = "320px";
            img.style.objectFit = "cover";
            modalBody.appendChild(img);
        }
        // Recipe Detail
        const detail = create("div");
        const timeP = document.createElement("p");
        const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
        timeP.innerHTML = `<strong>Waktu masak:</strong> ${totalTime > 0 ? totalTime : "-"} menit`;
        const diffP = document.createElement("p");
        diffP.innerHTML = `<strong>Kesulitan:</strong> ${(_a = recipe.difficulty) !== null && _a !== void 0 ? _a : "-"}`;
        const cuisineP = document.createElement("p");
        cuisineP.innerHTML = `<strong>Kategori:</strong> ${(_b = recipe.cuisine) !== null && _b !== void 0 ? _b : "-"}`;
        const ratingP = document.createElement("p");
        ratingP.innerHTML = `<strong>Rating:</strong> ${(_c = recipe.rating) !== null && _c !== void 0 ? _c : 0}`;
        detail.appendChild(timeP);
        detail.appendChild(diffP);
        detail.appendChild(cuisineP);
        detail.appendChild(ratingP);
        modalBody.appendChild(detail);
        // Recipe Ingredients
        const ingredientsModal = create("div");
        const ingredientTitle = document.createElement("h4");
        ingredientTitle.textContent = "Bahan-bahan:";
        ingredientsModal.appendChild(ingredientTitle);
        const ul = create("ul");
        (recipe.ingredients || []).forEach(ingredient => {
            const li = create("li");
            li.textContent = ingredient;
            ul.appendChild(li);
        });
        ingredientsModal.appendChild(ul);
        modalBody.appendChild(ingredientsModal);
        // Recipe Instructions
        const steps = create("div");
        const stepsTitle = document.createElement("h4");
        stepsTitle.textContent = "Langkah-langkah:";
        steps.appendChild(stepsTitle);
        if (recipe.instructions && recipe.instructions.length > 0) {
            const ol = document.createElement("ol");
            recipe.instructions.forEach(step => {
                const li = document.createElement("li");
                li.textContent = step;
                ol.appendChild(li);
            });
            steps.appendChild(ol);
        }
        else {
            const span = document.createElement("span");
            span.textContent = "Tidak ada langkah yang tersedia.";
            steps.appendChild(span);
        }
        modalBody.appendChild(steps);
        modal.classList.remove("hidden");
    }
    closeModal.addEventListener("click", () => modal.classList.add("hidden"));
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.classList.add("hidden");
        }
    });
    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            modal.classList.add("hidden");
        }
    });
    // Search and Filter
    const debouncedSearch = debounce(() => applyFilters(), 350);
    searchInput.addEventListener("input", debouncedSearch);
    cuisineFilter.addEventListener("change", applyFilters);
    fetchRecipes();
};
document.addEventListener("DOMContentLoaded", () => {
    if (document.body.dataset.page === "login") {
        login();
    }
    else if (document.body.dataset.page === "recipes") {
        recipes();
    }
});
