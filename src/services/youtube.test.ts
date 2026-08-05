import { describe, expect, it } from "vitest";

import { extractChannelId } from "./youtube";

describe("extractChannelId", () => {
  it("passes through a direct UC channel ID", () => {
    expect(extractChannelId("UCX6Wc6iura2Yy2F0vBY9BzA")).toBe(
      "UCX6Wc6iura2Yy2F0vBY9BzA",
    );
  });

  it("extracts the channel ID from a /channel/ URL", () => {
    expect(
      extractChannelId("https://www.youtube.com/channel/UCX6Wc6iura2Yy2F0vBY9BzA"),
    ).toBe("UCX6Wc6iura2Yy2F0vBY9BzA");
  });

  it("does not resolve /c/, /user/, or @handle URLs", () => {
    expect(extractChannelId("https://www.youtube.com/c/somechannel")).toBe(
      "https://www.youtube.com/c/somechannel",
    );
    expect(extractChannelId("https://www.youtube.com/user/someuser")).toBe(
      "https://www.youtube.com/user/someuser",
    );
    expect(extractChannelId("https://www.youtube.com/@somehandle")).toBe(
      "https://www.youtube.com/@somehandle",
    );
  });

  it("passes through handles and custom inputs unchanged", () => {
    expect(extractChannelId("@somehandle")).toBe("@somehandle");
    expect(extractChannelId("somechannel")).toBe("somechannel");
    expect(extractChannelId("")).toBe("");
  });
});
