import { Pipe, PipeTransform } from '@angular/core';
import BigNumber from "bignumber.js";

@Pipe({name: 'weiToEther'})
export class UnitConvertWeiToEther implements PipeTransform {
  transform(value: number): string {
    return new BigNumber(value).dividedBy(1000000000000000000).toString(10);
  }
}
