// サービスのリストを提供する関数です。

import { DefineFunction, Schema, SlackFunction } from "deno_slack_sdk/mod.ts";
import { Client } from "./client.ts";

export const Release = DefineFunction({
  callback_id: "release",
  title: "start pipeline execution",
  description: "start pipeline execution",
  source_file: "functions/release.ts",
  input_parameters: {
    properties: {
      serviceName: {
        type: Schema.types.string,
      },
      version: {
        type: Schema.types.string,
      },
    },
    required: ["serviceName", "version"],
  },
  output_parameters: {
    properties: {
      executionUrl: {
        type: Schema.types.string,
      },
    },
    required: [],
  },
});

/**
 * SlackFunction takes in two arguments: the CustomFunction
 * definition (see above), as well as a function that contains
 * handler logic that's run when the function is executed.
 * https://api.slack.com/automation/functions/custom
 */
export default SlackFunction(
  Release,
  async ({ env, inputs }) => {
    try {
      const { serviceName, version } = inputs;
      const client = new Client(env);

      const response = await client.release(serviceName, version);

      console.log("リリースが開始されました。");
      return {
        outputs: {
          executionUrl: response.pipelineExecutionId,
        },
      };
    } catch (e) {
      console.log(e);
      return {
        error: "リリースが失敗しました。",
      };
    }
  },
);
