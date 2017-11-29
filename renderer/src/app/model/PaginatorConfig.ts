export class PaginatorConfig {

  pageIndex: number;
  pageSize: number;
  length: number;

  constructor(pageIndex, pageSize, length) {
    this.pageIndex = pageIndex;
    this.pageSize = pageSize;
    this.length = length;
  }

}
