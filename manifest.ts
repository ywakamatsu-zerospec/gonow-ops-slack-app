import { Manifest } from "deno_slack_sdk/mod.ts";
import { PostIssueMessage } from "./functions/post_issue_message.ts";
import ReleaseWorkflow from "./workflows/release.ts";
import { GetServices } from "./functions/get_services.ts";
import { GetVersions } from "./functions/get_versions.ts";

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "gonow-ops-slack-app",
  description: "A basic sample that demonstrates issue submission to channel",
  icon: "assets/default_new_app_icon.png",
  workflows: [ReleaseWorkflow],
  functions: [
    GetServices,
    GetVersions,
    PostIssueMessage,
  ],
  outgoingDomains: [
    "slack-app-release-api.app2.5-now.com",
  ],
  botScopes: ["commands", "chat:write", "chat:write.public"],
});
