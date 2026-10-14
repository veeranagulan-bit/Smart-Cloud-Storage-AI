import logging
import numpy as np
from typing import List, Dict, Any, Tuple
from app.config import settings

logger = logging.getLogger("embeddings")

class EmbeddingEngine:
    def __init__(self):
        self.model = None
        self.is_ready = False
        self._init_model()

    def _init_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            # Load the lightweight, high performance model
            self.model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME, device=settings.USE_DEVICE)
            self.is_ready = True
            logger.info(f"Loaded SentenceTransformer model: {settings.EMBEDDING_MODEL_NAME}")
        except Exception as e:
            logger.warning(f"SentenceTransformer could not be initialized: {e}. Semantic search will use TF-IDF keyword vector fallback.")
            self.model = None
            self.is_ready = False

    def embed_text(self, text: str) -> List[float]:
        if not text:
            return []
        
        # Limit text length for encoding
        text_chunk = text[:2000].strip()
        if not text_chunk:
            return []

        if self.is_ready and self.model is not None:
            try:
                embedding = self.model.encode(text_chunk, normalize_embeddings=True)
                return embedding.tolist()
            except Exception as e:
                logger.error(f"Error generating embedding: {e}")

        # Return empty list if model not ready (signals fallback)
        return []

    def cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        a = np.array(vec_a, dtype=np.float32)
        b = np.array(vec_b, dtype=np.float32)
        dot = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(dot / (norm_a * norm_b))

    def semantic_rank(self, query: str, documents: List[Dict[str, Any]]) -> List[Tuple[Dict[str, Any], float, str]]:
        """
        Ranks documents against the natural query.
        Returns list of (doc, similarity_score_0_to_100, mode_used)
        """
        results = []
        q_clean = query.strip()
        if not q_clean:
            return []

        query_vec = self.embed_text(q_clean) if self.is_ready else []

        if query_vec:
            # Dense Vector Search
            for doc in documents:
                doc_vec = doc.get("embedding")
                if doc_vec and len(doc_vec) == len(query_vec):
                    sim = self.cosine_similarity(query_vec, doc_vec)
                    # Convert cosine [-1, 1] to percentage scale [0, 100]
                    score = round(max(0.0, min(100.0, ((sim + 1.0) / 2.0) * 100)), 1)
                    if score >= 35.0:  # Threshold for relevance
                        results.append((doc, score, "dense_semantic"))
                else:
                    # Fallback keyword match for this specific document if missing embedding
                    kw_score = self._keyword_score(q_clean, doc)
                    if kw_score > 0:
                        results.append((doc, kw_score, "keyword_fallback"))
        else:
            # Keyword / Token Overlap Fallback
            for doc in documents:
                score = self._keyword_score(q_clean, doc)
                if score > 0:
                    results.append((doc, score, "keyword_fallback"))

        # Sort descending by score
        results.sort(key=lambda x: x[1], reverse=True)
        return results

    def _keyword_score(self, query: str, doc: Dict[str, Any]) -> float:
        query_words = set(w.lower() for w in query.split() if len(w) > 2)
        if not query_words:
            return 0.0

        content = f"{doc.get('name', '')} {doc.get('category', '')} {doc.get('extracted_text', '')} {' '.join(doc.get('tags', []))}".lower()
        
        matches = sum(1 for w in query_words if w in content)
        if matches == 0:
            return 0.0

        ratio = matches / len(query_words)
        # Score scaled to 40% - 95%
        return round(40.0 + ratio * 55.0, 1)

embedding_engine = EmbeddingEngine()
