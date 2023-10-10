import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[appTimeMask]'
})
export class TimeMaskDirective {

  private previousValue = '';

  constructor(private el: ElementRef) {}

  @HostListener('keydown', ['$event']) 
  onKeydown(event: KeyboardEvent): void {
    const initialValue = this.el.nativeElement.value;
    let currentPosition = this.el.nativeElement.selectionStart;

    if (event.key >= '0' && event.key <= '9') {
      if (initialValue.charAt(currentPosition) === ':') {
        currentPosition++;
      }
      if (currentPosition < 5) {
        const chars = initialValue.split('');
        chars[currentPosition] = event.key;
        this.el.nativeElement.value = chars.join('');
        this.el.nativeElement.setSelectionRange(currentPosition + 1, currentPosition + 1);
        this.emitChangeEvent();
      }
      event.preventDefault();
    } else if (event.key === 'Backspace') {
      if (initialValue.charAt(currentPosition - 1) === ':') {
        currentPosition--;
      }
      if (currentPosition > 0) {
        const chars = initialValue.split('');
        chars[currentPosition - 1] = '-';
        this.el.nativeElement.value = chars.join('');
        this.el.nativeElement.setSelectionRange(currentPosition - 1, currentPosition - 1);
        this.emitChangeEvent();
      }
      event.preventDefault();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      this.adjustValue(event.key, currentPosition);
      event.preventDefault();
    } else if (event.key === 'Tab' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      return;
    }  else {
      // Prevents any other key presses
      event.preventDefault();
    }
  }

  adjustValue(direction: string, position: number): void {
    const value = this.el.nativeElement.value.replace(/-/g, '0').split(':');
    let mins = parseInt(value[0], 10);
    let secs = parseInt(value[1], 10);

    if (direction === 'ArrowUp') {
        secs += 1;
        if (secs > 59) {
            secs = 0;
            mins += 1;
            if (mins > 59) { // prevent the minutes from exceeding 59
                mins = 59;
            }
        }
    } else {
        secs -= 1;
        if (secs < 0) {
            secs = 59;
            mins -= 1;
            if (mins < 0) { // prevent the minutes from going below 0
                mins = 0;
            }
        }
    }

    this.el.nativeElement.value = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    this.el.nativeElement.setSelectionRange(position, position);
  }

  @HostListener('focus') 
  onFocus(): void {
    if (this.previousValue === '--:--') {
      this.el.nativeElement.value = '--:--';
      this.emitChangeEvent();
      this.el.nativeElement.setSelectionRange(0, 0);  // set cursor at the start
    } else {
      // set cursor right after the last digit
      const lastDigitIndex = this.el.nativeElement.value.search(/-|$/);
      this.emitChangeEvent();
      this.el.nativeElement.setSelectionRange(lastDigitIndex, lastDigitIndex);
    }
  }

  @HostListener('blur') 
  onBlur(): void {
      const currentValue = this.el.nativeElement.value;
      this.previousValue = currentValue;
      if (currentValue === '--:--') {
        this.el.nativeElement.value = '';
      }
  }
  
  private emitChangeEvent(): void {
    const event = new Event('input', {
        'bubbles': true,
        'cancelable': true
    });
    this.el.nativeElement.dispatchEvent(event);
}

}
