const API_BASE_URL = (window.API_BASE_URL) || "http://localhost:5001/api";

const state = {
    admin: null,
    isAuthenticated: false,
    users: [],
    selectedUserId: null,
    currentUser: null,
    transactions: [],
    categories: [],
    admins: [],
    reports: [],
    reportHistory: [],
    selectedReportIndex: null,
    notifications: [],
    notificationsLoaded: false,
    highlightTransactionId: null,
    allTransactions: [],
    allTransactionsFilters: {
        category: "",
        from: "",
        to: "",
    },
    allTransactionsSort: "date_desc",
    allTransactionsLoaded: false,
    adminsLoaded: false,
};

const loginView = document.getElementById("login-view");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const appRoot = document.getElementById("app-root");

const userListEl = document.getElementById("user-list");
const userDetailsSection = document.getElementById("user-details");
const userOverview = document.getElementById("user-overview");
const transactionsContainer = document.getElementById("transactions");
const notificationPanel = document.getElementById("notification-panel");
const notificationListEl = document.getElementById("notification-list");
const notificationBadge = document.getElementById("notification-badge");
const notificationToggleButton = document.getElementById("notification-toggle");
const closeNotificationsButton = document.getElementById("close-notifications");
const refreshNotificationsButton = document.getElementById("refresh-notifications");
const clearNotificationsButton = document.getElementById("clear-notifications");
const logoutButton = document.getElementById("logout-button");

const categoryListEl = document.getElementById("category-list");
const openAddTransactionButton = document.getElementById("open-add-transaction");
const userDialog = document.getElementById("user-dialog");
const userForm = document.getElementById("user-form");
const transactionDialog = document.getElementById("transaction-dialog");
const transactionForm = document.getElementById("transaction-form");
const transactionTitleEl = transactionDialog.querySelector("h2");
const transactionSubmitButton = transactionDialog.querySelector('button[type="submit"]');
const deleteUserButton = document.getElementById("delete-user");
const categoryDialog = document.getElementById("category-dialog");
const categoryForm = document.getElementById("category-form");
const categoryTitleEl = categoryDialog.querySelector("h2");
const categorySubmitButton = categoryDialog.querySelector('button[type="submit"]');
const cancelCategoryButton = document.getElementById("cancel-category");
const openAddCategoryButton = document.getElementById("open-add-category");
const reportForm = document.getElementById("report-form");
const reportStatusEl = document.getElementById("report-status");
const reportTableBody = document.getElementById("report-table-body");
const reportSubmitButton = document.getElementById("generate-reports");
const reportHistoryWrapper = document.getElementById("report-history-wrapper");
const reportHistoryList = document.getElementById("report-history-list");
const reportHistoryEmpty = document.getElementById("report-history-empty");
const reportDetail = document.getElementById("report-detail");
const reportDetailTitle = document.getElementById("report-detail-title");
const reportDetailSubtitle = document.getElementById("report-detail-subtitle");
const reportBackButton = document.getElementById("report-back");
const transactionsSection = document.getElementById("transactions-section");
const allTransactionsTable = document.getElementById("all-transactions-table");
const allTransactionsCategoryFilter = document.getElementById("all-transactions-category");
const allTransactionsFromFilter = document.getElementById("all-transactions-from");
const allTransactionsToFilter = document.getElementById("all-transactions-to");
const allTransactionsResetButton = document.getElementById("all-transactions-reset");
const allTransactionsSortSelect = document.getElementById("all-transactions-sort");
const adminsSection = document.getElementById("admins-section");
const adminProfileForm = document.getElementById("admin-profile-form");
const adminUsernameInput = document.getElementById("admin-username");
const adminEmailInput = document.getElementById("admin-email");
const adminCountEl = document.getElementById("admin-count");
const adminTableBody = document.getElementById("admin-table-body");
const openAddAdminButton = document.getElementById("open-add-admin");
const adminDialog = document.getElementById("admin-dialog");
const adminForm = document.getElementById("admin-form");
const cancelAdminButton = document.getElementById("cancel-admin");
const openAddUserButton = document.getElementById("open-add-user");
const editUserButton = document.getElementById("open-edit-user");
const userTitleEl = userDialog.querySelector("h2");
const userSubmitButton = userDialog.querySelector('button[type="submit"]');
const categorySection = document.getElementById("category-section");
const reportsSection = document.getElementById("reports-section");
const subnavButtons = document.querySelectorAll(".subnav [data-section]");
let activeSection = "users";

if (appRoot) {
    appRoot.classList.add("hidden");
}

if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
}

if (logoutButton) {
    logoutButton.addEventListener("click", handleLogout);
}

if (notificationToggleButton) {
    notificationToggleButton.addEventListener("click", () => toggleNotificationPanel());
}

if (closeNotificationsButton) {
    closeNotificationsButton.addEventListener("click", () => closeNotificationPanel());
}

if (allTransactionsCategoryFilter) {
    allTransactionsCategoryFilter.addEventListener("change", () => {
        state.allTransactionsFilters.category = allTransactionsCategoryFilter.value || "";
        loadAllTransactions().catch(console.error);
    });
}

if (allTransactionsFromFilter) {
    allTransactionsFromFilter.addEventListener("change", () => {
        state.allTransactionsFilters.from = allTransactionsFromFilter.value || "";
        loadAllTransactions().catch(console.error);
    });
}

if (allTransactionsToFilter) {
    allTransactionsToFilter.addEventListener("change", () => {
        state.allTransactionsFilters.to = allTransactionsToFilter.value || "";
        loadAllTransactions().catch(console.error);
    });
}

if (allTransactionsResetButton) {
    allTransactionsResetButton.addEventListener("click", () => {
        state.allTransactionsFilters = { category: "", from: "", to: "" };
        state.allTransactionsSort = "date_desc";
        populateAllTransactionsCategoryFilter();
        syncAllTransactionsFilterInputs();
        loadAllTransactions().catch(console.error);
    });
}

if (allTransactionsSortSelect) {
    allTransactionsSortSelect.addEventListener("change", () => {
        state.allTransactionsSort = allTransactionsSortSelect.value || "date_desc";
        renderAllTransactions(state.allTransactions);
    });
}

if (openAddAdminButton) {
    openAddAdminButton.addEventListener("click", () => {
        if (!adminDialog) {
            return;
        }
        adminForm.reset();
        adminDialog.showModal();
    });
}

if (cancelAdminButton) {
    cancelAdminButton.addEventListener("click", () => {
        if (adminDialog) {
            adminDialog.close();
        }
    });
}

if (adminForm) {
    adminForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(adminForm);
        const payload = {
            username: (formData.get("username") || "").trim(),
            email: (formData.get("email") || "").trim(),
            password: formData.get("password") || "",
            role: (formData.get("role") || "admin").trim() || "admin",
        };

        if (!payload.username || !payload.email || !payload.password) {
            alert("Merci de remplir tous les champs.");
            return;
        }

        try {
            await apiFetch("/admins", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            if (adminDialog) {
                adminDialog.close();
            }
            await loadAdmins();
            alert("Administrateur créé.");
        } catch (error) {
            alert("Impossible de créer l'administrateur : " + error.message);
        }
    });
}

if (adminTableBody) {
    adminTableBody.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-admin-id]");
        if (!button) {
            return;
        }
        const adminId = button.dataset.adminId;
        if (!adminId) {
            return;
        }
        const remainingAfterDeletion = state.admins.filter((item) => item._id !== adminId);
        if (!remainingAfterDeletion.length) {
            alert("Il doit toujours rester au moins un administrateur actif.");
            return;
        }
        if (state.admin && adminId === state.admin._id) {
            alert("Tu ne peux pas supprimer ton propre compte depuis cette interface.");
            return;
        }
        const admin = state.admins.find((item) => item._id === adminId);
        const label = admin ? admin.username || admin.email || admin._id : "cet administrateur";
        const confirmation = window.confirm(`Supprimer ${label} ? Cette action est définitive.`);
        if (!confirmation) {
            return;
        }
        try {
            await apiFetch(`/admins/${adminId}`, { method: "DELETE" });
            await loadAdmins();
            alert("Administrateur supprimé.");
        } catch (error) {
            alert("Impossible de supprimer cet administrateur : " + error.message);
        }
    });
}

if (adminProfileForm) {
    adminProfileForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!state.admin) {
            return;
        }
        const formData = new FormData(adminProfileForm);
        const payload = {
            username: (formData.get("username") || "").trim(),
            email: (formData.get("email") || "").trim(),
            current_password: formData.get("current_password") || "",
            new_password: formData.get("new_password") || "",
        };

        if (!payload.username || !payload.email) {
            alert("Nom d'utilisateur et email sont obligatoires.");
            return;
        }

        const body = {
            username: payload.username,
            email: payload.email,
        };

        if (payload.new_password) {
            if (!payload.current_password) {
                alert("Le mot de passe actuel est requis pour modifier le mot de passe.");
                return;
            }
            body.current_password = payload.current_password;
            body.new_password = payload.new_password;
        }

        try {
            await apiFetch(`/admins/${state.admin._id}`, {
                method: "PUT",
                body: JSON.stringify(body),
            });
            alert("Profil administrateur mis à jour.");
            state.admin.username = body.username;
            state.admin.email = body.email;
            if (adminProfileForm) {
                if (payload.new_password) {
                    adminProfileForm.reset();
                } else {
                    adminProfileForm.elements.current_password.value = "";
                    adminProfileForm.elements.new_password.value = "";
                }
            }
            if (adminUsernameInput) {
                adminUsernameInput.value = state.admin.username;
            }
            if (adminEmailInput) {
                adminEmailInput.value = state.admin.email;
            }
            await loadAdmins();
        } catch (error) {
            alert("Impossible de mettre à jour le profil : " + error.message);
        }
    });
}

document.addEventListener("click", handleDocumentClick, true);
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeNotificationPanel();
    }
});

function isUserSectionActive() {
    return activeSection === "users";
}

function syncUserSectionInteractivity() {
    const isActive = isUserSectionActive();
    if (userListEl) {
        userListEl.classList.toggle("disabled", !isActive);
    }
    if (openAddUserButton) {
        openAddUserButton.disabled = !isActive;
    }
    if (openAddTransactionButton) {
        openAddTransactionButton.disabled = !isActive || !state.selectedUserId;
    }
    if (deleteUserButton) {
        deleteUserButton.disabled = !isActive || !state.selectedUserId;
    }
    if (editUserButton) {
        editUserButton.disabled = !isActive || !state.currentUser;
    }
}

function syncAllTransactionsFilterInputs() {
    if (allTransactionsCategoryFilter) {
        allTransactionsCategoryFilter.value = state.allTransactionsFilters.category || "";
    }
    if (allTransactionsFromFilter) {
        allTransactionsFromFilter.value = state.allTransactionsFilters.from || "";
    }
    if (allTransactionsToFilter) {
        allTransactionsToFilter.value = state.allTransactionsFilters.to || "";
    }
    if (allTransactionsSortSelect) {
        allTransactionsSortSelect.value = state.allTransactionsSort || "date_desc";
    }
}

function populateAllTransactionsCategoryFilter() {
    if (!allTransactionsCategoryFilter) {
        return;
    }
    const previous = state.allTransactionsFilters.category || allTransactionsCategoryFilter.value || "";
    allTransactionsCategoryFilter.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Toutes";
    allTransactionsCategoryFilter.appendChild(defaultOption);

    state.categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category._id;
        option.textContent = category.name || category._id;
        allTransactionsCategoryFilter.appendChild(option);
    });

    const desired =
        previous && [...allTransactionsCategoryFilter.options].some((opt) => opt.value === previous)
            ? previous
            : "";
    allTransactionsCategoryFilter.value = desired;
    state.allTransactionsFilters.category = desired;
}

function toIsoBoundary(dateString, boundary) {
    if (!dateString) {
        return null;
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    if (boundary === "end") {
        date.setHours(23, 59, 59, 999);
    } else {
        date.setHours(0, 0, 0, 0);
    }
    return date.toISOString();
}

async function loadAllTransactions() {
    if (!state.isAuthenticated || !allTransactionsTable) {
        return;
    }

    const params = new URLSearchParams();
    const { category, from, to } = state.allTransactionsFilters;
    if (category) {
        params.append("category_id", category);
    }

    const fromIso = toIsoBoundary(from, "start");
    const toIsoValue = toIsoBoundary(to, "end");
    if (fromIso) {
        params.append("date_from", fromIso);
    }
    if (toIsoValue) {
        params.append("date_to", toIsoValue);
    }

    try {
        const query = params.toString();
        const transactions = await apiFetch(`/transactions${query ? `?${query}` : ""}`);
        state.allTransactions = Array.isArray(transactions) ? transactions : [];
        state.allTransactionsLoaded = true;
        renderAllTransactions(state.allTransactions);
    } catch (error) {
        console.error("Impossible de charger toutes les transactions :", error);
        allTransactionsTable.innerHTML = "";
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 7;
        cell.className = "muted";
        cell.textContent = error.message || "Erreur lors du chargement des transactions";
        row.appendChild(cell);
        allTransactionsTable.appendChild(row);
    }
}

function renderAllTransactions(transactions) {
    if (!allTransactionsTable) {
        return;
    }
    allTransactionsTable.innerHTML = "";
    if (!transactions || !transactions.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 7;
        cell.className = "muted";
        cell.textContent = state.allTransactionsLoaded
            ? "Aucune transaction ne correspond aux filtres."
            : "Aucune transaction à afficher.";
        row.appendChild(cell);
        allTransactionsTable.appendChild(row);
        return;
    }

    const items = [...transactions];
    const sortMode = state.allTransactionsSort || "date_desc";

    const getDateValue = (tx) => {
        const value = tx?.date ? new Date(tx.date).getTime() : Number.NEGATIVE_INFINITY;
        return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
    };

    const getCategoryValue = (tx) => (getCategoryLabel(tx.category_id) || "").toLowerCase();

    if (sortMode === "date_asc") {
        items.sort((a, b) => getDateValue(a) - getDateValue(b));
    } else if (sortMode === "category_asc" || sortMode === "category_desc") {
        items.sort((a, b) => {
            const comp = getCategoryValue(a).localeCompare(getCategoryValue(b));
            return sortMode === "category_asc" ? comp : -comp;
        });
    } else {
        items.sort((a, b) => getDateValue(b) - getDateValue(a));
    }

    const fragment = document.createDocumentFragment();
    items.forEach((transaction) => {
        const row = document.createElement("tr");
        row.className = "global-transaction-row";

        const dateCell = document.createElement("td");
        dateCell.textContent = formatDate(transaction.date);
        row.appendChild(dateCell);

        const userCell = document.createElement("td");
        userCell.textContent = getUserLabel(transaction.user_id);
        row.appendChild(userCell);

        const relationCell = document.createElement("td");
        relationCell.textContent = (transaction.relation_type || "").toUpperCase();
        row.appendChild(relationCell);

        const typeCell = document.createElement("td");
        typeCell.textContent = (transaction.type || "").toUpperCase();
        row.appendChild(typeCell);

        const amountCell = document.createElement("td");
        amountCell.textContent = formatCurrency(transaction.amount);
        row.appendChild(amountCell);

        const categoryCell = document.createElement("td");
        categoryCell.textContent = getCategoryLabel(transaction.category_id) || "—";
        row.appendChild(categoryCell);

        const descriptionCell = document.createElement("td");
        descriptionCell.textContent = transaction.description ?? "";
        row.appendChild(descriptionCell);

        if (state.highlightTransactionId && state.highlightTransactionId === transaction._id) {
            row.classList.add("highlight");
        }

        row.addEventListener("click", () => {
            closeNotificationPanel();
            state.highlightTransactionId = transaction._id;
            setActiveSection("users");
            selectUser(transaction.user_id);
        });

        fragment.appendChild(row);
    });

    allTransactionsTable.appendChild(fragment);
}

async function loadAdmins() {
    if (!state.isAuthenticated) {
        return;
    }
    try {
        const admins = await apiFetch("/admins");
        state.admins = Array.isArray(admins) ? admins : [];
        state.adminsLoaded = true;

        if (state.admin) {
            const current = state.admins.find((item) => item._id === state.admin._id);
            if (current) {
                state.admin = current;
                populateAdminProfileForm();
            }
        }

        renderAdminTable();
    } catch (error) {
        console.error("Impossible de charger les administrateurs :", error);
    }
}

function renderAdminTable() {
    if (!adminTableBody) {
        return;
    }
    adminTableBody.innerHTML = "";

    const currentId = state.admin?._id;
    const others = state.admins.filter((admin) => admin._id !== currentId);

    if (adminCountEl) {
        adminCountEl.textContent = `${others.length} administrateur(s)`;
    }

    if (!others.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 5;
        cell.className = "muted";
        cell.textContent = "Aucun autre administrateur enregistré.";
        row.appendChild(cell);
        adminTableBody.appendChild(row);
        return;
    }

    const fragment = document.createDocumentFragment();
    others.forEach((admin) => {
        const row = document.createElement("tr");

        const usernameCell = document.createElement("td");
        usernameCell.textContent = admin.username || admin.email || admin._id;
        row.appendChild(usernameCell);

        const emailCell = document.createElement("td");
        emailCell.textContent = admin.email || "—";
        row.appendChild(emailCell);

        const roleCell = document.createElement("td");
        roleCell.textContent = (admin.role || "admin").toUpperCase();
        row.appendChild(roleCell);

        const createdCell = document.createElement("td");
        createdCell.textContent = admin.created_at ? formatDate(admin.created_at) : "—";
        row.appendChild(createdCell);

        const actionsCell = document.createElement("td");
        actionsCell.className = "admin-table-actions";
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "secondary";
        deleteBtn.dataset.adminId = admin._id;
        deleteBtn.textContent = "Supprimer";
        actionsCell.appendChild(deleteBtn);
        row.appendChild(actionsCell);

        fragment.appendChild(row);
    });

    adminTableBody.appendChild(fragment);
}

function populateAdminProfileForm() {
    if (!adminProfileForm || !state.admin) {
        return;
    }
    if (adminUsernameInput) {
        adminUsernameInput.value = state.admin.username || "";
    }
    if (adminEmailInput) {
        adminEmailInput.value = state.admin.email || "";
    }
    if (adminProfileForm.elements.current_password) {
        adminProfileForm.elements.current_password.value = "";
    }
    if (adminProfileForm.elements.new_password) {
        adminProfileForm.elements.new_password.value = "";
    }
}

function getUserLabel(userId) {
    if (!userId) {
        return "Utilisateur";
    }
    const user = state.users.find((item) => item._id === userId);
    if (user) {
        return formatUserName(user) || user.email || userId;
    }
    return userId;
}


function handleDocumentClick(event) {
    if (!notificationPanel || !notificationPanel.classList.contains("open")) {
        return;
    }
    const target = event.target;
    if (notificationPanel.contains(target)) {
        return;
    }
    if (notificationToggleButton && notificationToggleButton.contains(target)) {
        return;
    }
    closeNotificationPanel();
}

async function handleLogin(event) {
    event.preventDefault();
    if (loginError) {
        loginError.textContent = "";
    }

    const formData = new FormData(loginForm);
    const username = (formData.get("username") || "").trim();
    const password = formData.get("password") || "";

    if (!username || !password) {
        if (loginError) {
            loginError.textContent = "Merci de renseigner les deux champs.";
        }
        return;
    }

    try {
        const response = await apiFetch("/admins/login", {
            method: "POST",
            body: JSON.stringify({ username, password }),
        });

        state.admin = response.admin;
        state.isAuthenticated = true;
        populateAdminProfileForm();

        if (loginView) {
            loginView.classList.add("hidden");
        }
        if (appRoot) {
            appRoot.classList.remove("hidden");
        }

        await initializeApp();
    } catch (error) {
        if (loginError) {
            loginError.textContent = error.message || "Connexion impossible.";
        }
    }
}

function handleLogout() {
    state.isAuthenticated = false;
    state.admin = null;
    state.users = [];
    state.selectedUserId = null;
    state.currentUser = null;
    state.transactions = [];
    state.categories = [];
    state.reports = [];
    state.reportHistory = [];
    state.selectedReportIndex = null;
    state.notifications = [];
    state.notificationsLoaded = false;
    state.allTransactions = [];
    state.allTransactionsFilters = { category: "", from: "", to: "" };
    state.allTransactionsSort = "date_desc";
    state.allTransactionsLoaded = false;
    state.admins = [];
    state.adminsLoaded = false;
    populateAllTransactionsCategoryFilter();
    syncAllTransactionsFilterInputs();
    if (adminProfileForm) {
        adminProfileForm.reset();
    }
    if (adminUsernameInput) {
        adminUsernameInput.value = "";
    }
    if (adminEmailInput) {
        adminEmailInput.value = "";
    }
    if (adminTableBody) {
        adminTableBody.innerHTML =
            '<tr><td colspan="5" class="muted">Aucun autre administrateur enregistré.</td></tr>';
    }
    if (adminCountEl) {
        adminCountEl.textContent = "";
    }

    renderUserList();
    renderTransactions([]);
    renderCategoryList();
    renderReportHistory();
    renderReportDetail();
    renderNotifications();
    closeNotificationPanel();

    if (loginForm) {
        loginForm.reset();
    }
    if (loginError) {
        loginError.textContent = "";
    }
    if (loginView) {
        loginView.classList.remove("hidden");
    }
    if (appRoot) {
        appRoot.classList.add("hidden");
    }

    setActiveSection("users");
    syncUserSectionInteractivity();
}

async function initializeApp() {
    try {
        await Promise.all([loadUsers(), loadCategories(), loadAdmins()]);
        await loadNotifications();
    } catch (error) {
        console.error(error);
        alert("Impossible de charger les données initiales : " + error.message);
    } finally {
        renderReportHistory();
        renderReportDetail();
        setActiveSection(activeSection);
        syncUserSectionInteractivity();
        syncAllTransactionsFilterInputs();
        populateAdminProfileForm();
    }
}

async function toggleNotificationPanel() {
    if (!state.isAuthenticated || !notificationPanel) {
        return;
    }
    if (notificationPanel.classList.contains("open")) {
        closeNotificationPanel();
    } else {
        await openNotificationPanel();
    }
}

async function openNotificationPanel() {
    if (!notificationPanel) {
        return;
    }
    notificationPanel.classList.remove("hidden");
    notificationPanel.classList.add("open");

    if (!state.notificationsLoaded) {
        await loadNotifications();
    } else {
        renderNotifications();
    }
}

function closeNotificationPanel() {
    if (!notificationPanel) {
        return;
    }
    notificationPanel.classList.remove("open");
    notificationPanel.classList.add("hidden");
}

function updateNotificationBadge() {
    if (!notificationBadge) {
        return;
    }
    const unread = state.notifications.filter((notification) => !notification.is_read).length;
    if (unread > 0) {
        notificationBadge.textContent = unread;
        notificationBadge.classList.remove("hidden");
    } else {
        notificationBadge.classList.add("hidden");
        notificationBadge.textContent = "";
    }
}

if (openAddUserButton) {
    openAddUserButton.addEventListener("click", () => {
        if (!isUserSectionActive()) {
            return;
        }
        openUserDialog("create");
    });
}

if (editUserButton) {
    editUserButton.addEventListener("click", () => {
        if (!state.currentUser || !isUserSectionActive()) {
            return;
        }
        openUserDialog("edit", state.currentUser);
    });
}

        document.getElementById("cancel-user").addEventListener("click", () => userDialog.close());

if (openAddTransactionButton) {
    openAddTransactionButton.addEventListener("click", () => {
        if (!state.selectedUserId || !isUserSectionActive()) return;
        openTransactionDialog("create");
    });
}


        document.getElementById("cancel-transaction").addEventListener("click", () => transactionDialog.close());
        deleteUserButton.addEventListener("click", handleDeleteUser);
        openAddCategoryButton.addEventListener("click", () => openCategoryDialog("create"));
        cancelCategoryButton.addEventListener("click", () => categoryDialog.close());
        if (refreshNotificationsButton) {
            refreshNotificationsButton.addEventListener("click", () => loadNotifications().catch(console.error));
        }
        if (clearNotificationsButton) {
            clearNotificationsButton.addEventListener("click", () => clearAllNotifications().catch((error) => {
                alert("Impossible de supprimer les notifications : " + error.message);
            }));
        }
        subnavButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const target = button.dataset.section;
                if (!target) {
                    return;
                }
                setActiveSection(target);
            });
        });

        if (reportBackButton) {
            reportBackButton.addEventListener("click", () => {
                state.selectedReportIndex = null;
                renderReportDetail();
                renderReportHistory();
            });
        }

        userForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const mode = userForm.dataset.mode || "create";
            const userId = userForm.dataset.userId || "";
            const formData = new FormData(userForm);

            const payload = {
                first_name: (formData.get("first_name") || "").trim(),
                last_name: (formData.get("last_name") || "").trim(),
                email: (formData.get("email") || "").trim(),
                phone: (formData.get("phone") || "").trim(),
            };

            payload.creances = parseNumberOrZero(formData.get("creances"));
            payload.dettes = parseNumberOrZero(formData.get("dettes"));

            const argentRecolteInput = formData.get("argent_recolte");
            let argentRecolteValue = argentRecolteInput ? parseNumberOrZero(argentRecolteInput) : payload.creances - payload.dettes;

            const roundToTwo = (value) => Math.round(value * 100) / 100;
            payload.creances = roundToTwo(payload.creances);
            payload.dettes = roundToTwo(payload.dettes);
            payload.argent_recolte = roundToTwo(argentRecolteValue);
            payload.phone = payload.phone || null;

            const timestamp = new Date().toISOString();

            try {
                if (mode === "edit") {
                    if (!userId) {
                        throw new Error("Utilisateur introuvable.");
                    }
                    payload.updated_at = timestamp;
                    await apiFetch(`/users/${userId}`, {
                        method: "PUT",
                        body: JSON.stringify(payload),
                    });
                    userDialog.close();
                    await refreshCurrentUser();
                } else {
                    payload.created_at = timestamp;
                    payload.updated_at = timestamp;
                    const created = await apiFetch("/users", {
                        method: "POST",
                        body: JSON.stringify(payload),
                    });
                    userDialog.close();
                    await loadUsers();
                    if (created && created._id) {
                        await selectUser(created._id);
                        await createNotification({
                            message: `Nouvel utilisateur créé : ${formatUserName(payload)}`,
                            target_type: "user",
                            target_id: created._id,
                            related_user_id: created._id,
                            metadata: { email: payload.email },
                        });
                    }
                }
            } catch (error) {
                alert("Erreur lors de l'enregistrement : " + error.message);
            }
        });

        function openUserDialog(mode, user = null) {
            userForm.reset();
            userForm.dataset.mode = mode;
            userForm.dataset.userId = user?._id || "";

            if (userTitleEl) {
                userTitleEl.textContent = mode === "edit" ? "Modifier l'utilisateur" : "Nouvel utilisateur";
            }
            if (userSubmitButton) {
                userSubmitButton.textContent = mode === "edit" ? "Enregistrer les modifications" : "Enregistrer";
            }

            if (mode === "edit" && user) {
                userForm.elements.first_name.value = user.first_name || "";
                userForm.elements.last_name.value = user.last_name || "";
                userForm.elements.email.value = user.email || "";
                userForm.elements.phone.value = user.phone || "";
                userForm.elements.creances.value = parseNumberOrZero(user.creances);
                userForm.elements.dettes.value = parseNumberOrZero(user.dettes);
                userForm.elements.argent_recolte.value =
                    user.argent_recolte !== undefined && user.argent_recolte !== null
                        ? parseNumberOrZero(user.argent_recolte)
                        : "";
            }

            userDialog.showModal();
        }

        transactionsContainer.addEventListener("click", (event) => {
            const target = event.target;
            if (target.closest(".transaction-edit")) {
                const button = target.closest(".transaction-edit");
                const transactionId = button.dataset.transactionId;
                const transaction = state.transactions.find((t) => t._id === transactionId);
                if (transaction) {
                    openTransactionDialog("edit", transaction);
                }
            } else if (target.closest(".transaction-delete")) {
                const button = target.closest(".transaction-delete");
                const transactionId = button.dataset.transactionId;
                handleDeleteTransaction(transactionId);
            }
        });

        categoryForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const mode = categoryForm.dataset.mode || "create";
            const formData = new FormData(categoryForm);
            const payload = {
                name: (formData.get("name") || "").trim(),
                description: (formData.get("description") || "").trim() || null,
            };

            if (!payload.name) {
                alert("Le nom de la catégorie est requis.");
                return;
            }

            try {
                if (mode === "edit") {
                    const categoryId = categoryForm.dataset.categoryId;
                    await apiFetch(`/categories/${categoryId}`, {
                        method: "PUT",
                        body: JSON.stringify(payload),
                    });
                } else {
                    await apiFetch("/categories", {
                        method: "POST",
                        body: JSON.stringify(payload),
                    });
                }
                categoryDialog.close();
                await loadCategories();
            } catch (error) {
                alert("Impossible d'enregistrer la catégorie : " + error.message);
            }
        });

        categoryListEl.addEventListener("click", (event) => {
            const button = event.target.closest("button[data-action]");
            if (!button) {
                return;
            }
            const categoryId = button.dataset.categoryId;
            const category = state.categories.find((c) => c._id === categoryId);
            if (button.dataset.action === "edit" && category) {
                openCategoryDialog("edit", category);
            } else if (button.dataset.action === "delete" && categoryId) {
                handleDeleteCategory(categoryId);
            }
        });

        if (notificationListEl) {
            notificationListEl.addEventListener("click", async (event) => {
                const button = event.target.closest("button[data-notification-id]");
                if (!button) {
                    return;
                }
                const notificationId = button.dataset.notificationId;
                const action = button.dataset.action;
                const notification = state.notifications.find((item) => item._id === notificationId);
                if (!notification) {
                    return;
                }
                if (action === "open") {
                    try {
                        await handleNotificationAction(notification);
                    } catch (error) {
                        console.error(error);
                        alert("Impossible d'ouvrir la notification : " + (error?.message || "Erreur inconnue"));
                    }
                } else if (action === "delete") {
                    await deleteNotification(notificationId).catch((error) => {
                        alert("Impossible de supprimer la notification : " + error.message);
                    });
                }
            });
        }

        transactionForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (!state.selectedUserId) return;

            const mode = transactionForm.dataset.mode || "create";
            const formData = new FormData(transactionForm);
            const transactionPayload = collectTransactionFormData(formData);
            let createdTransactionId = null;

            try {
                if (mode === "edit") {
                    const transactionId = transactionForm.dataset.transactionId;
                    const response = await apiFetch(`/transactions/${transactionId}`, {
                        method: "PUT",
                        body: JSON.stringify(transactionPayload),
                    });
                    if (response && response.user) {
                        state.currentUser = response.user;
                        state.users = state.users.map((u) => (u._id === response.user._id ? response.user : u));
                    }
                } else {
                    if (!state.currentUser) {
                        alert("Utilisateur introuvable en mémoire.");
                        return;
                    }
                    const payload = { transaction: transactionPayload };
                    const response = await apiFetch(`/users/${state.selectedUserId}/transaction`, {
                        method: "PUT",
                        body: JSON.stringify(payload),
                    });
                    if (response && response.user) {
                        state.currentUser = response.user;
                        state.users = state.users.map((u) => (u._id === response.user._id ? response.user : u));
                    }
                    if (response && response.transaction_id) {
                        createdTransactionId = response.transaction_id;
                    }
                }

                transactionDialog.close();
                if (createdTransactionId) {
                    state.highlightTransactionId = createdTransactionId;
                }
                await refreshCurrentUser();
                if (activeSection === "transactions") {
                    await loadAllTransactions().catch(console.error);
                }
                if (createdTransactionId) {
                    await createNotification({
                        message: `Nouvelle transaction ${transactionPayload.relation_type} (${transactionPayload.type}) pour ${formatUserName(state.currentUser)}`,
                        target_type: "transaction",
                        target_id: createdTransactionId,
                        related_user_id: state.selectedUserId,
                        metadata: {
                            amount: transactionPayload.amount,
                            relation_type: transactionPayload.relation_type,
                            type: transactionPayload.type,
                            user_name: formatUserName(state.currentUser),
                        },
                    });
                }
            } catch (error) {
                alert("Erreur lors de l'enregistrement : " + error.message);
            }
        });

        if (reportForm) {
            reportForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                const formData = new FormData(reportForm);
                const periodStartValue = formData.get("period_start");
                const periodEndValue = formData.get("period_end");

                if (!periodStartValue || !periodEndValue) {
                    alert("Veuillez renseigner les deux dates de la période.");
                    return;
                }

                const startDate = new Date(periodStartValue);
                const endDate = new Date(periodEndValue);
                if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
                    alert("Format de date invalide.");
                    return;
                }
                if (startDate > endDate) {
                    alert("La date de début doit être antérieure à la date de fin.");
                    return;
                }

                const period_start = startDate.toISOString();
                const period_end = endDate.toISOString();

                if (reportSubmitButton) {
                    reportSubmitButton.disabled = true;
                    reportSubmitButton.textContent = "Génération...";
                }
                if (reportStatusEl) {
                    reportStatusEl.textContent = "Génération des rapports en cours...";
                }

                try {
                    if (!state.users.length) {
                        await loadUsers();
                    }

                    const reports = [];
                    for (const user of state.users) {
                        try {
                            const response = await apiFetch(`/reports/generate`, {
                                method: "POST",
                                body: JSON.stringify({
                                    user_id: user._id,
                                    period_start,
                                    period_end,
                                }),
                            });
                            if (response && response.report) {
                                reports.push({
                                    user,
                                    report: response.report,
                                });
                                if (response.report_id) {
                                    await createNotification({
                                        message: `Rapport généré pour ${formatUserName(user)}`,
                                        target_type: "report",
                                        target_id: response.report_id,
                                        related_user_id: user._id,
                                        metadata: {
                                            user_id: user._id,
                                            user_name: formatUserName(user),
                                            period_start,
                                            period_end,
                                        },
                                    });
                                }
                            }
                        } catch (error) {
                            console.error(`Erreur pour l'utilisateur ${user._id} :`, error);
                        }
                    }

                    const entry = {
                        id: `${Date.now()}-${period_start}-${period_end}`,
                        period_start,
                        period_end,
                        generated_at: new Date().toISOString(),
                        items: reports,
                    };
                    state.reportHistory.unshift(entry);
                    state.selectedReportIndex = 0;
                    state.reports = reports;
                    renderReportHistory();
                    renderReportDetail();
                    if (reportStatusEl) {
                        if (reports.length) {
                            const periodStartLabel = formatDate(period_start);
                            const periodEndLabel = formatDate(period_end);
                            reportStatusEl.textContent = `Rapports générés (${periodStartLabel} → ${periodEndLabel}) pour ${reports.length} utilisateur(s).`;
                        } else {
                            reportStatusEl.textContent = "Aucun rapport généré pour cette période.";
                        }
                    }
                } catch (error) {
                    alert("Impossible de générer les rapports : " + error.message);
                    if (reportStatusEl) {
                        reportStatusEl.textContent = "";
                    }
                } finally {
                    if (reportSubmitButton) {
                        reportSubmitButton.disabled = false;
                        reportSubmitButton.textContent = "Générer les rapports";
                    }
                }
            });
        }

        function setActiveSection(section) {
            activeSection = section;
            subnavButtons.forEach((button) => {
                button.classList.toggle("active", button.dataset.section === section);
            });

            const showUsers = section === "users";
            const showCategories = section === "categories";
            const showReports = section === "reports";
            const showTransactions = section === "transactions";
            const showAdmins = section === "admins";

            if (categorySection) {
                categorySection.hidden = !showCategories;
            }
            if (reportsSection) {
                reportsSection.hidden = !showReports;
            }
            if (transactionsSection) {
                transactionsSection.hidden = !showTransactions;
            }
            if (adminsSection) {
                adminsSection.hidden = !showAdmins;
            }

            syncUserSectionInteractivity();

            if (showTransactions) {
                populateAllTransactionsCategoryFilter();
                syncAllTransactionsFilterInputs();
                loadAllTransactions().catch(console.error);
            }

            if (showAdmins) {
                populateAdminProfileForm();
                if (!state.adminsLoaded) {
                    loadAdmins().catch(console.error);
                } else {
                    renderAdminTable();
                }
            }

            if (showUsers) {
                updateUserDetails(state.currentUser);
            } else {
                userOverview.hidden = true;
                userDetailsSection.hidden = true;
                if (editUserButton) {
                    editUserButton.disabled = true;
                }
            }

            if (showReports) {
                renderReportHistory();
                renderReportDetail();
            }

            if (showCategories && !state.categories.length) {
                loadCategories().catch((error) => console.error(error));
            }
        }

        async function loadUsers() {
            const users = await apiFetch("/users");
            state.users = users;
            renderUserList();
        }

        async function loadCategories() {
            const categories = await apiFetch("/categories");
            state.categories = categories;
            renderCategoryList();
            populateCategorySelect();
            populateAllTransactionsCategoryFilter();
            syncAllTransactionsFilterInputs();
            if (state.transactions.length) {
                renderTransactions(state.transactions);
            }
        }

        function renderUserList() {
            userListEl.innerHTML = "";
            if (!state.users.length) {
                const empty = document.createElement("li");
                empty.className = "muted";
                empty.textContent = "Aucun utilisateur";
                empty.style.cursor = "default";
                userListEl.appendChild(empty);
                if (activeSection === "users") {
                    userDetailsSection.hidden = true;
                    userOverview.hidden = false;
                } else {
                    userDetailsSection.hidden = true;
                    userOverview.hidden = true;
                }
                renderTransactions([]);
                syncUserSectionInteractivity();
                return;
            }

            state.users.forEach((user) => {
                const li = document.createElement("li");
                li.textContent = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email;
                if (user._id === state.selectedUserId) {
                    li.classList.add("active");
                }
                li.addEventListener("click", () => selectUser(user._id));
                userListEl.appendChild(li);
            });
            syncUserSectionInteractivity();
        }

        function renderCategoryList() {
            categoryListEl.innerHTML = "";
            if (!state.categories.length) {
                const empty = document.createElement("li");
                empty.className = "category-empty muted";
                empty.textContent = "Aucune catégorie";
                categoryListEl.appendChild(empty);
                return;
            }

            state.categories.forEach((category) => {
                const li = document.createElement("li");
                const info = document.createElement("header");
                const nameEl = document.createElement("strong");
                nameEl.textContent = category.name || "Sans nom";
                info.appendChild(nameEl);
                if (category.description) {
                    const descriptionEl = document.createElement("span");
                    descriptionEl.className = "muted";
                    descriptionEl.textContent = category.description;
                    info.appendChild(descriptionEl);
                }
                li.appendChild(info);

                const actions = document.createElement("div");
                actions.className = "category-actions";

                const editButton = document.createElement("button");
                editButton.type = "button";
                editButton.className = "secondary";
                editButton.dataset.action = "edit";
                editButton.dataset.categoryId = category._id;
                editButton.textContent = "Modifier";
                actions.appendChild(editButton);

                const deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.className = "secondary";
                deleteButton.dataset.action = "delete";
                deleteButton.dataset.categoryId = category._id;
                deleteButton.textContent = "Supprimer";
                actions.appendChild(deleteButton);

                li.appendChild(actions);
                categoryListEl.appendChild(li);
            });
        }

        async function loadNotifications() {
            if (!state.isAuthenticated) {
                return;
            }
            try {
                const notifications = await apiFetch("/notifications");
                state.notifications = Array.isArray(notifications) ? notifications : [];
                state.notificationsLoaded = true;
                renderNotifications();
            } catch (error) {
                console.error("Impossible de charger les notifications :", error);
                updateNotificationBadge();
            }
        }

        async function clearAllNotifications() {
            if (!state.notifications.length) {
                renderNotifications();
                return;
            }
            const ids = state.notifications.map((notification) => notification._id);
            await Promise.all(
                ids.map((notificationId) =>
                    apiFetch(`/notifications/${notificationId}`, { method: "DELETE" }).catch((error) => {
                        console.error("Suppression notification échouée", error);
                    })
                )
            );
            state.notifications = [];
            renderNotifications();
        }

        function renderNotifications() {
            if (!notificationListEl) {
                return;
            }
            notificationListEl.innerHTML = "";
            if (!state.notifications.length) {
                const empty = document.createElement("li");
                empty.className = "muted";
                empty.textContent = "Aucune notification";
                notificationListEl.appendChild(empty);
                updateNotificationBadge();
                return;
            }

            state.notifications.forEach((notification) => {
                const li = document.createElement("li");
                if (!notification.is_read) {
                    li.classList.add("unread");
                }

                const info = document.createElement("header");
                const title = document.createElement("strong");
                title.textContent = notification.message || "Notification";
                info.appendChild(title);
                const subtitle = document.createElement("span");
                subtitle.className = "muted";
                subtitle.textContent = formatRelativeTime(notification.created_at);
                info.appendChild(subtitle);
                li.appendChild(info);

                const actions = document.createElement("div");
                actions.className = "notification-actions";

                const openButton = document.createElement("button");
                openButton.type = "button";
                openButton.dataset.action = "open";
                openButton.dataset.notificationId = notification._id;
                openButton.textContent = "Voir";
                actions.appendChild(openButton);

                const deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.className = "secondary";
                deleteButton.dataset.action = "delete";
                deleteButton.dataset.notificationId = notification._id;
                deleteButton.textContent = "Supprimer";
                actions.appendChild(deleteButton);

                li.appendChild(actions);
                notificationListEl.appendChild(li);
            });
            updateNotificationBadge();

            updateNotificationBadge();
        }

        async function createNotification(notification) {
            try {
                const payload = {
                    ...notification,
                    target_id: notification.target_id != null ? String(notification.target_id) : null,
                    related_user_id: notification.related_user_id != null ? String(notification.related_user_id) : null,
                    created_at: notification.created_at || new Date().toISOString(),
                    is_read: notification.is_read ?? false,
                };
                const result = await apiFetch("/notifications", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                const storedNotification = {
                    ...payload,
                    _id: result?._id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                };
                state.notifications = [storedNotification, ...state.notifications];
                state.notificationsLoaded = true;
                renderNotifications();
            } catch (error) {
                console.error("Impossible de créer la notification :", error);
            }
        }

        async function deleteNotification(notificationId) {
            await apiFetch(`/notifications/${notificationId}`, { method: "DELETE" });
            state.notifications = state.notifications.filter((notification) => notification._id !== notificationId);
            renderNotifications();
        }

        function renderReportHistory() {
            if (!reportHistoryWrapper || !reportHistoryList) {
                return;
            }

            const entries = state.reportHistory;
            reportHistoryList.innerHTML = "";

            if (reportHistoryEmpty) {
                reportHistoryEmpty.hidden = Boolean(entries.length);
            }

            if (!entries.length) {
                if (reportHistoryWrapper) {
                    reportHistoryWrapper.hidden = false;
                }
                return;
            }

            entries.forEach((entry, index) => {
                const item = document.createElement("li");
                item.className = "report-history-item";
                if (state.selectedReportIndex === index) {
                    item.classList.add("active");
                }

                const info = document.createElement("div");
                info.style.display = "flex";
                info.style.flexDirection = "column";
                info.style.gap = "0.2rem";

                const title = document.createElement("span");
                title.style.fontWeight = "600";
                title.textContent = `${formatDate(entry.period_start)} → ${formatDate(entry.period_end)}`;

                const subtitle = document.createElement("span");
                subtitle.className = "muted";
                subtitle.textContent = `Généré le ${formatDate(entry.generated_at)}`;

                info.appendChild(title);
                info.appendChild(subtitle);

                const countBadge = document.createElement("span");
                countBadge.className = "muted";
                countBadge.textContent = `${entry.items.length} utilisateur(s)`;

                item.appendChild(info);
                item.appendChild(countBadge);

                item.addEventListener("click", () => {
                    state.selectedReportIndex = index;
                    renderReportHistory();
                    renderReportDetail();
                });

                reportHistoryList.appendChild(item);
            });

            reportHistoryWrapper.hidden = state.selectedReportIndex !== null;
        }

        function renderReportDetail() {
            if (!reportDetail) {
                return;
            }

            const index = state.selectedReportIndex;
            if (index === null || index < 0 || index >= state.reportHistory.length) {
                reportDetail.hidden = true;
                state.reports = [];
                renderReportTable([]);
                if (reportBackButton) {
                    reportBackButton.hidden = true;
                }
                if (reportHistoryWrapper) {
                    reportHistoryWrapper.hidden = false;
                }
                if (reportDetailSubtitle) {
                    reportDetailSubtitle.textContent = "";
                }
                if (reportStatusEl) {
                    reportStatusEl.textContent = state.reportHistory.length
                        ? "Sélectionne un rapport dans l'historique pour afficher les détails."
                        : "Génère un rapport pour démarrer.";
                }
                return;
            }

            const entry = state.reportHistory[index];
            state.reports = entry.items;
            reportDetail.hidden = false;
            if (reportBackButton) {
                reportBackButton.hidden = false;
            }
            if (reportHistoryWrapper) {
                reportHistoryWrapper.hidden = true;
            }

            if (reportDetailTitle) {
                reportDetailTitle.textContent = `Rapport ${index + 1}`;
            }
            if (reportDetailSubtitle) {
                const periodLabel = `${formatDate(entry.period_start)} → ${formatDate(entry.period_end)}`;
                const generatedLabel = formatDate(entry.generated_at);
                reportDetailSubtitle.textContent = `${periodLabel} • Généré le ${generatedLabel}`;
            }
            if (reportStatusEl) {
                const periodLabel = `${formatDate(entry.period_start)} → ${formatDate(entry.period_end)}`;
                reportStatusEl.textContent = `Rapport sélectionné (${periodLabel}) pour ${entry.items.length} utilisateur(s).`;
            }

            renderReportTable(entry.items);
        }

        function renderReportTable(items = state.reports) {
            if (!reportTableBody) {
                return;
            }

            reportTableBody.innerHTML = "";

            if (!items || !items.length) {
                const emptyRow = document.createElement("tr");
                const emptyCell = document.createElement("td");
                emptyCell.colSpan = 4;
                emptyCell.className = "muted";
                emptyCell.textContent =
                    state.selectedReportIndex === null
                        ? "Sélectionne un rapport dans l'historique pour afficher les détails."
                        : "Aucune donnée disponible pour ce rapport.";
                emptyRow.appendChild(emptyCell);
                reportTableBody.appendChild(emptyRow);
                return;
            }

            items.forEach(({ user, report }) => {
                const row = document.createElement("tr");
                const fullName =
                    `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
                    user.email ||
                    "Utilisateur";

                const creancesValue = parseNumberOrZero(report.total_credit ?? report.creances);
                const dettesValue = parseNumberOrZero(report.total_debit ?? report.dettes);
                const collecteValue = parseNumberOrZero(report.net_balance ?? report.argent_recolte);

                const nameCell = document.createElement("td");
                nameCell.textContent = fullName;
                const creancesCell = document.createElement("td");
                creancesCell.textContent = formatCurrency(creancesValue);
                const dettesCell = document.createElement("td");
                dettesCell.textContent = formatCurrency(dettesValue);
                const collecteCell = document.createElement("td");
                collecteCell.textContent = formatCurrency(collecteValue);

                row.appendChild(nameCell);
                row.appendChild(creancesCell);
                row.appendChild(dettesCell);
                row.appendChild(collecteCell);

                reportTableBody.appendChild(row);
            });
        }

        async function selectUser(userId) {
            if (!isUserSectionActive()) {
                return;
            }
            state.selectedUserId = userId;
            renderUserList();
            await refreshCurrentUser();
            syncUserSectionInteractivity();
        }

        async function refreshCurrentUser() {
            if (!state.selectedUserId) {
                state.currentUser = null;
                state.transactions = [];
                renderTransactions([]);
                updateUserDetails(null);
                return;
            }

            try {
                const [user, transactions] = await Promise.all([
                    apiFetch(`/users/${state.selectedUserId}`),
                    apiFetch(`/transactions?user_id=${encodeURIComponent(state.selectedUserId)}`),
                ]);

                state.currentUser = user;
                state.transactions = transactions;

                updateUserDetails(user);
                renderTransactions(transactions);

                state.users = state.users.map((u) => (u._id === user._id ? user : u));
                renderUserList();
            } catch (error) {
                alert("Impossible de charger l'utilisateur : " + error.message);
            }
        }

        function updateUserDetails(user) {
            const showUsers = activeSection === "users";
            if (!showUsers) {
                userDetailsSection.hidden = true;
                userOverview.hidden = true;
                if (editUserButton) {
                    editUserButton.disabled = true;
                }
                syncUserSectionInteractivity();
                return;
            }

            if (!user) {
                userDetailsSection.hidden = true;
                userOverview.hidden = false;
                if (editUserButton) {
                    editUserButton.disabled = true;
                }
                syncUserSectionInteractivity();
                return;
            }

            userDetailsSection.hidden = false;
            userOverview.hidden = true;
            if (editUserButton) {
                editUserButton.disabled = !isUserSectionActive();
            }

            document.getElementById("user-name").textContent =
                `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Profil";
            document.getElementById("user-email").textContent = user.email || "Email inconnu";
            document.getElementById("user-phone").textContent = user.phone || "—";
            document.getElementById("user-creances").textContent = formatCurrency(user.creances);
            document.getElementById("user-dettes").textContent = formatCurrency(user.dettes);
            document.getElementById("user-argent").textContent = formatCurrency(user.argent_recolte);
            document.getElementById("user-created").textContent = formatDate(user.created_at);
            document.getElementById("user-updated").textContent = formatDate(user.updated_at);
            syncUserSectionInteractivity();
        }

        function renderTransactions(transactions) {
            transactionsContainer.innerHTML = "";
            if (!transactions || !transactions.length) {
                const empty = document.createElement("div");
                empty.className = "empty-state";
                empty.textContent = "Aucune transaction enregistrée pour le moment.";
                transactionsContainer.appendChild(empty);
                return;
            }

            transactions.forEach((transaction) => {
                const item = document.createElement("div");
                item.className = `transaction-item ${transaction.type === "debit" ? "debit" : "credit"}`;
                item.dataset.transactionId = transaction._id;
                const categoryLabel = getCategoryLabel(transaction.category_id);
                item.innerHTML = `
                    <strong>${(transaction.relation_type || "").toUpperCase()} • ${(transaction.type || "").toUpperCase()}</strong>
                    <p>Montant : ${formatCurrency(transaction.amount)}</p>
                    <p>Catégorie : ${categoryLabel ?? "—"}</p>
                    <p>${transaction.description ?? ""}</p>
                    <p class="muted">${formatDate(transaction.date)}</p>
                `;

                const actions = document.createElement("div");
                actions.className = "transaction-actions";
                const editButton = document.createElement("button");
                editButton.type = "button";
                editButton.className = "secondary transaction-edit";
                editButton.dataset.transactionId = transaction._id;
                editButton.textContent = "Modifier";
                actions.appendChild(editButton);
                const deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.className = "secondary transaction-delete";
                deleteButton.dataset.transactionId = transaction._id;
                deleteButton.textContent = "Supprimer";
                actions.appendChild(deleteButton);

                item.appendChild(actions);
                transactionsContainer.appendChild(item);

                if (state.highlightTransactionId && state.highlightTransactionId === transaction._id) {
                    item.classList.add("highlight");
                    item.scrollIntoView({ behavior: "smooth", block: "center" });
                    setTimeout(() => {
                        item.classList.remove("highlight");
                    }, 4000);
                }
            });
            state.highlightTransactionId = null;
        }

        function openTransactionDialog(mode, transaction = null) {
            transactionForm.reset();
            transactionForm.dataset.mode = mode;
            transactionForm.dataset.transactionId = transaction?._id || "";
            populateCategorySelect(transaction?.category_id || "");

            if (mode === "edit" && transaction) {
                transactionTitleEl.textContent = "Modifier la transaction";
                transactionSubmitButton.textContent = "Mettre à jour";
                transactionForm.elements.relation_type.value = transaction.relation_type || "creance";
                transactionForm.elements.type.value = transaction.type || "credit";
                transactionForm.elements.amount.value = parseNumberOrZero(transaction.amount);
                transactionForm.elements.description.value = transaction.description ?? "";
                transactionForm.elements.category_id.value = transaction.category_id ?? "";
                const dateValue = transaction.date ? new Date(transaction.date) : new Date();
                transactionForm.elements.date.value = toLocalInputDateTime(dateValue);
            } else {
                transactionTitleEl.textContent = "Nouvelle transaction";
                transactionSubmitButton.textContent = "Valider";
                const now = new Date();
                transactionForm.elements.date.value = toLocalInputDateTime(now);
            }

            transactionDialog.showModal();
        }

        function collectTransactionFormData(formData) {
            const amount = parseNumberOrZero(formData.get("amount"));
            const categoryIdRaw = formData.get("category_id") || "";

            const data = {
                relation_type: formData.get("relation_type"),
                type: formData.get("type"),
                amount,
                description: formData.get("description") || null,
                date: (() => {
                    const dateValue = formData.get("date");
                    return dateValue ? new Date(dateValue).toISOString() : new Date().toISOString();
                })(),
            };

            data.category_id = categoryIdRaw || null;

            return data;
        }

        function openCategoryDialog(mode, category = null) {
            categoryForm.reset();
            categoryForm.dataset.mode = mode;
            categoryForm.dataset.categoryId = category?._id || "";

            if (mode === "edit" && category) {
                categoryTitleEl.textContent = "Modifier la catégorie";
                categorySubmitButton.textContent = "Mettre à jour";
                categoryForm.elements.name.value = category.name || "";
                categoryForm.elements.description.value = category.description || "";
            } else {
                categoryTitleEl.textContent = "Nouvelle catégorie";
                categorySubmitButton.textContent = "Enregistrer";
            }

            categoryDialog.showModal();
        }

        async function handleDeleteCategory(categoryId) {
            const category = state.categories.find((c) => c._id === categoryId);
            const label = category ? (category.name || category._id) : "cette catégorie";
            const confirmation = window.confirm(`Supprimer ${label} ? Cette action est définitive.`);
            if (!confirmation) {
                return;
            }
            try {
                await apiFetch(`/categories/${categoryId}`, { method: "DELETE" });
                await loadCategories();
            } catch (error) {
                alert("Impossible de supprimer la catégorie : " + error.message);
            }
        }

        function populateCategorySelect(selectedId = null) {
            const select = transactionForm.elements.category_id;
            if (!select) {
                return;
            }
            const targetValue = selectedId !== null ? selectedId : select.value;
            select.innerHTML = "";

            const emptyOption = document.createElement("option");
            emptyOption.value = "";
            emptyOption.textContent = "Sans catégorie";
            select.appendChild(emptyOption);

            state.categories.forEach((category) => {
                const option = document.createElement("option");
                option.value = category._id;
                option.textContent = category.name || category._id;
                select.appendChild(option);
            });

            if (targetValue && [...select.options].some((option) => option.value === targetValue)) {
                select.value = targetValue;
            } else {
                select.value = "";
            }
        }

        function getCategoryLabel(categoryId) {
            if (!categoryId) {
                return null;
            }
            const category = state.categories.find((c) => c._id === categoryId);
            return category ? category.name || category._id : categoryId;
        }

        async function apiFetch(path, options = {}) {
            const response = await fetch(`${API_BASE_URL}${path}`, {
                headers: { "Content-Type": "application/json" },
                ...options,
            });
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                const message = errorBody.error || response.statusText || "Erreur réseau";
                throw new Error(message);
            }
            return response.json();
        }

        function parseNumberOrZero(value) {
            const parsed = Number.parseFloat(value);
            return Number.isFinite(parsed) ? parsed : 0;
        }

        function formatCurrency(value) {
            const number = parseNumberOrZero(value);
            return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(number);
        }

        function formatDate(value) {
            if (!value) return "—";
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return value;
            return date.toLocaleString("fr-FR");
        }

        function toLocalInputDateTime(date) {
            const pad = (n) => n.toString().padStart(2, "0");
            const yyyy = date.getFullYear();
            const mm = pad(date.getMonth() + 1);
            const dd = pad(date.getDate());
            const hh = pad(date.getHours());
            const min = pad(date.getMinutes());
            return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
        }

        function formatRelativeTime(value) {
            if (!value) {
                return "—";
            }
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                return value;
            }
            const diffMs = Date.now() - date.getTime();
            const diffSeconds = Math.floor(diffMs / 1000);
            if (diffSeconds < 60) {
                return "à l'instant";
            }
            const diffMinutes = Math.floor(diffSeconds / 60);
            if (diffMinutes < 60) {
                return `il y a ${diffMinutes} min`;
            }
            const diffHours = Math.floor(diffMinutes / 60);
            if (diffHours < 24) {
                return `il y a ${diffHours} h`;
            }
            const diffDays = Math.floor(diffHours / 24);
            if (diffDays < 7) {
                return `il y a ${diffDays} j`;
            }
            return date.toLocaleString("fr-FR");
        }

        function formatUserName(user) {
            if (!user) {
                return "Utilisateur";
            }
            const full = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
            return full || user.email || user.phone || "Utilisateur";
        }

        async function ensureUserLoaded(userId) {
            if (!userId) {
                return null;
            }
            let user = state.users.find((item) => item._id === userId);
            if (user) {
                return user;
            }
            try {
                user = await apiFetch(`/users/${userId}`);
                state.users.push(user);
                renderUserList();
                return user;
            } catch (error) {
                console.error("Impossible de charger l'utilisateur demandé :", error);
                throw error;
            }
        }

        async function handleNotificationAction(notification) {
            if (!notification) {
                return;
            }

            if (notification.target_type === "user" && notification.target_id) {
                await ensureUserLoaded(notification.target_id);
                await selectUser(notification.target_id);
                setActiveSection("users");
            } else if (notification.target_type === "transaction" && notification.target_id) {
                const relatedUserId =
                    notification.related_user_id || notification.user_id || notification.metadata?.user_id || notification.metadata?.related_user_id;
                if (relatedUserId) {
                    state.highlightTransactionId = notification.target_id;
                    await ensureUserLoaded(relatedUserId);
                    await selectUser(relatedUserId);
                    setActiveSection("users");
                } else {
                    alert("Impossible de déterminer l'utilisateur associé à la transaction.");
                }
            } else if (notification.target_type === "report" && notification.target_id) {
                try {
                    const report = await apiFetch(`/reports/${notification.target_id}`);
                    const relatedUserId = notification.related_user_id || report.user_id || notification.metadata?.user_id;
                    let relatedUser = null;
                    if (relatedUserId) {
                        relatedUser = await ensureUserLoaded(relatedUserId).catch(() => null);
                    }
                    const entry = {
                        id: `notif-${notification._id}`,
                        period_start: notification.metadata?.period_start || report.period_start,
                        period_end: notification.metadata?.period_end || report.period_end,
                        generated_at: report.generated_at || notification.created_at,
                        items: [
                            {
                                user: relatedUser || { first_name: "", last_name: "", email: notification.metadata?.user_email },
                                report: {
                                    total_credit: report.total_credit,
                                    total_debit: report.total_debit,
                                    net_balance: report.net_balance,
                                    period_start: report.period_start,
                                    period_end: report.period_end,
                                },
                            },
                        ],
                    };
                    state.reportHistory = state.reportHistory.filter((existing) => existing.id !== entry.id);
                    state.reportHistory.unshift(entry);
                    state.selectedReportIndex = 0;
                    state.reports = entry.items;
                    renderReportHistory();
                    renderReportDetail();
                    setActiveSection("reports");
                } catch (error) {
                    console.error("Impossible d'afficher le rapport :", error);
                    alert("Impossible d'ouvrir le rapport lié à cette notification.");
                }
            } else {
                alert("Cette notification ne contient pas de destination exploitable.");
            }
        }

        async function handleDeleteUser() {
            if (!state.selectedUserId || !isUserSectionActive()) {
                return;
            }
            const user = state.currentUser;
            const label = user
                ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email || "cet utilisateur"
                : "cet utilisateur";
            const confirmation = window.confirm(`Supprimer ${label} ? Cette action est définitive.`);
            if (!confirmation) {
                return;
            }
            try {
                await apiFetch(`/users/${state.selectedUserId}`, {
                    method: "DELETE",
                });
                state.selectedUserId = null;
                state.currentUser = null;
                state.transactions = [];
                await loadUsers();
                updateUserDetails(null);
                renderTransactions([]);
                if (activeSection === "transactions") {
                    await loadAllTransactions().catch(console.error);
                }
            } catch (error) {
                alert("Impossible de supprimer l'utilisateur : " + error.message);
            }
        }

        async function handleDeleteTransaction(transactionId) {
            if (!transactionId || !state.selectedUserId || !isUserSectionActive()) {
                return;
            }
            const confirmation = window.confirm("Supprimer cette transaction ? Cette action est définitive.");
            if (!confirmation) {
                return;
            }
            try {
                const response = await apiFetch(`/transactions/${transactionId}`, {
                    method: "DELETE",
                });

                if (response && response.user) {
                    state.currentUser = response.user;
                    state.users = state.users.map((u) => (u._id === response.user._id ? response.user : u));
                    updateUserDetails(response.user);
                }

                state.transactions = state.transactions.filter((t) => t._id !== transactionId);
                renderTransactions(state.transactions);
                if (activeSection === "transactions") {
                    await loadAllTransactions().catch(console.error);
                }
            } catch (error) {
                alert("Impossible de supprimer la transaction : " + error.message);
            }
        }

        setActiveSection(activeSection);
        renderReportHistory();
        renderReportDetail();
