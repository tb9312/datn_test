const mongoose = require('mongoose');

module.exports.connect = async () => {
  try {
    // Thêm các tùy chọn để tránh treo máy khi mạng yếu
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 5000, // Chỉ chờ 5 giây, không chờ 10-30s
    });
    console.log('✅ Connect success!!');
  } catch (error) {
    console.log('❌ Connect Error!!!');
    console.error(error); // In lỗi chi tiết ra terminal để debug
  }
};