import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { ConfigService } from '../config/config.service';
import { PrinterStatus } from '../model';
import { PrinterService } from '../services/printer/printer.service';
import { SocketService } from '../services/socket/socket.service';

import { Global } from '../print-control/print-control.component';

@Component({
  selector: 'app-printer-status',
  templateUrl: './printer-status.component.html',
  styleUrls: ['./printer-status.component.scss'],
})
export class PrinterStatusComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();
  public printerStatus: PrinterStatus;
  public fanSpeed: number;
  public status: string;

  public hotendTarget: number;
  public heatbedTarget: number;
  public feedTarget: number;
  public feedVTarget: number;
  public flowTarget: number;
  public fanTarget: number;

  public QuickControlView = QuickControlView;
  public view = QuickControlView.NONE;

  public constructor(
    private printerService: PrinterService,
    private configService: ConfigService,
    private socketService: SocketService,
  ) {
    this.hotendTarget = this.configService.getDefaultHotendTemperature();
    this.heatbedTarget = this.configService.getDefaultHeatbedTemperature();
    this.feedTarget = this.configService.getDefaultFeedRate();
    this.flowTarget = this.configService.getDefaultFlowRate();
    this.fanTarget = this.configService.getDefaultFanSpeed();
  }

  public ngOnInit(): void {
    this.subscriptions.add(
      this.socketService.getPrinterStatusSubscribable().subscribe((status: PrinterStatus): void => {
        this.printerStatus = status;
      }),
    );
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public showQuickControlHotend(): void {
    this.view = QuickControlView.HOTEND;
    this.showQuickControl();
  }

  public showQuickControlHeatbed(): void {
    this.view = QuickControlView.HEATBED;
    this.showQuickControl();
  }

  public showQuickControlFeed(): void {
    this.view = QuickControlView.FEEDRATE;
    this.showQuickControl();
  }

  public showQuickControlFlow(): void {
    this.view = QuickControlView.FLOWRATE;
    this.showQuickControl();
  }

  public showQuickControlFan(): void {
    this.view = QuickControlView.FAN;
    this.showQuickControl();
  }

  private showQuickControl(): void {
    setTimeout((): void => {
      const controlViewDOM = document.getElementById('quickControl');
      controlViewDOM.style.opacity = '1';
    }, 50);
  }

  public hideQuickControl(): void {
    const controlViewDOM = document.getElementById('quickControl');
    controlViewDOM.style.opacity = '0';
    setTimeout((): void => {
      this.view = QuickControlView.NONE;
    }, 500);
  }

  public stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  public quickControlChangeValue(value: number): void {
    switch (this.view) {
      case QuickControlView.HOTEND:
        this.changeTemperatureHotend(value);
        break;
      case QuickControlView.HEATBED:
        this.changeTemperatureHeatbed(value);
        break;
      case QuickControlView.FEEDRATE:
        this.changeRateFeed(value);
        break;
      case QuickControlView.FLOWRATE:
        this.changeRateFlow(value);
        break;
      case QuickControlView.FAN:
        this.changeSpeedFan(value);
        break;
    }
  }

  public quickControlSetValue(): void {
    switch (this.view) {
      case QuickControlView.HOTEND:
        this.setTemperatureHotend();
        break;
      case QuickControlView.HEATBED:
        this.setTemperatureHeatbed();
        break;
      case QuickControlView.FEEDRATE:
        this.setFeedRate();
        break;
      case QuickControlView.FLOWRATE:
        this.setFlowRate();
        break;
      case QuickControlView.FAN:
        this.setFanSpeed();
        break;
    }
  }

  private changeTemperatureHotend(value: number): void {
    this.hotendTarget += value;
    if (this.hotendTarget < -999) {
      this.hotendTarget = this.configService.getDefaultHotendTemperature();
    } else if (this.hotendTarget < 0) {
      this.hotendTarget = 0;
    } else if (this.hotendTarget > 260) {
      this.hotendTarget = 260;
    }
  }

  private changeTemperatureHeatbed(value: number): void {
    this.heatbedTarget += value;
    if (this.heatbedTarget < -999) {
      this.heatbedTarget = this.configService.getDefaultHeatbedTemperature();
    } else if (this.heatbedTarget < 0) {
      this.heatbedTarget = 0;
    } else if (this.heatbedTarget > 80) {
      this.heatbedTarget = 80;
    }
  }

  private changeRateFeed(value: number): void {
    this.feedTarget += value;
    if (this.feedTarget < -989) {
      this.feedTarget = this.configService.getDefaultFeedRate();
    } else if (this.feedTarget < 10) {
      this.feedTarget = 10;
    } else if (this.feedTarget > 250) {
      this.feedTarget = 250;
    }
  }

  private changeRateFlow(value: number): void {
    this.flowTarget += value;
    if (this.flowTarget < -989) {
      this.flowTarget = this.configService.getDefaultFlowRate();
    } else if (this.flowTarget < 10) {
      this.flowTarget = 10;
    } else if (this.flowTarget > 250) {
      this.flowTarget = 250;
    }
  }

  private changeSpeedFan(value: number): void {
    this.fanTarget += value;
    if (this.fanTarget < -999) {
      this.fanTarget = this.configService.getDefaultFanSpeed();
    } else if (this.fanTarget < 0) {
      this.fanTarget = 0;
    } else if (this.fanTarget > 100) {
      this.fanTarget = 100;
    }
  }

  private setTemperatureHotend(): void {
    this.printerService.setTemperatureHotend(this.hotendTarget);
    this.hideQuickControl();
  }

  private setTemperatureHeatbed(): void {
    this.printerService.setTemperatureBed(this.heatbedTarget);
    this.hideQuickControl();
  }

  private setFeedRate(): void {
    this.printerService.setFeedrate(this.feedTarget);
    Global.feedVal = this.feedTarget;
    this.hideQuickControl();
  }

  private setFlowRate(): void {
    this.printerService.setFlowrate(this.flowTarget);
    Global.flowVal = this.flowTarget;
    this.hideQuickControl();
  }

  private setFanSpeed(): void {
    this.printerService.setFanSpeed(this.fanTarget);
    this.hideQuickControl();
  }

  public getFeedSpeed(): number {
    return Global.feedVal;
  }

  public getFlowSpeed(): number {
    return Global.flowVal;
  }
}

enum QuickControlView {
  NONE,
  HOTEND,
  HEATBED,
  FEEDRATE,
  FLOWRATE,
  FAN,
}
