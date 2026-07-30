async function initApp() {
  const res = await fetch("/api/auth/session");
  if (!res.ok) {
    window.location.href = "/login";
    return;
  }
  const data = await res.json();
  if (!data.user) {
    window.location.href = "/login";
    return;
  }
  window.appUser = data.user;
  document.getElementById("userName").textContent = data.user.name;
  document.getElementById("userRole").textContent = data.user.role;
  applyRoleFilter(data.user.role);
}

function applyRoleFilter(role) {
  document.querySelectorAll("[data-roles]").forEach((el) => {
    const roles = el.dataset.roles.split(",");
    if (!roles.includes(role)) {
      el.classList.add("hidden");
    }
  });
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.style.cssText = "position:fixed;bottom:20px;right:20px;padding:12px 16px;border-radius:8px;background:#111827;color:#fff;font-size:14px;z-index:9999;border:1px solid #e5e7eb;";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
