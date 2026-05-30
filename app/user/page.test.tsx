import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import UserPage from "./page";

describe("UserPage", () => {
  test("renders the local user profile with recent sessions", () => {
    const markup = renderToStaticMarkup(<UserPage />);

    expect(markup).toContain("ローカルユーザー");
    expect(markup).toContain("Recent Sessions");
    expect(markup).toContain('class="app-header"');
  });
});
