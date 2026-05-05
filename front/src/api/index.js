const BASE_URL = "http://localhost:8000/api";

async function get(endpoint) {
  const res = await fetch(`${BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`API error ${res.status} on ${endpoint}`);
  return res.json();
}

export const api = {
  getLanguages: () => get("/languages/"),
  getLanguageIntent: () => get("/languages/by-intent"),
  getLanguageTrend: () => get("/languages/trend"),
  getFrameworks: () => get("/frameworks/"),
  getFrameworksByLang:() => get("/frameworks/by-language"),
  getRepos: () => get("/repos/"),
  getIntent: () => get("/repos/intent"),
  getBuildStatus: () => get("/repos/build-status"),
  triggerBuild: () =>
    fetch(`${BASE_URL}/repos/build-dataset`, { method: "POST" }).then((r) => r.json()),
};
