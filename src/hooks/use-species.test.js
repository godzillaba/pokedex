import { renderHook, act } from "@testing-library/preact";
import { useSpecies } from "./use-species.js";

vi.mock("../data/species.json", () => ({
  default: [
    {
      id: 1, name: "Grizzly Bear", species: "Ursus arctos", type: "Mammal",
      region: "Northwest", habitat: "Forest", conservation_status: "Least Concern",
      stats: { size: 90, speed: 60, rarity: 40, danger: 85 },
      image: "images/animals/001.png",
    },
    {
      id: 2, name: "Bald Eagle", species: "Haliaeetus leucocephalus", type: "Bird",
      region: "Nationwide", habitat: "Wetlands", conservation_status: "Least Concern",
      stats: { size: 50, speed: 80, rarity: 30, danger: 20 },
      image: "images/animals/002.png",
    },
    {
      id: 3, name: "Timber Rattlesnake", species: "Crotalus horridus", type: "Reptile",
      region: "Eastern", habitat: "Forest", conservation_status: "Vulnerable",
      stats: { size: 30, speed: 40, rarity: 60, danger: 90 },
      image: "images/animals/003.png",
    },
  ],
}));

describe("useSpecies", () => {
  const emptyLog = {};

  describe("search", () => {
    it("filters by name case-insensitively", () => {
      const { result } = renderHook(() => useSpecies(emptyLog));
      act(() => result.current.setSearch("grizzly"));
      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].name).toBe("Grizzly Bear");
    });

    it("returns empty when no match", () => {
      const { result } = renderHook(() => useSpecies(emptyLog));
      act(() => result.current.setSearch("unicorn"));
      expect(result.current.filtered).toHaveLength(0);
    });

    it("returns all when cleared", () => {
      const { result } = renderHook(() => useSpecies(emptyLog));
      act(() => result.current.setSearch("eagle"));
      expect(result.current.filtered).toHaveLength(1);
      act(() => result.current.setSearch(""));
      expect(result.current.filtered).toHaveLength(3);
    });
  });

  describe("type filter", () => {
    it("filters to matching type", () => {
      const { result } = renderHook(() => useSpecies(emptyLog));
      act(() => result.current.setTypeFilter("Bird"));
      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].name).toBe("Bald Eagle");
    });

    it("shows all when empty string", () => {
      const { result } = renderHook(() => useSpecies(emptyLog));
      act(() => result.current.setTypeFilter("Bird"));
      act(() => result.current.setTypeFilter(""));
      expect(result.current.filtered).toHaveLength(3);
    });
  });

  describe("status filter", () => {
    it("filters by IUCN code", () => {
      const { result } = renderHook(() => useSpecies(emptyLog));
      act(() => result.current.setStatusFilter("VU"));
      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].name).toBe("Timber Rattlesnake");
    });
  });

  describe("seen filter", () => {
    it("filters to seen species", () => {
      const log = { 1: { seen: true } };
      const { result } = renderHook(() => useSpecies(log));
      act(() => result.current.setSeenFilter("seen"));
      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0].id).toBe(1);
    });

    it("filters to unseen species", () => {
      const log = { 1: { seen: true } };
      const { result } = renderHook(() => useSpecies(log));
      act(() => result.current.setSeenFilter("unseen"));
      expect(result.current.filtered).toHaveLength(2);
    });
  });

  describe("combined filters", () => {
    it("applies search + type together (AND logic)", () => {
      const { result } = renderHook(() => useSpecies(emptyLog));
      act(() => {
        result.current.setSearch("bear");
        result.current.setTypeFilter("Bird");
      });
      expect(result.current.filtered).toHaveLength(0);
    });
  });

  describe("computed arrays", () => {
    it("returns sorted unique types", () => {
      const { result } = renderHook(() => useSpecies(emptyLog));
      expect(result.current.types).toEqual(["Bird", "Mammal", "Reptile"]);
    });

    it("returns statuses in IUCN order", () => {
      const { result } = renderHook(() => useSpecies(emptyLog));
      expect(result.current.statuses).toEqual(["LC", "VU"]);
    });
  });
});
