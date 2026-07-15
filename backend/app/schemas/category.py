import uuid

from pydantic import BaseModel

from app.schemas.common import ORMBase


class CategoryCreate(BaseModel):
    name: str
    parent_id: uuid.UUID | None = None


class CategoryOut(ORMBase):
    id: uuid.UUID
    name: str
    parent_id: uuid.UUID | None = None
