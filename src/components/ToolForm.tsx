import { useEffect, useState } from "react";
import type { Tool } from "../api";
import { createTool, updateTool } from "../api";

const DEFAULT_API_PARAMS = `{
  "type": "object",
  "properties": {
    "id": { "type": "string", "description": "Resource id" }
  },
  "required": ["id"]
}`;

function paramsToJson(parameters: Record<string, unknown> | undefined): string {
  if (!parameters || Object.keys(parameters).length === 0) {
    return DEFAULT_API_PARAMS;
  }
  return JSON.stringify(parameters, null, 2);
}

interface Props {
  tool?: Tool;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function ToolForm({ tool, onSuccess, onCancel }: Props) {
  const isEdit = Boolean(tool);
  const isBuiltin = tool?.builtin ?? false;
  const readOnly = isEdit && isBuiltin;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [handlerType, setHandlerType] = useState("http_api");
  const [apiUrl, setApiUrl] = useState("");
  const [apiMethod, setApiMethod] = useState("GET");
  const [apiBody, setApiBody] = useState("");
  const [parametersJson, setParametersJson] = useState(DEFAULT_API_PARAMS);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!tool) {
      setName("");
      setDescription("");
      setHandlerType("http_api");
      setApiUrl("");
      setApiMethod("GET");
      setApiBody("");
      setParametersJson(DEFAULT_API_PARAMS);
      setError("");
      return;
    }
    setName(tool.name);
    setDescription(tool.description);
    setHandlerType(tool.handler_type || "http_api");
    setApiUrl(tool.api_url || "");
    setApiMethod(tool.api_method || "GET");
    setApiBody(tool.api_body || "");
    setParametersJson(paramsToJson(tool.parameters));
    setError("");
  }, [tool]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (readOnly) {
        await updateTool(tool!.id, { description: description.trim() });
        onSuccess();
        return;
      }

      let parameters: Record<string, unknown> = {
        type: "object",
        properties: {},
        required: [],
      };
      if (handlerType === "http_api" || isEdit) {
        try {
          parameters = JSON.parse(parametersJson);
        } catch {
          setError("Parameters must be valid JSON");
          setBusy(false);
          return;
        }
      }

      if (isEdit && tool) {
        await updateTool(tool.id, {
          name: name.trim(),
          description: description.trim(),
          handler_type: handlerType,
          parameters,
          ...(handlerType === "http_api"
            ? {
                api_url: apiUrl.trim(),
                api_method: apiMethod,
                api_body: apiBody.trim() || "",
              }
            : {}),
        });
      } else {
        await createTool({
          name: name.trim(),
          description: description.trim(),
          handler_type: handlerType,
          parameters,
          ...(handlerType === "http_api"
            ? {
                api_url: apiUrl.trim(),
                api_method: apiMethod,
                api_body: apiBody.trim() || undefined,
              }
            : {}),
        });
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="add-tool-form create-tool-form" onSubmit={handleSubmit}>
      {error && <p className="error-banner">{error}</p>}

      {readOnly && (
        <p className="create-tool-intro">
          Built-in tools can only have their description updated (used by the LLM when
          choosing tools).
        </p>
      )}

      <label>
        Tool name
        <input
          placeholder="snake_case e.g. get_weather"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          readOnly={readOnly || isEdit}
          disabled={readOnly || isEdit}
        />
      </label>
      <label>
        Description (for the LLM)
        <textarea
          placeholder="When should the AI call this tool?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          required
        />
      </label>

      {!readOnly && (
        <>
          <label>
            Handler type
            <select
              value={handlerType}
              onChange={(e) => setHandlerType(e.target.value)}
              disabled={isEdit}
            >
              <option value="http_api">External HTTP API</option>
              <option value="echo_args">Echo (test)</option>
              <option value="uppercase">Uppercase</option>
            </select>
          </label>

          {handlerType === "http_api" && (
            <>
              <label>
                API URL
                <input
                  placeholder="https://api.example.com/items/{id}"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  required
                />
              </label>
              <label>
                Method
                <select
                  value={apiMethod}
                  onChange={(e) => setApiMethod(e.target.value)}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </label>
              <label>
                Parameters (JSON Schema)
                <textarea
                  value={parametersJson}
                  onChange={(e) => setParametersJson(e.target.value)}
                  rows={5}
                  required
                />
              </label>
              <label>
                POST body template (optional)
                <textarea
                  placeholder='{"id": "{id}"}'
                  value={apiBody}
                  onChange={(e) => setApiBody(e.target.value)}
                  rows={2}
                />
              </label>
            </>
          )}
        </>
      )}

      <div className="create-tool-actions">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-create-tool" disabled={busy}>
          {busy ? "Saving…" : isEdit ? "Save changes" : "Create tool"}
        </button>
      </div>
    </form>
  );
}
