from functools import lru_cache
from sentence_transformers import SentenceTransformer, util


@lru_cache(maxsize=1)
def get_model():
    # Loaded once per server run, reused for every request after that
    return SentenceTransformer("all-MiniLM-L6-v2")


def best_semantic_matches(text: str, reference_phrases: list[str], threshold: float = 0.55) -> list[dict]:
    """Compares each sentence in `text` against a list of example phrases by
    meaning, not exact wording. Raise `threshold` (closer to 1.0) to be
    stricter, lower it to catch more borderline phrasing."""
    model = get_model()
    sentences = [s.strip() for s in text.replace("!", ".").replace("\n", ". ").split(".") if s.strip()]
    if not sentences:
        return []

    sentence_embeddings = model.encode(sentences, convert_to_tensor=True)
    reference_embeddings = model.encode(reference_phrases, convert_to_tensor=True)

    hits = []
    for i, sentence in enumerate(sentences):
        scores = util.cos_sim(sentence_embeddings[i], reference_embeddings)[0]
        best_idx = int(scores.argmax())
        best_score = float(scores[best_idx])
        if best_score >= threshold:
            hits.append({
                "sentence": sentence,
                "matched_example": reference_phrases[best_idx],
                "similarity": round(best_score, 2),
            })
    return hits