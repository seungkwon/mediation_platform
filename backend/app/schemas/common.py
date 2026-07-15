from pydantic import BaseModel, ConfigDict


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class AttachmentInput(BaseModel):
    file_path: str
    original_filename: str
    size: int


class Page[T](ORMBase):
    items: list[T]
    total: int
    page: int
    page_size: int
