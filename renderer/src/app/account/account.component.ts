import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Observable} from "rxjs/Observable";
import {MatPaginator} from "@angular/material";
import {DataSource} from "@angular/cdk/collections";
import {Transaction} from "../model/Transaction";
import {UnitConvertWeiToEther} from "../util/pipes/unit-converter-pipe";
import {AccountIconService} from "../service/account-icon/account-icon.service";
import {NotificationService} from "../service/notification/notification.service";
import {IPCService} from "../service/ipc/concrete/ipc.service";
import {PaginatorConfig} from "../model/PaginatorConfig";

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
  private error: string;
  private paginatorConfig: PaginatorConfig

  @ViewChild(MatPaginator)
  set setPaginatorHandler(paginator: MatPaginator) {
    if (paginator) {
      console.log(paginator);
      this.dataSource.injectPaginator(paginator);
    }
  }

  constructor(private route: ActivatedRoute,
              private IPCService: IPCService,
              private AccountIconService: AccountIconService,
              private NotificationService: NotificationService) {
    this.transactions = [];
    const pageIndex = 0;
    const pageSize = 5;

    this.paginatorConfig = null;

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

  public paginatorEvent(event) {
    this.paginatorConfig.pageIndex = event.pageIndex;
    this.paginatorConfig.pageSize = event.pageSize;
    this.transactionDatabase.dataChange.next(this.transactions);
  }

  public saveLabel(address, label) {
    if (label === "") {
      this.label = this.address.substr(0, 8);
      label = this.label;
      this.IPCService.saveAddressLabel(address, label).then(() => {
        console.log(`Saved empty label for address ${address}`);
        this.labelSavedSnackbar(label);
        this.labelRemovedSnackbar();
      }, err => {
        console.log('Error saving label ' + label + ' for address ' + address, err);
      });
    } else {
      this.IPCService.saveAddressLabel(address, label).then(() => {
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

      this.IPCService.getAddressLabel(this.address).then((label: string) => {
        console.log('Got label from config: ', label);
        this.label = label;
      }, err => {
        console.log('Could not get label from config, probably not set: ', err);
        this.label = this.address.substr(0, 8);
      });

      this.IPCService.getBalance(this.address).then(balance => {
        this.balance = balance;
      }, error => {
        this.NotificationService.notificate("Could not get address balance: " + error);
      });

      this.IPCService.getTransactionsByAddress(this.address).then((transactions: Transaction[]) => {
        this.transactions = transactions;
        this.transactionDatabase.updateData(transactions);
        this.paginatorConfig = new PaginatorConfig(0, 5, transactions.length);
      }, error => {
        this.NotificationService.notificate("Could not get transactions by account: " + error);
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
          let startIndex = this.paginator.pageIndex * this.paginator.pageSize;
          let endIndex = startIndex + this.paginator.pageSize;
          observer.next(transactions.slice(startIndex, endIndex));
        }
      })
    })

  }

  disconnect() {
  }
}
