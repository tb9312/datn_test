//Button Status

const buttonsStatus = document.querySelectorAll("[button-status]");

if (buttonsStatus.length > 0) {
  let url = new URL(window.location.href);
  buttonsStatus.forEach((button) => {
    button.addEventListener("click", () => {
      const status = button.getAttribute("button-status");
      // console.log(status);
      if (status) {
        url.searchParams.set("status", status);
      } else {
        url.searchParams.delete("status");
      }

      window.location.href = url.href;
    });
  });
}
// End Button Status

// Form Search
const formSearch = document.querySelector("#form-search");
if (formSearch) {
  let url = new URL(window.location.href);
  formSearch.addEventListener("submit", (e) => {
    e.preventDefault();
    const keyword = e.target.elements.keyword.value;
    console.log(keyword);
    if (keyword) {
      url.searchParams.set("keyword", keyword);
    } else {
      url.searchParams.delete("keyword");
    }
    window.location.href = url.href;
  });
}
//End Form Search

//Patitation
const buttonPagitation = document.querySelectorAll("[button-pagination]");
// console.log(buttonPagitation);
if (buttonPagitation) {
  let url = new URL(window.location.href);
  buttonPagitation.forEach((button) => {
    // console.log(button);
    button.addEventListener("click", () => {
      const page = button.getAttribute("button-pagination");
      console.log(page);
      url.searchParams.set("page", page);
      window.location.href = url.href;
    });
  });
}
//End Patitation

//Checkbox Multi
const checkboxMulti = document.querySelector("[checkbox-multi]");
if (checkboxMulti) {
  const inputCheckAll = checkboxMulti.querySelector("input[name='checkAll']");
  // console.log(inputCheckAll);
  const inputsId = checkboxMulti.querySelectorAll("input[name='id']");
  // console.log(inputsId);
  inputCheckAll.addEventListener("click", () => {
    console.log(inputCheckAll.checked);
    if (inputCheckAll.checked) {
      // console.log("Check tat ca");
      inputsId.forEach((input) => {
        input.checked = true;
      });
    } else {
      console.log(" Bo Check tat ca");
      inputsId.forEach((input) => {
        input.checked = false;
      });
    }
  });
  inputsId.forEach((input) => {
    input.addEventListener("click", () => {
      const countChecked = checkboxMulti.querySelectorAll(
        "input[name='id']:checked"
      ).length;
      // console.log(countChecked);
      if (countChecked == inputsId.length) {
        inputCheckAll.checked = true;
      } else {
        inputCheckAll.checked = false;
      }
    });
  });
}
//End Checkbox Multi

//Form CheckMulti
const formChangeMulti = document.querySelector("[form-change-multi]");
if (formChangeMulti) {
  // console.log(formChangeMulti);
  formChangeMulti.addEventListener("submit", (e) => {
    e.preventDefault();
    // console.log(e);
    const checkboxMulti = document.querySelector("[checkbox-multi]");
    const inputsChecked = checkboxMulti.querySelectorAll(
      "input[name='id']:checked"
    );
    const typeChange = e.target.elements.type.value;
    // console.log(typeChange);
    if (typeChange == "delete-all") {
      const isComfirm = confirm(" Ban co chac muon xoa tat ca khong");
      if (!isComfirm) {
        return;
      }
    }
    // console.log(inputsChecked);
    if (inputsChecked.length > 0) {
      let ids = [];
      const inputIds = formChangeMulti.querySelector("input[name='ids']");
      inputsChecked.forEach((input) => {
        const id = input.value;
        if (typeChange == "change-position") {
          const position = input
            .closest("tr")
            .querySelector("input[name='position']").value;
          ids.push(`${id}-${position}`);
        } else {
          ids.push(id);
        }
      });
      // console.log(ids.join(","));
      inputIds.value = ids.join(", ");
      formChangeMulti.submit();
    } else {
      alert("vui long chon ít nhât một bản ghi");
    }
  });
}
//End CheckMulti

//Show Alert
const showAlert = document.querySelector("[show-alert]");
if (showAlert) {
  const time = parseInt(showAlert.getAttribute("data-time"));
  const closeAlert = showAlert.querySelector("[close-alert]");
  setTimeout(() => {
    showAlert.classList.add("alert-hidden");
  }, time);
  closeAlert.addEventListener("click", () => {
    showAlert.classList.add("alert-hidden");
  });
}
//End Show Alert
//Upload Image
const uploadImage = document.querySelector("[upload-image]");
if (uploadImage) {
  const uploadImageInput = document.querySelector("[upload-image-input]");
  const uploadImagePreview = document.querySelector("[upload-image-preview]");
  uploadImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    console.log(file);
    if (file) {
      uploadImagePreview.src = URL.createObjectURL(file);
    }
  });
}
//End Upload Image
//Sort
const sort = document.querySelector("[sort]");
// console.log(sort);
if (sort) {
  let url = new URL(window.location.href);
  const sortSelect = sort.querySelector("[sort-select]");
  const sortClear = sort.querySelector("[sort-clear]");
  //sap xep
  sortSelect.addEventListener("change", (e) => {
    // console.log(e.target.value);
    const value = e.target.value;
    const [sortKey, sortValue] = value.split("-");
    url.searchParams.set("sortKey", sortKey);
    url.searchParams.set("sortValue", sortValue);
    window.location.href = url.href;
  });
  //end sap xep

  // Xóa sắp xếp
  sortClear.addEventListener("click", () => {
    url.searchParams.delete("sortKey");
    url.searchParams.delete("sortValue");
    window.location.href = url.href;
  });
  //Thêm select cho option
  const SortKey = url.searchParams.get("sortKey");
  const SortValue = url.searchParams.get("sortValue");
  // console.log(SortKey);
  if (SortKey && SortValue) {
    const stringSort = `${SortKey}-${SortValue}`;
    console.log(stringSort);
    const optionSelected = sortSelect.querySelector(
      `option[value='${stringSort}']`
    );
    // optionSelected.selected = true;
    optionSelected.setAttribute("selected", true);
  }
}
//End Sort
