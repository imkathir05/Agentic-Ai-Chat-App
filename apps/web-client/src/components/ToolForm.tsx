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

  const [tab, setTab] = useState<"general" | "api">("general");

  const handleGenerateSchema = () => {
    if (!apiBody.trim()) {
      setError("Please enter a POST body template first.");
      return;
    }
    try {
      const parsed = JSON.parse(apiBody);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setError("Body must be a JSON object to generate schema.");
        return;
      }
      
      const properties: Record<string, any> = {};
      const required: string[] = [];
      
      for (const [key, value] of Object.entries(parsed)) {
        required.push(key);
        let type = "string";
        if (typeof value === "number") type = "number";
        else if (typeof value === "boolean") type = "boolean";
        else if (Array.isArray(value)) type = "array";
        else if (typeof value === "object" && value !== null) type = "object";
        
        properties[key] = { type };
      }
      
      const schema = {
        type: "object",
        properties,
        required
      };
      
      setParametersJson(JSON.stringify(schema, null, 2));
      setError("");
    } catch (e) {
      setError("POST body must be valid JSON to generate schema.");
    }
  };

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
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {error && (
        <p className="text-red-500 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900/50 mb-2 font-medium">
          {error}
        </p>
      )}

      {readOnly && (
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          Built-in tools can only have their description updated (used by the LLM when
          choosing tools).
        </p>
      )}

      {!readOnly && handlerType === "http_api" && (
        <div className="flex gap-1 border-b border-border pb-0.5 mb-2">
          <button
            type="button"
            className={`px-4 py-2 text-sm border-b-2 transition-all cursor-pointer ${
              tab === "general" 
                ? "text-accent border-accent font-semibold" 
                : "text-text-secondary border-transparent hover:text-text"
            }`}
            onClick={() => setTab("general")}
          >
            General
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm border-b-2 transition-all cursor-pointer ${
              tab === "api" 
                ? "text-accent border-accent font-semibold" 
                : "text-text-secondary border-transparent hover:text-text"
            }`}
            onClick={() => setTab("api")}
          >
            API Details
          </button>
        </div>
      )}

      {(!readOnly && handlerType === "http_api" ? tab === "general" : true) && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider">
            Tool name
            <input
              placeholder="snake_case e.g. get_weather"
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm font-normal text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all placeholder-text-secondary mt-1 disabled:opacity-55 disabled:cursor-not-allowed"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              readOnly={readOnly || isEdit}
              disabled={readOnly || isEdit}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider">
            Description (for the LLM)
            <textarea
              placeholder="When should the AI call this tool?"
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm font-normal text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all placeholder-text-secondary mt-1"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              required
            />
          </label>

          {!readOnly && (
            <label className="flex flex-col gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider">
              Handler type
              <select
                value={handlerType}
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm font-normal text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all mt-1 disabled:opacity-55"
                onChange={(e) => {
                  setHandlerType(e.target.value);
                  if (e.target.value !== "http_api") {
                    setTab("general");
                  }
                }}
                disabled={isEdit}
              >
                <option value="http_api">External HTTP API</option>
                <option value="echo_args">Echo (test)</option>
                <option value="uppercase">Uppercase</option>
              </select>
            </label>
          )}
        </div>
      )}

      {!readOnly && handlerType === "http_api" && tab === "api" && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider">
            API URL
            <input
              placeholder="https://api.example.com/items/{id}"
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm font-normal text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all placeholder-text-secondary mt-1"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider">
            Method
            <select
              value={apiMethod}
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm font-normal text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all mt-1"
              onChange={(e) => setApiMethod(e.target.value)}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider">
            <div className="flex justify-between items-center w-full">
              <span>POST body template (optional)</span>
              <button
                type="button"
                className="px-2.5 py-1 bg-surface hover:bg-surface-hover border border-border text-text text-[11px] font-semibold rounded transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  handleGenerateSchema();
                }}
              >
                Generate schema
              </button>
            </div>
            <textarea
              placeholder='{"id": "{id}"}'
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm font-normal text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all placeholder-text-secondary mt-1"
              value={apiBody}
              onChange={(e) => setApiBody(e.target.value)}
              rows={4}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-text-secondary uppercase tracking-wider">
            Parameters (JSON Schema)
            <textarea
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-sm font-normal text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all placeholder-text-secondary mt-1 font-mono text-xs"
              value={parametersJson}
              onChange={(e) => setParametersJson(e.target.value)}
              rows={8}
              required
            />
          </label>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-4 border-t border-border/50 pt-4">
        {onCancel && (
          <button 
            type="button" 
            className="px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-text text-sm font-semibold rounded-lg cursor-pointer transition-colors" 
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
        <button 
          type="submit" 
          className="px-4 py-2 bg-accent hover:bg-accent-dim text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" 
          disabled={busy}
        >
          {busy ? "Saving…" : isEdit ? "Save changes" : "Create tool"}
        </button>
      </div>
    </form>
  );
}
