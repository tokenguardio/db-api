import supertest from "supertest";
import mockKnex from "mock-knex";
import app from "../../src/app";
import { Parameter } from "../../src/types/queries";
import knex from "knex";

const knexInstance = knex({
  client: "pg",
});

describe("executeQuery Controller", () => {
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

  it("should successfully execute a query", async () => {
    const savedQueryData = {
      id: 1,
      query: "SELECT * FROM test_table",
      parameters: [] as Parameter[],
      database: "astar_mainnet_squid",
    };

    tracker.on("query", (query) => {
      query.response([savedQueryData]);
    });

    tracker.on("query", (query) => {
      if (query.method === "raw") {
        query.response({
          rows: [{ a: 1, b: 2 }],
        });
      }
    });

    const response = await supertest(app).post("/execute-query").send({
      id: 1,
      queryParams: [],
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [{ a: 1, b: 2 }],
      message: "Query executed",
    });
  });

  it("should return error for missing query ID", async () => {
    const response = await supertest(app).post("/execute-query").send({
      queryParams: [],
    });

    expect(response.status).toBe(400);
    // prettier-ignore
    expect(response.body.message).toContain("\"id\" is required");
  });

  it("should return error for non-existent query", async () => {
    tracker.on("query", (query) => {
      query.response([]);
    });

    const response = await supertest(app).post("/execute-query").send({
      id: 999, // Non-existent ID
      queryParams: [],
    });

    expect(response.status).toBe(404);
    expect(response.body.message).toContain("Query not found");
  });

  it("should handle database errors gracefully", async () => {
    tracker.on("query", (query) => {
      query.reject(new Error("Database error"));
    });

    const response = await supertest(app).post("/execute-query").send({
      id: 1,
      queryParams: [],
    });

    expect(response.status).toBe(500);
    expect(response.body.message).toContain("Error executing the query");
  });

  it("should return error for invalid query parameters", async () => {
    const savedQueryData = {
      id: 1,
      query: "SELECT * FROM test_table",
      parameters: [{ name: "param1", type: "number" }] as Parameter[],
      database: "astar_mainnet_squid",
    };

    tracker.on("query", (query) => {
      query.response([savedQueryData]);
    });

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

  it("should return error for wrong number of query parameters", async () => {
    const savedQueryData = {
      id: 1,
      query: "SELECT * FROM test_table WHERE param1 = ? AND param2 = ?",
      parameters: [
        { name: "param1", type: "number" },
        { name: "param2", type: "string" },
      ] as Parameter[],
      database: "astar_mainnet_squid",
    };

    tracker.on("query", (query) => {
      query.response([savedQueryData]);
    });

    const response = await supertest(app)
      .post("/execute-query")
      .send({
        id: 1,
        queryParams: [{ name: "param1", value: 123 }],
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      "Incorrect number of parameters provided"
    );
  });

  it("should return error for mismatched query parameter names", async () => {
    const savedQueryData = {
      id: 1,
      query: "SELECT * FROM test_table WHERE param1 = ?",
      parameters: [{ name: "param1", type: "number" }] as Parameter[],
      database: "astar_mainnet_squid",
    };

    tracker.on("query", (query) => {
      query.response([savedQueryData]);
    });

    const response = await supertest(app)
      .post("/execute-query")
      .send({
        id: 1,
        queryParams: [{ name: "wrongParamName", value: 123 }],
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("is missing");
  });

  it("should execute a query with valid parameters", async () => {
    const savedQueryData = {
      id: 1,
      query: "SELECT * FROM test_table WHERE column = ?",
      parameters: [{ name: "column", type: "string" }] as Parameter[],
      database: "astar_mainnet_squid",
    };

    tracker.on("query", (query) => {
      query.response([savedQueryData]);
    });

    tracker.on("query", (query) => {
      if (query.method === "raw") {
        query.response({
          rows: [{ a: 1, b: 2 }],
        });
      }
    });

    const response = await supertest(app)
      .post("/execute-query")
      .send({
        id: 1,
        queryParams: [{ name: "column", value: "testValue" }],
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [{ a: 1, b: 2 }],
      message: "Query executed",
    });
  });

  it("should handle queries with no result", async () => {
    const savedQueryData = {
      id: 1,
      query: "SELECT * FROM empty_table",
      parameters: [] as Parameter[],
      database: "astar_mainnet_squid",
    };

    tracker.on("query", (query) => {
      query.response([savedQueryData]);
    });

    tracker.on("query", (query) => {
      if (query.method === "raw") {
        query.response([]);
      }
    });

    const response = await supertest(app).post("/execute-query").send({
      id: 1,
      queryParams: [],
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [], message: "Query executed" });
  });

  it("should return an error if the number of provided parameters is less than the number of ? placeholders in the SQL query", async () => {
    const savedQueryData = {
      id: 1,
      query: "SELECT * FROM test_table WHERE column = ? and param1 = ?",
      parameters: [{ name: "column", type: "string" }] as Parameter[],
      database: "astar_mainnet_squid",
    };

    tracker.on("query", (query) => {
      query.response([savedQueryData]);
    });

    tracker.on("query", (query) => {
      if (query.method === "raw") {
        query.response([]);
      }
    });

    const response = await supertest(app)
      .post("/execute-query")
      .send({
        id: 1,
        queryParams: [{ name: "column", value: "testValue" }],
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Error executing the query" });
  });

  it("should return an error if the number of provided parameters exceeds the number of ? placeholders in the SQL query", async () => {
    const savedQueryData = {
      id: 1,
      query: "SELECT * FROM test_table WHERE column = ?",
      parameters: [
        { name: "column", type: "string" },
        { name: "column2", type: "string" },
      ] as Parameter[],
      database: "astar_mainnet_squid",
    };

    tracker.on("query", (query) => {
      query.response([savedQueryData]);
    });

    tracker.on("query", (query) => {
      if (query.method === "raw") {
        query.response([]);
      }
    });

    const response = await supertest(app)
      .post("/execute-query")
      .send({
        id: 1,
        queryParams: [
          { name: "column", value: "testValue" },
          { name: "column2", value: "testValue" },
        ],
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Error executing the query" });
  });
});
