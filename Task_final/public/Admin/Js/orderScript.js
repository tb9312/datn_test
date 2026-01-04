//Delete Item
const buttonsDelete = document.querySelectorAll("[button-delete]");
if (buttonsDelete.length > 0) {
  const formDeleteItem = document.querySelector("#form-delete-item");
  // console.log(formDeleteItem);
  const path = formDeleteItem.getAttribute("data-path");
  // console.log(path);
  buttonsDelete.forEach((button) => {
    button.addEventListener("click", () => {
      // console.log(button);
      const isConfirm = confirm("Ban co chac muon xoa san pham nay");
      if (isConfirm) {
        const id = button.getAttribute("data-id");
        // console.log(id);
        const action = `${path}/${id}?_method=DELETE`;
        // console.log(action);
        formDeleteItem.action = action;
        formDeleteItem.submit();
      }
    });
  });
}
// End Delede Item
