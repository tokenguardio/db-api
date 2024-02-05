import supertest from "supertest";
import mockKnex from "mock-knex";
import app from "../../src/app";
import knex from "knex";

const knexInstance = knex({
  client: "pg",
});

describe("getQueryById Controller", () => {
  let tracker: mockKnex.Tracker;
  beforeAll(() => {
    mockKnex.mock(knexInstance);
  });

  beforeEach(() => {
    tracker = mockKnex.getTracker();
    tracker.install();
  });

  afterEach(() => {
    tracker.uninstall();
  });

  afterAll(() => {
    mockKnex.unmock(knexInstance);
  });

  it("should successfully retrieve a query by ID", async () => {
    const savedQueryData = {
      id: 212,
      query:
        "SELECT * FROM :tableName: WHERE :columnName: = :ticker1 OR :columnName: = :ticker2 OR :columnName: = :ticker2 OR :columnName: IN (:tickers) OR :columnName: IN (:tickers)",
      parameters: {
        identifiers: ["tableName", "columnName"],
        values: [
          { name: "ticker1", type: "string" },
          { name: "ticker2", type: "string" },
          { name: "tickers", type: "string[]" },
        ],
      },
      database: "crosschain",
      label: "growth_index",
      created_at: "2024-02-05T11:23:06.484Z",
      updated_at: "2024-02-05T11:23:06.484Z",
    };

    tracker.on("query", (query) => {
      query.response([savedQueryData]);
    });

    const response = await supertest(app).get("/query/212");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: savedQueryData,
      message: "Query retrieved successfully",
    });
  });

  it("should return error for non-existent query ID", async () => {
    tracker.on("query", (query) => {
      query.response([]);
    });

    const response = await supertest(app).get("/query/999"); // Non-existent ID

    expect(response.status).toBe(404);
    expect(response.body.message).toContain("Query not found");
  });

  it("should handle database errors gracefully", async () => {
    tracker.on("query", (query) => {
      query.reject(new Error("Database error"));
    });

    const response = await supertest(app).get("/query/212");

    expect(response.status).toBe(500);
    expect(response.body.message).toContain(
      "Error occurred while retrieving the query"
    );
  });

  it("should return a validation error for invalid ID", async () => {
    const response = await supertest(app).get("/query/not-a-number");

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("ID must be a number");
  });
});
