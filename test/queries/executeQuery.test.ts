import supertest from "supertest";
import mockKnex from "mock-knex";
import app from "../../src/app";
import { StoredParameters } from "../../src/types/queries";
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

  it("should successfully execute a query with empty parameters", async () => {
    const savedQueryData = {
      id: 1,
      query: "SELECT * FROM test_table",
      parameters: {} as StoredParameters,
      databases: "astar_mainnet_squid",
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
      parameters: {},
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [{ a: 1, b: 2 }],
      message: "Query executed",
    });
  });

  it("should successfully execute a query without parameters", async () => {
    const savedQueryData = {
      id: 1,
      query: "SELECT * FROM test_table",
      databases: "astar_mainnet_squid",
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
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [{ a: 1, b: 2 }],
      message: "Query executed",
    });
  });

  it("should return error for missing query ID", async () => {
    const response = await supertest(app).post("/execute-query").send({
      parameters: {},
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
      parameters: {},
    });

    expect(response.status).toBe(404);
    expect(response.body.message).toContain("Query not found");
  });

  it("should handle databases errors gracefully", async () => {
    tracker.on("query", (query) => {
      query.reject(new Error("Databases error"));
    });

    const response = await supertest(app).post("/execute-query").send({
      id: 1,
      parameters: {},
    });

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({
      message: "Error executing the query",
    });
  });

  it("should return error for invalid query parameter type", async () => {
    const savedQueryData = {
      id: 1,
      query: "SELECT * FROM test_table where column = :param1",
      parameters: {
        values: [{ name: "param1", type: "number" }],
      } as StoredParameters,
      databases: "astar_mainnet_squid",
    };

    tracker.on("query", (query) => {
      query.response([savedQueryData]);
    });

    const response = await supertest(app)
      .post("/execute-query")
      .send({
        id: 1,
        parameters: { values: [{ name: "param1", value: "not-a-number" }] },
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      "Invalid or missing value parameter 'param1'"
    );
  });

  it("should return error for wrong number of query parameters", async () => {
    const savedQueryData = {
      id: 1,
      query:
        "SELECT * FROM test_table WHERE column = :param1 AND column = :param2",
      parameters: {
        values: [
          { name: "param1", type: "number" },
          { name: "param2", type: "string" },
        ],
      } as StoredParameters,
      databases: "astar_mainnet_squid",
    };

    tracker.on("query", (query) => {
      query.response([savedQueryData]);
    });

    const response = await supertest(app)
      .post("/execute-query")
      .send({
        id: 1,
        parameters: { values: [{ name: "param1", value: 123 }] },
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      "Incorrect number of value parameters provided"
    );
  });

  it("should return error for mismatched query parameter names", async () => {
    const savedQueryData = {
      id: 1,
      query: "SELECT * FROM test_table WHERE param1 = ?",
      parameters: {
        values: [{ name: "param1", type: "number" }],
      } as StoredParameters,
      databases: "astar_mainnet_squid",
    };

    tracker.on("query", (query) => {
      query.response([savedQueryData]);
    });

    const response = await supertest(app)
      .post("/execute-query")
      .send({
        id: 1,
        parameters: { values: [{ name: "wrongParamName", value: 123 }] },
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("is missing");
  });

  it("should execute a query with valid parameters", async () => {
    const savedQueryData = {
      id: 1,
      query: "SELECT * FROM test_table WHERE column = ?",
      parameters: {
        values: [{ name: "column", type: "string" }],
      } as StoredParameters,
      databases: "astar_mainnet_squid",
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
        parameters: { values: [{ name: "column", value: "testValue" }] },
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
      parameters: {} as StoredParameters,
      databases: "astar_mainnet_squid",
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
      parameters: {},
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [], message: "Query executed" });
  });

  it("should return an error if the number of provided parameters is less than the number of value parameters in the SQL query", async () => {
    const savedQueryData = {
      id: 1,
      query:
        "SELECT * FROM test_table WHERE :column1: = :var1 and :column2: = :var2",
      parameters: {
        values: [
          { name: "var1", type: "string" },
          { name: "var2", type: "number" },
        ],
        identifiers: ["column1", "column2"],
      } as StoredParameters,
      databases: "astar_mainnet_squid",
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
        parameters: {
          identifiers: [
            { name: "column1", value: "ticker" },
            { name: "column2", value: "count" },
          ],
          values: [{ name: "var2", value: 42 }],
        },
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Incorrect number of value parameters provided",
    });
  });

  it("should return an error if the number of provided value parameters is larger than the number of value parameters in the SQL query", async () => {
    const savedQueryData = {
      id: 1,
      query:
        "SELECT * FROM test_table WHERE :column1: = :var1 and :column2: = :var2",
      parameters: {
        values: [
          { name: "var1", type: "string" },
          { name: "var2", type: "number" },
        ],
        identifiers: ["column1", "column2"],
      } as StoredParameters,
      databases: "astar_mainnet_squid",
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
        parameters: {
          identifiers: [
            { name: "column1", value: "ticker" },
            { name: "column2", value: "count" },
          ],
          values: [
            { name: "var2", value: 42 },
            { name: "var2", value: 42 },
            { name: "var1", value: "abc" },
          ],
        },
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Incorrect number of value parameters provided",
    });
  }, 100000);

  it("should return an error if the number of provided identifiers is not equal than the number of identifiers in the SQL query", async () => {
    const savedQueryData = {
      id: 1,
      query:
        "SELECT * FROM test_table WHERE :column1: = :var1 and :column2: = :var2",
      parameters: {
        values: [
          { name: "var1", type: "string" },
          { name: "var2", type: "number" },
        ],
        identifiers: ["column1", "column2"],
      } as StoredParameters,
      databases: "astar_mainnet_squid",
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
        parameters: {
          identifiers: [{ name: "column1", value: "ticker" }],
          values: [
            { name: "var2", value: 42 },
            { name: "var1", value: "abc" },
          ],
        },
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: "Incorrect number of identifiers provided",
    });
  });

  it("should return an error if the provided identifier is not of string type", async () => {
    const savedQueryData = {
      id: 1,
      query: "SELECT column1 FROM test_table",
      parameters: {
        identifiers: ["column1"],
      } as StoredParameters,
      databases: "astar_mainnet_squid",
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
        parameters: {
          identifiers: [{ name: "column1", value: 1 }],
        },
      });

    expect(response.status).toBe(400);
    // prettier-ignore
    expect(response.body.message).toContain(
      "\"value\" must be a string"
    );
  });
});
