import { DefineFunction, Schema, SlackFunction } from "deno_slack_sdk/mod.ts";
import { Client } from "./client.ts";

export const GetVersions = DefineFunction({
  callback_id: "get_versions",
  title: "Get versions for the service",
  description: "Get versions for the service identified by name",
  source_file: "functions/get_versions.ts",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      serviceName: {
        type: Schema.types.string,
        description: "service name",
      },
    },
    required: ["serviceName"],
  },
  output_parameters: {
    properties: {
      versions: {
        type: Schema.types.array,
        items: {
          type: Schema.types.string,
        },
      },
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
    },
    required: ["versions"],
  },
});

/**
 * SlackFunction takes in two arguments: the CustomFunction
 * definition (see above), as well as a function that contains
 * handler logic that's run when the function is executed.
 * https://api.slack.com/automation/functions/custom
 */
export default SlackFunction(
  GetVersions,
  async ({ inputs, env }) => {
    const { serviceName, interactivity } = inputs;
    console.log(serviceName);
    try {
      const client = new Client(env);
      const versions = await client.getVersions(serviceName);

      console.log(versions);
      return {
        outputs: { versions, interactivity },
      };
    } catch (e) {
      console.log(e);
      return {
        error: "バージョンの取得に失敗しました。",
      };
    }
  },
);
