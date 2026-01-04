module.exports.item = (query) => {
  let filterStatus = [
    {
      name: "Tất cả",
      status: "",
      class: "",
    },
    {
      name: "Hoạt động",
      status: "active",
      class: "",
    },
    {
      name: "Ngưng hoạt động",
      status: "inactive",
      class: "",
    },
  ];
  if (query.status) {
    const index = filterStatus.findIndex((item) => item.status == query.status);
    filterStatus[index].class = "active";
  } else {
    const index = filterStatus.findIndex((item) => item.status == "");
    filterStatus[index].class = "active";
  }
  return filterStatus;
};
module.exports.order = (query) => {
  let filterStatusOrder = [
    {
      name: "Tất cả",
      status: "",
      class: "",
    },
    {
      name: "Đang chuẩn bị",
      status: "initial",
      class: "",
    },
    {
      name: "Đang xử lý",
      status: "handle",
      class: "",
    },
    {
      name: "Hoàn thành",
      status: "complete",
      class: "",
    },
    {
      name: "Từ chối",
      status: "refuse",
      class: "",
    },
  ];
  if (query.status) {
    const index = filterStatusOrder.findIndex(
      (item) => item.status == query.status
    );
    filterStatusOrder[index].class = "active";
  } else {
    const index = filterStatusOrder.findIndex((item) => item.status == "");
    filterStatusOrder[index].class = "active";
  }
  return filterStatusOrder;
};
