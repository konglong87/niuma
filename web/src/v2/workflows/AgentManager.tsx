import { useEffect, useRef, useState } from "react";
import type { AgentProfileRecord, ProviderOption } from "../../lib/types";
import { WORKFLOW_AGENT_ROLE_TYPES, type WorkflowAgentRoleType } from "../../lib/workflowAgentProfiles";
import { type AgentDraft, type AgentOption, canManageWorkflowAgent, emptyAgentDraft, hasNoWorkflowTools, type WorkflowAgentClient } from "./agentClient";
import { useWorkflowText } from "./i18n";
import { WORKFLOW } from "./types";
import { message } from "./useWorkflowRun";
export function AgentManager({ client, onDirtyChange, onRequestNavigation }: { client: WorkflowAgentClient; onDirtyChange: (dirty: boolean) => void; onRequestNavigation: (action: () => void) => void }) {
  const text = useWorkflowText();
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [draft, setDraft] = useState<AgentDraft>(emptyAgentDraft);
  const [editing, setEditing] = useState<AgentProfileRecord>();
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [custom, setCustom] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const refresh = async () => { const items = await client.list(); if (mounted.current) setAgents(items); };
  useEffect(() => {
    let active = true;
    void client.list().then((value) => { if (active) setAgents(value); }).catch((reason) => { if (active) setError(message(reason)); }).finally(() => { if (active) setLoading(false); });
    void Promise.all([client.providers(), client.models()]).then(([ps, ms]) => { if (active) { setProviders(ps); setModels(ms); } }).catch((reason) => { if (active) setError(message(reason)); });
    return () => { active = false; };
  }, [client]);
  const update = (patch: Partial<AgentDraft>) => { setDraft((value) => ({ ...value, ...patch })); onDirtyChange(true); };
  const operate = async (action: () => Promise<void>) => { setBusy(true); setError(""); try { await action(); if (mounted.current) await refresh(); } catch (reason) { if (mounted.current) setError(message(reason)); } finally { if (mounted.current) setBusy(false); } };
  const save = () => operate(async () => {
    if (!draft.name.trim()) throw new Error(text("nameError"));
    if (custom && (!draft.provider.trim() || !draft.model.trim())) throw new Error(`${text("provider")} / ${text("model")}`);
    await client.save(draft, editing);
    if (!mounted.current) return;
    onDirtyChange(false); setDraft(emptyAgentDraft()); setEditing(undefined); setCustom(false);
  });
  return <div className="workflow-columns">
    <section aria-label={text("agents")}><div className="workflow-section-heading"><h2>{text("agents")}</h2><button disabled={busy} onClick={() => onRequestNavigation(() => { setEditing(undefined); setDraft(emptyAgentDraft()); setCustom(false); onDirtyChange(false); })} type="button">{text("newAgent")}</button><button disabled={busy} onClick={() => { void operate(async () => undefined); }} type="button">{text("retry")}</button></div>{loading ? <p role="status">{text("loading")}</p> : agents.length === 0 ? <p>{text("noAgents")}</p> : null}
      {agents.map((agent) => { const { record, document } = agent; const manageable = canManageWorkflowAgent(record); return <article className="workflow-card" key={`${record.id}:${record.scope}:${record.profile_key}:${record.profile_version}`}>
        <h3>{record.display_name}</h3><p>{text(document.identity.role_type)} · v{record.profile_version} · {record.status}</p>
        <p>{document.execution.provider ? `${document.execution.provider} / ${document.execution.model ?? ""}` : text("inherited")}</p><p>{text(hasNoWorkflowTools(agent) ? "tools" : "toolsUnavailable")}</p>{!manageable ? <p className="workflow-muted">{text("personalAgentHint")}</p> : null}
        <div className="workflow-actions"><button disabled={busy} onClick={() => onRequestNavigation(() => { setEditing(manageable ? record : undefined); setDraft({ name: record.display_name, role: document.identity.role_type, prompt: [document.prompt.persona, document.prompt.system_addendum].filter(Boolean).join("\n\n"), provider: document.execution.provider ?? "", model: document.execution.model ?? "" }); setCustom(Boolean(document.execution.provider || document.execution.model)); onDirtyChange(false); })} type="button">{text(manageable ? "edit" : "createPersonal")}</button>
          {manageable && record.status !== "published" ? <button disabled={busy} onClick={() => { void operate(() => client.publish(record)); }} type="button">{text("publish")}</button> : null}
          {manageable ? <button disabled={busy} onClick={() => { void operate(() => client.archive(record)); }} type="button">{text("archive")}</button> : null}</div>
      </article>; })}
    </section>
    <form className="workflow-card" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <h2>{editing ? text("edit") : text("newAgent")}</h2>
      <fieldset disabled={busy}>
        <label>{text("name")}<input required maxLength={128} value={draft.name} onChange={(event) => update({ name: event.target.value })} /></label>
        <label>{text("role")}<select value={draft.role} onChange={(event) => update({ role: event.target.value as WorkflowAgentRoleType })}>{WORKFLOW_AGENT_ROLE_TYPES.map((role) => <option key={role} value={role}>{text(role)}</option>)}</select></label>
        <label>{text("prompt")}<textarea maxLength={16384} value={draft.prompt} onChange={(event) => update({ prompt: event.target.value })} rows={5} /></label>
        <label><select aria-label={text("model")} value={custom ? "custom" : "inherit"} onChange={(event) => { const next = event.target.value === "custom"; setCustom(next); if (!next) update({ provider: "", model: "" }); else onDirtyChange(true); }}><option value="inherit">{text("inherited")}</option><option value="custom">{text("customModel")}</option></select></label>
        {custom ? <><label>{text("provider")}<select required value={draft.provider} onChange={(event) => { const provider = providers.find((item) => item.name === event.target.value); update({ provider: event.target.value, model: provider?.model ?? "" }); }}><option value="">—</option>{providers.map((provider) => <option key={provider.name} value={provider.name}>{provider.name === WORKFLOW.primaryProvider ? text("primaryProvider") : provider.name}</option>)}</select></label><label>{text("model")}<input required list="workflow-agent-models" value={draft.model} onChange={(event) => update({ model: event.target.value })} /><datalist id="workflow-agent-models">{models.map((model) => <option key={model} value={model} />)}</datalist></label></> : null}
        <p><strong>{text("tools")}</strong></p><p className="workflow-muted">{text("toolsHint")}</p>
        <button className="workflow-primary" type="submit">{busy ? text("busy") : text("saveAgent")}</button>
      </fieldset>{error ? <p role="alert">{error}</p> : null}
    </form>
  </div>;
}
