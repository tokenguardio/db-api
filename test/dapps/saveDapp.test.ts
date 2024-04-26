import supertest from "supertest";
import mockKnex from "mock-knex";
import knex from "knex";
import app from "../../src/app";

const knexInstance = knex({
  client: "pg",
});

describe("createDapp Controller", () => {
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

  it("should create a new dapp with valid data", async () => {
    tracker.on("query", (query, step) => {
      if (step === 1) {
        expect(query.method).toEqual("insert");
        query.response([{ id: 1 }]);
      }
    });

    const dappData = {
      name: "New Dapp",
      slug: "new-dapp",
      icon: "new-dapp-icon.png",
      active: true,
      dapp_growth_index: true,
      defi_growth_index: false,
      blockchains: ["ethereum", "polygon"],
    };

    const response = await supertest(app).post("/create-dapp").send(dappData);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: "Dapp created successfully",
      id: 1,
    });
  });

  // Add more tests for various scenarios such as invalid data, database errors, etc.
});
