import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";
import { CommonModule } from '@angular/common';
import { HeaderPaddingComponent } from "../../core/components/header-padding/header-padding.component";

@Component({
    selector: 'fa-home',
    standalone: true,
    imports: [CommonModule, HeaderPaddingComponent, RouterLink],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {

}
