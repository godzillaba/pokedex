import { render, fireEvent, act } from "@testing-library/preact";
import { App } from "./app.jsx";

vi.mock("./data/species.json", () => ({
  default: [
    {
      id: "Grizzly_bear", name: "Grizzly Bear", species: "Ursus arctos", type: "Mammal",
      region: "Northwest", habitat: "Forest", conservation_status: "Least Concern",
      stats: { size: 90, speed: 60, rarity: 40, danger: 85 },
      image: "images/animals/Grizzly_bear.png",
    },
    {
      id: "Bald_eagle", name: "Bald Eagle", species: "Haliaeetus leucocephalus", type: "Bird",
      region: "Nationwide", habitat: "Wetlands", conservation_status: "Least Concern",
      stats: { size: 50, speed: 80, rarity: 30, danger: 20 },
      image: "images/animals/Bald_eagle.png",
    },
  ],
}));

beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, "");
});

describe("App", () => {
  it("renders species list by default", () => {
    const { getByText } = render(<App />);
    expect(getByText("Grizzly Bear")).toBeInTheDocument();
    expect(getByText("Bald Eagle")).toBeInTheDocument();
  });

  it("navigates to species card on click", () => {
    const { getByText } = render(<App />);
    fireEvent.click(getByText("Grizzly Bear"));
    expect(getByText("#0001")).toBeInTheDocument();
    expect(getByText("BACK")).toBeInTheDocument();
  });

  it("navigates to settings", () => {
    const { getByTitle, getByText } = render(<App />);
    fireEvent.click(getByTitle("Settings"));
    expect(getByText("SETTINGS")).toBeInTheDocument();
    expect(getByText("CLEAR ALL DATA")).toBeInTheDocument();
  });

  it("navigates to sighting log", () => {
    const { getByTitle, getByText } = render(<App />);
    fireEvent.click(getByTitle("Sighting log"));
    expect(getByText("SIGHTING LOG")).toBeInTheDocument();
  });

  it("returns to list via popstate from card", () => {
    const { getByText, queryByText } = render(<App />);
    fireEvent.click(getByText("Grizzly Bear"));
    expect(getByText("#0001")).toBeInTheDocument();
    act(() => window.dispatchEvent(new PopStateEvent("popstate", { state: null })));
    expect(queryByText("#0001")).not.toBeInTheDocument();
    expect(getByText("Grizzly Bear")).toBeVisible();
  });

  it("returns to list via popstate from settings", () => {
    const { getByTitle, getByText, queryByText } = render(<App />);
    fireEvent.click(getByTitle("Settings"));
    expect(getByText("SETTINGS")).toBeInTheDocument();
    act(() => window.dispatchEvent(new PopStateEvent("popstate", { state: null })));
    expect(queryByText("SETTINGS")).not.toBeInTheDocument();
  });

  it("pushes history state on navigation", () => {
    const spy = vi.spyOn(history, "pushState");
    const { getByText } = render(<App />);
    fireEvent.click(getByText("Grizzly Bear"));
    expect(spy).toHaveBeenCalledWith({ speciesId: "Grizzly_bear" }, "");
    spy.mockRestore();
  });

  it("restores correct page from popstate state", () => {
    const { getByTitle, getByText } = render(<App />);
    fireEvent.click(getByTitle("Sighting log"));
    fireEvent.click(getByText("BACK"));
    // Simulate browser forward to log
    window.dispatchEvent(new PopStateEvent("popstate", { state: { page: "log" } }));
    expect(getByText("SIGHTING LOG")).toBeInTheDocument();
  });
});
