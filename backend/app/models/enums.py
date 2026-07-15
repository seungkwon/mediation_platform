import enum


class SocialProvider(str, enum.Enum):
    naver = "naver"
    kakao = "kakao"
    google = "google"
    apple = "apple"


class PortfolioStatus(str, enum.Enum):
    draft = "draft"
    published = "published"


class ServiceRequestStatus(str, enum.Enum):
    open = "open"
    awarded = "awarded"
    expired = "expired"
    cancelled = "cancelled"


class QuoteStatus(str, enum.Enum):
    submitted = "submitted"
    opened = "opened"
    selected = "selected"
    rejected = "rejected"


class ChatMessageType(str, enum.Enum):
    text = "text"
    image = "image"
    file = "file"


class ReportTargetType(str, enum.Enum):
    user = "user"
    portfolio_post = "portfolio_post"
    service_request = "service_request"
    review = "review"
    chat_message = "chat_message"


class ReportStatus(str, enum.Enum):
    pending = "pending"
    reviewing = "reviewing"
    resolved = "resolved"
    rejected = "rejected"


class DisputeStatus(str, enum.Enum):
    open = "open"
    in_review = "in_review"
    resolved = "resolved"


class AdminRole(str, enum.Enum):
    super_admin = "super_admin"
    moderator = "moderator"


class NotificationType(str, enum.Enum):
    new_quote = "new_quote"
    quote_opened = "quote_opened"
    quote_selected = "quote_selected"
    deadline_soon = "deadline_soon"
    new_message = "new_message"
    new_review = "new_review"
    report_update = "report_update"
    dispute_update = "dispute_update"
