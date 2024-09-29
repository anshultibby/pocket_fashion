import logging
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)

class LoggingStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope) -> Response:
        request = Request(scope)
        logger.info(f"Static file requested: {request.url.path}")
        return await super().get_response(path, scope)