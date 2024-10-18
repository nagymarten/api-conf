import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadYamlButtonComponent } from './download-yaml-button.component';

describe('DownloadYamlButtonComponent', () => {
  let component: DownloadYamlButtonComponent;
  let fixture: ComponentFixture<DownloadYamlButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadYamlButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DownloadYamlButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
