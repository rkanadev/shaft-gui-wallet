import {Component, Directive, Input} from '@angular/core';

@Component({
  selector: 'arrow-icon',
  templateUrl: 'arrow-icon.html'
})
export class ArrowIconComponent {

  @Input()
  direction : string;
  constructor() {
  }

  public getDegree() {
    switch (this.direction) {
      case "up" :
        return 180 + "deg";
      case "down" :
        return 0 + "deg";
      case "right" :
        return -90 + "deg";
      case "left" :
        return 90 + "deg";
      default :
        return "45deg"
    }


}

}
