const request = require("supertest");
const app = require("./server");

describe("Testy backendu Memory Game", () => {
  // 1. testy podstawowe (publiczne)
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

  // 2. testy autoryzacji (ochrona przed brakiem tokena)
  it("Powinien zablokować dostęp do historii bez tokena (błąd 401)", async () => {
    const response = await request(app).get("/history");
    // oczekujemy kodu 401 (Unauthorized)
    expect(response.statusCode).toBe(401); 
  });

  // 3. testy uprawnień administracyjnych
  it("Powinien zablokować próbę usunięcia gracza bez tokena admina (błąd 401)", async () => {
    const response = await request(app).delete("/users/jakis_gracz");
    expect(response.statusCode).toBe(401);
  });
});