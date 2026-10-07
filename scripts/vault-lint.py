"""Bilgi grafiği (.knowledge) doğrulayıcı.

Hatalar (her zaman çıkış kodu 1):
  - Kırık wikilink: [[hedef]] hiçbir dosyaya çözülemiyor.
Uyarılar (--strict ile çıkış kodu 1):
  - Doldurulmamış placeholder: {{...}} veya TODO(onboarding) (_schema/ hariç).
  - Yetim sayfa: hiçbir sayfadan bağlantı almayan .md dosyası.

Kullanım: python scripts/vault-lint.py [--strict]
"""
import argparse
import os
import re
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VAULT_DIR = os.path.join(ROOT_DIR, ".knowledge")

WIKILINK_RE = re.compile(r"\[\[([^\|\]]+)(?:\|[^\]]*)?\]\]")
INLINE_CODE_RE = re.compile(r"`[^`]*`")
PLACEHOLDER_RE = re.compile(r"\{\{[^}]+\}\}|TODO\(onboarding\)")

# Bu dizinlerdeki dosyalar şablon veya ham kaynaktır.
TEMPLATE_DIRS = {"_schema"}
RAW_DIRS = {"inbox", "archive"}
IGNORED_DIRS = {".obsidian", ".trash"}


def top_dir(rel_path):
    return rel_path.split("/", 1)[0] if "/" in rel_path else ""


def collect_files():
    """Kasadaki tüm dosyaları kasa köküne göre '/' ayraçlı yollarla döndürür."""
    paths = []
    for root, dirs, filenames in os.walk(VAULT_DIR):
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
        for name in filenames:
            rel = os.path.relpath(os.path.join(root, name), VAULT_DIR)
            paths.append(rel.replace("\\", "/"))
    return paths


def build_index(paths):
    """Wikilink hedeflerini gerçek dosya yollarına eşleyen sözlük kurar.

    Obsidian gibi hem tam yol hem de yalnızca dosya adıyla çözümlemeye izin verir;
    .md dosyaları uzantısız, diğer dosyalar uzantılı olarak bağlanır.
    """
    index = {}

    def add(key, path):
        index.setdefault(key, path)

    for path in sorted(paths):
        name = os.path.basename(path)
        if path.endswith(".md"):
            stem = path[: -len(".md")]
            add(stem, path)
            add(path, path)
            add(os.path.basename(stem), path)
            add(name, path)
        else:
            add(path, path)
            add(name, path)
    return index


def resolve(target, index):
    path_part = target.split("#", 1)[0].split("^", 1)[0].strip().replace("\\", "/")
    if not path_part:
        return "self"  # [[#Başlık]]: aynı sayfa içi bağlantı
    path_part = path_part.rstrip("/")
    for candidate in (path_part, f"{path_part}/README", f"{path_part}/index"):
        if candidate in index:
            return index[candidate]
    return None


def strip_comments(line, in_comment):
    """HTML yorumlarını satırdan çıkarır; çok satırlı yorum durumunu taşır."""
    out = []
    pos = 0
    while pos < len(line):
        if in_comment:
            end = line.find("-->", pos)
            if end == -1:
                return "".join(out), True
            pos = end + 3
            in_comment = False
        else:
            start = line.find("<!--", pos)
            if start == -1:
                out.append(line[pos:])
                break
            out.append(line[pos:start])
            pos = start + 4
            in_comment = True
    return "".join(out), in_comment


def scan_file(rel_path):
    """(satır_no, wikilink_hedefi) ve (satır_no, placeholder) listelerini döndürür."""
    links, placeholders = [], []
    in_fence = in_comment = False
    with open(os.path.join(VAULT_DIR, rel_path), "r", encoding="utf-8-sig") as f:
        for line_no, line in enumerate(f, 1):
            # Placeholder'lar kod içinde de doldurulmalıdır; bu yüzden ham satırda aranır.
            placeholders.extend((line_no, m) for m in PLACEHOLDER_RE.findall(line))
            if line.lstrip().startswith(("```", "~~~")):
                in_fence = not in_fence
                continue
            if in_fence:
                continue
            code_free = INLINE_CODE_RE.sub("", line)
            link_text, in_comment = strip_comments(code_free, in_comment)
            links.extend((line_no, t) for t in WIKILINK_RE.findall(link_text))
    return links, placeholders


def main():
    parser = argparse.ArgumentParser(description="Bilgi grafiği bağlantı doğrulayıcı")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Placeholder ve yetim sayfa uyarılarını da hata say (onboarding sonrası kullan).",
    )
    args = parser.parse_args()

    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

    if not os.path.isdir(VAULT_DIR):
        print(f"[HATA] Kasa dizini bulunamadı: {VAULT_DIR}")
        sys.exit(1)

    paths = collect_files()
    index = build_index(paths)
    md_files = [p for p in paths if p.endswith(".md")]

    errors, warnings = [], []
    inbound = set()

    for rel_path in md_files:
        is_template = top_dir(rel_path) in TEMPLATE_DIRS
        if top_dir(rel_path) in RAW_DIRS:
            continue
        links, placeholders = scan_file(rel_path)

        for line_no, target in links:
            if "{{" in target or "<" in target:
                continue  # şablon kalıbı, gerçek bağlantı değil
            resolved = resolve(target, index)
            if resolved is None:
                if not is_template:
                    errors.append(f"[HATA] Kırık link: {rel_path}:{line_no} -> [[{target}]]")
            elif resolved not in ("self", rel_path):
                inbound.add(resolved)

        if not is_template:
            for line_no, marker in placeholders:
                warnings.append(f"[UYARI] Doldurulmamış placeholder: {rel_path}:{line_no} -> {marker}")

    for rel_path in md_files:
        if rel_path == "index.md" or top_dir(rel_path) in RAW_DIRS:
            continue
        if rel_path not in inbound:
            warnings.append(f"[UYARI] Yetim sayfa (hiçbir sayfadan bağlantı almıyor): {rel_path}")

    for message in errors + warnings:
        print(message)

    if errors or (args.strict and warnings):
        print(f"\nDoğrulama başarısız: {len(errors)} hata, {len(warnings)} uyarı.")
        sys.exit(1)
    if warnings:
        print(f"\nBağlantılar geçerli; {len(warnings)} uyarı var (onboarding sonrası --strict ile temizlenmeli).")
    else:
        print("Grafik doğrulaması başarılı: Tüm bağlantılar geçerli!")


if __name__ == "__main__":
    main()
