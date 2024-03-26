import { Trigger } from "deno_slack_sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno_slack_api/mod.ts";
import ReleaseWorkflow from "../workflows/release.ts";

/**
 * Triggers determine when workflows are executed. A trigger
 * file describes a scenario in which a workflow should be run,
 * such as a user pressing a button or when a specific event occurs.
 * https://api.slack.com/automation/triggers
 */
const release: Trigger<typeof ReleaseWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Release GoNOW service",
  description: "Release GoNOW service",
  workflow: "#/workflows/release_gonow",
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    channel: {
      value: TriggerContextData.Shortcut.channel_id,
    },
  },
};

export default release;
