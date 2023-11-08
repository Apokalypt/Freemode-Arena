import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderPaddingComponent } from './header-padding.component';

describe('HeaderPaddingComponent', () => {
    let component: HeaderPaddingComponent;
    let fixture: ComponentFixture<HeaderPaddingComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HeaderPaddingComponent]
        });
        fixture = TestBed.createComponent(HeaderPaddingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
