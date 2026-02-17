import { render, fireEvent } from "@testing-library/preact";
import { Settings } from "./settings.jsx";

describe("Settings", () => {
  const onBack = vi.fn();
  const onClearData = vi.fn();

  beforeEach(() => { onBack.mockClear(); onClearData.mockClear(); });

  it("shows clear button initially without confirmation", () => {
    const { getByText, queryByText } = render(<Settings onBack={onBack} onClearData={onClearData} />);
    expect(getByText("CLEAR ALL DATA")).toBeInTheDocument();
    expect(queryByText("YES, DELETE")).not.toBeInTheDocument();
  });

  it("shows confirmation dialog after clicking clear", () => {
    const { getByText } = render(<Settings onBack={onBack} onClearData={onClearData} />);
    fireEvent.click(getByText("CLEAR ALL DATA"));
    expect(getByText("Delete all seen/notes data?")).toBeInTheDocument();
    expect(getByText("YES, DELETE")).toBeInTheDocument();
    expect(getByText("CANCEL")).toBeInTheDocument();
  });

  it("calls onClearData and hides dialog when YES clicked", () => {
    const { getByText, queryByText } = render(<Settings onBack={onBack} onClearData={onClearData} />);
    fireEvent.click(getByText("CLEAR ALL DATA"));
    fireEvent.click(getByText("YES, DELETE"));
    expect(onClearData).toHaveBeenCalledOnce();
    expect(queryByText("YES, DELETE")).not.toBeInTheDocument();
  });

  it("hides dialog without clearing when CANCEL clicked", () => {
    const { getByText, queryByText } = render(<Settings onBack={onBack} onClearData={onClearData} />);
    fireEvent.click(getByText("CLEAR ALL DATA"));
    fireEvent.click(getByText("CANCEL"));
    expect(onClearData).not.toHaveBeenCalled();
    expect(queryByText("YES, DELETE")).not.toBeInTheDocument();
    expect(getByText("CLEAR ALL DATA")).toBeInTheDocument();
  });

  it("calls onBack when BACK is clicked", () => {
    const { getByText } = render(<Settings onBack={onBack} onClearData={onClearData} />);
    fireEvent.click(getByText("< BACK"));
    expect(onBack).toHaveBeenCalled();
  });
});
