import { describe, it, expect } from "vitest";
import { themeToVars, defaultThemeVars } from "../styles.js";

describe("themeToVars", () => {
  it("returns empty object when no theme provided", () => {
    expect(themeToVars()).toEqual({});
    expect(themeToVars(undefined)).toEqual({});
  });

  it("maps theme properties to CSS variables", () => {
    const result = themeToVars({
      primaryColor: "#ff0000",
      backgroundColor: "#000000",
      textColor: "#ffffff",
      borderRadius: "8px",
      fontFamily: "Arial",
    });

    expect(result).toEqual({
      "--ai-me-primary": "#ff0000",
      "--ai-me-bg": "#000000",
      "--ai-me-text": "#ffffff",
      "--ai-me-radius": "8px",
      "--ai-me-font": "Arial",
    });
  });

  it("only includes provided properties", () => {
    const result = themeToVars({ primaryColor: "#ff0000" });
    expect(result).toEqual({ "--ai-me-primary": "#ff0000" });
    expect(Object.keys(result)).toHaveLength(1);
  });
});

describe("defaultThemeVars", () => {
  it("has all required CSS variables", () => {
    expect(defaultThemeVars["--ai-me-primary"]).toBeDefined();
    expect(defaultThemeVars["--ai-me-bg"]).toBeDefined();
    expect(defaultThemeVars["--ai-me-text"]).toBeDefined();
    expect(defaultThemeVars["--ai-me-border"]).toBeDefined();
    expect(defaultThemeVars["--ai-me-radius"]).toBeDefined();
    expect(defaultThemeVars["--ai-me-font"]).toBeDefined();
    expect(defaultThemeVars["--ai-me-shadow"]).toBeDefined();
  });
});
