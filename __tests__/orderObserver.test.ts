/**
 * @jest-environment jsdom
 */
import {
  LoggerObserver,
  OrderObserver,
  OrderSubject,
  WindowEventObserver,
  orderSubject,
} from "@/lib/observer/orderObserver";

describe("OrderSubject", () => {
  it("notifica todos os observadores inscritos", () => {
    const subject = new OrderSubject();
    const a: OrderObserver = { onOrderCompleted: jest.fn() };
    const b: OrderObserver = { onOrderCompleted: jest.fn() };
    subject.subscribe(a);
    subject.subscribe(b);

    subject.notifyAll("o1");

    expect(a.onOrderCompleted).toHaveBeenCalledWith("o1");
    expect(b.onOrderCompleted).toHaveBeenCalledWith("o1");
  });

  it("não notifica observadores que cancelaram a inscrição", () => {
    const subject = new OrderSubject();
    const a: OrderObserver = { onOrderCompleted: jest.fn() };
    subject.subscribe(a);
    subject.notifyAll("o1");
    subject.unsubscribe(a);
    subject.notifyAll("o2");

    expect(a.onOrderCompleted).toHaveBeenCalledTimes(1);
  });

  it("a falha de um observador não impede os demais de serem notificados", () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const subject = new OrderSubject();
    const broken: OrderObserver = {
      onOrderCompleted: jest.fn(() => {
        throw new Error("boom");
      }),
    };
    const healthy: OrderObserver = { onOrderCompleted: jest.fn() };
    subject.subscribe(broken);
    subject.subscribe(healthy);

    expect(() => subject.notifyAll("o1")).not.toThrow();
    expect(healthy.onOrderCompleted).toHaveBeenCalledWith("o1");
  });
});

describe("WindowEventObserver", () => {
  it("dispara o evento orderCompleted com o id do pedido", () => {
    const listener = jest.fn();
    window.addEventListener("orderCompleted", listener);

    new WindowEventObserver().onOrderCompleted("o9");

    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({ orderId: "o9" });
    window.removeEventListener("orderCompleted", listener);
  });
});

describe("orderSubject (instância compartilhada)", () => {
  it("já vem com o WindowEventObserver e o LoggerObserver registrados", () => {
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    const listener = jest.fn();
    window.addEventListener("orderCompleted", listener);

    orderSubject.notifyAll("o5");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("o5"));
    window.removeEventListener("orderCompleted", listener);
  });

  it("LoggerObserver registra o pedido concluído", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    new LoggerObserver().onOrderCompleted("o7");
    expect(spy).toHaveBeenCalledWith("[audit] Order completed: o7");
  });
});
