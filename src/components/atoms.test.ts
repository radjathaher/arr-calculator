import { describe, expect, it } from "vitest";
import { formatThousands, parseNI, stripThousands } from "./atoms";

describe("formatThousands", () => {
  it("groups the integer part with commas", () => {
    expect(formatThousands("1000000")).toBe("1,000,000");
    expect(formatThousands("1234")).toBe("1,234");
    expect(formatThousands("100")).toBe("100");
  });

  it("leaves the decimal part untouched", () => {
    expect(formatThousands("9.99")).toBe("9.99");
    expect(formatThousands("1234.5")).toBe("1,234.5");
    expect(formatThousands("1000000.123")).toBe("1,000,000.123");
  });

  it("allows in-progress trailing decimals", () => {
    expect(formatThousands("1234.")).toBe("1,234.");
    expect(formatThousands(".")).toBe(".");
    expect(formatThousands("1234.0")).toBe("1,234.0");
  });

  it("handles negatives", () => {
    expect(formatThousands("-1000000")).toBe("-1,000,000");
    expect(formatThousands("-")).toBe("-");
    expect(formatThousands("-1234.5")).toBe("-1,234.5");
  });

  it("re-formats a value that already carries commas (idempotent)", () => {
    expect(formatThousands("1,000,000")).toBe("1,000,000");
    expect(formatThousands("1,234.5")).toBe("1,234.5");
  });

  it("passes blanks through", () => {
    expect(formatThousands("")).toBe("");
  });
});

describe("stripThousands", () => {
  it("removes commas only", () => {
    expect(stripThousands("1,000,000")).toBe("1000000");
    expect(stripThousands("1,234.56")).toBe("1234.56");
    expect(stripThousands("9.99")).toBe("9.99");
  });
});

describe("parseNI", () => {
  it("strips commas before parsing", () => {
    expect(parseNI("1,000,000")).toBe(1000000);
    expect(parseNI("1,234.5")).toBe(1234.5);
    expect(parseNI("9.99")).toBe(9.99);
  });

  it("handles negatives", () => {
    expect(parseNI("-1,000")).toBe(-1000);
  });

  it("commits NaN for blank / lone sign / lone dot", () => {
    expect(parseNI("")).toBeNaN();
    expect(parseNI("-")).toBeNaN();
    expect(parseNI(".")).toBeNaN();
    expect(parseNI("-.")).toBeNaN();
  });

  it("round-trips through formatThousands", () => {
    for (const n of [0, 5, 9.99, 1234, 1000000, -42, 1234.5]) {
      expect(parseNI(formatThousands(String(n)))).toBe(n);
    }
  });
});
