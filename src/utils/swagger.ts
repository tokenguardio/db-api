const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Express API for My App",
    version: "1.0.0",
    description:
      "This is a REST API application made with Express. It retrieves data from a sample database.",
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT}`,
      description: "Localhost development server",
    },
    {
      url: "https://db-api.dev.tokenguard.io",
      description: "Dev environment server",
    },
    // jrojek: todo. Just use host on which the server is visible or env var to substitute the value here
  ],
};

export default swaggerDefinition;
