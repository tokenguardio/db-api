import supertest from "supertest";
import knex from "knex";
import mockKnex from "mock-knex";
import app from "../../src/app";

const knexInstance = knex({
  client: "pg",
});
const encodedQuery = Buffer.from("SELECT * FROM table").toString("base64");

describe("saveQuery Controller", () => {
  beforeAll(() => {
    mockKnex.mock(knexInstance);
  });

  afterAll(async () => {
    mockKnex.unmock(knexInstance);
  });

  it("should save a query with valid parameters", async () => {
    const tracker = mockKnex.getTracker();
    tracker.install();

    tracker.on("query", (query) => {
      expect(query.method).toEqual("insert");
      query.response([{ id: 3 }]);
    });

    const response = await supertest(app)
      .post("/save-query")
      .send({
        query: encodedQuery,
        database: "astar_mainnet_squid",
        parameters: [{ name: "param1", type: "number" }],
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      data: { id: 3 },
      message: "Query saved successfully",
    });

    tracker.uninstall();
  });

  it("should save a query without parameters", async () => {
    const tracker = mockKnex.getTracker();
    tracker.install();

    tracker.on("query", (query) => {
      expect(query.method).toEqual("insert");
      query.response([{ id: 1 }]);
    });

    const response = await supertest(app).post("/save-query").send({
      query: encodedQuery,
      database: "astar_mainnet_squid",
      parameters: [],
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      data: { id: 1 },
      message: "Query saved successfully",
    });

    tracker.uninstall();
  });

  it("should return error for invalid database", async () => {
    const response = await supertest(app).post("/save-query").send({
      query: encodedQuery,
      database: "invalid_database",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      "Specified database is not available"
    );
  });

  it("should return error for missing query parameter", async () => {
    const response = await supertest(app).post("/save-query").send({
      database: "astar_mainnet_squid",
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
        database: "astar_mainnet_squid",
        parameters: [{ name: "test", type: "invalid_type" }],
      });

    expect(response.status).toBe(400);
    // prettier-ignore
    expect(response.body.message).toContain(
      "\"type\" must be one of [number, date, string]"
    );
  });

  it("should return error for incorrect parameter without type field", async () => {
    const response = await supertest(app)
      .post("/save-query")
      .send({
        query: encodedQuery,
        database: "astar_mainnet_squid",
        parameters: [{ name: "name1", type: "string" }, { name: "name2" }],
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
        database: "astar_mainnet_squid",
        parameters: [{ name: "name1", type: "string" }, { type: "string" }],
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
        database: "astar_mainnet_squid",
        parameters: [
          { namw: "name1", type: "string" },
          { name: "name2", typr: "string" },
        ],
      });

    expect(response.status).toBe(400);
    // prettier-ignore
    expect(response.body.message).toContain(
      "\"type\" is required"
    );
    // prettier-ignore
    expect(response.body.message).toContain( "\"name\" is required");
  });

  it("should handle database errors gracefully", async () => {
    const tracker = mockKnex.getTracker();
    tracker.install();

    tracker.on("query", (query) => {
      query.reject(new Error("Database error"));
    });

    const response = await supertest(app).post("/save-query").send({
      query: encodedQuery,
      database: "astar_mainnet_squid",
      parameters: [],
    });

    expect(response.status).toBe(500);
    expect(response.body.message).toContain(
      "Error occurred while saving the query"
    );

    tracker.uninstall();
  });

  it("should return error for duplicate parameter names", async () => {
    const response = await supertest(app)
      .post("/save-query")
      .send({
        query: encodedQuery,
        database: "astar_mainnet_squid",
        parameters: [
          { name: "duplicateName", type: "string" },
          { name: "duplicateName", type: "number" },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      "Duplicate parameter names are not allowed"
    );
  });

  it("should return error for invalid base64 encoded query", async () => {
    const response = await supertest(app).post("/save-query").send({
      query: "aGVsbG9*W29ybGR@",
      database: "astar_mainnet_squid",
      parameters: [],
    });

    expect(response.status).toBe(400);
    // prettier-ignore
    expect(response.body.message).toContain(
      "\"query\" must be a valid base64 string"
    );
  });
});
