import json
import datetime
from typing import Any

def execute_builtin(name: str, arguments: dict[str, Any]) -> str:
    if name == "calculator":
        expression = arguments.get("expression", "")
        try:
            # simple eval for builtin math
            # safer to use a proper evaluator in prod
            allowed_names = {"__builtins__": None}
            return json.dumps({"result": eval(str(expression), allowed_names, {})})
        except Exception as e:
            return json.dumps({"error": str(e)})
            
    if name == "get_time":
        return json.dumps({"time": datetime.datetime.now().isoformat()})
        
    return json.dumps({"error": f"Unknown builtin tool: {name}"})
