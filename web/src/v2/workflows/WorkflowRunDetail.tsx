import { useState } from "react";
import type { WorkflowClient } from "./client";
import { useWorkflowText } from "./i18n";
import { TERMINAL_STATUSES, type Failure, type Usage } from "./types";
import { message, useWorkflowRun } from "./useWorkflowRun";
export function WorkflowRunDetail({ client, runID }: { client: WorkflowClient; runID: string }) {
  const text = useWorkflowText();
  const { state, connection, error, reload, accept } = useWorkflowRun(client, runID);
  const [busy, setBusy] = useState(false);
  const [operationError, setOperationError] = useState("");
  const run = state.run;
  const status = state.status ?? run?.status;
  const operate = async (operation: "cancel" | "recover") => {
    if (!run) return;
    setBusy(true); setOperationError("");
    try { accept(operation === "cancel" ? await client.cancel(runID) : await client.recover(runID, run.revision)); reload(); }
    catch (reason) { setOperationError(message(reason)); reload(); }
    finally { setBusy(false); }
  };
  return <section className="workflow-run" aria-label={run?.name || runID}>
    <header className="workflow-card"><div className="workflow-section-heading"><h2>{run?.name || runID}</h2>{status ? <span className="workflow-status" data-status={status}>{text(status)}</span> : null}</div><p className="workflow-muted">{runID} {run ? `· ${text("revision")} ${run.revision} · epoch ${run.epoch}` : ""}</p><p role="status">{text(connection)}</p>{connection === "offline" || connection === "readback" ? <p>{text("readbackHint")}</p> : null}
      <div className="workflow-actions"><button onClick={reload} type="button">{text("retry")}</button>{run && status && !TERMINAL_STATUSES.has(status) ? <button disabled={busy || status === "cancel_requested"} onClick={() => { void operate("cancel"); }} type="button">{text("cancel")}</button> : null}{run && status === "interrupted" ? <button className="workflow-primary" disabled={busy} onClick={() => { void operate("recover"); }} type="button">{text("recover")}</button> : null}</div>
      {error || operationError ? <p role="alert">{operationError || error}</p> : null}
      {run ? <><h3>{text("input")}</h3><pre>{run.input}</pre><UsageView usage={run.usage} uncertainTokens={run.uncertain_tokens} /><FailureView failure={run.failure} /></> : null}
    </header>
    {run ? <><h2>{text("steps")}</h2><ol className="workflow-step-list">{(run.plan.definition.nodes ?? []).map((definition, index) => {
      const node = (run.nodes ?? []).find((item) => item.node_id === definition.id);
      const projection = state.nodes[definition.id];
      const agent = (run.plan.agents ?? []).find((item) => item.ref === definition.agent_ref);
      return <li className="workflow-card" key={definition.id}><div className="workflow-section-heading"><h3>{text("step")} {index + 1} · {definition.id}</h3>{projection ? <span className="workflow-status" data-status={projection.status}>{text(projection.status)}</span> : null}</div><p>{agent?.name ?? definition.agent_ref} · {definition.instruction}</p><p className="workflow-muted">{definition.depends_on.length ? `${text("dependencies")}: ${definition.depends_on.join(", ")}` : text("noDependencies")}</p><FailureView failure={node?.failure} />{node?.next_retry_at ? <p>{text("nextRetry")}: {new Date(node.next_retry_at).toLocaleString()}</p> : null}
        {(node?.attempts ?? []).map((attempt) => <details key={`${attempt.epoch}:${attempt.number}`} open={attempt.number === projection?.attempt}><summary>{text("attempt")} {attempt.number} · {text(projection?.attempts[attempt.number]?.status ?? attempt.status)} · {attempt.provider} {attempt.model}</summary><UsageView usage={attempt.usage} known={attempt.usage_known} uncertainTokens={attempt.usage_known === false ? attempt.budget_reserved : undefined} /><FailureView failure={projection?.attempts[attempt.number]?.failure ?? attempt.failure} />{projection?.attempts[attempt.number]?.text ? <section aria-label={text("output")}><pre>{projection.attempts[attempt.number].text}</pre></section> : null}</details>)}
        {projection && !node?.attempts?.some((attempt) => attempt.number === projection.attempt) && projection.attempt > 0 ? <div><h4>{text("attempt")} {projection.attempt}</h4><FailureView failure={projection.attempts[projection.attempt]?.failure} /><pre>{projection.attempts[projection.attempt]?.text}</pre></div> : null}
        {node?.output && !projection?.attempt ? <pre>{node.output}</pre> : null}
      </li>;
    })}</ol><section><h2>{text("artifacts")}</h2>{!(run.artifacts ?? []).length ? <p>{text("noArtifacts")}</p> : (run.artifacts ?? []).map((artifact) => <details className="workflow-card" key={artifact.id} open><summary>{artifact.node_id} · {text("attempt")} {artifact.attempt_no} · {artifact.kind}</summary><small>{artifact.id} · SHA256 {artifact.sha256}</small><pre>{artifact.content}</pre></details>)}</section></> : null}
    <section><h2>{text("timeline")}</h2>{!state.events.length ? <p>{text("noEvents")}</p> : <ol className="workflow-timeline">{state.events.map((event) => <li key={event.sequence}><div><strong>#{event.sequence} · {event.type}</strong><time dateTime={event.created_at}>{new Date(event.created_at).toLocaleTimeString()}</time></div><small>{event.node_id} {event.attempt_no ? `· ${text("attempt")} ${event.attempt_no}` : ""} {event.status ? `· ${text(event.status)}` : ""}</small>{event.text ? <pre>{event.text}</pre> : null}<FailureView failure={event.failure} /></li>)}</ol>}</section>
  </section>;
}
function UsageView({ usage, known, uncertainTokens }: { usage: Usage; known?: boolean; uncertainTokens?: number }) {
  const text = useWorkflowText();
  return <><p className="workflow-muted">{text(known === false ? "unknownUsage" : "actualUsage")}</p><dl className="workflow-usage" aria-label={text("usage")}>{([ ["input_tokens", "inputTokens"], ["output_tokens", "outputTokens"], ["cache_read_tokens", "cacheRead"], ["cache_write_tokens", "cacheWrite"] ] as const).map(([key, label]) => <div key={key}><dt>{text(label)}</dt><dd>{known === false ? text("unknownValue") : usage?.[key] ?? 0}</dd></div>)}</dl>{uncertainTokens !== undefined && uncertainTokens > 0 ? <p className="workflow-muted" role="status">{text("uncertainUsage").replace("{tokens}", String(uncertainTokens))}</p> : null}</>;
}
function FailureView({ failure }: { failure?: Failure }) {
  const text = useWorkflowText();
  return failure ? <p className="workflow-failure" role="alert"><strong>{failure.code}</strong>: {failure.message} · {text(failure.retryable ? "retryable" : "notRetryable")}</p> : null;
}
