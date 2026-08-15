/**
 * @sentinel/sdk — TypeScript client stub (Phase 15).
 * Does not bypass Sentinel; execute() will fail until the gateway exists.
 */

export interface SentinelOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
}

export class Sentinel {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: SentinelOptions) {
    if (!options.apiKey) {
      throw new Error("Sentinel API key is required");
    }
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? "http://localhost:3000";
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  /**
   * Execute a tool call through Sentinel.
   * Not implemented until Phase 4/15 — throws by design (no silent bypass).
   */
  async execute(
    _toolName: string,
    _args: Record<string, unknown>,
    _requestId?: string,
  ): Promise<never> {
    void this.apiKey;
    void this.baseUrl;
    void this.timeoutMs;
    throw new Error(
      "Sentinel SDK execute() is not implemented yet. Gateway lands in Phase 4; full SDK in Phase 15.",
    );
  }

  /**
   * Mark content as untrusted for prompt-injection heuristics (Phase 10).
   */
  untrusted(content: string, source?: string): { content: string; trust: "untrusted"; source?: string } {
    return { content, trust: "untrusted", source };
  }
}
