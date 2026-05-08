import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UploadActionComponent } from './upload-action.component';

describe('UploadActionComponent', () => {
  let fixture: ComponentFixture<UploadActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadActionComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(UploadActionComponent);
    fixture.detectChanges();
  });

  it('emits uploadClick when the upload button is pressed', () => {
    let emissions = 0;
    fixture.componentInstance.uploadClick.subscribe(() => emissions++);
    fixture.nativeElement.querySelector('button').click();
    expect(emissions).toBe(1);
  });

  it('renders a single upload button', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent.trim()).toBe('Upload');
  });
});
