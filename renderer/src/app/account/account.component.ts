import {Component, Inject, OnInit, ViewChild, ViewChildren} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {Web3IPCService} from "../service/ipc/web3/web3-ipc.service";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Observable} from "rxjs/Observable";
import {MatPaginator, MatSnackBar} from "@angular/material";
import {DataSource} from "@angular/cdk/collections";
import {Transaction} from "../model/Transaction";
import {UnitConvertWeiToEther} from "../util/pipes/unit-converter-pipe";
import {AccountIconService} from "../service/account-icon/account-icon.service";
import {NotificationService} from "../service/notification/notification.service";

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css'],
  providers: [MatPaginator, UnitConvertWeiToEther, AccountIconService, NotificationService]
})
export class AccountComponent implements OnInit {

  private address: string;
  private transactions: Transaction[];
  private balance: number;
  private accountIconBase64: string;
  private displayedColumns: string[];
  private dataSource: TransactionDataSource | null;
  private transactionDatabase: TransactionDatabase;
  private label: string;

  @ViewChild(MatPaginator)
  set setPaginatorHandler(paginator: MatPaginator) {
    if (paginator) {
      console.log(paginator);
      this.dataSource.injectPaginator(paginator);
    }
  }

  constructor(private route: ActivatedRoute, private Web3IPCService: Web3IPCService, private AccountIconService: AccountIconService, private NotificationService: NotificationService) {
    this.transactions = [];
    this.displayedColumns = ['from', 'to', 'amount'];
    this.transactionDatabase = new TransactionDatabase();
    this.dataSource = new TransactionDataSource(this.transactionDatabase);

  }

  public labelSavedSnackbar(label) {
    this.NotificationService.addressLabelSaved(label);
  }

  public labelRemovedSnackbar() {
    this.NotificationService.addressLabelRemoved();
  }

  public saveLabel(address, label) {
    if (label === "") {
      this.labelRemovedSnackbar();
      this.label = this.address.substr(0, 8)
    } else {
      this.Web3IPCService.saveAddressLabel(address, label).then(() => {
        console.log(`Saved label ${label} for address ${address}`);
        this.labelSavedSnackbar(label);
      }, err => {
        console.log('Error saving label ' + label + ' for address ' + address, err);
      });
    }

  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      let addressHash = params.addressHash;
      this.address = addressHash;

      this.accountIconBase64 = this.AccountIconService.getIconBase64(this.address);

      this.Web3IPCService.getAddressLabel(this.address).then((label: string) => {
        console.log('Got label from config: ', label);
        this.label = label;
      }, err => {
        console.log('Could not get label from config, probably not set: ', err);
        this.label = this.address.substr(0, 8);
      });


      this.Web3IPCService.getBalance(this.address).then(balance => {
        this.balance = balance;
      }, error => {
        console.log(error)
      });

      this.Web3IPCService.getTransactionsByAddress(this.address).then((transactions: Transaction[]) => {
        console.log('Transactions by address ' + this.address + ' : ', transactions);
        this.transactions = transactions;
        this.transactionDatabase.updateData(transactions)
      }, error => {
        console.log(error)
      })
    });
  }

}


/** An example database that the data source uses to retrieve data for the table. */
export class TransactionDatabase {

  /** Stream that emits whenever the data has been modified. */
  dataChange: BehaviorSubject<Transaction[]> = new BehaviorSubject<Transaction[]>([]);

  get data(): Transaction[] {
    return this.dataChange.value;
  }

  constructor() {
  }

  updateData(transactions: Transaction[]) {
    this.dataChange.next(transactions);
  }
}


/**
 * Data source to provide what data should be rendered in the table. Note that the data source
 * can retrieve its data in any way. In this case, the data source is provided a reference
 * to a common data base, ExampleDatabase. It is not the data source's responsibility to manage
 * the underlying data. Instead, it only needs to take the data and send the table exactly what
 * should be rendered.
 */
export class TransactionDataSource extends DataSource<any> {
  private paginator: MatPaginator;

  constructor(private _transactionDatabase: TransactionDatabase) {
    super();
  }

  injectPaginator(paginator) {
    this.paginator = paginator;
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<Transaction[]> {
    return new Observable<Transaction[]>(observer => {
      this._transactionDatabase.dataChange.subscribe((transactions) => {
        if (!this.paginator) {
          observer.next(transactions.slice(0, 5));
        } else {
          const data = this._transactionDatabase.data.slice();

          // Grab the page's slice of data.
          const startIndex = this.paginator.pageIndex * (this.paginator.pageSize);
          return data.splice(startIndex, this.paginator.pageSize);
        }
      })
    })

    /* const displayDataChanges = [
       this._transactionDatabase.dataChange,
       this._paginator ? this._paginator.page : 0,
     ];

     return Observable.merge(...displayDataChanges).map(() => {
       const data = this._transactionDatabase.data.slice();

       // Grab the page's slice of data.
       const startIndex = this._paginator ? this._paginator.pageIndex : 0 * (this._paginator ? this._paginator.pageSize : 0);
       return data.splice(startIndex, this._paginator ? this._paginator.pageSize : 0);
     });*/
  }

  disconnect() {
  }
}
