// ZAŚLEPKI (MOCKS)
// blokujemy łączenie z zewnętrznym serwerem MQTT
jest.mock("mqtt", () => ({
  connect: () => ({
    on: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn(),
    end: jest.fn(),
  }),
}));

// blokujemy łączenie z prawdziwą bazą PostgreSQL
jest.mock("pg", () => {
  const mClient = {
    connect: jest.fn().mockResolvedValue(),
    query: jest.fn().mockResolvedValue({ rows: [] }),
  };
  return { Client: jest.fn(() => mClient) };
});

const request = require("supertest");
const app = require("./server");

describe("Testy backendu Memory Game", () => {
  it("Powinien zwrócić status 200 na endpoincie /health", async () => {
    const response = await request(app).get("/health");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: "OK" });
  });

  it("Powinien zwrócić tablicę wyników na endpoincie /users", async () => {
    const response = await request(app).get("/users");
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  it("Powinien zablokować dostęp do historii bez tokena (błąd 401)", async () => {
    // tymczasowo wyciszamy console.error
    jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(app).get("/history");
    expect(response.statusCode).toBe(401);

    // przywracamy logowanie
    console.error.mockRestore();
  });

  it("Powinien zablokować próbę usunięcia gracza bez tokena admina (błąd 401)", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(app).delete("/users/jakis_gracz");
    expect(response.statusCode).toBe(401);

    console.error.mockRestore();
  });
});
