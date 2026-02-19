import { render, fireEvent } from "@testing-library/preact";
import { SpeciesCard } from "./species-card.jsx";

const BASE_SPECIES = {
  id: "Grizzly_bear", number: 7, name: "Grizzly Bear", species: "Ursus arctos", type: "Mammal",
  region: "Northwest", habitat: "Forest", conservation_status: "Least Concern",
  stats: { size: 90, speed: 60, rarity: 40, danger: 85 },
  image: "images/animals/Grizzly_bear.png",
  original_image: "https://upload.wikimedia.org/007.jpg",
  fallback_image: "images/originals/Grizzly_bear.webp",
  wiki_url: "https://en.wikipedia.org/wiki/Grizzly_bear",
};

const UNSEEN_ENTRY = { seen: false, note: "", date: "" };
const SEEN_ENTRY = { seen: true, note: "Big one!", date: "2025-07-04" };

function renderCard(speciesOverrides = {}, entry = UNSEEN_ENTRY, callbacks = {}) {
  const props = {
    species: { ...BASE_SPECIES, ...speciesOverrides },
    entry,
    onToggleSeen: vi.fn(),
    onSetNote: vi.fn(),
    onSetDate: vi.fn(),
    onBack: vi.fn(),
    ...callbacks,
  };
  return { ...render(<SpeciesCard {...props} />), props };
}

describe("SpeciesCard", () => {
  describe("image cascade", () => {
    it("defaults to sprite image", () => {
      const { container } = renderCard();
      const img = container.querySelector("img");
      expect(img.getAttribute("src")).toBe("/images/animals/Grizzly_bear.png");
    });

    it("toggles to original image on click", () => {
      const { container } = renderCard();
      fireEvent.click(container.querySelector(".scard__image-frame"));
      const img = container.querySelector("img");
      expect(img.getAttribute("src")).toBe("https://upload.wikimedia.org/007.jpg");
    });

    it("falls back to fallback_image when original errors", () => {
      const { container } = renderCard();
      fireEvent.click(container.querySelector(".scard__image-frame"));
      fireEvent.error(container.querySelector("img"));
      expect(container.querySelector("img").getAttribute("src")).toBe("/images/originals/Grizzly_bear.webp");
    });

    it("falls back to sprite when fallback also errors", () => {
      const { container } = renderCard();
      fireEvent.click(container.querySelector(".scard__image-frame"));
      fireEvent.error(container.querySelector("img")); // original → fallback
      fireEvent.error(container.querySelector("img")); // fallback → sprite
      expect(container.querySelector("img").getAttribute("src")).toBe("/images/animals/Grizzly_bear.png");
    });

    it("shows placeholder when sprite errors", () => {
      const { container } = renderCard();
      fireEvent.error(container.querySelector("img")); // sprite error
      expect(container.querySelector(".scard__placeholder")).toBeInTheDocument();
      expect(container.querySelector(".scard__placeholder").textContent).toBe("?");
    });

    it("does not toggle for species without original_image", () => {
      const { container } = renderCard({ original_image: undefined, fallback_image: undefined });
      const imgBefore = container.querySelector("img").getAttribute("src");
      fireEvent.click(container.querySelector(".scard__image-frame"));
      expect(container.querySelector("img").getAttribute("src")).toBe(imgBefore);
    });
  });

  describe("seen state", () => {
    it("shows 'MARK SEEN' when unseen", () => {
      const { getByText } = renderCard();
      expect(getByText("MARK SEEN")).toBeInTheDocument();
    });

    it("shows '* SEEN' when seen", () => {
      const { getByText } = renderCard({}, SEEN_ENTRY);
      expect(getByText("* SEEN")).toBeInTheDocument();
    });

    it("shows date input when seen", () => {
      const { container } = renderCard({}, SEEN_ENTRY);
      expect(container.querySelector("input[type='date']")).toBeInTheDocument();
    });

    it("hides date input when unseen", () => {
      const { container } = renderCard();
      expect(container.querySelector("input[type='date']")).not.toBeInTheDocument();
    });
  });

  describe("callbacks", () => {
    it("calls onToggleSeen", () => {
      const { getByText, props } = renderCard();
      fireEvent.click(getByText("MARK SEEN"));
      expect(props.onToggleSeen).toHaveBeenCalled();
    });

    it("calls onSetNote on textarea input", () => {
      const { container, props } = renderCard();
      fireEvent.input(container.querySelector("textarea"), { target: { value: "spotted!" } });
      expect(props.onSetNote).toHaveBeenCalledWith("spotted!");
    });

    it("calls onBack", () => {
      const { getByText, props } = renderCard();
      fireEvent.click(getByText("BACK"));
      expect(props.onBack).toHaveBeenCalled();
    });
  });

  describe("info rendering", () => {
    it("shows conservation status when present", () => {
      const { getByText } = renderCard();
      expect(getByText("Least Concern")).toBeInTheDocument();
    });

    it("hides conservation status when absent", () => {
      const { queryByText } = renderCard({ conservation_status: undefined });
      expect(queryByText("STATUS")).not.toBeInTheDocument();
    });

    it("renders stat bars with correct values", () => {
      const { getByText } = renderCard();
      expect(getByText("90")).toBeInTheDocument();  // size
      expect(getByText("60")).toBeInTheDocument();  // speed
    });

    it("pads number to 4 digits", () => {
      const { getByText } = renderCard();
      expect(getByText("#0007")).toBeInTheDocument();
    });
  });
});
