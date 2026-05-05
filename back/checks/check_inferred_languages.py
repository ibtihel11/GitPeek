# check_inferred_languages.py
import json
from pathlib import Path
from collections import Counter

BASE = Path(__file__).parent.parent
with open(BASE / "data" / "final_dataset.json", encoding="utf-8") as f:
    dataset = json.load(f)

rows = dataset["rows"]

# Language signals: keywords that strongly indicate a language
LANGUAGE_SIGNALS = {
    "JavaScript": ["javascript", "js", "nodejs", "node.js", "npm", "webpack", "eslint", "babel", "jest", "prettier"],
    "TypeScript": ["typescript", "ts", "tsx", ".ts", "tsconfig", "tslint"],
    "Python":     ["python", "pip", "django", "fastapi", "flask", "pytest", "pandas", "numpy", ".py"],
    "Java":       ["java", "maven", "gradle", "spring", "junit", "pom.xml", ".java"],
    "Rust":       ["rust", "cargo", "crate", ".rs", "rustfmt", "clippy"],
    "Go":         ["golang", " go ", "go.mod", "goroutine", ".go"],
    "C++":        ["c++", "cmake", "clang", "g++", ".cpp", ".hpp"],
    "Ruby":       ["ruby", "rails", "gem", "bundler", "rspec", ".rb"],
    "PHP":        ["php", "composer", "laravel", "symfony", ".php"],
    "Kotlin":     ["kotlin", ".kt", "coroutine", "jetpack"],
    "Swift":      ["swift", "xcode", "cocoapods", ".swift", "swiftui"],
    "C#":         ["c#", ".net", "dotnet", "nuget", ".cs", "blazor"],
}


def infer_language(message: str, repo: str) -> str | None:
    text = f"{message} {repo}".lower()
    for language, keywords in LANGUAGE_SIGNALS.items():
        if any(kw in text for kw in keywords):
            return language
    return None

inferred = 0
lang_counter = Counter()

for row in rows:
    # Skip rows that already have a language from the API
    if row.get("language"):
        lang_counter[row["language"]] += 1
        inferred += 1
        continue

    lang = infer_language(row.get("message", ""), row.get("repo", ""))
    if lang:
        lang_counter[lang] += 1
        inferred += 1

print(f"Total rows:              {len(rows):,}")
print(f"Rows with language:      {inferred:,}  ({inferred*100/len(rows):.1f}%)")
print(f"Rows without language:   {len(rows) - inferred:,}")
print(f"\nLanguage breakdown:")
for lang, count in lang_counter.most_common():
    pct = count * 100 / inferred
    bar = "█" * int(pct / 2)
    print(f"  {lang:<20} {count:>8,}  {pct:>5.1f}%  {bar}")