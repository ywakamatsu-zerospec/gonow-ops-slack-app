import { DefineWorkflow, Schema } from "deno_slack_sdk/mod.ts";
import { GetServices } from "../functions/get_services.ts";

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
        name: "service",
        title: "サービス名",
        type: Schema.types.string,
        enum: getServices.outputs.names,
      }],
      required: ["service"],
    },
  },
);

// const serviceSelection1 = ReleaseWorkflow.addStep(
//   Schema.slack.functions.OpenForm,
//   {
//     title: "Submit an issue",
//     interactivity: ReleaseWorkflow.inputs.interactivity,
//     submit_label: "Submit",
//     fields: {
//       elements: [{
//         name: "severity",
//         title: "Severity of issue",
//         type: Schema.types.string,
//         enum: [":white_circle:", ":large_blue_circle:", ":red_circle:"],
//         choices: serviceSelection.outputs.services,
//       }, {
//         name: "description",
//         title: "Description of issue",
//         type: Schema.types.string,
//         long: true,
//       }, {
//         name: "link",
//         title: "Relevant link or URL",
//         type: Schema.types.string,
//       }],
//       required: ["severity", "description"],
//     },
//   },
// );

export default ReleaseWorkflow;
