import { Component, ElementRef, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from "@angular/router";
import { CommonModule } from '@angular/common';
import { HeaderService } from "../../services/header.service";

@Component({
    selector: 'fa-header',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {
    protected readonly _HEADERS_OPTIONS = [
        {
            label: 'Accueil',
            route: '/'
        },
        {
            label: 'Règlement',
            route: '/rules'
        },
        {
            label: 'Comment participer?',
            route: '/how-to-participate'
        }
    ];

    constructor(private readonly _el: ElementRef, private readonly _service: HeaderService) { }

    ngOnInit() {
        this._service.attachHeader(this._el);
    }

    optionIsSelected(option: HeaderOption): boolean {
        return option.route === window.location.pathname;
    }
}

type HeaderOption = {
    label: string,
    route: string
}
