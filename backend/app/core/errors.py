"""RFC 7807 problem+json errors for every failure response."""

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

PROBLEM_BASE = "https://jointlabourers.org/problems/"
PROBLEM_MEDIA = "application/problem+json"


class ProblemError(Exception):
    def __init__(
        self, status: int, slug: str, title: str, detail: str | None = None, **extra: Any
    ) -> None:
        super().__init__(title)
        self.status, self.slug, self.title, self.detail, self.extra = (
            status,
            slug,
            title,
            detail,
            extra,
        )


def not_found(what: str) -> ProblemError:
    return ProblemError(404, "not-found", f"{what} not found")


def _problem(status: int, slug: str, title: str, detail: str | None, **extra: Any) -> JSONResponse:
    body: dict[str, Any] = {"type": PROBLEM_BASE + slug, "title": title, "status": status}
    if detail:
        body["detail"] = detail
    body.update(extra)
    return JSONResponse(body, status_code=status, media_type=PROBLEM_MEDIA)


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ProblemError)
    async def _problem_error(_: Request, exc: ProblemError) -> JSONResponse:
        return _problem(exc.status, exc.slug, exc.title, exc.detail, **exc.extra)

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return _problem(exc.status_code, "http-error", str(exc.detail), None)

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        errors = [{"loc": list(e["loc"]), "msg": e["msg"], "type": e["type"]} for e in exc.errors()]
        return _problem(422, "validation-error", "Some fields are invalid", None, errors=errors)
