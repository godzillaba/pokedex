import { renderHook, act } from "@testing-library/preact";
import { useLog } from "./use-log.js";

beforeEach(() => localStorage.clear());

describe("useLog", () => {
  it("starts with empty log", () => {
    const { result } = renderHook(() => useLog());
    expect(result.current.log).toEqual({});
  });

  it("loads existing data from localStorage", () => {
    localStorage.setItem("wilddex-log", JSON.stringify({ Grizzly_bear: { seen: true, note: "hi", date: "2025-01-01" } }));
    const { result } = renderHook(() => useLog());
    expect(result.current.log.Grizzly_bear).toEqual({ seen: true, note: "hi", date: "2025-01-01" });
  });

  it("handles corrupt JSON gracefully", () => {
    localStorage.setItem("wilddex-log", "not json{{{");
    const { result } = renderHook(() => useLog());
    expect(result.current.log).toEqual({});
  });

  describe("toggleSeen", () => {
    it("marks a species as seen with today's date", () => {
      vi.useFakeTimers({ now: new Date("2025-07-04") });
      const { result } = renderHook(() => useLog());
      act(() => result.current.toggleSeen("Bald_eagle"));
      expect(result.current.log.Bald_eagle).toEqual({ seen: true, note: "", date: "2025-07-04" });
      vi.useRealTimers();
    });

    it("preserves existing date when toggling unseen", () => {
      localStorage.setItem("wilddex-log", JSON.stringify({ Bald_eagle: { seen: true, note: "", date: "2025-01-01" } }));
      const { result } = renderHook(() => useLog());
      act(() => result.current.toggleSeen("Bald_eagle"));
      expect(result.current.log.Bald_eagle.seen).toBe(false);
      expect(result.current.log.Bald_eagle.date).toBe("2025-01-01");
    });

    it("preserves existing date when re-marking seen", () => {
      localStorage.setItem("wilddex-log", JSON.stringify({ Bald_eagle: { seen: false, note: "", date: "2025-01-01" } }));
      const { result } = renderHook(() => useLog());
      act(() => result.current.toggleSeen("Bald_eagle"));
      expect(result.current.log.Bald_eagle.seen).toBe(true);
      expect(result.current.log.Bald_eagle.date).toBe("2025-01-01");
    });
  });

  describe("setNote", () => {
    it("creates entry if missing", () => {
      const { result } = renderHook(() => useLog());
      act(() => result.current.setNote("Timber_rattlesnake", "spotted near river"));
      expect(result.current.log.Timber_rattlesnake).toEqual({ seen: false, note: "spotted near river", date: "" });
    });

    it("updates note without clobbering other fields", () => {
      localStorage.setItem("wilddex-log", JSON.stringify({ Timber_rattlesnake: { seen: true, note: "old", date: "2025-03-15" } }));
      const { result } = renderHook(() => useLog());
      act(() => result.current.setNote("Timber_rattlesnake", "new note"));
      expect(result.current.log.Timber_rattlesnake).toEqual({ seen: true, note: "new note", date: "2025-03-15" });
    });
  });

  describe("setDate", () => {
    it("sets a custom date and persists to localStorage", () => {
      const { result } = renderHook(() => useLog());
      act(() => result.current.setDate("Bald_eagle", "2025-12-25"));
      expect(result.current.log.Bald_eagle.date).toBe("2025-12-25");
      expect(JSON.parse(localStorage.getItem("wilddex-log")).Bald_eagle.date).toBe("2025-12-25");
    });
  });

  describe("clearLog", () => {
    it("removes all entries from state and localStorage", () => {
      localStorage.setItem("wilddex-log", JSON.stringify({ Grizzly_bear: { seen: true, note: "", date: "" } }));
      const { result } = renderHook(() => useLog());
      expect(Object.keys(result.current.log).length).toBe(1);
      act(() => result.current.clearLog());
      expect(result.current.log).toEqual({});
      expect(localStorage.getItem("wilddex-log")).toBeNull();
    });

  });
});
