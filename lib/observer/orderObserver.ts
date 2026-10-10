//interface do observador
export interface OrderObserver {
  onOrderCompleted(orderId: string): void;
}

//observador concreto
export class WindowEventObserver implements OrderObserver {
  onOrderCompleted(orderId: string): void {
    try {
      window.dispatchEvent(new CustomEvent("orderCompleted", { detail: { orderId } }));
    } catch (error) {
      console.log("Note: Could not trigger notification refresh");
    }
  }
}

//sujeito
export class OrderSubject {
  private observers: OrderObserver[] = [];

  public subscribe(observer: OrderObserver): void {
    this.observers.push(observer);
  }

  public unsubscribe(observer: OrderObserver): void {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  public notifyAll(orderId: string): void {
    this.observers.forEach((observer) => observer.onOrderCompleted(orderId));
  }
}

export const orderSubject = new OrderSubject();
orderSubject.subscribe(new WindowEventObserver());