let url = new URL(window.location.href);
const paginationButtons = document.querySelectorAll("[page-number]");
if (paginationButtons.length > 0) {
  paginationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const page = button.getAttribute("page-number");
      url.searchParams.set("page", page);
      window.location.href = url.href;
    });
  });
}
