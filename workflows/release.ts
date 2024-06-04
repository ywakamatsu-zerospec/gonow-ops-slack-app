import { DefineWorkflow, Schema } from "deno_slack_sdk/mod.ts";
import { GetServices } from "../functions/get_services.ts";
import { GetVersions } from "../functions/get_versions.ts";
import { Release } from "../functions/release.ts";

const ReleaseWorkflow = DefineWorkflow({
  callback_id: "release_gonow",
  title: "Release GoNOW",
  description: "Release GoNOW on production",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      channel: {
        type: Schema.slack.types.channel_id,
      },
    },
    required: ["interactivity"],
  },
});

const getServices = ReleaseWorkflow.addStep(
  GetServices,
  {
    interactivity: ReleaseWorkflow.inputs.interactivity,
  },
);

const serviceSelection = ReleaseWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Select GoNOW service",
    interactivity: getServices.outputs.interactivity,
    submit_label: "選択",
    fields: {
      elements: [{
        name: "serviceName",
        title: "サービス名",
        type: Schema.types.string,
        enum: getServices.outputs.names,
      }],
      required: ["serviceName"],
    },
  },
);

const getVersions = ReleaseWorkflow.addStep(
  GetVersions,
  {
    interactivity: serviceSelection.outputs.interactivity,
    serviceName: serviceSelection.outputs.fields.serviceName,
  },
);

const versionSelection = ReleaseWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Select version",
    interactivity: getVersions.outputs.interactivity,
    submit_label: "リリース",
    fields: {
      elements: [{
        name: "version",
        title: "バージョン",
        type: Schema.types.string,
        enum: getVersions.outputs.versions,
      }],
      required: ["version"],
    },
  },
);

const release = ReleaseWorkflow.addStep(
  Release,
  {
    serviceName: serviceSelection.outputs.fields.serviceName,
    version: versionSelection.outputs.fields.version,
  },
);

ReleaseWorkflow.addStep(
  Schema.slack.functions.SendMessage,
  {
    channel_id: ReleaseWorkflow.inputs.channel,
    message:
      `:open_hands: ${release.outputs.pipelineExecutionId}が実行されました。`,
  },
);

export default ReleaseWorkflow;
