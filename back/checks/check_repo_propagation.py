# check_repo_propagation.py
import json
from pathlib import Path
from collections import Counter, defaultdict

BASE = Path(__file__).parent.parent
with open(BASE / "data" / "final_dataset.json", encoding="utf-8") as f:
    dataset = json.load(f)

rows = dataset["rows"]

LANGUAGE_SIGNALS = {
    "JavaScript": ["javascript", " js ", "nodejs", "node.js", "npm", "webpack", "eslint", "babel", "jest", "prettier", "react", "vue", "angular", "svelte"],
    "TypeScript": ["typescript", " ts ", " tsx", "tsconfig", "tslint", "next.js", "nextjs"],
    "Python":     ["python", " pip ", "django", "fastapi", "flask", "pytest", "pandas", "numpy", " py ", ".py"],
    "Java":       ["java", "maven", "gradle", "spring", "junit", "pom.xml"],
    "Rust":       ["rust", "cargo", "crate", " rs ", "rustfmt", "clippy"],
    "Go":         ["golang", "go.mod", "goroutine", " go "],
    "C++":        ["c++", "cmake", "clang", "g++", ".cpp", ".hpp"],
    "Ruby":       ["ruby", "rails", " gem ", "bundler", "rspec"],
    "PHP":        ["php", "composer", "laravel", "symfony"],
    "Kotlin":     ["kotlin", "coroutine", "jetpack"],
    "Swift":      ["swift", "xcode", "cocoapods", "swiftui"],
    "C#":         ["c#", ".net", "dotnet", "nuget", "blazor"],
    "Shell":      ["bash", "shell", " sh ", "zsh", "chmod", "#!/"],
    "Dart":       ["flutter", "dart", "pubspec"],
}

def infer_language(text: str) -> str | None:
    text = text.lower()
    for language, keywords in LANGUAGE_SIGNALS.items():
        if any(kw in text for kw in keywords):
            return language
    return None

# detect language per row from message + repo name
repo_language_votes: defaultdict[str, Counter] = defaultdict(Counter)

for row in rows:
    text = f"{row.get('message', '')} {row.get('repo', '')}"
    
    # Use API language if available
    if row.get("language"):
        repo_language_votes[row["repo"]][row["language"]] += 1
        continue

    lang = infer_language(text)
    if lang:
        repo_language_votes[row["repo"]][lang] += 1


# pick the most voted language per repo
repo_language: dict[str, str] = {}
for repo, votes in repo_language_votes.items():
    if votes:
        repo_language[repo] = votes.most_common(1)[0][0]


# propagate repo language to ALL rows of that repo
covered = 0
lang_counter: Counter = Counter()

for row in rows:
    lang = repo_language.get(row["repo"])
    if lang:
        lang_counter[lang] += 1
        covered += 1

print(f"Total rows:              {len(rows):,}")
print(f"Repos with language:     {len(repo_language):,} / 114,018")
print(f"Rows covered:            {covered:,}  ({covered*100/len(rows):.1f}%)")
print(f"Rows still unknown:      {len(rows)-covered:,}")
print(f"\nLanguage breakdown:")
for lang, count in lang_counter.most_common():
    pct = count * 100 / covered
    bar = "█" * int(pct / 2)
    print(f"  {lang:<20} {count:>8,}  {pct:>5.1f}%  {bar}")