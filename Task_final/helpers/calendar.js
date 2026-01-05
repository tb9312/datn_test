module.exports.buildDateFilter = (date) => {
  if (!date) return {};

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return {
    $and: [
      { timeStart: { $lt: endOfDay } },
      { timeFinish: { $gte: startOfDay } },
    ],
  };
};