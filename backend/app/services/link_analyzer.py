import re
from urllib.parse import urlparse

SHORTENER_DOMAINS = {
    "bit.ly", "tinyurl.com", "cutt.ly", "is.gd", "t.co",
    "rebrand.ly", "buff.ly", "ow.ly", "rb.gy", "shorte.st",
}


def extract_domain(url: str) -> str:
    if not url:
        return ""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return urlparse(url).netloc.lower().removeprefix("www.")


def levenshtein(a: str, b: str) -> int:
    if len(a) < len(b):
        a, b = b, a
    if not b:
        return len(a)
    previous_row = list(range(len(b) + 1))
    for i, char_a in enumerate(a, start=1):
        current_row = [i]
        for j, char_b in enumerate(b, start=1):
            current_row.append(min(
                previous_row[j] + 1,
                current_row[j - 1] + 1,
                previous_row[j - 1] + (char_a != char_b),
            ))
        previous_row = current_row
    return previous_row[-1]


def similarity_ratio(a: str, b: str) -> float:
    if not a and not b:
        return 1.0
    longest = max(len(a), len(b))
    return 1 - (levenshtein(a, b) / longest) if longest else 1.0


def domain_looks_unrelated(domain: str, company_name: str) -> bool:
    company = re.sub(r"[^a-z0-9]", "", company_name.lower())
    domain_clean = re.sub(r"[^a-z0-9]", "", domain.lower())
    if not company or not domain_clean:
        return False
    if company in domain_clean or domain_clean in company:
        return False
    return similarity_ratio(company, domain_clean) < 0.35


def analyze_link(apply_url: str, company_name: str | None = None, skip_domain_check: bool = False) -> dict:
    if not apply_url:
        return {"score": 0, "evidence": ["No apply link provided — link checks were skipped."]}

    evidence = []
    score = 0
    domain = extract_domain(apply_url)

    if not apply_url.startswith("https://"):
        score += 20
        evidence.append("Apply link doesn't use HTTPS.")

    if domain in SHORTENER_DOMAINS:
        score += 35
        evidence.append(f"Apply link uses a URL shortener ({domain}) — the real destination is hidden.")

    if company_name:
        if skip_domain_check:
            evidence.append("Domain-vs-company check skipped — already verified independently against your official listing.")
        elif domain_looks_unrelated(domain, company_name):
            score += 30
            evidence.append(f'Post claims "{company_name}" but the apply link domain ({domain}) doesn\'t clearly match.')

    return {"score": min(100, score), "evidence": evidence}