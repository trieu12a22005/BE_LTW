module.exports = (objectPagination, query, RecordProducts) => {
  if (query.page) {
    objectPagination.currentPage = parseInt(query.page);
  }
  objectPagination.skip =
    (objectPagination.currentPage - 1) * objectPagination.limitItems;
  objectPagination.totalPage = Math.ceil(
    RecordProducts / objectPagination.limitItems
  );
  return objectPagination;
};
