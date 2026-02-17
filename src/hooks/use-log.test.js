import { renderHook, act } from "@testing-library/preact";
import { useLog } from "./use-log.js";

beforeEach(() => localStorage.clear());

describe("useLog", () => {
  it("starts with empty log", () => {
    const { result } = renderHook(() => useLog());
    expect(result.current.log).toEqual({});
  });

  it("loads existing data from localStorage", () => {
    localStorage.setItem("wilddex-log", JSON.stringify({ 1: { seen: true, note: "hi", date: "2025-01-01" } }));
    const { result } = renderHook(() => useLog());
    expect(result.current.log[1]).toEqual({ seen: true, note: "hi", date: "2025-01-01" });
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
      act(() => result.current.toggleSeen(5));
      expect(result.current.log[5]).toEqual({ seen: true, note: "", date: "2025-07-04" });
      vi.useRealTimers();
    });

    it("preserves existing date when toggling unseen", () => {
      localStorage.setItem("wilddex-log", JSON.stringify({ 5: { seen: true, note: "", date: "2025-01-01" } }));
      const { result } = renderHook(() => useLog());
      act(() => result.current.toggleSeen(5));
      expect(result.current.log[5].seen).toBe(false);
      expect(result.current.log[5].date).toBe("2025-01-01");
    });

    it("preserves existing date when re-marking seen", () => {
      localStorage.setItem("wilddex-log", JSON.stringify({ 5: { seen: false, note: "", date: "2025-01-01" } }));
      const { result } = renderHook(() => useLog());
      act(() => result.current.toggleSeen(5));
      expect(result.current.log[5].seen).toBe(true);
      expect(result.current.log[5].date).toBe("2025-01-01");
    });
  });

  describe("setNote", () => {
    it("creates entry if missing", () => {
      const { result } = renderHook(() => useLog());
      act(() => result.current.setNote(10, "spotted near river"));
      expect(result.current.log[10]).toEqual({ seen: false, note: "spotted near river", date: "" });
    });

    it("updates note without clobbering other fields", () => {
      localStorage.setItem("wilddex-log", JSON.stringify({ 10: { seen: true, note: "old", date: "2025-03-15" } }));
      const { result } = renderHook(() => useLog());
      act(() => result.current.setNote(10, "new note"));
      expect(result.current.log[10]).toEqual({ seen: true, note: "new note", date: "2025-03-15" });
    });
  });

  describe("setDate", () => {
    it("sets a custom date and persists to localStorage", () => {
      const { result } = renderHook(() => useLog());
      act(() => result.current.setDate(3, "2025-12-25"));
      expect(result.current.log[3].date).toBe("2025-12-25");
      expect(JSON.parse(localStorage.getItem("wilddex-log"))[3].date).toBe("2025-12-25");
    });
  });

  describe("clearLog", () => {
    it("removes all entries from state and localStorage", () => {
      localStorage.setItem("wilddex-log", JSON.stringify({ 1: { seen: true, note: "", date: "" } }));
      const { result } = renderHook(() => useLog());
      expect(Object.keys(result.current.log).length).toBe(1);
      act(() => result.current.clearLog());
      expect(result.current.log).toEqual({});
      expect(localStorage.getItem("wilddex-log")).toBeNull();
    });
  });
});
