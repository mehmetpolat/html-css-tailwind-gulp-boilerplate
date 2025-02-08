// Main JavaScript file
document.addEventListener("DOMContentLoaded", function () {
  console.log("Document ready!");

  // Initialize dropdowns
  const initDropdowns = () => {
    const dropdowns = document.querySelectorAll("[data-dropdown]");
    dropdowns.forEach((dropdown) => {
      new Dropdown(dropdown);
    });
  };

  initDropdowns();
});
