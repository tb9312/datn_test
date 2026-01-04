// console.log("social");

// Chức năng gửi yêu cầu
const listBtnAddFriend = document.querySelectorAll("[btn-add-friend]");
if (listBtnAddFriend.length > 0) {
  listBtnAddFriend.forEach((button) => {
    button.addEventListener("click", () => {
      //   console.log(button.closest(".box-user"));
      button.closest(".box-user").classList.add("add");
      const userId = button.getAttribute("btn-add-friend");
      //   console.log(userId);
      socket.emit("CLIENT_ADD_FRIEND", userId);
    });
  });
}
// End Gửi yêu cầu

// Chức năng hủy yêu cầu
const listBtnCancelFriend = document.querySelectorAll("[btn-cancel-friend]");
if (listBtnCancelFriend.length > 0) {
  listBtnCancelFriend.forEach((button) => {
    button.addEventListener("click", () => {
      //   console.log(button.closest(".box-user"));
      button.closest(".box-user").classList.remove("add");
      const userId = button.getAttribute("btn-cancel-friend");
      //   console.log(userId);
      socket.emit("CLIENT_CANCEL_FRIEND", userId);
    });
  });
}
// End hủy yêu cầu

// Chức năng từ chối yêu cầu
const listBtnRefuseFriend = document.querySelectorAll("[btn-refuse-friend]");
if (listBtnRefuseFriend.length > 0) {
  listBtnRefuseFriend.forEach((button) => {
    button.addEventListener("click", () => {
      //   console.log(button.closest(".box-user"));
      button.closest(".box-user").classList.add("refuse");
      const userId = button.getAttribute("btn-refuse-friend");
      //   console.log(userId);
      socket.emit("CLIENT_REFUSE_FRIEND", userId);
    });
  });
}
// End từ chối yêu cầu

// Chức năng chấp nhận yêu cầu
const acceptFriend = (button) => {
  button.addEventListener("click", () => {
    //   console.log(button.closest(".box-user"));
    button.closest(".box-user").classList.add("accepted");
    const userId = button.getAttribute("btn-accept-friend");
    //   console.log(userId);
    socket.emit("CLIENT_ACCEPT_FRIEND", userId);
  });
};
const listBtnAcceptFriend = document.querySelectorAll("[btn-accept-friend]");
if (listBtnAcceptFriend.length > 0) {
  listBtnAcceptFriend.forEach((button) => {
    acceptFriend(button);
  });
}
// End chấp nhận yêu cầu

// SEVER_RETURN_LENGTH_ACCEPT_FRIEND;
const badgeUsersAccept = document.querySelector("[badge-users-accept]");
if (badgeUsersAccept) {
  const userId = badgeUsersAccept.getAttribute("badge-users-accept");
  socket.on("SEVER_RETURN_LENGTH_ACCEPT_FRIEND", (data) => {
    // console.log(data);
    if (userId === data.userId) {
      badgeUsersAccept.innerHTML = data.lengthAcceptFriends;
    }
  });
}
// End SEVER_RETURN_LENGTH_ACCEPT_FRIEND;

// SEVER_RETURN_INFO_ACCEPT_FRIEND;
socket.on("SEVER_RETURN_INFO_ACCEPT_FRIEND", (data) => {
  //Trang loi moi da nhan
  const dataUsersAccept = document.querySelector("[data-users-accept]");
  if (dataUsersAccept) {
    const userId = dataUsersAccept.getAttribute("data-users-accept");
    if (userId === data.userId) {
      //Vẽ user ra giao diện
      const div = document.createElement("div");
      div.classList.add("col-6");
      div.setAttribute("user-id", data.infoUserA._id);
      div.innerHTML = `
        <div class="box-user">
          <div class="inner-avatar">
            <img
              id="userAvatar"
              alt="${data.infoUserA.fullName}"
            >
          </div>
          <div class="inner-info">
            <div class="inner-name"> ${data.infoUserA.fullName}</div>
            <div class="inner-buttons">
              <button
                class="btn btn-sm btn-primary mr-1"
                btn-accept-friend="${data.infoUserA._id}"
              > Chấp nhận</button>
              <button
                class="btn btn-sm btn-secondary mr-1"
                btn-refuse-friend="${data.infoUserA._id}"
              > Xóa</button>
              <button
                class="btn btn-sm btn-secondary mr-1"
                btn-deleted-friend=""
                disabled=""
              > Đã xóa </button>
              <button
                class="btn btn-sm btn-primary mr-1"
                btn-accepted-friend=""
                disabled=""
              > Đã chấp nhận</button>
            </div>
          </div>        
        </div>  
      `;
      dataUsersAccept.appendChild(div);
      // Gán ảnh và alt vào thẻ <img>
      const img = document.getElementById("userAvatar");
      img.alt = data.infoUserA.fullName;
      img.src = data.infoUserA.avatar
        ? data.infoUserA.avatar
        : "https://res.cloudinary.com/dyppifz1z/image/upload/v1747908416/bbt0u0sge20rhgmlmwvv.png";
      //Bắt sự kiện
      //Hủy lời mời
      const buttonRefuse = div.querySelector("[btn-refuse-friend]");
      buttonRefuse.addEventListener("click", () => {
        //   console.log(button.closest(".box-user"));
        buttonRefuse.closest(".box-user").classList.add("refuse");
        const userId = buttonRefuse.getAttribute("btn-refuse-friend");
        //   console.log(userId);
        socket.emit("CLIENT_REFUSE_FRIEND", userId);
      });
      //End Hủy lời mời

      //Chap nhan loi moi
      const buttonAccept = div.querySelector("[btn-accept-friend]");
      acceptFriend(buttonAccept);
      //End Chap nhan loi moi
    }
  }
  //Trang danh sach nguoi dung
  const dataUsersNotFriend = document.querySelector("[data-users-not-friend]");
  if (dataUsersNotFriend) {
    const userId = dataUsersNotFriend.getAttribute("data-users-not-friend");
    if (userId === data.userId) {
      const boxUserRemove = dataUsersNotFriend.querySelector(
        `[user-id='${data.infoUserA._id}']`
      );
      if (boxUserRemove) {
        dataUsersNotFriend.removeChild(boxUserRemove);
      }
    }
  }
});

// END SEVER_RETURN_INFO_ACCEPT_FRIEND

// SEVER_RETURN_USER_ID_CANCEL_FRIEND;
socket.on("SEVER_RETURN_USER_ID_CANCEL_FRIEND", (data) => {
  const boxUserRemove = document.querySelector(`[user-id='${data.userIdA}']`);
  if (boxUserRemove) {
    const dataUsersAccept = document.querySelector("[data-users-accept]");
    const userIdB = badgeUsersAccept.getAttribute("badge-users-accept");
    if (userIdB === data.userIdB) {
      dataUsersAccept.removeChild(boxUserRemove);
    }
  }
});

// END SEVER_RETURN_USER_ID_CANCEL_FRIEND

//SERVER_RETURN_USER_ONLINE
socket.on("SERVER_RETURN_USER_ONLINE", (userId) => {
  console.log(userId);
});
// END SERVER_RETURN_USER_ONLINE;
