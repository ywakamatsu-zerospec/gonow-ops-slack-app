import { DefineWorkflow, Schema } from "deno_slack_sdk/mod.ts";
import { GetServices } from "../functions/get_services.ts";
import { GetVersions } from "../functions/get_versions.ts";

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
    title: "Release GoNOW service",
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

export default ReleaseWorkflow;
