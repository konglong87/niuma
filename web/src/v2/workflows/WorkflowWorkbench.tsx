import { useEffect, useRef, useState } from "react";
import type { IdentityConfig } from "../../lib/types";
import { webUIV2WorkflowPath, type WorkflowRoute } from "../routes";
import { AgentManager } from "./AgentManager";
import { createWorkflowAgentClient, type WorkflowAgentClient } from "./agentClient";
import { createHTTPWorkflowClient, type WorkflowClient } from "./client";
import { useWorkflowText } from "./i18n";
import type { Builtin, Template } from "./types";
import { message } from "./useWorkflowRun";
import { WorkflowEditor } from "./WorkflowEditor";
import { WorkflowRunDetail } from "./WorkflowRunDetail";
import "./workflows.css";
export function WorkflowWorkbench({ identity, route, client: providedClient, agentClient: providedAgentClient, onNavigate, onDirtyChange, onRequestNavigation }: {
  identity: IdentityConfig; route: WorkflowRoute; client?: WorkflowClient; agentClient?: WorkflowAgentClient;
  onNavigate: (path: string) => void; onDirtyChange: (dirty: boolean) => void; onRequestNavigation: (action: () => void) => void;
}) {
  const text = useWorkflowText();
  const mounted = useRef(true);
  const currentRoute = useRef(route);
  currentRoute.current = route;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [http] = useState(() => createHTTPWorkflowClient(identity));
  const [profiles] = useState(() => createWorkflowAgentClient(identity));
  const client = providedClient ?? http;
  const agentClient = providedAgentClient ?? profiles;
  const [templates, setTemplates] = useState<Template[]>([]);
  const [builtins, setBuiltins] = useState<Builtin[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  // biome-ignore lint/correctness/useExhaustiveDependencies: refresh is the explicit user-requested readback generation.
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    void Promise.all([client.list(controller.signal), client.builtins(controller.signal)]).then(([items, builtinItems]) => {
      if (!controller.signal.aborted) { setTemplates(items); setBuiltins(builtinItems); }
    }).catch((reason) => { if (!controller.signal.aborted) setError(message(reason)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [client, refresh]);
  const navigate = (next: WorkflowRoute) => onNavigate(webUIV2WorkflowPath(next));
  const createBuiltin = async (key: string) => {
    const sourceRoute = currentRoute.current;
    setBusy(true); setError("");
    try { const template = await client.createBuiltin(key); if (!mounted.current) return; setTemplates((items) => [template, ...items.filter((item) => item.key !== template.key)]); if (currentRoute.current === sourceRoute) navigate({ kind: "workflows", page: "edit", key: template.key }); }
    catch (reason) { if (mounted.current) setError(message(reason)); } finally { if (mounted.current) setBusy(false); }
  };
  const selected = route.page === "edit" ? templates.find((item) => item.key === route.key) : undefined;
  return <section className="workflow-workbench" aria-label={text("title")}>
    <header className="workflow-topbar"><div><p className="workflow-eyebrow">TEAM / WORKFLOWS</p><h1>{text("title")}</h1><p className="workflow-muted">{text("subtitle")}</p></div><nav className="workflow-actions" aria-label={text("title")}><button aria-current={route.page === "list" ? "page" : undefined} onClick={() => navigate({ kind: "workflows", page: "list" })} type="button">{text("workflows")}</button><button aria-current={route.page === "agents" ? "page" : undefined} onClick={() => navigate({ kind: "workflows", page: "agents" })} type="button">{text("agents")}</button><button className="workflow-primary" onClick={() => navigate({ kind: "workflows", page: "new" })} type="button">+ {text("newWorkflow")}</button></nav></header>
    {error ? <div role="alert" className="workflow-card"><p>{error}</p><button onClick={() => setRefresh((value) => value + 1)} type="button">{text("retry")}</button></div> : null}
    {route.page === "list" ? <><section className="workflow-card"><h2>{text("templates")}</h2><p className="workflow-muted">{text("templateHint")}</p><div className="workflow-template-grid">{builtins.map((builtin) => <button className="workflow-template" key={builtin.key} disabled={busy} onClick={() => { void createBuiltin(builtin.key); }} type="button"><strong>{builtin.key === "research-review" ? text("chainName") : builtin.key === "parallel-review" ? text("joinName") : builtin.name}</strong><span>{builtin.key === "research-review" ? text("chainDescription") : builtin.key === "parallel-review" ? text("joinDescription") : builtin.description}</span></button>)}</div></section><section><div className="workflow-section-heading"><h2>{text("workflows")}</h2><button onClick={() => setRefresh((value) => value + 1)} type="button">{text("retry")}</button></div>{loading ? <p role="status">{text("loading")}</p> : !templates.length && !error ? <p>{text("empty")}</p> : null}<div className="workflow-template-grid">{templates.map((template) => <article className="workflow-card" key={`${template.key}:${template.version}`}><h3>{template.name}</h3><p>{template.description}</p><p className="workflow-muted">v{template.version} · {template.definition.nodes.length} {text("steps")}</p><button onClick={() => navigate({ kind: "workflows", page: "edit", key: template.key })} type="button">{text("edit")}</button></article>)}</div></section></> : null}
    {route.page === "agents" ? <AgentManager client={agentClient} onDirtyChange={onDirtyChange} onRequestNavigation={onRequestNavigation} /> : null}
    {route.page === "new" || (route.page === "edit" && selected) ? <WorkflowEditor key={selected ? `${selected.key}:${selected.version}` : "new"} template={selected} client={client} agentClient={agentClient} onDirtyChange={onDirtyChange} onAgents={() => navigate({ kind: "workflows", page: "agents" })} onRun={(runID) => navigate({ kind: "workflows", page: "run", runID })} onSaved={(template) => { setTemplates((items) => [template, ...items.filter((item) => item.key !== template.key)]); navigate({ kind: "workflows", page: "edit", key: template.key }); }} /> : null}
    {route.page === "edit" && !selected ? <p role={loading ? "status" : "alert"}>{loading ? text("loading") : text("missing")}</p> : null}
    {route.page === "run" ? <WorkflowRunDetail client={client} runID={route.runID} key={route.runID} /> : null}
  </section>;
}
