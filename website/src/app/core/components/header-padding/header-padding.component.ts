import { Component, HostBinding, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from "rxjs";
import { HeaderService } from "../../services/header.service";

@Component({
    selector: 'fa-header-padding',
    standalone: true,
    imports: [CommonModule],
    template: ``,
    host: {
        class: 'block'
    }
})
export class HeaderPaddingComponent implements OnInit, OnDestroy {
    @HostBinding('style.height') height = '0px';

    private readonly _header: HeaderService;
    private _subscription?: Subscription;

    constructor() {
        this._header = inject(HeaderService);
    }

    ngOnInit() {
        this._subscription = this._header.height$
            .subscribe( height => {
                this.height = `${height}px`;
            });
    }

    ngOnDestroy() {
        this._subscription?.unsubscribe();
    }
}
