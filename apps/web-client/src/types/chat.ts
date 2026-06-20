import type { ToolTraceEntry } from "../api";

export interface Message {
  role: "user" | "assistant";
  content: string;
  toolTrace?: ToolTraceEntry[];
}
