import supertest from "supertest";
import mockKnex from "mock-knex";
import knex from "knex";
import app from "../../src/app";

const knexInstance = knex({
  client: "pg",
});

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

  it("should update the previously created query with a new query", async () => {
    const createdQueryId = 3;

    tracker.on("query", (query, step) => {
      switch (step) {
        case 1:
          expect(query.method).toEqual("first");
          query.response([
            {
              id: createdQueryId,
              query: "SELECT * FROM table WHERE column = 'value'",
              databases: "example_databases",
              label: "Example Query",
              parameters: JSON.stringify({ example: "parameter" }),
              version_history: JSON.stringify([]),
              updated_at: new Date(),
            },
          ]);
          break;
        case 2:
          expect(query.method).toEqual("update");
          expect(query.bindings).toContain(createdQueryId);
          query.response({ id: createdQueryId });
          break;
      }
    });

    const updateResponse = await supertest(app)
      .patch(`/update-query/${createdQueryId}`)
      .send({
        query: Buffer.from(
          "SELECT * FROM table WHERE :column: = :ticker1"
        ).toString("base64"),
        databases: "astar_mainnet_squid",
        parameters: {
          values: [{ name: "ticker1", type: "string" }],
        },
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toEqual({
      id: createdQueryId,
      message: "Query updated successfully",
    });
  }, 10000);
});
