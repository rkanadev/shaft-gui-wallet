import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {FooterComponent} from './footer/footer.component';
import {HeaderComponent} from './header/header.component';
import {SendComponent, SendDialog} from './send/send.component';
import {HomeComponent} from './home/home.component';
import {RouterModule, Routes} from "@angular/router";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {FormsModule} from "@angular/forms";
import {HttpModule} from "@angular/http";
import {
  MatButtonModule, MatCardModule, MatCheckboxModule, MatDialogModule, MatIconModule, MatInputModule, MatMenuModule,
  MatPaginatorModule,
  MatProgressSpinnerModule,
  MatSelectModule,
  MatSidenavModule, MatTableModule,
  MatToolbarModule
} from "@angular/material";
import {SidenavComponent} from './sidenav/sidenav.component';
import {AccountsComponent, CreateAccountDialog} from './accounts/accounts.component';
import {CoreModule} from "./core.module";
import {AccountComponent} from "./account/account.component";
import {UnitConvertWeiToEther} from "./util/pipes/unit-converter-pipe";
import {TestComponent} from "./test/test.component";

const appRoutes: Routes = [
  {path: 'send', component: SendComponent},
  {path: 'home', component: HomeComponent},
  {path: 'accounts', component: AccountsComponent},
  {path: 'account/:addressHash', component: AccountComponent},
  {path: 'test', component: TestComponent},
  {path: '**', redirectTo: '/home'}
];


@NgModule({
  declarations: [
    AppComponent,
    TestComponent,
    FooterComponent,
    HeaderComponent,
    SendComponent,
    HomeComponent,
    SidenavComponent,
    AccountsComponent,
    AccountComponent,
    SendDialog,
    CreateAccountDialog,
    UnitConvertWeiToEther],
  entryComponents: [CreateAccountDialog, SendDialog],
  imports: [
    CoreModule,
    BrowserModule, RouterModule.forRoot(
      appRoutes,
      {enableTracing: false, useHash: true} // <-- debugging purposes only
    ), BrowserAnimationsModule,
    FormsModule,
    HttpModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatMenuModule,
    MatDialogModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatTableModule,
  ],
  exports: [
    MatButtonModule,
    MatMenuModule,
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatSidenavModule,
    MatPaginatorModule
  ],
  bootstrap: [AppComponent]
})


export class AppModule {
}
