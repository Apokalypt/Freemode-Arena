import { Component, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderService } from "../../services/header.service";

@Component({
    selector: 'fa-header',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {
    constructor(private readonly _el: ElementRef, private readonly _service: HeaderService) {
    }

    ngOnInit() {
        this._service.attachHeader(this._el);
    }
}
