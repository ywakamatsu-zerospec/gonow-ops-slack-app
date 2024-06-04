import { Env } from "deno_slack_sdk/types.ts";

export interface ServiceInfo {
  physicalResourceId: string;
  githubRepositoryOwner: string;
  githubRepositoryName: string;
  pipelineArn: string;
  pipelineName: string;
  actionName: string;
  serviceName: string;
}

export class Client {
  public constructor(private readonly env: Env) {}

  private async query(url: URL, options?: Parameters<typeof fetch>[1]) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "x-api-key": this.env.X_API_KEY!,
        ...(options?.headers ?? {}),
      },
    });

    const status = Math.floor(response.status / 100) * 100;
    if (status !== 200) {
      console.log(status);
      throw new Error(
        `error occurred : ${response.status} ${response.statusText}`,
      );
    }

    return response.json();
  }

  private get url() {
    return "https://slack-app-release-api.app2.5-now.com";
  }

  public async getServices() {
    const url = new URL(`${this.url}/services`);
    const body = await this.query(url);
    return body.services as ServiceInfo[];
  }

  public async getVersions(serviceName: string) {
    const url = new URL(`${this.url}/versions`);
    url.searchParams.append("serviceName", serviceName);

    const body = await this.query(url);
    return body.versions as string[];
  }

  public async release(serviceName: string, version: string) {
    const url = new URL(`${this.url}/execute`);
    const body = await this.query(url, {
      method: "POST",
      body: JSON.stringify({ serviceName, version }),
    });
    return body.pipelineExecutionId as string;
  }
}
