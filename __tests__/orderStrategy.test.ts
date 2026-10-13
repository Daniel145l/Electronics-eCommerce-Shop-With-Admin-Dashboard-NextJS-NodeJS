import toast from "react-hot-toast";
import apiClient from "@/lib/api";
import {
  OrderContext,
  OrderCreationStrategy,
  OrderData,
  OrderPayload,
  RestApiOrderStrategy,
} from "@/lib/strategies/OrderStrategy";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}));

const mockedPost = apiClient.post as jest.Mock;
const mockedToastError = toast.error as unknown as jest.Mock;

const orderData: OrderData = {
  name: "Ana",
  lastname: "Silva",
  phone: "85999999999",
  email: "ana@example.com",
  company: "ACME",
  adress: "Rua A, 10",
  apartment: "101",
  postalCode: "63900000",
  status: "pending",
  total: 300,
  city: "Quixadá",
  country: "Brasil",
  orderNotice: "",
  userId: null,
};

const makePayload = (addFn = jest.fn().mockResolvedValue(undefined)): OrderPayload => ({
  orderData,
  products: [
    { id: "p1", amount: 1 },
    { id: "p2", amount: 3 },
  ],
  addOrderProductFn: addFn,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => undefined);
});

describe("RestApiOrderStrategy", () => {
  it("cria o pedido e adiciona cada produto na ordem", async () => {
    mockedPost.mockResolvedValue({ ok: true, json: async () => ({ id: "order-1" }) });
    const addFn = jest.fn().mockResolvedValue(undefined);

    const id = await new RestApiOrderStrategy().createOrder(makePayload(addFn));

    expect(id).toBe("order-1");
    expect(mockedPost).toHaveBeenCalledWith("/api/orders", orderData);
    expect(addFn).toHaveBeenCalledTimes(2);
    expect(addFn).toHaveBeenNthCalledWith(1, "order-1", "p1", 1);
    expect(addFn).toHaveBeenNthCalledWith(2, "order-1", "p2", 3);
  });

  it("lança DUPLICATE_ORDER e mostra um toast em caso de 409", async () => {
    mockedPost.mockResolvedValue({
      ok: false,
      status: 409,
      text: async () => JSON.stringify({ error: "Duplicate order" }),
    });
    const addFn = jest.fn();

    await expect(new RestApiOrderStrategy().createOrder(makePayload(addFn))).rejects.toThrow(
      "DUPLICATE_ORDER"
    );
    expect(mockedToastError).toHaveBeenCalledTimes(1);
    expect(addFn).not.toHaveBeenCalled();
  });

  it("mostra um toast por erro de validação e lança ORDER_CREATION_FAILED", async () => {
    mockedPost.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          details: [
            { field: "email", message: "invalid" },
            { field: "phone", message: "required" },
          ],
        }),
    });

    await expect(new RestApiOrderStrategy().createOrder(makePayload())).rejects.toThrow(
      "ORDER_CREATION_FAILED"
    );
    expect(mockedToastError).toHaveBeenCalledTimes(2);
    expect(mockedToastError).toHaveBeenCalledWith("email: invalid");
  });

  it("trata resposta de erro que não é JSON", async () => {
    mockedPost.mockResolvedValue({ ok: false, status: 500, text: async () => "<html>erro</html>" });

    await expect(new RestApiOrderStrategy().createOrder(makePayload())).rejects.toThrow(
      "ORDER_CREATION_FAILED"
    );
    expect(mockedToastError).toHaveBeenCalledWith("Order creation failed. Please try again.");
  });

  it("falha quando o servidor não devolve o id do pedido", async () => {
    mockedPost.mockResolvedValue({ ok: true, json: async () => ({}) });
    const addFn = jest.fn();

    await expect(new RestApiOrderStrategy().createOrder(makePayload(addFn))).rejects.toThrow(
      "Order ID not received from server"
    );
    expect(addFn).not.toHaveBeenCalled();
  });
});

describe("OrderContext", () => {
  it("delega a criação para a estratégia atual", async () => {
    const strategy: OrderCreationStrategy = { createOrder: jest.fn().mockResolvedValue("x1") };
    const payload = makePayload();

    const id = await new OrderContext(strategy).executeOrderCreation(payload);

    expect(id).toBe("x1");
    expect(strategy.createOrder).toHaveBeenCalledWith(payload);
  });

  it("permite trocar a estratégia em tempo de execução (mock checkout)", async () => {
    const first: OrderCreationStrategy = { createOrder: jest.fn().mockResolvedValue("a") };
    const second: OrderCreationStrategy = { createOrder: jest.fn().mockResolvedValue("b") };
    const ctx = new OrderContext(first);

    ctx.setStrategy(second);
    const id = await ctx.executeOrderCreation(makePayload());

    expect(id).toBe("b");
    expect(first.createOrder).not.toHaveBeenCalled();
  });
});
