import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent implements OnInit {
  @Input() sidenav: any;

  constructor() { }

  ngOnInit() {
  }

}
