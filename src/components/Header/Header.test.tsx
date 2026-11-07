import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LocalizationProvider } from "../../lib/i18n/components/LocalizationProvider/LocalizationProvider";
import i18n from "../../lib/i18n/i18n";
import Header from "./Header";

afterEach(cleanup);

beforeEach(async () => {
  await i18n.changeLanguage("en");
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
});

describe("application header", () => {
  it("opens photo detection settings from the gear button", async () => {
    render(
      <MemoryRouter>
        <LocalizationProvider>
          <Header />
        </LocalizationProvider>
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Detection sensitivity settings" }),
    );

    expect(
      await screen.findByRole("dialog", {
        name: "Photo detection sensitivity",
      }),
    ).toBeTruthy();
  });
});
