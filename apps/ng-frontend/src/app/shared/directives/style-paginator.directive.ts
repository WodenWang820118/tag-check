import {
  AfterViewInit,
  Directive,
  Host,
  Optional,
  Renderer2,
  Self,
  ViewContainerRef,
  Input,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatButton } from '@angular/material/button';
import { PaginatorButtonComponent } from '../components/paginator-button/paginator-button.component';

interface PageObject {
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
}

@Directive({
  selector: '[appStylePaginator]',
  standalone: true,
})
export class StylePaginatorDirective implements AfterViewInit {
  private _pageGapTxt = '...';
  private _rangeStart!: number;
  private _rangeEnd!: number;
  private _buttons: MatButton[] = [];
  private _curPageObj: PageObject = {
    length: 0,
    pageIndex: 0,
    pageSize: 0,
    previousPageIndex: 0,
  };

  @Input() label = '';
  @Input() disabled = false;
  @Input() onClick: () => void = () => {};

  @Input()
  get showTotalPages(): number {
    return this._showTotalPages;
  }
  set showTotalPages(value: number) {
    this._showTotalPages = value % 2 == 0 ? value + 1 : value;
  }
  private _showTotalPages = 2;

  get inc(): number {
    return this._showTotalPages % 2 == 0
      ? this.showTotalPages / 2
      : (this.showTotalPages - 1) / 2;
  }

  get numOfPages(): number {
    return this.matPag.getNumberOfPages();
  }

  get lastPageIndex(): number {
    return this.matPag.getNumberOfPages() - 1;
  }

  constructor(
    @Host() @Self() @Optional() private readonly matPag: MatPaginator,
    private vr: ViewContainerRef,
    private ren: Renderer2
  ) {}

  private buildPageNumbers() {
    const actionContainer = this.vr.element.nativeElement.querySelector(
      'div.mat-mdc-paginator-range-actions'
    );
    const nextPageNode = this.vr.element.nativeElement.querySelector(
      'button.mat-mdc-paginator-navigation-next'
    );
    const prevButtonCount = this._buttons.length;

    // remove buttons before creating new ones
    if (this._buttons.length > 0) {
      this._buttons.forEach((button) => {
        this.ren.removeChild(actionContainer, button);
      });
      //Empty state array
      this._buttons.length = 0;
    }

    //initialize next page and last page buttons
    if (this._buttons.length == 0) {
      try {
        const nodeArray =
          this.vr.element.nativeElement.childNodes[0].childNodes[0]
            .childNodes[1].childNodes;
        for (let i = 0; i < nodeArray.length; i++) {
          if (nodeArray[i].nodeName === 'BUTTON') {
            if (nodeArray[i].innerHTML.length > 100 && nodeArray[i].disabled) {
              this.ren.setStyle(nodeArray[i], 'margin-right', '1rem');
              this.ren.setStyle(nodeArray[i], 'border-radius', '5px');
              this.ren.setStyle(
                nodeArray[i],
                'box-shadow',
                'var(--mdc-fab-small-container-elevation-shadow)'
              );
            } else if (
              nodeArray[i].innerHTML.length > 100 &&
              !nodeArray[i].disabled
            ) {
              this.ren.setStyle(nodeArray[i], 'margin-right', '1rem');
              this.ren.setStyle(nodeArray[i], 'border-radius', '5px');
            } else if (nodeArray[i].disabled) {
              this.ren.setStyle(nodeArray[i], 'background-color', 'white');
            }
          }
        }
        for (let i = 0; i < this.numOfPages; i++) {
          if (i >= this._rangeStart && i <= this._rangeEnd) {
            this.ren.insertBefore(
              actionContainer,
              this.createButton(i, this.matPag.pageIndex),
              nextPageNode
            );
          }

          if (i == this._rangeEnd) {
            this.ren.insertBefore(
              actionContainer,
              this.createButton(this._pageGapTxt, this._rangeEnd),
              nextPageNode
            );
          }
        }
      } catch (error) {
        console.error('error', error);
      }
    }
  }

  private createButton(i: number | string, pageIndex: number): HTMLElement {
    const componentRef = this.vr.createComponent(PaginatorButtonComponent);
    const instance = componentRef.instance;

    // Set properties
    instance.label = isNaN(i as number) ? this._pageGapTxt : `${+i + 1}`;

    switch (i) {
      case pageIndex:
        instance.disabled = true;
        break;
      case this._pageGapTxt: {
        let newIndex = this._curPageObj.pageIndex + this._showTotalPages;
        if (newIndex >= this.numOfPages) newIndex = this.lastPageIndex;

        if (pageIndex !== this.lastPageIndex) {
          instance.onClick = () => {
            console.log('working: ', pageIndex);
            this.switchPage(newIndex);
          };
        }

        if (pageIndex === this.lastPageIndex) {
          instance.disabled = true;
        }
        break;
      }
      default:
        instance.onClick = () => this.switchPage(i as number);
        break;
    }

    this._buttons.push(componentRef.location.nativeElement);
    return componentRef.location.nativeElement;
  }

  //calculates the button range based on class input parameters and based on current page index value. Used to render new buttons after event.
  private initPageRange(): void {
    const middleIndex = (this._rangeStart + this._rangeEnd) / 2;

    this._rangeStart = this.calcRangeStart(middleIndex);
    this._rangeEnd = this.calcRangeEnd(middleIndex);

    this.buildPageNumbers();
  }

  //Helper function To calculate start of button range
  private calcRangeStart(middleIndex: number): number {
    switch (true) {
      case this._curPageObj.pageIndex == 0 && this._rangeStart != 0:
        return 0;
      case this._curPageObj.pageIndex > this._rangeEnd:
        return this._curPageObj.pageIndex + this.inc > this.lastPageIndex
          ? this.lastPageIndex - this.inc * 2
          : this._curPageObj.pageIndex - this.inc;
      case this._curPageObj.pageIndex > this._curPageObj.previousPageIndex &&
        this._curPageObj.pageIndex > middleIndex &&
        this._rangeEnd < this.lastPageIndex:
        return this._rangeStart + 1;
      case this._curPageObj.pageIndex < this._curPageObj.previousPageIndex &&
        this._curPageObj.pageIndex < middleIndex &&
        this._rangeStart > 0:
        return this._rangeStart - 1;
      default:
        return this._rangeStart;
    }
  }
  //Helpter function to calculate end of button range
  private calcRangeEnd(middleIndex: number): number {
    switch (true) {
      case this._curPageObj.pageIndex == 0 &&
        this._rangeEnd != this._showTotalPages:
        return this._showTotalPages - 1;
      case this._curPageObj.pageIndex > this._rangeEnd:
        return this._curPageObj.pageIndex + this.inc > this.lastPageIndex
          ? this.lastPageIndex
          : this._curPageObj.pageIndex + 1;
      case this._curPageObj.pageIndex > this._curPageObj.previousPageIndex &&
        this._curPageObj.pageIndex > middleIndex &&
        this._rangeEnd < this.lastPageIndex:
        return this._rangeEnd + 1;
      case this._curPageObj.pageIndex < this._curPageObj.previousPageIndex &&
        this._curPageObj.pageIndex < middleIndex &&
        this._rangeStart >= 0 &&
        this._rangeEnd > this._showTotalPages - 1:
        return this._rangeEnd - 1;
      default:
        return this._rangeEnd;
    }
  }
  //Helper function to switch page on non first, last, next and previous buttons only.
  private switchPage(i: number): void {
    console.log('switch', i);
    const previousPageIndex = this.matPag.pageIndex;
    this.matPag.pageIndex = i;
    this.matPag['_emitPageEvent'](previousPageIndex);
    this.initPageRange();
  }

  //Initialize default state after view init
  ngAfterViewInit() {
    this._rangeStart = 0;
    this._rangeEnd = this._showTotalPages - 1;
    this.initPageRange();

    //to rerender buttons on items per page change and first, last, next and prior buttons
    this.matPag.page.subscribe((e: PageObject) => {
      if (
        this._curPageObj.pageSize != e.pageSize &&
        this._curPageObj.pageIndex != 0
      ) {
        e.pageIndex = 0;
        this._rangeStart = 0;
        this._rangeEnd = this._showTotalPages - 1;
      }
      this._curPageObj = e;

      this.initPageRange();
    });
  }
}
