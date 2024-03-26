import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { Env } from "deno_slack_sdk/types.ts";
import { Octokit } from "@octokit/rest";

export interface ServiceInfo {
  service_name: string;
  service_title: string;
  service_description: string;
  repository_owner: string;
  repository_name: string;
  order: number;
}

export class Client {
  public constructor(private readonly env: Env) {}

  public async getServices() {
    const response = await this.dynamodb.send(
      new ScanCommand({
        TableName: "gonow-services",
        IndexName: "info",
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
        owner: service.repository_owner,
        repo: service.repository_name,
        page,
      });
      if (response.status !== 200 || response.data.length === 0) {
        break;
      }

      for (const item of response.data) {
        const match = item.name.match(/^v([0-9]+)\.([0-9]+)\.([0-9]+)$/);
        if (match != null) {
          const version = match.slice(1).map((v) => parseInt(v, 10));
          tags.push({ order: version, name: version.join(".") });
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

  private async findServiceByName(serviceName: string) {
    const response = await this.dynamodb.send(
      new GetCommand({
        TableName: "gonow-services",
        Key: {
          service_name: serviceName,
          key: "info",
        },
      }),
    );
    return response.Item as ServiceInfo;
  }

  private _dynamodb!: DynamoDBDocumentClient;

  private get dynamodb(): DynamoDBDocumentClient {
    if (this._dynamodb == null) {
      this._dynamodb = DynamoDBDocumentClient.from(
        new DynamoDBClient({
          region: this.env.X_AWS_REGION,
          credentials: {
            accessKeyId: this.env.X_AWS_ACCESS_KEY_ID,
            secretAccessKey: this.env.X_AWS_SECRET_ACCESS_KEY,
          },
          // avoid os access
          defaultUserAgentProvider: () => Promise.resolve([["", ""]]),
        }),
      );
    }

    return this._dynamodb;
  }

  private _github!: Octokit;

  private get github(): Octokit {
    if (this._github == null) {
      this._github = new Octokit({ auth: this.env.X_GITHUB_TOKEN });
    }

    return this._github;
  }
}
