import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { ConfigService } from '../config/config.service';
import { PrinterState, PrinterStatus } from '../model';
import { JobService } from '../services/job/job.service';
import { PrinterService } from '../services/printer/printer.service';
import { SocketService } from '../services/socket/socket.service';

export namespace Global {
  export var feedVal: number = 100;
  export var flowVal: number = 100;
}

@Component({
  selector: 'app-print-control',
  templateUrl: './print-control.component.html',
  styleUrls: ['./print-control.component.scss'],
})
export class PrintControlComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();

  public showControls = false;
  public controlView = ControlView;
  public view = ControlView.MAIN;
  private showedPauseScreen = false;

  public temperatureHotend: number;
  public temperatureHeatbed: number;
  public feedrate: number;
  public flowrate: number;
  public fanSpeed: number;
  public zOffset: number;
  public zOffsetStep: number;

  public constructor(
    private jobService: JobService,
    private printerService: PrinterService,
    private configService: ConfigService,
    private socketService: SocketService,
    private router: Router,
  ) {
    this.temperatureHotend = 0;
    this.temperatureHeatbed = 0;
    this.feedrate = Global.feedVal;
    this.flowrate = Global.flowVal;
    this.fanSpeed = 0;
    this.zOffset = 0;
    this.zOffsetStep = 0;
  }

  public ngOnInit(): void {
    this.subscriptions.add(
      this.socketService.getPrinterStatusSubscribable().subscribe((printerStatus: PrinterStatus) => {
        if (printerStatus.status === PrinterState.paused) {
          if (!this.showedPauseScreen) {
            this.view = ControlView.PAUSE;
            this.showControls = true;
            this.showedPauseScreen = true;
          }
        } else {
          if (this.showedPauseScreen && this.showControls) {
            this.showControls = false;
          }
          this.showedPauseScreen = false;
        }
      }),
    );
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  //STELLAMOVE
  public isClickOnPreview(event: MouseEvent): boolean {
    const previewSwitchMinX = window.innerWidth * 0.25;
    const previewSwitchMaxX = window.innerWidth * 0.75;
    const previewSwitchMinY = window.innerHeight * 0.05;
    const previewSwitchMaxY = window.innerHeight * 0.35;

    return (
      previewSwitchMinX < event.clientX &&
      event.clientX < previewSwitchMaxX &&
      previewSwitchMinY < event.clientY &&
      event.clientY < previewSwitchMaxY
    );
  }

  public cancel(event: MouseEvent): void {
    if (this.showControls) {
      this.stopPropagation(event);
      this.view = ControlView.CANCEL;
    }
  }

  public pause(event: MouseEvent): void {
    if (this.showControls) {
      this.stopPropagation(event);
      this.jobService.pauseJob();
      this.view = ControlView.PAUSE;
    }
  }

  public adjust(event: MouseEvent): void {
    if (this.showControls) {
      if (this.view === ControlView.BABYSTEP) {
        this.printerService.saveToEPROM();
      }
      this.view = ControlView.ADJUST;
      this.stopPropagation(event);
    }
  }

  public babystep(event: MouseEvent): void {
    if (this.showControls) {
      this.view = ControlView.BABYSTEP;
      this.stopPropagation(event);
    }
  }

  public stopPropagation(event: MouseEvent): void {
    if (this.showControls) {
      event.stopPropagation();
    }
  }

  public showControlOverlay(event?: MouseEvent): void {
    if (!this.isClickOnPreview(event) && !this.showControls) {
      this.stopPropagation(event);
      this.loadData();
      this.view = ControlView.MAIN;
      this.showControls = true;
    } else {
      document.getElementById('jobTogglePreview').click();
    }
  }

  public hideControlOverlay(event: MouseEvent): void {
    this.stopPropagation(event);
    this.showControls = false;
  }

  public cancelPrint(event: MouseEvent): void {
    if (this.showControls && this.view === ControlView.CANCEL) {
      this.jobService.cancelJob();
      this.hideControlOverlay(event);
    }
  }

  public resume(event: MouseEvent): void {
    if (this.showControls && this.view === ControlView.PAUSE) {
      this.jobService.resumeJob();
      this.hideControlOverlay(event);
    }
  }

  public restart(event: MouseEvent): void {
    if (this.showControls && this.view === ControlView.PAUSE) {
      this.jobService.restartJob();
      this.hideControlOverlay(event);
    }
  }

  public changeFilament(event: MouseEvent): void {
    if (this.showControls && this.view === ControlView.PAUSE) {
      this.printerService.executeGCode('M600');
      this.hideControlOverlay(event);
    }
  }

  public backToControlScreen(event: MouseEvent): void {
    if (this.showControls) {
      this.view = ControlView.MAIN;
      this.stopPropagation(event);
    }
  }

  private loadData(): void {
    this.socketService
      .getPrinterStatusSubscribable()
      .pipe(take(1))
      .subscribe((status: PrinterStatus): void => {
        this.temperatureHotend = status.tool0.set;
        this.temperatureHeatbed = status.bed.set;
      });
  }

  // STELLAMOVE
  public changeTemperatureHotend(value: number): void {
    if (this.showControls) {
      this.temperatureHotend += value;
      if (this.temperatureHotend < 0) {
        this.temperatureHotend = 0;
      }
      if (this.temperatureHotend > 260) {
        this.temperatureHotend = 260;
      }
    }
  }

  // STELLAMOVE
  public changeTemperatureHeatbed(value: number): void {
    if (this.showControls) {
      this.temperatureHeatbed += value;
      if (this.temperatureHeatbed < 0) {
        this.temperatureHeatbed = 0;
      }
      if (this.temperatureHeatbed > 100) {
        this.temperatureHeatbed = 100;
      }
    }
  }

  // STELLAMOVE
  public changeFeedrate(value: number): void {
    if (this.showControls) {
      this.feedrate += value;
      if (this.feedrate < 10) {
        this.feedrate = 10;
      }
      if (this.feedrate > 250) {
        this.feedrate = 250;
      }
    }
  }

  public changeFlowrate(value: number): void {
    if (this.showControls) {
      this.flowrate += value;
      if (this.flowrate < 10) {
        this.flowrate = 10;
      }
      if (this.flowrate > 250) {
        this.flowrate = 250;
      }
    }
  }

  public changeFanSpeed(value: number): void {
    if (this.showControls) {
      this.fanSpeed += value;
      if (this.fanSpeed < 0) {
        this.fanSpeed = 0;
      }
      if (this.fanSpeed > 100) {
        this.fanSpeed = 100;
      }
    }
  }

  public setAdjustParameters(event: MouseEvent): void {
    if (this.showControls) {
      this.printerService.setTemperatureHotend(this.temperatureHotend);
      this.printerService.setTemperatureBed(this.temperatureHeatbed);
      this.printerService.setFeedrate(this.feedrate);
      Global.feedVal = this.feedrate;
      this.printerService.setFlowrate(this.flowrate);
      Global.flowVal = this.flowrate;
      this.hideControlOverlay(event);
    }
  }

  public changeSlowFeedrate(): void {
    this.printerService.setFeedrate(10);
  }

  public changeNormalFeedrate(): void {
    this.printerService.setFeedrate(100);
  }

  public saveOffset(event: MouseEvent): void {
    if (this.showControls) {
      this.printerService.saveToEPROM();
      this.zOffset = 0;
      this.stopPropagation(event);
    }
  }

  public getZOffset(): string {
    return Math.abs(this.zOffset).toFixed(2);
  }

  public babystepZ(value: number): void {
    this.zOffsetStep = value;

    // gotta love JS for that one.
    this.zOffset = Math.round((this.zOffset + value) * 100) / 100;
    this.printerService.executeGCode(`${this.configService.getZBabystepGCode()}${value}`);
  }
}

enum ControlView {
  MAIN,
  CANCEL,
  PAUSE,
  ADJUST,
  BABYSTEP,
}
