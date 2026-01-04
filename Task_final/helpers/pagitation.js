// module.exports = (query, objectPagitation, countRecords) => {
//   if (query.page) {
//     objectPagitation.currentPage = parseInt(query.page);
//   }
//   if (query.limit) {
//     objectPagitation.limitItem = parseInt(query.limit);
//   }

//   objectPagitation.skip =
//     (objectPagitation.currentPage - 1) * objectPagitation.limitItem;
//   // console.log(objectPagitation.currentPage);
//   const totalPage = Math.ceil(countRecords / objectPagitation.limitItem);
//   // console.log(totalPage);

//   objectPagitation.totalPage = totalPage;

//   return objectPagitation;
// };

///
module.exports = (query, objectPagination, countRecords) => {
  let currentPage = parseInt(query.page) || objectPagination.currentPage;
  let limitItem = parseInt(query.limit) || objectPagination.limitItem;

  // Validate page
  if (currentPage < 1) currentPage = 1;

  // Validate limit
  if (limitItem < 1) limitItem = 10;
  if (limitItem > 50) limitItem = 50; // HARD LIMIT

  const skip = (currentPage - 1) * limitItem;
  const totalPage = Math.max(1, Math.ceil(countRecords / limitItem));

  return {
    ...objectPagination,
    currentPage,
    limitItem,
    skip,
    totalPage,
  };
};
