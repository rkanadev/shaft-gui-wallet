import {Component, Inject, Input, OnInit, ViewChild} from '@angular/core';
import {Web3IPCService} from "../service/ipc/web3/web3-ipc.service";
import BigNumber from "bignumber.js";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatPaginator} from "@angular/material";
import {CreateAccountDialog} from "../accounts/accounts.component";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Observable} from "rxjs/Observable";
import {DataSource} from "@angular/cdk/collections";

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {
  displayedColumns = ['userId', 'userName', 'progress', 'color'];
  exampleDatabase = null;
  dataSource: ExampleDataSource | null;
  users = [];
  paginator: MatPaginator;

  @ViewChild(MatPaginator)
  set setPaginatorHandler(paginator: MatPaginator) {
    if (paginator) {
      this.paginator = paginator;
      this.dataSource.injectPaginator(paginator);
    }
  };

  constructor(private Web3IPCService: Web3IPCService) {
    this.exampleDatabase = new ExampleDatabase();
    this.dataSource = new ExampleDataSource();

    setTimeout(() => {
      console.log('setting');
      this.exampleDatabase.addUser({
        id: 1,
        name: "test",
        progress: Math.round(Math.random() * 100).toString(),
        color: COLORS[Math.round(Math.random() * (COLORS.length - 1))]
      });
      this.users.push("1")
    }, 1000)
  }


  ngOnInit() {
  }
}


/** Constants used to fill up our data base. */
const COLORS = ['maroon', 'red', 'orange', 'yellow', 'olive', 'green', 'purple',
  'fuchsia', 'lime', 'teal', 'aqua', 'blue', 'navy', 'black', 'gray'];
const NAMES = ['Maia', 'Asher', 'Olivia', 'Atticus', 'Amelia', 'Jack',
  'Charlotte', 'Theodore', 'Isla', 'Oliver', 'Isabella', 'Jasper',
  'Cora', 'Levi', 'Violet', 'Arthur', 'Mia', 'Thomas', 'Elizabeth'];

export interface UserData {
  id: string;
  name: string;
  progress: string;
  color: string;
}

/** An example database that the data source uses to retrieve data for the table. */
export class ExampleDatabase {
  /** Stream that emits whenever the data has been modified. */
  dataChange: BehaviorSubject<UserData[]> = new BehaviorSubject<UserData[]>([]);

  get data(): UserData[] {
    return this.dataChange.value;
  }

  constructor() {
    this.dataChange.next([]);
  }

  /** Adds a new user to the database. */
  addUser(user: UserData) {
    const copiedData = this.data.slice();
    copiedData.push(this.createNewUser());
    this.dataChange.next(copiedData);
  }

  /** Builds and returns a new User. */
  private createNewUser() {
    const name =
      NAMES[Math.round(Math.random() * (NAMES.length - 1))] + ' ' +
      NAMES[Math.round(Math.random() * (NAMES.length - 1))].charAt(0) + '.';

    return {
      id: (this.data.length + 1).toString(),
      name: name,
      progress: Math.round(Math.random() * 100).toString(),
      color: COLORS[Math.round(Math.random() * (COLORS.length - 1))]
    };
  }
}

/**
 * Data source to provide what data should be rendered in the table. Note that the data source
 * can retrieve its data in any way. In this case, the data source is provided a reference
 * to a common data base, ExampleDatabase. It is not the data source's responsibility to manage
 * the underlying data. Instead, it only needs to take the data and send the table exactly what
 * should be rendered.
 */
export class ExampleDataSource extends DataSource<any> {
  private database: ExampleDatabase;
  private paginator: MatPaginator;
  private observable: Observable<any>

  constructor() {
    super();
    this.database = new ExampleDatabase();
    this.paginator = null;
  }

  /** Builds and returns a new User. */
  private createNewUser(): UserData {
    const name =
      NAMES[Math.round(Math.random() * (NAMES.length - 1))] + ' ' +
      NAMES[Math.round(Math.random() * (NAMES.length - 1))].charAt(0) + '.';

    return {
      id: "1",
      name: "nasme",
      progress: Math.round(Math.random() * 100).toString(),
      color: COLORS[Math.round(Math.random() * (COLORS.length - 1))]
    };
  }

  injectPaginator(paginator: MatPaginator) {
    this.paginator = paginator;
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<UserData[]> {
    let observable = new Observable((observer) => {
      this.database.dataChange.subscribe((data)=> {
      console.log(data);
        if (!this.paginator) {
          observer.next(this.database.data.splice(0, 5));
        } else {
          const displayDataChanges = [
            this.database.dataChange,
            this.paginator.page,

          ];
          const data = this.database.data.slice();

          // Grab the page's slice of data.
          const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
          observer.next(data.splice(startIndex, this.paginator.pageSize));

        }
        /*
              return Observable.merge(...displayDataChanges).map(() => {
                const data = this.database.data.slice();

                // Grab the page's slice of data.
                const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
                return data.splice(startIndex, this.paginator.pageSize);
              });*/
      })
      })
    return this.observable;
  }

  disconnect() {
  }
}
