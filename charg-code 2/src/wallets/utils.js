import config from "../app.config.json";

export const getNetworkName = (netId) => {
    let network = config.networks[netId.toString()];
    if (network === undefined) {
      return "Unknown Network " + netId;
    }
    return network.short; //networkName;
}
  