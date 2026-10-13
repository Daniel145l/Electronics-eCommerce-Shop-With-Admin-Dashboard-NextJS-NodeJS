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

//observador concreto 2: registro de auditoria/log
export class LoggerObserver implements OrderObserver {
  onOrderCompleted(orderId: string): void {
    console.log(`[audit] Order completed: ${orderId}`);
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
    this.observers.forEach((observer) => {
      try {
        observer.onOrderCompleted(orderId);
      } catch (error) {
        // a falha de um observador não impede a notificação dos demais
        console.error("Observer failed while handling orderCompleted:", error);
      }
    });
  }
}

export const orderSubject = new OrderSubject();
orderSubject.subscribe(new WindowEventObserver());
orderSubject.subscribe(new LoggerObserver());