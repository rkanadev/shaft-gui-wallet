import {Component, Inject, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {Web3IPCService} from "../service/ipc/web3/web3-ipc.service";

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {

  private address:string;
  private balance:number;

  constructor(private route: ActivatedRoute, private Web3IPCService:Web3IPCService) {
    route.params.subscribe(params =>{
      let addressHash = params.addressHash;
      this.address = addressHash;
    });

    console.log('getbalance', this.address)
    Web3IPCService.getBalance(this.address).then(balance=> {
      this.balance = balance;

      console.log('getbalance res', balance)
    }, error => {console.log(error)})

  }

  ngOnInit() {

  }

}
