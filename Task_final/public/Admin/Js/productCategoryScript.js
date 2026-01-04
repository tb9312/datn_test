// Change Status
const buttonsChangeStatus = document.querySelectorAll("[button-change-status]");
if (buttonsChangeStatus.length > 0) {
  const formChangeStatus = document.querySelector("#form-change-status");
  const path = formChangeStatus.getAttribute("data-path");
  //   console.log(path);
  //   console.log(buttonsChangeStatus);
  buttonsChangeStatus.forEach((button) => {
    button.addEventListener("click", () => {
      const statusCurrent = button.getAttribute("data-status");
      const id = button.getAttribute("data-id");
      let statusChange = statusCurrent == "active" ? "inactive" : "active";
      const action = path + `/${statusChange}/${id}?_method=PATCH`;
      //   console.log(action);
      formChangeStatus.action = action;
      formChangeStatus.submit();
    });
  });
}
// End Change Status

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
      const isConfirm = confirm("Ban co chac muon xoa danh mục nay");
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
