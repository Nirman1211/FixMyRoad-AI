from typing import Optional
from pydantic import BaseModel
from app.models.report import VoteType


class VoteRequest(BaseModel):
    vote_type: VoteType


class VoteResponse(BaseModel):
    report_id: int
    upvotes_count: int
    downvotes_count: int
    user_vote: Optional[str]
    new_priority_score: float
