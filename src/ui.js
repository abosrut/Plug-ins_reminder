import { renderMarkdown } from "./markdown.js";
import { defaultSettings } from "./data.js";
import { Store } from "./store.js";

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const applySettings = (settings) => {
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.style.setProperty("--accent", settings.accent);
  document.documentElement.style.setProperty(
    "--accent-soft",
    `${settings.accent}33`
  );
  document.body.dataset.background = settings.background;
};

const createState = () => ({
  view: "app",
  currentAppId: null,
  groupFilterId: "all",
  selectedPluginId: null,
  pluginForm: { open: false, id: null, draft: null },
  groupForm: { open: false, mode: "add", id: null, name: "" },
  appForm: { open: false, mode: "add", id: null, name: "" },
  settings: { ...defaultSettings },
  searchQuery: "",
  detailMenuOpen: false
});

export const initUI = async (store) => {
  const root = document.getElementById("app");
  const state = createState();
  const data = { apps: [], groups: [], plugins: [] };

  const loadData = async () => {
    const [apps, groups, plugins, settingsList] = await Promise.all([
      store.getAll("apps"),
      store.getAll("groups"),
      store.getAll("plugins"),
      store.getAll("settings")
    ]);

    data.apps = apps;
    data.groups = groups;
    data.plugins = plugins;

    if (settingsList[0]) {
      state.settings = settingsList[0];
    }

    if (!state.currentAppId && data.apps.length > 0) {
      state.currentAppId = data.apps[0].id;
    }
  };

  const setView = (view, appId) => {
    state.view = view;
    if (appId) {
      state.currentAppId = appId;
      state.groupFilterId = "all";
      state.selectedPluginId = null;
      state.pluginForm = { open: false, id: null, draft: null };
      state.groupForm = { open: false, mode: "add", id: null, name: "" };
    }
  };

  const getApp = () => data.apps.find((app) => app.id === state.currentAppId);
  const getGroupsForApp = (appId) =>
    data.groups.filter((group) => group.appId === appId);
  const getPluginsForApp = (appId) =>
    data.plugins.filter((plugin) => plugin.appId === appId);
  const getGroupName = (id) => data.groups.find((group) => group.id === id)?.name;

  const getPluginCount = (appId) =>
    data.plugins.filter((plugin) => plugin.appId === appId).length;

  const renderSidebar = () => {
    const appTabs = data.apps
      .map((app) => {
        const active =
          state.view === "app" && state.currentAppId === app.id ? "active" : "";
        return `<button class=\"app-tab ${active}\" data-action=\"nav-app\" data-id=\"${
          app.id
        }\">
          <span class=\"app-dot\"></span>
          <span>${escapeHtml(app.name)}</span>
          <span class=\"count\">${getPluginCount(app.id)}</span>
        </button>`;
      })
      .join("");

    return `<div class=\"sidebar\">
      <div class=\"sidebar-card\">
        <div class=\"sidebar-title\">Applications</div>
        <div class=\"app-tabs\">${appTabs}</div>
      </div>
      <div class=\"sidebar-card\">
        <label class=\"sidebar-label\">Search</label>
        <input class=\"search-input\" type=\"search\" placeholder=\"Search plug-ins\" value=\"${escapeHtml(
          state.searchQuery
        )}\" data-action=\"search-input\" />
      </div>
      <button class=\"btn sidebar-settings ${state.view === "settings" ? "active" : ""}\" data-action=\"nav-settings\">Settings</button>
    </div>`;
  };

  const renderGroupList = (groups) => {
    const items = groups
      .map((group) => {
        const active = state.groupFilterId === group.id ? "selected" : "";
        return `<li class=\"list-item group-item ${active}\">
          <button class=\"link\" data-action=\"select-group\" data-id=\"${
            group.id
          }\">
            <span class=\"group-dot\"></span>
            <span>${escapeHtml(group.name)}</span>
          </button>
          <div class=\"item-actions\">
            <button class=\"btn ghost\" data-action=\"edit-group\" data-id=\"${
              group.id
            }\">Edit</button>
            <button class=\"btn ghost\" data-action=\"delete-group\" data-id=\"${
              group.id
            }\">Delete</button>
          </div>
        </li>`;
      })
      .join("");

    const form = state.groupForm.open
      ? `<div class=\"inline-form\">
          <input type=\"text\" placeholder=\"Название группы\" value=\"${escapeHtml(
            state.groupForm.name
          )}\" data-role=\"group-input\" />
          <button class=\"btn primary\" data-action=\"save-group\">Save</button>
          <button class=\"btn ghost\" data-action=\"cancel-group\">Cancel</button>
        </div>`
      : "";

    return `${form}<ul class=\"list\">${
      items ||
      "<li class=\"empty-state\">Групп пока нет. Создайте первую, чтобы начать.</li>"
    }</ul>`;
  };

  const renderPluginList = (plugins) => {
    const items = plugins
      .map((plugin) => {
        const active = state.selectedPluginId === plugin.id ? "selected" : "";
        const status = plugin.installed ? "Installed" : "Not installed";
        return `<li class=\"list-item ${active}\">
          <button class=\"plugin-card\" data-action=\"select-plugin\" data-id=\"${
            plugin.id
          }\">
            <div class=\"plugin-title\">${escapeHtml(plugin.name)}</div>
            <div class=\"plugin-meta\">
              <span class=\"pill\">${escapeHtml(getGroupName(plugin.groupId) || "")}</span>
              <span class=\"pill ${plugin.installed ? "pill-ok" : "pill-warn"}\">${status}</span>
            </div>
          </button>
        </li>`;
      })
      .join("");

    return `<ul class=\"list\">${
      items ||
      "<li class=\"empty-state\">Нет плагинов. Добавьте первый плагин, чтобы увидеть карточку.</li>"
    }</ul>`;
  };

  const renderPluginDetail = (plugin, groups) => {
    if (state.pluginForm.open) {
      const draft = state.pluginForm.draft || plugin || {};
      const description = draft.description || "";
      return `<div class=\"card\">
        <h2 class=\"section-title\">${escapeHtml(
          state.pluginForm.id ? "Редактирование" : "Новый плагин"
        )}</h2>
        <form data-role=\"plugin-form\">
          <div class=\"form-grid\">
            <div>
              <label>Название</label>
              <input name=\"name\" value=\"${escapeHtml(draft.name || "")}\" />
            </div>
            <div>
              <label>Группа</label>
              <select name=\"groupId\">
                ${groups
                  .map(
                    (group) =>
                      `<option value=\"${group.id}\" ${
                        draft.groupId === group.id ? "selected" : ""
                      }>${escapeHtml(group.name)}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div>
              <label>URL для установки</label>
              <input name=\"url\" value=\"${escapeHtml(draft.url || "")}\" />
            </div>
            <div>
              <label>Статус</label>
              <select name="installed">
                <option value="false" ${draft.installed ? "" : "selected"}>Not installed</option>
                <option value="true" ${draft.installed ? "selected" : ""}>Installed</option>
              </select>
            </div>
          </div>
          <div class=\"editor\">
            <div>
              <label>Markdown описание</label>
              <textarea name=\"description\" data-action=\"markdown-input\">${escapeHtml(
                description
              )}</textarea>
            </div>
            <div>
              <label>Превью</label>
              <div class=\"card markdown\" data-role=\"markdown-preview\">${renderMarkdown(
                description
              )}</div>
            </div>
          </div>
          <div class=\"form-actions\">
            <button class=\"btn primary\" type=\"button\" data-action=\"save-plugin\">Save</button>
            <button class=\"btn ghost\" type=\"button\" data-action=\"cancel-plugin\">Cancel</button>
          </div>
        </form>
      </div>`;
    }
    if (!plugin) {
      return `<div class="card">
        <div class="empty-state">
          <strong>Начните с выбора плагина</strong>
          <span>Выберите плагин слева или создайте новый, чтобы увидеть детали.</span>
        </div>
      </div>`;
    }

    const status = plugin.installed ? "Installed" : "Not installed";
    return `<div class="card plugin-detail">
      <div class="detail-head">
        <h2>${escapeHtml(plugin.name)}</h2>
        <div class="detail-tags">
          <span class="pill">${escapeHtml(getApp()?.name || "")}</span>
          <span class="pill">${escapeHtml(getGroupName(plugin.groupId) || "")}</span>
          <span class="pill ${plugin.installed ? "pill-ok" : "pill-warn"}">${status}</span>
        </div>
      </div>
      <div class="markdown detail-markdown">${renderMarkdown(
        plugin.description || ""
      )}</div>
      <div class="form-actions detail-actions">
        <button class="btn primary" data-action="install-plugin" data-id="${
          plugin.id
        }">Install</button>
        <button class="btn" data-action="edit-plugin" data-id="${
          plugin.id
        }">Edit</button>
        <div class="menu-wrap">
          <button class="btn ghost" data-action="toggle-menu">More</button>
          ${
            state.detailMenuOpen
              ? `<div class="menu">
                  <button class="menu-item danger" data-action="delete-plugin" data-id="${plugin.id}">Delete</button>
                </div>`
              : ""
          }
        </div>
      </div>
    </div>`;
  };

  const renderAppView = () => {
    const app = getApp();
    if (!app) {
      return `<div class="card"><p class="notice">Добавьте приложение в Settings.</p></div>`;
    }

    const groups = getGroupsForApp(app.id);
    const plugins = getPluginsForApp(app.id);
    const search = state.searchQuery.trim().toLowerCase();
    const filteredPlugins = plugins.filter((plugin) => {
      const matchesGroup =
        state.groupFilterId === "all" || plugin.groupId === state.groupFilterId;
      const matchesSearch = !search
        ? true
        : plugin.name.toLowerCase().includes(search) ||
          (getGroupName(plugin.groupId) || "").toLowerCase().includes(search);
      return matchesGroup && matchesSearch;
    });

    const selectedPlugin = plugins.find(
      (plugin) => plugin.id === state.selectedPluginId
    );

    return `<div class="view">
      <div class="layout">
        ${renderSidebar()}
        <div class="main-columns">
          <section class="center-col">
            <div class="card list-card">
              <div class="card-head">
                <h3>Groups</h3>
                <button class="btn" data-action="add-group">Add group</button>
              </div>
              ${renderGroupList(groups)}
            </div>
            <div class="card list-card">
              <div class="card-head">
                <h3>Plug-ins</h3>
                <div class="head-actions">
                  <select data-action="filter-group">
                    <option value="all">Все группы</option>
                    ${groups
                      .map(
                        (group) =>
                          `<option value="${group.id}" ${
                            state.groupFilterId === group.id ? "selected" : ""
                          }>${escapeHtml(group.name)}</option>`
                      )
                      .join("")}
                  </select>
                  <button class="btn" data-action="add-plugin">Add plugin</button>
                </div>
              </div>
              ${renderPluginList(filteredPlugins)}
            </div>
          </section>
          <section class="detail-col">
            ${renderPluginDetail(selectedPlugin, groups)}
          </section>
        </div>
      </div>
    </div>`;
  };

  const renderSettingsView = () => {
    const appItems = data.apps
      .map(
        (app) => `<li class=\"list-item\">
          <span>${escapeHtml(app.name)}</span>
          <div class=\"item-actions\">
            <button class=\"btn ghost\" data-action=\"edit-app\" data-id=\"${
              app.id
            }\">Edit</button>
            <button class=\"btn ghost\" data-action=\"delete-app\" data-id=\"${
              app.id
            }\">Delete</button>
          </div>
        </li>`
      )
      .join("");

    const appForm = state.appForm.open
      ? `<div class=\"inline-form\">
          <input type=\"text\" placeholder=\"Название приложения\" value=\"${escapeHtml(
            state.appForm.name
          )}\" data-role=\"app-input\" />
          <button class=\"btn primary\" data-action=\"save-app\">Save</button>
          <button class=\"btn ghost\" data-action=\"cancel-app\">Cancel</button>
        </div>`
      : "";

    return `<div class=\"view\">
      <div class=\"settings-grid\">
        <div class=\"card\">
          <h3>Theme</h3>
          <div class=\"form-grid\">
            <div>
              <label>Режим</label>
              <select data-action=\"theme-change\">
                <option value=\"light\" ${
                  state.settings.theme === "light" ? "selected" : ""
                }>Light</option>
                <option value=\"dark\" ${
                  state.settings.theme === "dark" ? "selected" : ""
                }>Dark</option>
              </select>
            </div>
            <div>
              <label>Акцентный цвет</label>
              <input type=\"color\" value=\"${escapeHtml(
                state.settings.accent
              )}\" data-action=\"accent-change\" />
            </div>
            <div>
              <label>Фон</label>
              <select data-action=\"background-change\">
                <option value=\"glow\" ${
                  state.settings.background === "glow" ? "selected" : ""
                }>Glow</option>
                <option value=\"ribbons\" ${
                  state.settings.background === "ribbons" ? "selected" : ""
                }>Ribbons</option>
                <option value=\"blueprint\" ${
                  state.settings.background === "blueprint" ? "selected" : ""
                }>Blueprint</option>
              </select>
            </div>
          </div>
        </div>
        <div class=\"card\">
          <div class=\"card-head\">
            <h3>Applications</h3>
            <button class=\"btn\" data-action=\"add-app\">Add</button>
          </div>
          ${appForm}
          <ul class=\"list\">${appItems || "<li class=\"notice\">Нет приложений</li>"}</ul>
        </div>
        <div class=\"card\">
          <h3>Data</h3>
          <p class=\"notice\">Экспортируйте или импортируйте JSON из файла.</p>
          <div class=\"form-actions\">
            <button class=\"btn\" data-action=\"export-data\">Export</button>
            <button class=\"btn\" data-action=\"trigger-import\">Import</button>
            <button class=\"btn ghost\" data-action=\"reset-data\">Reset example</button>
          </div>
          <input type=\"file\" accept=\"application/json\" data-role=\"import-input\" hidden />
        </div>
      </div>
    </div>`;
  };

  const render = () => {
    applySettings(state.settings);
    root.innerHTML = `<div class=\"shell\">
      <header class=\"topbar\">
        <div class=\"brand\">
          <h1>Plug-ins Reminder</h1>
          <span>Adobe After Effects / Premiere Pro</span>
        </div>
        <nav class=\"nav\">${renderNav()}</nav>
      </header>
      ${state.view === "settings" ? renderSettingsView() : renderAppView()}
    </div>`;
  };

  const refresh = async () => {
    await loadData();
    render();
  };

  const openPluginForm = (plugin) => {
    state.pluginForm = {
      open: true,
      id: plugin?.id || null,
      draft: plugin ? { ...plugin } : null
    };
    state.selectedPluginId = plugin?.id || null;
  };

  root.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    if (action !== "toggle-menu") {
      state.detailMenuOpen = false;
    }

    if (action === "nav-app") {
      setView("app", target.dataset.id);
      render();
      return;
    }

    if (action === "nav-settings") {
      setView("settings");
      render();
      return;
    }

    if (action === "select-group") {
      state.groupFilterId = target.dataset.id;
      render();
      return;
    }

    if (action === "add-group") {
      state.groupForm = { open: true, mode: "add", id: null, name: "" };
      render();
      return;
    }

    if (action === "edit-group") {
      const group = data.groups.find((item) => item.id === target.dataset.id);
      if (!group) return;
      state.groupForm = {
        open: true,
        mode: "edit",
        id: group.id,
        name: group.name
      };
      render();
      return;
    }

    if (action === "cancel-group") {
      state.groupForm = { open: false, mode: "add", id: null, name: "" };
      render();
      return;
    }

    if (action === "save-group") {
      const input = root.querySelector("[data-role='group-input']");
      const name = input?.value.trim();
      if (!name) return;

      if (state.groupForm.mode === "add") {
        await store.add("groups", {
          id: Store.createId(),
          appId: state.currentAppId,
          name
        });
      } else {
        await store.put("groups", {
          id: state.groupForm.id,
          appId: state.currentAppId,
          name
        });
      }

      state.groupForm = { open: false, mode: "add", id: null, name: "" };
      await refresh();
      return;
    }

    if (action === "delete-group") {
      const groupId = target.dataset.id;
      const hasPlugins = data.plugins.some((plugin) => plugin.groupId === groupId);
      const confirmText = hasPlugins
        ? "Удалить группу и все её плагины?"
        : "Удалить группу?";
      if (!window.confirm(confirmText)) return;

      if (hasPlugins) {
        const toDelete = data.plugins.filter((plugin) => plugin.groupId === groupId);
        await Promise.all(toDelete.map((plugin) => store.remove("plugins", plugin.id)));
      }

      await store.remove("groups", groupId);
      if (state.groupFilterId === groupId) {
        state.groupFilterId = "all";
      }
      await refresh();
      return;
    }

    if (action === "filter-group") {
      return;
    }

    if (action === "add-plugin") {
      const groups = getGroupsForApp(state.currentAppId);
      const fallbackGroup = groups[0]?.id || null;
      openPluginForm({
        name: "",
        groupId: fallbackGroup,
        url: "",
        description: ""
      });
      render();
      return;
    }

    if (action === "select-plugin") {
      state.selectedPluginId = target.dataset.id;
      state.pluginForm = { open: false, id: null, draft: null };
      render();
      return;
    }

    if (action === "edit-plugin") {
      const plugin = data.plugins.find((item) => item.id === target.dataset.id);
      if (!plugin) return;
      openPluginForm(plugin);
      render();
      return;
    }

    if (action === "cancel-plugin") {
      state.pluginForm = { open: false, id: null, draft: null };
      render();
      return;
    }

    if (action === "save-plugin") {
      const form = root.querySelector("[data-role='plugin-form']");
      if (!form) return;
      const formData = new FormData(form);
      const name = formData.get("name").trim();
      const groupId = formData.get("groupId");
      const url = formData.get("url").trim();
      const description = formData.get("description").trim();
      const installed = formData.get("installed") === "true";
      if (!name) return;

      const payload = {
        id: state.pluginForm.id || Store.createId(),
        appId: state.currentAppId,
        groupId,
        name,
        url,
        description,
        installed
      };

      await store.put("plugins", payload);
      state.pluginForm = { open: false, id: null, draft: null };
      state.selectedPluginId = payload.id;
      await refresh();
      return;
    }

    if (action === "delete-plugin") {
      const pluginId = target.dataset.id;
      if (!window.confirm("Удалить плагин?")) return;
      await store.remove("plugins", pluginId);
      if (state.selectedPluginId === pluginId) {
        state.selectedPluginId = null;
      }
      await refresh();
      return;
    }

    if (action === "install-plugin") {
      const plugin = data.plugins.find((item) => item.id === target.dataset.id);
      if (plugin?.url) {
        window.open(plugin.url, "_blank", "noopener");
      }
      return;
    }

    if (action === "toggle-menu") {
      state.detailMenuOpen = !state.detailMenuOpen;
      render();
      return;
    }

    if (action === "add-app") {
      state.appForm = { open: true, mode: "add", id: null, name: "" };
      render();
      return;
    }

    if (action === "edit-app") {
      const app = data.apps.find((item) => item.id === target.dataset.id);
      if (!app) return;
      state.appForm = { open: true, mode: "edit", id: app.id, name: app.name };
      render();
      return;
    }

    if (action === "cancel-app") {
      state.appForm = { open: false, mode: "add", id: null, name: "" };
      render();
      return;
    }

    if (action === "save-app") {
      const input = root.querySelector("[data-role='app-input']");
      const name = input?.value.trim();
      if (!name) return;

      if (state.appForm.mode === "add") {
        await store.add("apps", {
          id: Store.createId(),
          name,
          slug: name.toLowerCase().replace(/\s+/g, "-")
        });
      } else {
        await store.put("apps", {
          id: state.appForm.id,
          name,
          slug: name.toLowerCase().replace(/\s+/g, "-")
        });
      }

      state.appForm = { open: false, mode: "add", id: null, name: "" };
      await refresh();
      return;
    }

    if (action === "delete-app") {
      const appId = target.dataset.id;
      const hasRelated = data.groups.some((group) => group.appId === appId);
      const confirmText = hasRelated
        ? "Удалить приложение и все связанные данные?"
        : "Удалить приложение?";
      if (!window.confirm(confirmText)) return;

      const groupsToDelete = data.groups.filter((group) => group.appId === appId);
      const pluginsToDelete = data.plugins.filter((plugin) => plugin.appId === appId);

      await Promise.all([
        ...groupsToDelete.map((group) => store.remove("groups", group.id)),
        ...pluginsToDelete.map((plugin) => store.remove("plugins", plugin.id)),
        store.remove("apps", appId)
      ]);

      if (state.currentAppId === appId) {
        state.currentAppId = data.apps.find((app) => app.id !== appId)?.id || null;
      }

      await refresh();
      return;
    }

    if (action === "export-data") {
      const payload = await store.exportAll();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json"
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "plugins-export.json";
      link.click();
      URL.revokeObjectURL(link.href);
      return;
    }

    if (action === "trigger-import") {
      root.querySelector("[data-role='import-input']")?.click();
      return;
    }

    if (action === "reset-data") {
      if (!window.confirm("Сбросить данные к примеру?")) return;
      const { seedData } = await import("./data.js");
      await store.importAll({
        apps: seedData.apps,
        groups: seedData.groups,
        plugins: seedData.plugins,
        settings: seedData.settings
      });
      await refresh();
      return;
    }
  });

  root.addEventListener("change", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.dataset.action === "filter-group") {
      state.groupFilterId = target.value;
      render();
    }

    if (target.dataset.action === "theme-change") {
      state.settings.theme = target.value;
      await store.put("settings", state.settings);
      render();
    }

    if (target.dataset.action === "accent-change") {
      state.settings.accent = target.value;
      await store.put("settings", state.settings);
      render();
    }

    if (target.dataset.action === "background-change") {
      state.settings.background = target.value;
      await store.put("settings", state.settings);
      render();
    }

    if (target.dataset.role === "import-input") {
      const file = target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const payload = JSON.parse(text);
        await store.importAll(payload);
        await refresh();
      } catch (error) {
        window.alert("Не удалось импортировать JSON.");
      } finally {
        target.value = "";
      }
    }
  });

  root.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.dataset.action === "markdown-input") {
      const preview = root.querySelector("[data-role='markdown-preview']");
      if (preview) {
        preview.innerHTML = renderMarkdown(target.value);
      }
    }

    if (target.dataset.action === "search-input") {
      state.searchQuery = target.value;
      render();
    }
  });

  await refresh();
};
