"""
Tiny FastAPI service that exposes sentence-transformers/all-MiniLM-L6-v2
as a /embed endpoint. 384-dim embeddings, suitable for pgvector(384).
"""
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

app = FastAPI(title="SkillsHub Embeddings", version="0.1.0")
model = SentenceTransformer(MODEL_NAME)


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: list[float]
    dim: int


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model": MODEL_NAME, "dim": model.get_sentence_embedding_dimension()}


@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest) -> EmbedResponse:
    vec = model.encode(req.text, normalize_embeddings=True).tolist()
    return EmbedResponse(embedding=vec, dim=len(vec))
