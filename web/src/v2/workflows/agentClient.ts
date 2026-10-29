import { archiveAgentProfile, listAgentProfiles, listModels, listProviders, publishAgentProfile, saveAgentProfile } from "../../lib/api";
import { defaultWorkflowAgentProfileDocument, parseWorkflowAgentProfileJSON, validateWorkflowAgentProfileDraft, type WorkflowAgentProfileDocument, type WorkflowAgentRoleType } from "../../lib/workflowAgentProfiles";
import type { AgentProfileRecord, IdentityConfig, ProviderOption } from "../../lib/types";
export type AgentDraft = { name: string; role: WorkflowAgentRoleType; prompt: string; provider: string; model: string };
export type AgentOption = { record: AgentProfileRecord; document: WorkflowAgentProfileDocument };
export const canManageWorkflowAgent = (record: AgentProfileRecord): boolean => record.id > 0 && record.scope !== "tenant_shared";
export function hasNoWorkflowTools(agent: AgentOption): boolean {
  const capabilities = agent.document.capabilities;
  return !(capabilities.tools.allow?.length || capabilities.skills?.length || capabilities.mcp_servers?.length || capabilities.allow_agents);
}
export function isWorkflowBindableAgent(agent: AgentOption): boolean {
  return agent.record.id > 0 && agent.record.status === "published" && agent.document.execution.kind === "text" && hasNoWorkflowTools(agent);
}
export interface WorkflowAgentClient {
  list(): Promise<AgentOption[]>;
  save(draft: AgentDraft, existing?: AgentProfileRecord): Promise<AgentProfileRecord>;
  publish(record: AgentProfileRecord): Promise<void>;
  archive(record: AgentProfileRecord): Promise<void>;
  providers(): Promise<ProviderOption[]>;
  models(): Promise<string[]>;
}
export const emptyAgentDraft = (): AgentDraft => ({ name: "", role: "general", prompt: "", provider: "", model: "" });
export function createWorkflowAgentClient(identity: IdentityConfig): WorkflowAgentClient {
  return {
    async list() {
      const records = await listAgentProfiles(identity);
      return records.flatMap((record) => {
        if (record.status === "archived") return [];
        try { return [{ record, document: parseWorkflowAgentProfileJSON(record.config_json) }]; }
        catch { return []; } // Do not coerce legacy or unsupported execution kinds into text agents.
      });
    },
    async save(draft, existing) {
      const config = defaultWorkflowAgentProfileDocument(draft.role);
      config.identity.display_name = draft.name.trim();
      config.prompt.system_addendum = draft.prompt.trim();
      if (draft.provider) config.execution.provider = draft.provider;
      if (draft.model) config.execution.model = draft.model;
      const report = validateWorkflowAgentProfileDraft(config);
      if (!report.valid) throw new Error(report.issues.map((issue) => issue.message).join("; "));
      return saveAgentProfile(identity, {
        profile_key: (existing && canManageWorkflowAgent(existing) ? existing.profile_key : undefined) ?? `workflow-agent-${crypto.randomUUID()}`,
        scope: "user_private", display_name: draft.name.trim(), status: "draft", config,
      }, existing && canManageWorkflowAgent(existing) ? existing.profile_key : undefined);
    },
    async publish(record) { await publishAgentProfile(identity, record.profile_key, record.profile_version); },
    archive: (record) => archiveAgentProfile(identity, record.profile_key, record.profile_version),
    providers: () => listProviders(identity), models: () => listModels(identity),
  };
}
