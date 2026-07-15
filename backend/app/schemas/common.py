from pydantic import BaseModel, ConfigDict


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Page[T](ORMBase):
    items: list[T]
    total: int
    page: int
    page_size: int
