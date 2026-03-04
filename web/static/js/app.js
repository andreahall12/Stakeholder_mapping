// Stakeholder Tool — Client-side JavaScript
// HTMX integration, modal management, keyboard shortcuts, and toast notifications.

"use strict";

// --- Modal Management ---
function showModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = "flex";
        const firstInput = modal.querySelector("input, textarea, select");
        if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }
}

function hideModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "none";
}

// Close modals on Escape
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        document.querySelectorAll(".modal").forEach(function (modal) {
            modal.style.display = "none";
        });
    }
});

// --- Toast Notifications ---
function showToast(message, type) {
    type = type || "info";
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast toast-" + type;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(function () {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(100%)";
        setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
}

// --- HTMX Events ---
document.addEventListener("htmx:afterRequest", function (evt) {
    if (evt.detail.successful) {
        if (evt.detail.requestConfig.verb !== "get") {
            showToast("Operation successful", "success");
        }
    } else {
        var msg = "Request failed";
        try {
            var resp = JSON.parse(evt.detail.xhr.responseText);
            if (resp.error) msg = resp.error;
        } catch (e) { /* ignore parse error */ }
        showToast(msg, "error");
    }
});

// HTMX configuration
document.addEventListener("htmx:configRequest", function (evt) {
    // Ensure JSON content type for POST/PUT requests
    if (evt.detail.verb === "post" || evt.detail.verb === "put") {
        evt.detail.headers["Content-Type"] = "application/json";
        // Convert form data to JSON
        if (evt.detail.parameters && typeof evt.detail.parameters === "object") {
            var params = {};
            for (var key in evt.detail.parameters) {
                if (Object.prototype.hasOwnProperty.call(evt.detail.parameters, key)) {
                    params[key] = evt.detail.parameters[key];
                }
            }
            evt.detail.headers["Content-Type"] = "application/json";
        }
    }
});

// --- Keyboard Shortcuts ---
document.addEventListener("keydown", function (e) {
    // Ctrl/Cmd + K = Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        var search = document.querySelector('input[name="search"]');
        if (search) search.focus();
    }

    // Ctrl/Cmd + N = New stakeholder
    if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        showModal("new-stakeholder-modal");
    }
});

// --- Project Status Change ---
(function() {
    var sel = document.getElementById("project-status-select");
    if (sel) {
        sel.addEventListener("change", function() {
            var projectId = sel.getAttribute("data-project-id");
            fetch("/api/v1/projects/" + projectId, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: sel.value })
            }).then(function(resp) {
                if (resp.ok) {
                    showToast("Status updated to " + sel.value, "success");
                } else {
                    showToast("Failed to update status", "error");
                }
            });
        });
    }
})();

// --- Demo Mode Banner ---
(function () {
    var clearBtn = document.getElementById("demo-clear-btn");
    var dismissBtn = document.getElementById("demo-dismiss-btn");
    var cancelBtn = document.getElementById("demo-cancel-btn");
    var backdrop = document.getElementById("demo-modal-backdrop");

    if (clearBtn) {
        clearBtn.addEventListener("click", function () {
            showModal("demo-confirm-modal");
        });
    }
    if (dismissBtn) {
        dismissBtn.addEventListener("click", function () {
            var banner = document.getElementById("demo-banner");
            if (banner) banner.remove();
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener("click", function () {
            hideModal("demo-confirm-modal");
        });
    }
    if (backdrop) {
        backdrop.addEventListener("click", function () {
            hideModal("demo-confirm-modal");
        });
    }
})();

// --- AI Chat Panel ---
(function() {
    var fab = document.getElementById("chat-fab");
    var panel = document.getElementById("chat-panel");
    var closeBtn = document.getElementById("chat-close-btn");
    var sendBtn = document.getElementById("chat-send-btn");
    var input = document.getElementById("chat-input");
    var messages = document.getElementById("chat-messages");
    var projectSelect = document.getElementById("chat-project-select");

    if (!fab || !panel) return;

    fab.addEventListener("click", function() {
        panel.style.display = "flex";
        fab.style.display = "none";
        if (input) input.focus();
    });

    closeBtn.addEventListener("click", function() {
        panel.style.display = "none";
        fab.style.display = "flex";
    });

    function addMessage(text, role) {
        var div = document.createElement("div");
        div.className = "chat-message chat-message-" + role;
        var p = document.createElement("p");
        p.textContent = text;
        div.appendChild(p);
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
        return div;
    }

    function sendMessage(text) {
        if (!text || !text.trim()) return;
        addMessage(text, "user");
        var loadingDiv = addMessage("Thinking...", "loading");

        var projectId = projectSelect ? projectSelect.value : "";

        fetch("/api/v1/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text, project_id: projectId })
        })
        .then(function(resp) { return resp.json(); })
        .then(function(data) {
            loadingDiv.remove();
            if (data.error) {
                var errDiv = addMessage(data.error, "assistant");
                if (data.error.indexOf("not available") !== -1 || data.error.indexOf("not running") !== -1) {
                    var hint = document.getElementById("chat-ollama-hint");
                    if (hint) hint.style.display = "block";
                }
            } else if (data.content) {
                addMessage(data.content, "assistant");
            } else {
                addMessage("No response received.", "assistant");
            }
        })
        .catch(function() {
            loadingDiv.remove();
            addMessage("Could not reach the AI service. Make sure Ollama is running.", "assistant");
        });
    }

    sendBtn.addEventListener("click", function() {
        var text = input.value;
        input.value = "";
        sendMessage(text);
    });

    input.addEventListener("keydown", function(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            var text = input.value;
            input.value = "";
            sendMessage(text);
        }
    });

    // Quick actions
    var actionBtns = document.querySelectorAll(".chat-action");
    actionBtns.forEach(function(btn) {
        btn.addEventListener("click", function() {
            var action = btn.getAttribute("data-action");
            var projectId = projectSelect ? projectSelect.value : "";

            if (action === "blockers") {
                sendMessage("Analyze the current project stakeholders and identify potential blockers. For each, suggest a mitigation strategy.");
            } else if (action === "brief") {
                sendMessage("Generate a meeting preparation brief for the key stakeholders on this project. Include talking points and recommended approach.");
            } else if (action === "email") {
                sendMessage("Draft a professional status update email to the project stakeholders. Focus on progress, upcoming milestones, and any decisions needed.");
            }
        });
    });
})();

