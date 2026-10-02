import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { CronogramaAiError, parseCronogramaPdf } from "./claude";

const schedule = {
  title: "Cronograma T41",
  weeks: [{ number: 1, days: [{ day: 1, month: 8, items: [{
    subject: "Dermatologia",
    startTime: "08:00",
    endTime: "10:00",
    color: "#AABBCC",
    type: null,
    location: null,
    teacher: null,
    content: null,
    tag: null,
    sideBySide: false,
  }] }] }],
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Claude cronograma parser", () => {
  it("sends only PDF bytes and validates the structured response", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubEnv("CRONOGRAMA_AI_MODEL", "claude-sonnet-4-6");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(schedule) }] })),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await parseCronogramaPdf(Buffer.from("%PDF-test"));
    const request = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      model: string;
      max_tokens: number;
      output_config: { effort: string };
      messages: Array<{ content: Array<{ type: string; source?: { data: string }; text?: string }> }>;
    };

    expect(result).toEqual(schedule);
    expect(request.output_config.effort).toBe("low");
    expect(request.max_tokens).toBe(32000);
    expect(request.messages[0].content[1].text).toContain("página seguinte");
    expect(request.messages[0].content[1].text).toContain("lado a lado");
    expect(request.messages[0].content[1].text).toContain("nunca copie a grade de uma semana para outra");
    expect(request.model).toBe("claude-sonnet-4-6");
    expect(request.messages[0].content[0].source?.data).toBe(Buffer.from("%PDF-test").toString("base64"));
    expect(JSON.stringify(request)).not.toContain("arquivo-pessoal.pdf");
    expect(fetchMock.mock.calls[0][1].signal).toBeDefined();
  });

  it("classifies API failures without exposing their response body", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubEnv("CRONOGRAMA_AI_MODEL", "claude-sonnet-4-6");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      type: "error",
      error: { type: "invalid_request_error", message: "private upstream detail" },
    }), { status: 400, headers: { "request-id": "req_test_123" } })));

    const failure = await parseCronogramaPdf(Buffer.from("%PDF-test")).catch((error: unknown) => error);
    if (!(failure instanceof CronogramaAiError)) throw failure;
    expect(failure).toMatchObject({
      code: "upstream_rejected",
      upstreamStatus: 400,
      requestId: "req_test_123",
      upstreamType: "invalid_request_error",
    });
    expect(failure.message).not.toContain("private upstream detail");
  });

  it("reports only the error name and cause code when the request never gets a response", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubEnv("CRONOGRAMA_AI_MODEL", "claude-sonnet-4-6");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(
      new TypeError("fetch failed with test-key", { cause: { code: "ECONNRESET" } }),
    ));

    const failure = await parseCronogramaPdf(Buffer.from("%PDF-test")).catch((error: unknown) => error);
    if (!(failure instanceof CronogramaAiError)) throw failure;
    expect(failure).toMatchObject({ code: "network_error", detail: "TypeError:ECONNRESET" });
    expect(JSON.stringify(failure)).not.toContain("test-key");
  });

  it("identifies a request that exceeded the time limit", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubEnv("CRONOGRAMA_AI_MODEL", "claude-sonnet-4-6");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("timed out", "TimeoutError")));

    await expect(parseCronogramaPdf(Buffer.from("%PDF-test"))).rejects.toMatchObject({
      code: "timeout",
      detail: "TimeoutError",
    });
  });

  it("reports which schema rule rejected the output without echoing document text", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubEnv("CRONOGRAMA_AI_MODEL", "claude-sonnet-4-6");
    const invalid = structuredClone(schedule);
    invalid.weeks[0].days[0].items[0].startTime = "azul-secreto";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(invalid) }] })),
    ));

    const failure = await parseCronogramaPdf(Buffer.from("%PDF-test")).catch((error: unknown) => error);
    if (!(failure instanceof CronogramaAiError)) throw failure;
    expect(failure).toMatchObject({ code: "invalid_output", detail: "weeks=1-6 in=- out=- weeks.*.days.*.items.*.startTime:invalid_format" });
    expect(JSON.stringify(failure)).not.toContain("azul-secreto");
  });

  it("reads long schedules in week ranges and merges them in order", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubEnv("CRONOGRAMA_AI_MODEL", "claude-sonnet-4-6");
    const week = (number: number) => ({ number, days: schedule.weeks[0].days });
    const reply = (weeks: ReturnType<typeof week>[]) =>
      new Response(JSON.stringify({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ title: "Cronograma T41", weeks }) }] }));
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(reply([1, 2, 3, 4, 5, 6].map(week)))
      .mockResolvedValueOnce(reply([7, 8].map(week)));
    vi.stubGlobal("fetch", fetchMock);
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    const result = await parseCronogramaPdf(Buffer.from("%PDF-test"));
    const secondPrompt = (JSON.parse(fetchMock.mock.calls[1][1].body as string) as { messages: Array<{ content: Array<{ text?: string }> }> }).messages[0].content[1].text;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.weeks.map(({ number }) => number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(secondPrompt).toContain("semanas numeradas de 7 a 12");
    expect(info).toHaveBeenCalledWith(expect.stringMatching(/^cronograma\.read\.done chunks=2 ms=\d+ in=0 out=0 cacheWrite=0 cacheRead=0$/));
  });

  it("turns off up-front thinking only on Sonnet 5.5", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    const reply = () => new Response(JSON.stringify({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(schedule) }] }));
    const fetchMock = vi.fn().mockImplementation(async () => reply());
    vi.stubGlobal("fetch", fetchMock);
    const sentThinking = async (model: string) => {
      vi.stubEnv("CRONOGRAMA_AI_MODEL", model);
      await parseCronogramaPdf(Buffer.from("%PDF-test"));
      return (JSON.parse(fetchMock.mock.calls.at(-1)?.[1].body as string) as { thinking?: unknown }).thinking;
    };

    await expect(sentThinking("claude-sonnet-5-5")).resolves.toEqual({ type: "between_tools" });
    await expect(sentThinking("claude-sonnet-5")).resolves.toBeUndefined();
  });

  it("identifies truncated structured output", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    vi.stubEnv("CRONOGRAMA_AI_MODEL", "claude-sonnet-4-6");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      stop_reason: "max_tokens",
      content: [],
    }))));

    await expect(parseCronogramaPdf(Buffer.from("%PDF-test"))).rejects.toMatchObject({ code: "incomplete" });
  });
});