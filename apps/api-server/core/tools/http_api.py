import json
import httpx
from typing import Any

def execute_http_api(tool: dict[str, Any], arguments: dict[str, Any]) -> str:
    url = tool.get("api_url", "")
    method = tool.get("api_method", "GET").upper()
    headers = tool.get("api_headers", {})
    body_template = tool.get("api_body", "")
    timeout = tool.get("api_timeout", 15.0)

    for k, v in arguments.items():
        placeholder = f"{{{k}}}"
        if placeholder in url:
            url = url.replace(placeholder, str(v))

    body = None
    if body_template:
        body_str = str(body_template)
        for k, v in arguments.items():
            placeholder = f"{{{k}}}"
            if placeholder in body_str:
                body_str = body_str.replace(placeholder, str(v))
        body = body_str.encode("utf-8")

    try:
        with httpx.Client(timeout=timeout) as client:
            req = client.build_request(method, url, headers=headers, content=body)
            res = client.send(req)
            try:
                return json.dumps(res.json())
            except Exception:
                return res.text
    except Exception as e:
        return json.dumps({"error": str(e)})
