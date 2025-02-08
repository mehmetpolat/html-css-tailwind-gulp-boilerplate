class Dropdown {
  constructor(element) {
    this.dropdown = element;
    this.button = element.querySelector("[data-dropdown-toggle]");
    this.menu = element.querySelector("[data-dropdown-menu]");
    this.isOpen = false;

    this.init();
  }

  init() {
    console.log("init");
    this.button.addEventListener("click", () => this.toggle());

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.dropdown.contains(e.target) && this.isOpen) {
        this.close();
      }
    });
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    this.menu.classList.remove("hidden");
    this.button.setAttribute("aria-expanded", "true ");
  }

  close() {
    this.isOpen = false;
    this.menu.classList.add("hidden");
    this.button.setAttribute("aria-expanded", "false");
  }
}
