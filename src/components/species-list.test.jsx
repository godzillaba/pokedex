import { render, fireEvent } from "@testing-library/preact";
import { SpeciesList } from "./species-list.jsx";

const SPECIES = [
  {
    id: 1, name: "Grizzly Bear", type: "Mammal",
    conservation_status: "Least Concern",
  },
  {
    id: 2, name: "Bald Eagle", type: "Bird",
    conservation_status: "Least Concern",
  },
  {
    id: 42, name: "Timber Rattlesnake", type: "Reptile",
    conservation_status: "Vulnerable",
  },
];

const STATUS_CODES = {
  "Least Concern": "LC",
  "Vulnerable": "VU",
};

function renderList(overrides = {}) {
  const props = {
    species: SPECIES,
    types: ["Bird", "Mammal", "Reptile"],
    statuses: ["LC", "VU"],
    statusCodes: STATUS_CODES,
    search: "",
    onSearch: vi.fn(),
    typeFilter: "",
    onTypeFilter: vi.fn(),
    statusFilter: "",
    onStatusFilter: vi.fn(),
    seenFilter: "",
    onSeenFilter: vi.fn(),
    onSelect: vi.fn(),
    onSettings: vi.fn(),
    onLog: vi.fn(),
    log: {},
    ...overrides,
  };
  return { ...render(<SpeciesList {...props} />), props };
}

describe("SpeciesList", () => {
  describe("entries", () => {
    it("renders all species", () => {
      const { getByText } = renderList();
      expect(getByText("Grizzly Bear")).toBeInTheDocument();
      expect(getByText("Bald Eagle")).toBeInTheDocument();
      expect(getByText("Timber Rattlesnake")).toBeInTheDocument();
    });

    it("shows empty state when no species", () => {
      const { getByText } = renderList({ species: [] });
      expect(getByText("NO SPECIES FOUND")).toBeInTheDocument();
    });

    it("pads IDs to 3 digits", () => {
      const { getByText } = renderList();
      expect(getByText("001")).toBeInTheDocument();
      expect(getByText("042")).toBeInTheDocument();
    });
  });

  describe("indicators", () => {
    it("shows * for seen species", () => {
      const { container } = renderList({ log: { 1: { seen: true } } });
      expect(container.querySelector(".slist__seen")).toBeInTheDocument();
    });

    it("shows + for species with notes", () => {
      const { container } = renderList({ log: { 1: { note: "hello" } } });
      expect(container.querySelector(".slist__has-note")).toBeInTheDocument();
    });

    it("does not show indicators for unseen species without notes", () => {
      const { container } = renderList();
      expect(container.querySelector(".slist__seen")).not.toBeInTheDocument();
      expect(container.querySelector(".slist__has-note")).not.toBeInTheDocument();
    });
  });

  describe("search", () => {
    it("calls onSearch on input", () => {
      const { container, props } = renderList();
      fireEvent.input(container.querySelector(".slist__search"), { target: { value: "bear" } });
      expect(props.onSearch).toHaveBeenCalledWith("bear");
    });
  });

  describe("filters", () => {
    it("calls onTypeFilter when type button clicked", () => {
      const { getByText, props } = renderList();
      fireEvent.click(getByText("BIRD"));
      expect(props.onTypeFilter).toHaveBeenCalledWith("Bird");
    });

    it("toggles type filter off when clicking active type", () => {
      const { getByText, props } = renderList({ typeFilter: "Bird" });
      fireEvent.click(getByText("BIRD"));
      expect(props.onTypeFilter).toHaveBeenCalledWith("");
    });

    it("highlights active type filter", () => {
      const { getByText } = renderList({ typeFilter: "Bird" });
      expect(getByText("BIRD").className).toContain("slist__filter--active");
    });

    it("calls onSeenFilter when SEEN clicked", () => {
      const { getAllByText, props } = renderList();
      const seenButtons = getAllByText("SEEN");
      fireEvent.click(seenButtons[0]);
      expect(props.onSeenFilter).toHaveBeenCalledWith("seen");
    });

    it("calls onStatusFilter when status button clicked", () => {
      const { container, props } = renderList();
      const vuBtn = container.querySelector(".slist__filter--vu");
      fireEvent.click(vuBtn);
      expect(props.onStatusFilter).toHaveBeenCalledWith("VU");
    });
  });

  describe("buttons", () => {
    it("? button calls onSelect with a random species", () => {
      const { getByTitle, props } = renderList();
      fireEvent.click(getByTitle("Random species"));
      expect(props.onSelect).toHaveBeenCalled();
    });

    it("# button calls onLog", () => {
      const { getByTitle, props } = renderList();
      fireEvent.click(getByTitle("Sighting log"));
      expect(props.onLog).toHaveBeenCalled();
    });

    it("* button calls onSettings", () => {
      const { getByTitle, props } = renderList();
      fireEvent.click(getByTitle("Settings"));
      expect(props.onSettings).toHaveBeenCalled();
    });
  });
});
