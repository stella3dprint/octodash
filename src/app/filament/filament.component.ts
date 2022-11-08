import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AnimationItem } from 'lottie-web';
import { AnimationOptions } from 'ngx-lottie';
import { take } from 'rxjs/operators';

import { ConfigService } from '../config/config.service';
import { FilamentSpool, PrinterStatus } from '../model';
import { FilamentService } from '../services/filament/filament.service';
import { PrinterService } from '../services/printer/printer.service';
import { SocketService } from '../services/socket/socket.service';

import { EventService } from '../event.service';

@Component({
  selector: 'app-filament',
  templateUrl: './filament.component.html',
  styleUrls: ['./filament.component.scss'],
  providers: [FilamentService],
})
export class FilamentComponent implements OnInit, OnDestroy {
  private totalPages = 1;
  private hotendPreviousTemperature = 0;
  private printstateInterval: ReturnType<typeof setInterval>;

  public page: number;
  public showCheckmark = false;
  public selectedSpool: FilamentSpool;
  public checkmarkOptions: AnimationOptions = {
    path: 'assets/animations/checkmark.json',
    loop: false,
  };

  public constructor(
    private router: Router,
    private configService: ConfigService,
    private printerService: PrinterService,
    private socketService: SocketService,
    private filament: FilamentService,
    private eventService: EventService,
  ) {
    this.socketService
      .getPrinterStatusSubscribable()
      .pipe(take(1))
      .subscribe((printerStatus: PrinterStatus): void => {
        this.hotendPreviousTemperature = printerStatus.tool0.set;
      });
  }

  public ngOnInit(): void {
    if (this.configService.isFilamentManagerUsed()) {
      this.setPage(0);
    } else {
      this.setPage(1);
    }
}

  public ngOnDestroy(): void {
    this.printerService.setTemperatureHotend(this.hotendPreviousTemperature);
  }

  public increasePage(returnToMainScreen = false): void {
    if (this.eventService.isPrintingState()) {
      if (this.page === this.totalPages || returnToMainScreen) {
        this.router.navigate(['/main-screen']);
      } else if (this.page < this.totalPages) {
        this.setPage(this.page + 1);
      }
    }
  }

  private setPage(page: number): void {
    setTimeout((): void => {
      const progressBar = document.getElementById('progressBar');
      if (progressBar) {
        document.getElementById('progressBar').style.width = this.page * (20 / this.totalPages) + 'vw';
      }
    }, 200);
    this.page = page;
  }

  public setSpool(spoolInformation: { spool: FilamentSpool; skipChange: boolean }): void {
    this.selectedSpool = spoolInformation.spool;
    if (spoolInformation.skipChange) {
      this.setSpoolSelection();
    } else {
      this.increasePage();
    }
  }

  public setSpoolSelection(): void {
    if (this.selectedSpool) {
      this.filament
        .setSpool(this.selectedSpool)
        .then((): void => {
          this.showCheckmark = true;
          setTimeout(this.increasePage.bind(this), 1350, true);
        })
        .catch(() => this.increasePage(true));
    } else {
      this.increasePage(true);
    }
  }

  public get currentSpool(): FilamentSpool {
    return this.filament.getCurrentSpool();
  }

  public setAnimationSpeed(animation: AnimationItem): void {
    animation.setSpeed(0.55);
  }
}
