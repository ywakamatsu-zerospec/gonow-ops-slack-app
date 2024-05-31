import {
  CodePipelineClient,
  StartPipelineExecutionCommand,
} from "@aws-sdk/client-codepipeline";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Env } from "deno_slack_sdk/types.ts";
import { Octokit } from "@octokit/rest";

const userAgentProvider = (): Promise<Array<[string, string]>> =>
  Promise.resolve([["", ""]]);

export interface ServiceInfo {
  physicalResourceId: string;
  githubRepositoryOwner: string;
  githubRepositoryName: string;
  pipelineArn: string;
  pipelineName: string;
  actionName: string;
  serviceName: string;
}

const TABLE_NAME = "slack-app-release-services";

export class Client {
  public constructor(private readonly env: Env) {}

  public async getServices() {
    const response = await this.dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      }),
    );

    return (response.Items ?? []) as ServiceInfo[];
  }

  public async getVersions(serviceName: string) {
    const service = await this.findServiceByName(serviceName);
    if (service == null) return [];

    const tags: Array<{ order: number[]; name: string }> = [];
    for (let page = 1; true; page++) {
      const response = await this.github.repos.listTags({
        owner: service.githubRepositoryOwner,
        repo: service.githubRepositoryName,
        page,
      });
      if (response.status !== 200 || response.data.length === 0) {
        break;
      }

      for (const item of response.data) {
        const match = item.name.match(/^v([0-9]+)\.([0-9]+)\.([0-9]+)$/);
        if (match != null) {
          const version = match.slice(1).map((v) => parseInt(v, 10));
          tags.push({ order: version, name: item.name });
        }
      }
    }

    // 逆順にソートする
    return tags.sort((a, b) => {
      for (let i = 0; i < 3; i++) {
        const c = b.order[i] - a.order[i];
        if (c !== 0) return c;
      }
      return 0;
    }).map((item) => item.name);
  }

  public async release(serviceName: string, version: string) {
    const service = await this.findServiceByName(serviceName);
    const commitId = await this.getCommitIdForTag(service, version);

    const response = await this.codepipeline.send(
      new StartPipelineExecutionCommand({
        name: service.pipelineName,
        sourceRevisions: [{
          actionName: service.actionName,
          revisionType: "COMMIT_ID",
          revisionValue: commitId,
        }],
      }),
    );

    return { pipelineExecutionId: response.pipelineExecutionId };
  }

  private async findServiceByName(serviceName: string) {
    const response = await this.dynamodb.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        ScanFilter: {
          serviceName: {
            ComparisonOperator: "EQ",
            AttributeValueList: [serviceName],
          },
        },
      }),
    );
    return response.Items?.[0] as ServiceInfo;
  }

  private async getCommitIdForTag(service: ServiceInfo, version: string) {
    const response = await this.github.repos.getCommit({
      owner: service.githubRepositoryOwner,
      repo: service.githubRepositoryName,
      ref: `tags/${version}`,
    });

    return response.data.sha;
  }

  private get awsConfig() {
    return {
      region: this.env.X_AWS_REGION,
      credentials: {
        accessKeyId: this.env.X_AWS_ACCESS_KEY_ID,
        secretAccessKey: this.env.X_AWS_SECRET_ACCESS_KEY,
      },
      // avoid os access
      defaultUserAgentProvider: userAgentProvider,
    };
  }

  private get dynamodb(): DynamoDBDocumentClient {
    return DynamoDBDocumentClient.from(
      new DynamoDBClient(this.awsConfig),
    );
  }

  private get codepipeline() {
    return new CodePipelineClient(this.awsConfig);
  }

  private get github(): Octokit {
    return new Octokit({ auth: this.env.X_GITHUB_TOKEN });
  }
}
