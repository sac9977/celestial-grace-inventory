const api = {
  async request(method, path, body = null) {
    const headers = { "Content-Type": "application/json" };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(path, options);
    if (res.status === 401) {
      window.location.href = "/login";
      return null;
    }
    if (res.status === 403) {
      alert("Forbidden");
      return null;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  },
  get(path) { return this.request("GET", path); },
  post(path, body) { return this.request("POST", path, body); },
  patch(path, body) { return this.request("PATCH", path, body); },
  delete(path) { return this.request("DELETE", path); },
};
