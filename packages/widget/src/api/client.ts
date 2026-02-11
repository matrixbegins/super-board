export class KanApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(serverUrl: string, apiKey: string) {
    this.baseUrl = serverUrl.replace(/\/$/, "") + "/api/v1";
    this.apiKey = apiKey;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "x-api-key": this.apiKey,
    };
    if (body) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      let message = `API error: ${res.status}`;
      try {
        const errBody = await res.json();
        if (errBody?.error?.message) message = errBody.error.message;
        else if (errBody?.message) message = errBody.message;
      } catch {
        // ignore parse error
      }
      throw new Error(message);
    }

    return res.json() as Promise<T>;
  }

  async getBoard(boardPublicId: string): Promise<any> {
    return this.request("GET", `/boards/${boardPublicId}`);
  }

  async createList(boardPublicId: string, name: string): Promise<any> {
    return this.request("POST", "/lists", { boardPublicId, name });
  }

  async createCard(input: {
    title: string;
    description: string;
    listPublicId: string;
    labelPublicIds: string[];
    memberPublicIds: string[];
    position: "start" | "end";
    externalCreatedByName?: string;
    externalCreatedByEmail?: string;
  }): Promise<any> {
    return this.request("POST", "/cards", input);
  }

  async generateUploadUrl(
    cardPublicId: string,
    filename: string,
    contentType: string,
    size: number,
  ): Promise<{ url: string; key: string }> {
    return this.request(
      "POST",
      `/cards/${cardPublicId}/attachments/upload-url`,
      { cardPublicId, filename, contentType, size },
    );
  }

  async confirmAttachment(
    cardPublicId: string,
    input: {
      s3Key: string;
      filename: string;
      originalFilename: string;
      contentType: string;
      size: number;
    },
  ): Promise<any> {
    return this.request("POST", `/cards/${cardPublicId}/attachments/confirm`, {
      cardPublicId,
      ...input,
    });
  }

  async addComment(
    cardPublicId: string,
    comment: string,
    options?: {
      externalCreatedByName?: string;
      externalCreatedByEmail?: string;
    },
  ): Promise<any> {
    return this.request("POST", `/cards/${cardPublicId}/comments`, {
      cardPublicId,
      comment,
      ...options,
    });
  }
}
