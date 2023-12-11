import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderPaddingComponent } from "../../core/components/header-padding/header-padding.component";

@Component({
    selector: 'fa-not-found',
    standalone: true,
    imports: [CommonModule, HeaderPaddingComponent],
    templateUrl: './not-found.component.html',
    styleUrls: ['./not-found.component.scss'],
    host: {
        class: 'h-screen'
    }
})
export class NotFoundComponent {

}
