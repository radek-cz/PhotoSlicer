import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LocalizationProvider } from "../../lib/i18n/components/LocalizationProvider/LocalizationProvider";
import i18n from "../../lib/i18n/i18n";
import { ErrorPage, type ErrorPageType } from "./ErrorPage";

afterEach(cleanup);

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

function renderErrorPage(type: ErrorPageType) {
  render(
    <MemoryRouter>
      <LocalizationProvider>
        <ErrorPage type={type} />
      </LocalizationProvider>
    </MemoryRouter>,
  );
}

describe("reusable error page", () => {
  it.each([
    ["not-found", "404", "This page went off the frame."],
    ["forbidden", "403", "This page is out of bounds."],
    ["server-error", "500", "Something went wrong on our end."],
    ["service-unavailable", "503", "The service is taking a break."],
  ] as const)("renders the %s error", (type, code, title) => {
    renderErrorPage(type);

    expect(screen.getByRole("heading", { name: title })).toBeTruthy();
    expect(screen.getAllByText(code)).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "Back to PhotoSlicer" }).getAttribute("href"),
    ).toBe("/");
    expect(screen.getByRole("button", { name: "Go back" })).toBeTruthy();
  });

  it("uses the active language for error content", async () => {
    await i18n.changeLanguage("pl");
    renderErrorPage("not-found");

    expect(
      screen.getByRole("heading", { name: "Ta strona wypadła z kadru." }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Wróć do PhotoSlicer" }),
    ).toBeTruthy();
  });
});
