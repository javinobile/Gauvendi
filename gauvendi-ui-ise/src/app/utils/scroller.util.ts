export class Scroller {
  public static scrollToTargetElement(targetId: string, timeout?: number, block: ScrollLogicalPosition='start') {
    setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: 'smooth',
        block,
        inline: 'nearest',
      });
    }, timeout || 0);
  }
}
