import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { initialSettings, productionDurations } from "../_lib/constants";
import { ModeSelectScreen } from "./ModeSelectScreen";

function renderModeSelectScreen({
  productionPlayable = true,
  productionUnlocked = true,
}: {
  productionPlayable?: boolean;
  productionUnlocked?: boolean;
} = {}) {
  return renderToStaticMarkup(
    <ModeSelectScreen
      productionDuration={300}
      productionDurations={productionDurations}
      productionPlayable={productionPlayable}
      productionUnlocked={productionUnlocked}
      soundSettings={initialSettings}
      onProductionDurationChange={() => undefined}
      onSelectMode={() => undefined}
    />,
  );
}

describe("ModeSelectScreen", () => {
  test("locks rating modes when the production build is alpha-gated", () => {
    const markup = renderModeSelectScreen({ productionPlayable: false, productionUnlocked: true });

    expect(markup).toContain("Alpha");
    expect(markup.match(/class="mode-select-card locked"/g)?.length).toBe(2);
  });

  test("keeps rating modes available outside the alpha production build gate", () => {
    const markup = renderModeSelectScreen({ productionPlayable: true, productionUnlocked: true });

    expect(markup.match(/class="mode-select-card locked"/g)?.length ?? 0).toBe(0);
  });
});
