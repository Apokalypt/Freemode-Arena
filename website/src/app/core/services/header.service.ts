import { ElementRef, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class HeaderService implements OnDestroy {
    private readonly _ro: ResizeObserver;
    private _header?: ElementRef;
    private _lastHeaderHeight = -1;

    private _height$ = new BehaviorSubject<number>(0);
    public get height$() {
        return this._height$;
    }

    constructor() {
        this._ro = new ResizeObserver(entries => {
            const lastEntry = entries[entries.length - 1];
            const cr = lastEntry.contentRect;

            if (this._lastHeaderHeight !== cr.height) {
                this._lastHeaderHeight = cr.height;
                this._height$.next(cr.height);
            }
        });
    }

    attachHeader(header: ElementRef) {
        if (this._header) {
            this._ro.unobserve(this._header.nativeElement);
        }

        this._header = header;
        this._ro.observe(this._header.nativeElement);
    }

    ngOnDestroy() {
        if (this._header) {
            this._ro.unobserve(this._header.nativeElement);
        }
        this._ro.disconnect();

        this._height$.complete();
    }
}
