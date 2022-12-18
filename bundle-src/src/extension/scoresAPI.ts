import axios, { Axios } from "axios";
import { Configschema } from "common/types/config";
import { NodeCG } from "../../../../../types/server";

export let apiClient: Axios;
export let token = "";

export async function init(nodecg: NodeCG) {
  apiClient = axios.create({
    baseURL: nodecg.bundleConfig.scoresService?.apiURL,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function authenticate(
  nodecg: NodeCG,
  username?: string,
  password?: string
) {
  nodecg.log.debug("Authenticating...");
  const authResponse = await apiClient.post("/auth/login/local", {
    username: username ?? nodecg.bundleConfig.scoresService.username,
    password: password ?? nodecg.bundleConfig.scoresService.password,
  });
  token = authResponse.data.token;
  apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  nodecg.log.debug("Authenticated successfully.");
}
