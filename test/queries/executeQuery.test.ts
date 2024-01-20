import supertest from "supertest";
import knex from "knex";
import mockKnex from "mock-knex";
import app from "../../src/app";
import { Parameter } from "../../src/types/queries";

const knexInstance = knex({
  client: "pg",
});

describe("executeQuery Controller", () => {
  beforeAll(() => {
    mockKnex.mock(knexInstance);
  });

  afterAll(async () => {
    mockKnex.unmock(knexInstance);
  });

  it("should successfully execute a query", async () => {
    const tracker = mockKnex.getTracker();
    tracker.install();

    // Mock saved query data
    const savedQueryData = {
      id: 1,
      query: "SELECT * FROM test_table",
      parameters: [] as Parameter[],
      database: "testDatabase",
    };

    tracker.install();

    tracker.on("query", (query) => {
      // Respond to internal database queries
      query.response([savedQueryData]);
    });

    tracker.on("query", (query) => {
      // Respond to external database queries
      if (query.method === "raw") {
        query.response([{ result: "test data" }]);
      }
    });

    const response = await supertest(app).post("/execute-query").send({
      id: 1,
      queryParams: [],
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [{ result: "test data" }] });

    tracker.uninstall();
  });

  it("should return error for missing query ID", async () => {
    const response = await supertest(app).post("/execute-query").send({
      queryParams: [],
    });

    expect(response.status).toBe(400);
    // prettier-ignore
    expect(response.body.message).toContain("\"id\" is required");
  });

  // Test handling non-existent query
  it("should return error for non-existent query", async () => {
    // Mock tracker for non-existent query
    const tracker = mockKnex.getTracker();
    tracker.install();
    tracker.on("query", (query) => {
      query.response([]);
    });

    const response = await supertest(app).post("/execute-query").send({
      id: 999, // Non-existent ID
      queryParams: [],
    });

    expect(response.status).toBe(404);
    expect(response.body.message).toContain("Query not found");

    tracker.uninstall();
  });

  // Test database error handling
  it("should handle database errors gracefully", async () => {
    // Mock tracker for database error
    const tracker = mockKnex.getTracker();
    tracker.install();
    tracker.on("query", (query) => {
      query.reject(new Error("Database error"));
    });

    const response = await supertest(app).post("/execute-query").send({
      id: 1,
      queryParams: [],
    });

    expect(response.status).toBe(500);
    expect(response.body.message).toContain("Error executing the query");

    tracker.uninstall();
  });

  it("should return error for invalid query parameters", async () => {
    const response = await supertest(app)
      .post("/execute-query")
      .send({
        id: 1,
        queryParams: [{ name: "param1", value: "not-a-number" }], // Assuming param1 should be a number
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      "Invalid type for parameter param1"
    );
  });

  it("should execute query with valid parameters", async () => {
    // Mock saved query data with parameters
    const savedQueryData = {
      id: 1,
      query: "SELECT * FROM test_table WHERE column = ?",
      parameters: [{ name: "column", type: "string" }],
      database: "testDatabase",
    };

    // Mock database response
    const tracker = mockKnex.getTracker();
    tracker.install();
    tracker.on("query", (query, step) => {
      if (step === 1) {
        query.response([savedQueryData]);
      } else if (step === 2) {
        expect(query.bindings).toEqual(["testValue"]); // Ensure correct parameter is passed
        query.response([{ result: "filtered data" }]);
      }
    });

    const response = await supertest(app)
      .post("/execute-query")
      .send({
        id: 1,
        queryParams: [{ name: "column", value: "testValue" }],
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [{ result: "filtered data" }] });

    tracker.uninstall();
  });

  it("should handle queries with no result", async () => {
    const savedQueryData = {
      id: 1,
      query: "SELECT * FROM empty_table",
      parameters: [] as Parameter[],
      database: "testDatabase",
    };

    const tracker = mockKnex.getTracker();
    tracker.install();
    tracker.on("query", (query, step) => {
      if (step === 1) {
        query.response([savedQueryData]);
      } else if (step === 2) {
        query.response([]); // Simulate empty result
      }
    });

    const response = await supertest(app).post("/execute-query").send({
      id: 1,
      queryParams: [],
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [] });

    tracker.uninstall();
  });
});
