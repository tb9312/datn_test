function padZero(num) {
  return (num < 10 ? "0" : "") + num;
}
module.exports.formatDateTime = (date) => {
  // Lấy giờ, phút, ngày, tháng, năm từ đối tượng Date
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var day = date.getDate();
  var month = date.getMonth() + 1; // Lưu ý: Tháng bắt đầu từ 0 (0 - January, 1 - February, ...)
  var year = date.getFullYear();

  // Định dạng giờ và phút thành chuỗi "hh:mm"
  var formattedTime = padZero(hours) + ":" + padZero(minutes);

  // Định dạng ngày, tháng, năm thành chuỗi "dd-mm-yyyy"
  var formattedDate = padZero(day) + "-" + padZero(month) + "-" + year;

  // Kết hợp giờ, phút và ngày thành một chuỗi
  var dateTimeString = formattedTime + "  - " + formattedDate;

  return dateTimeString;
};
// Hàm để thêm số 0 vào trước số nếu số đó là một chữ số (vd: 9 -> 09)

module.exports.formatDate = (date) => {
  // Lấy ngày, tháng, năm từ đối tượng Date
  const day = String(date.getDate()).padStart(2, "0"); // Lấy ngày và thêm số 0 nếu cần thiết để có 2 chữ số
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Lấy tháng (đánh số từ 0), cộng thêm 1 và thêm số 0 nếu cần thiết để có 2 chữ số
  const year = date.getFullYear(); // Lấy năm

  // Trả về chuỗi có định dạng "dd-mm-yyyy"
  return `${day}-${month}-${year}`;
};
