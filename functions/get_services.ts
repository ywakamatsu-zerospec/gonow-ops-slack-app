// サービスのリストを提供する関数です。

import { DefineFunction, Schema, SlackFunction } from "deno_slack_sdk/mod.ts";
import { Client } from "./client.ts";

export const GetServices = DefineFunction({
  callback_id: "get_services",
  title: "Get all services",
  description: "Get all services",
  source_file: "functions/get_services.ts",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
    },
    required: [],
  },
  output_parameters: {
    properties: {
      names: {
        type: Schema.types.array,
        items: {
          type: Schema.types.string,
        },
      },
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
    },
    required: ["names"],
  },
});

/**
 * SlackFunction takes in two arguments: the CustomFunction
 * definition (see above), as well as a function that contains
 * handler logic that's run when the function is executed.
 * https://api.slack.com/automation/functions/custom
 */
export default SlackFunction(
  GetServices,
  async ({ env, inputs }) => {
    try {
      const client = new Client(env);
      const services = await client.getServices();
      services.sort((a, b) => {
        const na = a.serviceName;
        const nb = b.serviceName;

        if (na === nb) {
          return 0;
        } else if (na < nb) {
          return -1;
        } else {
          return +1;
        }
      });

      console.log("%d件のサービスを取得しました。", services.length);
      return {
        outputs: {
          names: services.map((service) => service.serviceName),
          interactivity: inputs.interactivity,
        },
      };
    } catch (e) {
      console.log(e);
      return {
        error: "バージョンの取得に失敗しました。",
      };
    }
  },
);
