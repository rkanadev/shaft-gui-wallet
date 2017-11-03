import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'shaft-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  providers: []
})
export class HeaderComponent implements OnInit {

  @Input() sidenav:any;

  constructor() {

  }

  ngOnInit() {
    console.log('Header')
  }


  close() {
    console.log('Exiting app');
  }

}
