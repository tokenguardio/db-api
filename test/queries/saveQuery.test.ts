import supertest from "supertest";
import mockKnex from "mock-knex";
import knex from "knex";
import app from "../../src/app";

const knexInstance = knex({
  client: "pg",
});
const encodedQuery = Buffer.from(
  "SELECT * FROM :tableName: where :columnName: = :ticker1 OR :columnName: = ticker2 OR :columnName: IN (:tickers)"
).toString("base64");

describe("saveQuery Controller", () => {
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

  afterAll(async () => {
    mockKnex.unmock(knexInstance);
  });

  it("should save a query with valid values and identifiers", async () => {
    tracker.on("query", (query) => {
      expect(query.method).toEqual("insert");
      query.response([{ id: 3 }]);
    });

    const response = await supertest(app)
      .post("/save-query")
      .send({
        query: Buffer.from(
          "SELECT * FROM table WHERE :column: = :ticker1"
        ).toString("base64"),
        databases: "astar_mainnet_squid",
        parameters: {
          values: [{ name: "ticker1", type: "string" }],
        },
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      data: { id: 3 },
      message: "Query saved successfully",
    });
  });

  it("should save a query with valid values, identifiers and description", async () => {
    tracker.on("query", (query) => {
      expect(query.method).toEqual("insert");
      query.response([{ id: 3 }]);
    });

    const response = await supertest(app)
      .post("/save-query")
      .send({
        query: Buffer.from(
          "SELECT * FROM table WHERE :column: = :ticker1"
        ).toString("base64"),
        databases: "astar_mainnet_squid",
        parameters: {
          values: [{ name: "ticker1", type: "string" }],
        },
        description: "descriptive descrption",
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      data: { id: 3 },
      message: "Query saved successfully",
    });
  });

  it("should return error for save query with identifiers", async () => {
    tracker.on("query", (query) => {
      expect(query.method).toEqual("insert");
      query.response([{ id: 3 }]);
    });

    const response = await supertest(app)
      .post("/save-query")
      .send({
        query: encodedQuery,
        databases: "astar_mainnet_squid",
        parameters: {
          values: [
            { name: "ticker1", type: "string" },
            { name: "ticker2", type: "string" },
          ],
          identifiers: ["tableName", "columnName"],
        },
      });

    expect(response.status).toBe(400);
    // prettier-ignore
    expect(response.body.message).toContain("\"identifiers\" is not allowed");
  });

  it("should not save a query with mismatched values", async () => {
    tracker.on("query", (query) => {
      query.response([]);
    });

    const response = await supertest(app)
      .post("/save-query")
      .send({
        query: encodedQuery,
        databases: "astar_mainnet_squid",
        parameters: {
          values: [{ name: "missingParam", type: "string" }],
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      "Incorrect number of value parameters provided"
    );
  });

  it("should save a query with empty parameters", async () => {
    tracker.on("query", (query) => {
      expect(query.method).toEqual("insert");
      query.response([{ id: 1 }]);
    });

    const response = await supertest(app)
      .post("/save-query")
      .send({
        query: Buffer.from("SELECT * FROM table").toString("base64"),
        databases: "astar_mainnet_squid",
        parameters: {},
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      data: { id: 1 },
      message: "Query saved successfully",
    });
  });

  it("should save a query without parameters", async () => {
    tracker.on("query", (query) => {
      expect(query.method).toEqual("insert");
      query.response([{ id: 1 }]);
    });

    const response = await supertest(app)
      .post("/save-query")
      .send({
        query: Buffer.from("SELECT * FROM table").toString("base64"),
        databases: "astar_mainnet_squid",
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      data: { id: 1 },
      message: "Query saved successfully",
    });
  });

  it("should return error for invalid databases", async () => {
    const response = await supertest(app).post("/save-query").send({
      query: encodedQuery,
      databases: "invalid_databases",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      "One or more specified databases are not available"
    );
  });

  it("should return error for missing query parameter", async () => {
    const response = await supertest(app).post("/save-query").send({
      databases: "astar_mainnet_squid",
    });

    expect(response.status).toBe(400);
    // prettier-ignore
    expect(response.body.message).toContain("\"query\" is required");
  });

  it("should return error for incorrect parameter type", async () => {
    const response = await supertest(app)
      .post("/save-query")
      .send({
        query: encodedQuery,
        databases: "astar_mainnet_squid",
        parameters: { values: [{ name: "test", type: "invalid_type" }] },
      });

    expect(response.status).toBe(400);
    // prettier-ignore
    expect(response.body.message).toContain(
      "\"type\" must be one of [number, date, string, number[], date[], string[]]"
    );
  });

  it("should return error for incorrect parameter without type field", async () => {
    const response = await supertest(app)
      .post("/save-query")
      .send({
        query: encodedQuery,
        databases: "astar_mainnet_squid",
        parameters: {
          values: [{ name: "name1", type: "string" }, { name: "name2" }],
        },
      });

    expect(response.status).toBe(400);
    // prettier-ignore
    expect(response.body.message).toContain(
      "\"type\" is required"
    );
  });

  it("should return error for incorrect parameter without name field", async () => {
    const response = await supertest(app)
      .post("/save-query")
      .send({
        query: encodedQuery,
        databases: "astar_mainnet_squid",
        parameters: {
          values: [{ name: "name1", type: "string" }, { type: "string" }],
        },
      });

    expect(response.status).toBe(400);
    // prettier-ignore
    expect(response.body.message).toContain(
      "\"name\" is required"
    );
  });

  it("should return error for incorrect parameter with typo in field names", async () => {
    const response = await supertest(app)
      .post("/save-query")
      .send({
        query: encodedQuery,
        databases: "astar_mainnet_squid",
        parameters: {
          values: [
            { namw: "name1", type: "string" },
            { name: "name2", typr: "string" },
          ],
        },
      });

    expect(response.status).toBe(400);
    // prettier-ignore
    expect(response.body.message).toContain(
      "\"type\" is required"
    );
    // prettier-ignore
    expect(response.body.message).toContain( "\"name\" is required");
  });

  it("should handle databases errors gracefully", async () => {
    tracker.on("query", (query) => {
      query.reject(new Error("Databases error"));
    });

    const response = await supertest(app)
      .post("/save-query")
      .send({
        query: Buffer.from("SELECT * FROM table").toString("base64"),
        databases: "astar_mainnet_squid",
        parameters: {},
      });

    expect(response.status).toBe(500);
    expect(response.body.message).toContain(
      "Error occurred while saving the query"
    );
  });

  it("should return error for duplicate parameter names", async () => {
    const response = await supertest(app)
      .post("/save-query")
      .send({
        query: Buffer.from(
          "SELECT * FROM table WHERE :column: = :ticker1 OR :column: = :ticker2"
        ).toString("base64"),
        databases: "astar_mainnet_squid",
        parameters: {
          values: [
            { name: "ticker1", type: "string" },
            { name: "ticker1", type: "string" },
          ],
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      "Duplicate parameter names are not allowed"
    );
  });

  it("should return error for invalid base64 encoded query", async () => {
    const response = await supertest(app).post("/save-query").send({
      query: "aGVsbG9*W29ybGR@",
      databases: "astar_mainnet_squid",
      parameters: [],
    });

    expect(response.status).toBe(400);
    // prettier-ignore
    expect(response.body.message).toContain(
      "\"query\" must be a valid base64 string"
    );
  });
});
