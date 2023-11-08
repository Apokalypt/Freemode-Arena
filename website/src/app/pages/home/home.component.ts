import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderPaddingComponent } from "../../core/components/header-padding/header-padding.component";

@Component({
    selector: 'fa-home',
    standalone: true,
    imports: [CommonModule, HeaderPaddingComponent],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {

}
