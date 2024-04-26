import axios from "axios";
import * as fs from "fs";
import * as path from "path";

interface Dapp {
  name: string;
  slug: string;
  blockchains: string[];
  icon: string;
  active: boolean;
  dapp_growth_index: boolean;
  defi_growth_index: boolean;
}

const readDappsFromFile = (filePath: string): Dapp[] => {
  const fileData = fs.readFileSync(path.resolve(__dirname, filePath), "utf-8");
  return JSON.parse(fileData) as Dapp[];
};

const uploadDapp = async (dapp: Dapp) => {
  const url = "http://localhost:8082/dapps";

  try {
    const response = await axios.post(
      url,
      {
        ...dapp,
        blockchains: dapp.blockchains,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Dapp uploaded successfully:", response.data);
  } catch (error) {
    console.error(
      "Failed to upload dapp:",
      error.response ? error.response.data : error.message
    );
  }
};

const main = async () => {
  const dapps = readDappsFromFile("../../data/dapps.json");
  for (const dapp of dapps) {
    await uploadDapp(dapp);
  }
};

main();
