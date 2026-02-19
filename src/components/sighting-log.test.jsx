import { render, fireEvent } from "@testing-library/preact";
import { SightingLog } from "./sighting-log.jsx";

vi.mock("../data/species.json", () => ({
  default: [
    { id: "Grizzly_bear", name: "Grizzly Bear", type: "Mammal" },
    { id: "Bald_eagle", name: "Bald Eagle", type: "Bird" },
    { id: "Timber_rattlesnake", name: "Timber Rattlesnake", type: "Reptile" },
  ],
}));

describe("SightingLog", () => {
  const onSelect = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => { onSelect.mockClear(); onBack.mockClear(); });

  describe("empty state", () => {
    it("shows empty message for empty log", () => {
      const { getByText } = render(<SightingLog log={{}} onSelect={onSelect} onBack={onBack} />);
      expect(getByText("NO SIGHTINGS YET")).toBeInTheDocument();
    });

    it("shows empty message when no entries are marked seen", () => {
      const log = { Grizzly_bear: { seen: false, note: "", date: "" } };
      const { getByText } = render(<SightingLog log={log} onSelect={onSelect} onBack={onBack} />);
      expect(getByText("NO SIGHTINGS YET")).toBeInTheDocument();
    });

    it("shows count of 0", () => {
      const { getByText } = render(<SightingLog log={{}} onSelect={onSelect} onBack={onBack} />);
      expect(getByText("0")).toBeInTheDocument();
    });
  });

  describe("sorting", () => {
    it("sorts entries in reverse chronological order", () => {
      const log = {
        Grizzly_bear: { seen: true, date: "2025-01-01" },
        Bald_eagle: { seen: true, date: "2025-06-15" },
      };
      const { container } = render(<SightingLog log={log} onSelect={onSelect} onBack={onBack} />);
      const names = container.querySelectorAll(".slog__name");
      expect(names[0].textContent).toBe("Bald Eagle");
      expect(names[1].textContent).toBe("Grizzly Bear");
    });

    it("shows dated entries before undated entries", () => {
      const log = {
        Grizzly_bear: { seen: true, date: "" },
        Bald_eagle: { seen: true, date: "2025-03-01" },
      };
      const { container } = render(<SightingLog log={log} onSelect={onSelect} onBack={onBack} />);
      const names = container.querySelectorAll(".slog__name");
      expect(names[0].textContent).toBe("Bald Eagle");
      expect(names[1].textContent).toBe("Grizzly Bear");
    });

    it("shows '---' for entries without dates", () => {
      const log = { Grizzly_bear: { seen: true, date: "" } };
      const { getByText } = render(<SightingLog log={log} onSelect={onSelect} onBack={onBack} />);
      expect(getByText("---")).toBeInTheDocument();
    });
  });

  describe("rendering", () => {
    it("shows correct count", () => {
      const log = { Grizzly_bear: { seen: true, date: "" }, Bald_eagle: { seen: true, date: "" } };
      const { getByText } = render(<SightingLog log={log} onSelect={onSelect} onBack={onBack} />);
      expect(getByText("2")).toBeInTheDocument();
    });

    it("filters out invalid IDs", () => {
      const log = { No_such_species: { seen: true, date: "" }, Grizzly_bear: { seen: true, date: "" } };
      const { getByText, container } = render(<SightingLog log={log} onSelect={onSelect} onBack={onBack} />);
      expect(container.querySelectorAll(".slog__entry")).toHaveLength(1);
      expect(getByText("1")).toBeInTheDocument();
    });
  });

  describe("interaction", () => {
    it("calls onSelect when entry is clicked", () => {
      const log = { Grizzly_bear: { seen: true, date: "2025-01-01" } };
      const { getByText } = render(<SightingLog log={log} onSelect={onSelect} onBack={onBack} />);
      fireEvent.click(getByText("Grizzly Bear"));
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "Grizzly_bear", name: "Grizzly Bear" }));
    });

    it("calls onBack when BACK is clicked", () => {
      const { getByText } = render(<SightingLog log={{}} onSelect={onSelect} onBack={onBack} />);
      fireEvent.click(getByText("BACK"));
      expect(onBack).toHaveBeenCalled();
    });
  });
});
