const API_USERS = "https://dummyjson.com/users";
const API_RECIPES = "https://dummyjson.com/recipes";

// Helper DOM
const $ = <T extends HTMLElement = HTMLElement>(selector: string): T | null => document.querySelector(selector) as T | null;
const create = (tag: string, className?: string): HTMLElement => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
};

// Debounce
const debounce = <T extends (...args: any[]) => void>(fn: T, delay: number) => {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
};

// Login Interface
interface User {
    id: number;
    username: string;
    password: string;
    firstName: string;
    lastName?: string;
    [key: string]: any;
}

interface UserResponse {
    users: User[];
}

// Login
const login = () => {
    const loginForm: HTMLFormElement | null = $("#loginForm");
    const loginMsg: HTMLElement | null = $("#loginMsg");
    const loginBtn: HTMLButtonElement | null = $("#loginBtn");

    if (loginForm && loginMsg && loginBtn) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            loginMsg.textContent = "";

            const username: string = $<HTMLInputElement>("#username")?.value.trim() || "";
            const password: string = $<HTMLInputElement>("#password")?.value.trim() || "";

            if (!username && !password) {
                loginMsg.textContent = "Username dan password harus diisi.";
                loginMsg.style.color = "crimson";
                return;
            }

            if (!username && password) {
                loginMsg.textContent = "Username harus diisi.";
                loginMsg.style.color = "crimson";
                return;
            }

            if (username && !password) {
                loginMsg.textContent = "Password tidak boleh kosong.";
                loginMsg.style.color = "crimson";
                return;
            }

            loginBtn.disabled = true;
            loginBtn.textContent = "Logging in...";

            try {
                const res: Response = await fetch(API_USERS);
                if (!res.ok) throw new Error("Gagal mengambil data pengguna.");

                const data: UserResponse = await res.json();
                const users: User[] = data.users;
                const user = users.find((u) => u.username === username);

                if (!user) {
                    loginMsg.textContent = "Username tidak ditemukan.";
                    loginMsg.style.color = "crimson";
                }
                else if (user.password !== password) {
                    loginMsg.textContent = "Password salah.";
                    loginMsg.style.color = "crimson";
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
        });
    }
};

// Recipe Interface
interface Recipe {
    id: number;
    name: string;
    ingredients: string[];
    instructions: string[];
    prepTimeMinutes?: number;
    cookTimeMinutes?: number;
    servings?: number;
    difficulty?: string;
    cuisine?: string;
    caloriesPerServing?: number;
    tags?: string[];
    image?: string;
    rating?: number;
    reviewCount?: number;
    mealType?: string[];
}

interface RecipeResponse {
    recipes: Recipe[];
}


// Recipe
const recipes = () => {
    const firstName: string | null = localStorage.getItem("rc_firstName");

    if (!firstName) {
        alert("Anda belum login. Mengarahkan ke halaman login...");
        window.location.href = "login.html";
        return;
    }

    const greeting: HTMLElement | null = $("#greeting");
    const logoutBtn: HTMLButtonElement | null = $("#logoutBtn");
    const recipesList: HTMLElement | null = $("#recipesList");
    const recipesMsg: HTMLElement | null = $("#recipesMsg");
    const searchInput: HTMLInputElement | null = $("#searchInput");
    const cuisineFilter: HTMLSelectElement | null = $("#cuisineFilter");
    const showMoreBtn: HTMLButtonElement | null = $("#showMoreBtn");
    const modal: HTMLElement | null = $("#modal");
    const modalBody: HTMLElement | null = $("#modalBody");
    const closeModal: HTMLElement | null = $("#closeModal");

    if (!greeting || !logoutBtn || !recipesList || !recipesMsg || !searchInput || !cuisineFilter || !showMoreBtn || !modal || !modalBody || !closeModal) {
        console.warn("Halaman resep: satu atau lebih elemen hilang.");
        return;
    }

    greeting.textContent = `Hi, ${firstName}!`;
    logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });

    let allRecipes: Recipe[] = [];
    let filteredRecipes: Recipe[] = [];
    let page: number = 0;
    const PAGE_SIZE: number = 8;

    async function fetchRecipes(): Promise<void> {
        if (!recipesMsg) {
            return;
        }
        recipesMsg.style.color = "";
        recipesMsg.textContent = "Memuat resep...";

        try {
            const res: Response = await fetch(API_RECIPES);
            if (!res.ok) throw new Error("Gagal mengambil data resep.");
            const data: RecipeResponse = await res.json();
            allRecipes = data.recipes || [];
            populateCuisineOptions(allRecipes);
            applyFilters();
        }
        catch (err) {
            recipesMsg.style.color = "crimson";
            recipesMsg.textContent = "Gagal memuat resep. Coba lagi nanti.";
            console.error(err);
        }
    }

    function populateCuisineOptions(list: Recipe[]): void {
        if (!cuisineFilter) {
            return;
        }
        cuisineFilter.innerHTML = "<option value=''>Semua Masakan</option>";
        const cuisines: string[] = Array.from(new Set(list.map(recipe => recipe.cuisine).filter((cuisine): cuisine is string => Boolean(cuisine)))).sort();

        cuisines.forEach(cuisine => {
            const option: HTMLOptionElement | null = document.createElement("option");
            option.value = cuisine!;
            option.textContent = cuisine!;
            cuisineFilter.appendChild(option);
        });
    }

    function applyFilters(): void {
        if (!searchInput || !cuisineFilter) {
            return;
        }
        const q: string = (searchInput.value || "").trim().toLowerCase();
        const cuisine: string = cuisineFilter.value;
        filteredRecipes = allRecipes.filter(recipe => {
            if (cuisine && recipe.cuisine !== cuisine) {
                return false;
            }
            if (!q) {
                return true;
            }
            const haystack: string = [
                recipe.name ?? "",
                recipe.cuisine ?? "",
                ...(recipe.ingredients || []),
                ...(recipe.tags || []),
            ].join(" ").toLowerCase();
            return haystack.includes(q);
        });
        page = 0;
        renderPage();
    }

    function renderPage(): void {
        const start: number = page * PAGE_SIZE;
        const end: number = start + PAGE_SIZE;
        const items: Recipe[] = filteredRecipes.slice(start, end);
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

    function recipeCard(recipe: Recipe): HTMLElement {
        const card: HTMLElement = create("article", "recipe-card");

        // Recipe Thumbnail
        const img: HTMLImageElement = document.createElement("img");
        img.src = recipe.image || "";
        img.alt = recipe.name || "";
        card.appendChild(img);

        // Recipe Title
        const h3: HTMLHeadingElement = document.createElement("h3");
        h3.textContent = recipe.name || "-";
        card.appendChild(h3);

        // Meta
        const meta: HTMLElement = create("div", "meta");
        const totalTime: number = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
        const timeText: string = `Waktu masak: ${totalTime > 0 ? totalTime : "-"} menit`;
        const timeDiv: HTMLElement = create("div");
        timeDiv.textContent = `⏱ ${timeText}`;
        const diffDiv: HTMLElement = create("div");
        diffDiv.textContent = `Kesulitan: ${recipe.difficulty ?? "-"}`;
        const cuisineDiv: HTMLElement = create("div");
        cuisineDiv.textContent = `🍽 ${recipe.cuisine ?? "-"}`;
        meta.appendChild(timeDiv);
        meta.appendChild(diffDiv);
        meta.appendChild(cuisineDiv);
        card.appendChild(meta);

        // Recipe Rating
        const rating: HTMLElement = create("div", "rating");
        const stars: string = renderStars(recipe.rating || 0);
        rating.textContent = `${stars} (${recipe.rating ?? 0})`;
        card.appendChild(rating);

        // Recipe Ingredient Tags
        const ingredientTags: HTMLElement = create("div", "tags");
        (recipe.ingredients || []).slice(0, 6).forEach(ingredient => {
            const tag: HTMLElement = create("span");
            tag.textContent = ingredient;
            ingredientTags.appendChild(tag);
        });
        card.appendChild(ingredientTags);

        // Recipe View Button
        const viewBtn: HTMLButtonElement = document.createElement("button");
        viewBtn.className = "btn small";
        viewBtn.textContent = "Lihat Resep Lengkap";
        viewBtn.addEventListener("click", () => openModal(recipe));
        card.appendChild(viewBtn);

        return card;
    }

    function renderStars(num: number): string {
        const full: number = Math.round(num);
        return Array.from({ length: 5 }, (_, i) => i < full ? "★" : "☆").join("");
    }

    // Tampilkan Lebih
    showMoreBtn.addEventListener("click", () => {
        page++;
        renderPage();
    });

    // Modal
    function openModal(recipe: Recipe): void {
        if (!modal || !modalBody) {
            return
        }
        modalBody.innerHTML = "";

        const title: HTMLHeadingElement = document.createElement("h2");
        title.textContent = recipe.name || "-";
        modalBody.appendChild(title);

        if (recipe.image) {
            const img: HTMLImageElement = document.createElement("img");
            img.src = recipe.image || "";
            img.style.width = "100%";
            img.style.maxHeight = "320px";
            img.style.objectFit = "cover";
            modalBody.appendChild(img);
        }

        // Recipe Detail
        const detail: HTMLElement = create("div");
        const timeP: HTMLParagraphElement = document.createElement("p");
        const totalTime: number = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);
        timeP.innerHTML = `<strong>Waktu masak:</strong> ${totalTime > 0 ? totalTime : "-"} menit`;
        const diffP: HTMLParagraphElement = document.createElement("p");
        diffP.innerHTML = `<strong>Kesulitan:</strong> ${recipe.difficulty ?? "-"}`;
        const cuisineP: HTMLParagraphElement = document.createElement("p");
        cuisineP.innerHTML = `<strong>Kategori:</strong> ${recipe.cuisine ?? "-"}`;
        const ratingP: HTMLParagraphElement = document.createElement("p");
        ratingP.innerHTML = `<strong>Rating:</strong> ${recipe.rating ?? 0}`;
        detail.appendChild(timeP);
        detail.appendChild(diffP);
        detail.appendChild(cuisineP);
        detail.appendChild(ratingP);
        modalBody.appendChild(detail);

        // Recipe Ingredients
        const ingredientsModal: HTMLElement = create("div");
        const ingredientTitle: HTMLHeadingElement = document.createElement("h4");
        ingredientTitle.textContent = "Bahan-bahan:";
        ingredientsModal.appendChild(ingredientTitle);
        const ul: HTMLElement = create("ul");
        (recipe.ingredients || []).forEach(ingredient => {
            const li: HTMLElement = create("li");
            li.textContent = ingredient;
            ul.appendChild(li);
        });
        ingredientsModal.appendChild(ul);
        modalBody.appendChild(ingredientsModal);

        // Recipe Instructions
        const steps: HTMLElement = create("div");
        const stepsTitle: HTMLHeadingElement = document.createElement("h4");
        stepsTitle.textContent = "Langkah-langkah:";
        steps.appendChild(stepsTitle);

        if (recipe.instructions && recipe.instructions.length > 0) {
            const ol: HTMLOListElement = document.createElement("ol");
            recipe.instructions.forEach(step => {
                const li: HTMLLIElement = document.createElement("li");
                li.textContent = step;
                ol.appendChild(li);
            });
            steps.appendChild(ol);
        }
        else {
            const span: HTMLSpanElement = document.createElement("span");
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
    const debouncedSearch: () => void = debounce(() => applyFilters(), 350);
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