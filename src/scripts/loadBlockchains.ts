import axios from "axios";
import * as fs from "fs";
import * as path from "path";

interface Blockchain {
  name: string;
  network: string;
  slug: string;
  logo: string;
  active: boolean;
  growthindex: boolean;
  dappgrowth: boolean;
  database?: string;
}

const readBlockchainsFromFile = (filePath: string): Blockchain[] => {
  const fileData = fs.readFileSync(path.resolve(__dirname, filePath));
  return JSON.parse(fileData.toString()) as Blockchain[];
};

const uploadBlockchain = async (blockchain: Blockchain) => {
  const url = "http://localhost:8082/blockchain/create";

  try {
    const response = await axios.post(url, blockchain, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    console.log("Blockchain uploaded successfully:", response.data);
  } catch (error) {
    console.error(
      "Failed to upload blockchain:",
      error.response ? error.response.data : error.message
    );
  }
};

const main = async () => {
  const blockchains = readBlockchainsFromFile("../../data/blockchains.json");
  for (const blockchain of blockchains) {
    await uploadBlockchain(blockchain);
  }
};

main();
