import { render, fireEvent } from "@testing-library/preact";
import { Settings } from "./settings.jsx";

describe("Settings", () => {
  const onBack = vi.fn();
  const onClearData = vi.fn();
  const onRestore = vi.fn();
  const log = { Bald_eagle: { seen: true, note: "majestic", date: "2025-01-01" } };

  beforeEach(() => { onBack.mockClear(); onClearData.mockClear(); onRestore.mockClear(); });

  const renderSettings = () =>
    render(<Settings onBack={onBack} onClearData={onClearData} log={log} onRestore={onRestore} />);

  it("shows clear button initially without confirmation", () => {
    const { getByText, queryByText } = renderSettings();
    expect(getByText("CLEAR ALL DATA")).toBeInTheDocument();
    expect(queryByText("YES, DELETE")).not.toBeInTheDocument();
  });

  it("shows confirmation dialog after clicking clear", () => {
    const { getByText } = renderSettings();
    fireEvent.click(getByText("CLEAR ALL DATA"));
    expect(getByText("Delete all seen/notes data?")).toBeInTheDocument();
    expect(getByText("YES, DELETE")).toBeInTheDocument();
    expect(getByText("CANCEL")).toBeInTheDocument();
  });

  it("calls onClearData and hides dialog when YES clicked", () => {
    const { getByText, queryByText } = renderSettings();
    fireEvent.click(getByText("CLEAR ALL DATA"));
    fireEvent.click(getByText("YES, DELETE"));
    expect(onClearData).toHaveBeenCalledOnce();
    expect(queryByText("YES, DELETE")).not.toBeInTheDocument();
  });

  it("hides dialog without clearing when CANCEL clicked", () => {
    const { getByText, queryByText } = renderSettings();
    fireEvent.click(getByText("CLEAR ALL DATA"));
    fireEvent.click(getByText("CANCEL"));
    expect(onClearData).not.toHaveBeenCalled();
    expect(queryByText("YES, DELETE")).not.toBeInTheDocument();
    expect(getByText("CLEAR ALL DATA")).toBeInTheDocument();
  });

  it("calls onBack when BACK is clicked", () => {
    const { getByText } = renderSettings();
    fireEvent.click(getByText("< BACK"));
    expect(onBack).toHaveBeenCalled();
  });

  it("shows export and restore buttons", () => {
    const { getByText } = renderSettings();
    expect(getByText("EXPORT DATA")).toBeInTheDocument();
    expect(getByText("RESTORE FROM FILE")).toBeInTheDocument();
  });

  it("triggers file download on export", () => {
    const clickSpy = vi.fn();
    const createObjectURL = vi.fn(() => "blob:mock");
    const revokeObjectURL = vi.fn();
    globalThis.URL.createObjectURL = createObjectURL;
    globalThis.URL.revokeObjectURL = revokeObjectURL;
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "a") return { set href(v) {}, set download(v) {}, click: clickSpy };
      return document.__proto__.createElement.call(document, tag);
    });

    const { getByText } = renderSettings();
    fireEvent.click(getByText("EXPORT DATA"));
    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");

    vi.restoreAllMocks();
  });

  it("calls onRestore with parsed JSON when file is selected", async () => {
    const { container } = renderSettings();
    const input = container.querySelector("input[type=file]");
    const imported = { Wolf: { seen: true, note: "", date: "" } };
    const file = new File([JSON.stringify(imported)], "backup.json", { type: "application/json" });

    fireEvent.change(input, { target: { files: [file] } });
    await vi.waitFor(() => expect(onRestore).toHaveBeenCalledWith(imported));
  });

  it("shows error message for invalid JSON file", async () => {
    const { container, getByText } = renderSettings();
    const input = container.querySelector("input[type=file]");
    const file = new File(["not json"], "bad.json", { type: "application/json" });

    fireEvent.change(input, { target: { files: [file] } });
    await vi.waitFor(() => expect(getByText("Invalid file.")).toBeInTheDocument());
  });
});
